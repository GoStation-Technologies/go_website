import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { resolveAiConfig } from "./ai-provider.server";
import { requestChatReply } from "./chat-provider.server";
import { localChatReply, type FallbackStation } from "./chat-fallback";
import { getServerSupabase } from "./supabase-server.server";
import { retrieveGrounding, formatGrounding } from "./chat.grounding";
import {
  LIMITS,
  checkPersistentRate,
  errorMessage,
  extractIp,
  hashIp,
  messageLooksAbusive,
  recordAbuseEvent,
  type AbuseReason,
} from "./chat.abuse";

const Input = z.object({
  sessionId: z.string().uuid(),
  message: z.string().trim().min(1).max(2000),
  lang: z.enum(["en", "ar"]).default("en"),
});

const SYSTEM_EN = `You are GoStation's bilingual customer support assistant.
GoStation is a Saudi Arabian fuel and mobility network with stations across the Kingdom.
You help visitors with: finding stations, franchise applications, acquisitions, careers, investor info, and general questions.
- Be concise (under 120 words).
- If asked about pricing beyond Aramco published rates, refer to /stations.
- For franchise questions link to /franchise; acquisitions /acquisitions; careers /careers; investors /investors; contact /contact.
- Never invent stations, prices, or job openings.
- Reply in the same language as the user's last message.`;

const SYSTEM_AR = `أنت المساعد ثنائي اللغة لخدمة عملاء قوستيشن.
قوستيشن شبكة سعودية لمحطات الوقود والتنقل في جميع أنحاء المملكة.
تساعد الزوار في: البحث عن المحطات، طلبات الامتياز، الاستحواذ، الوظائف، علاقات المستثمرين، والاستفسارات العامة.
- كن مختصراً (أقل من 120 كلمة).
- للأسعار خارج أسعار أرامكو المعلنة، وجّه المستخدم إلى /stations.
- للامتياز /franchise؛ الاستحواذ /acquisitions؛ الوظائف /careers؛ المستثمرين /investors؛ التواصل /contact.
- لا تخترع محطات أو أسعاراً أو وظائف.
- أجب بنفس لغة رسالة المستخدم الأخيرة.`;

// Chainable no-op DB used when no Supabase client can be built at all.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NULL_DB: any = new Proxy(function () {}, {
  get: (_t, prop) =>
    prop === "then"
      ? (resolve: (v: unknown) => void) => resolve({ data: null, error: { message: "db unavailable" } })
      : NULL_DB,
  apply: () => NULL_DB,
});

// In-memory per-session limiter used when the service-role key is missing
// (persistent Postgres limits need it). Per-process only.
const memHits = new Map<string, number[]>();
function memoryRateOk(sessionId: string): boolean {
  const now = Date.now();
  const hits = (memHits.get(sessionId) ?? []).filter((t) => t > now - 60_000);
  if (hits.length >= LIMITS.perSessionPerMinute) return false;
  hits.push(now);
  memHits.set(sessionId, hits);
  if (memHits.size > 5000) memHits.clear();
  return true;
}

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => Input.parse(raw))
  .handler(async ({ data }) => {
    const ai = resolveAiConfig();

    // Admin client when SUPABASE_SERVICE_ROLE_KEY is set; otherwise the public
    // client (RLS applies: persistence/abuse logging are skipped, public reads work).
    const { client, isAdmin } = await getServerSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAdmin: any = client ?? NULL_DB;
    if (!isAdmin && !memoryRateOk(data.sessionId)) {
      return { ok: false as const, error: errorMessage("session_minute", data.lang) };
    }

    // Resolve IP + hash early so every abuse event can be attributed.
    let ip = "";
    try {
      const req = getRequest();
      ip = extractIp(req.headers);
    } catch {
      // getRequest unavailable in some contexts.
    }
    const ipHash = await hashIp(ip);

    const reject = async (
      reason: AbuseReason,
      extra: { key?: string; currentCount?: number | null; metadata?: Record<string, unknown> } = {},
    ) => {
      await recordAbuseEvent(supabaseAdmin, {
        reason,
        key: extra.key ?? null,
        sessionId: data.sessionId,
        ipHash: ipHash || null,
        lang: data.lang,
        currentCount: extra.currentCount ?? null,
        metadata: {
          message_length: data.message.length,
          ...(extra.metadata ?? {}),
        },
      });
      return { ok: false as const, error: errorMessage(reason, data.lang) };
    };

    // Content filter (URL flood, char repetition, script tags)
    const contentReason = messageLooksAbusive(data.message);
    if (contentReason) {
      return reject(contentReason, { key: "content_filter" });
    }

    // Persistent per-IP rate limits (Postgres-backed, cross-instance).
    if (ip) {
      const ipMinKey = `ip:${ipHash || ip}:m`;
      const minute = await checkPersistentRate(supabaseAdmin, ipMinKey, 60, LIMITS.perIpPerMinute);
      if (!minute.allowed) {
        return reject("ip_minute", { key: ipMinKey, currentCount: minute.count });
      }
      const ipHrKey = `ip:${ipHash || ip}:h`;
      const hour = await checkPersistentRate(supabaseAdmin, ipHrKey, 3600, LIMITS.perIpPerHour);
      if (!hour.allowed) {
        return reject("ip_hour", { key: ipHrKey, currentCount: hour.count });
      }
    }

    // Persistent per-session rate limits (cross-instance, atomic).
    const smKey = `sess:${data.sessionId}:m`;
    const sm = await checkPersistentRate(supabaseAdmin, smKey, 60, LIMITS.perSessionPerMinute);
    if (!sm.allowed) return reject("session_minute", { key: smKey, currentCount: sm.count });
    const shKey = `sess:${data.sessionId}:h`;
    const sh = await checkPersistentRate(supabaseAdmin, shKey, 3600, LIMITS.perSessionPerHour);
    if (!sh.allowed) return reject("session_hour", { key: shKey, currentCount: sh.count });
    const sdKey = `sess:${data.sessionId}:d`;
    const sd = await checkPersistentRate(supabaseAdmin, sdKey, 86400, LIMITS.perSessionPerDay);
    if (!sd.allowed) return reject("session_day", { key: sdKey, currentCount: sd.count });

    // Session-based rate limits + duplicate/flood detection.
    const now = Date.now();
    const dayAgo = new Date(now - 24 * 3_600_000).toISOString();
    const { data: recent }: { data: { content: string; created_at: string }[] | null } = await supabaseAdmin
      .from("chatbot_messages")
      .select("content, created_at")
      .eq("session_id", data.sessionId)
      .eq("role", "user")
      .gte("created_at", dayAgo)
      .order("created_at", { ascending: false })
      .limit(LIMITS.perSessionPerDay + 1);

    const times = (recent ?? []).map((r) => new Date(r.created_at as string).getTime());
    const last = times[0];
    if (last && now - last < LIMITS.minIntervalMs) {
      return reject("too_fast", { key: `sess:${data.sessionId}:interval` });
    }
    // Duplicate message within window
    const dupSince = now - LIMITS.duplicateWindowMs;
    if (
      (recent ?? []).some(
        (r) =>
          r.content === data.message &&
          new Date(r.created_at as string).getTime() > dupSince,
      )
    ) {
      return reject("duplicate", { key: `sess:${data.sessionId}:dup` });
    }
    const inMinute = times.filter((t) => t > now - 60_000).length;
    const inHour = times.filter((t) => t > now - 3_600_000).length;
    const inDay = times.length;
    if (inMinute >= LIMITS.perSessionPerMinute) {
      return reject("session_minute", { key: smKey, currentCount: inMinute });
    }
    if (inHour >= LIMITS.perSessionPerHour) {
      return reject("session_hour", { key: shKey, currentCount: inHour });
    }
    if (inDay >= LIMITS.perSessionPerDay) {
      return reject("session_day", { key: sdKey, currentCount: inDay });
    }


    // Load complete conversation history.
    const { data: history }: { data: { role: string; content: string }[] | null } = !isAdmin ? { data: [] as { role: string; content: string }[] } : await supabaseAdmin
      .from("chatbot_messages")
      .select("role, content")
      .eq("session_id", data.sessionId)
      .order("created_at", { ascending: true });

    // Persist user message.
    if (isAdmin) await supabaseAdmin.from("chatbot_messages").insert({
      session_id: data.sessionId,
      role: "user",
      content: data.message,
    });

    // Retrieve grounding context from stations, news, jobs
    const grounding = client
      ? await retrieveGrounding(client, data.message, data.lang).catch((e) => {
          console.warn("[chat] grounding failed", e);
          return null;
        })
      : null;
    const groundingBlock = grounding ? formatGrounding(grounding, data.lang) : "";

    const systemPrompt = (data.lang === "ar" ? SYSTEM_AR : SYSTEM_EN) + (groundingBlock ? `\n\n${groundingBlock}` : "");

    const result = await requestChatReply(ai, systemPrompt, history ?? [], data.message);
    if (result.kind === "denied") {
      // A refusal or access denial ends this request; never replay via fallback AI.
      return { ok: false as const, error: data.lang === "ar"
        ? "لا يمكنني المساعدة في هذا الطلب. يمكنك التواصل مع خدمة العملاء على 920007168."
        : "I cannot assist with this request. Contact customer service on 920007168." };
    }
    let reply: string;
    if (result.kind === "answer") {
      reply = result.reply;
    } else {
      let stations: FallbackStation[] = [];
      try {
        if (client) {
          const response = await client.from("stations")
            .select("name_ar,name_en,city_ar,city_en,district_ar,district_en,services,is_active,status")
            .order("name_en").limit(1000);
          stations = response.data ?? [];
        }
      } catch { /* A database outage still gets safe static guidance. */ }
      reply = localChatReply(data.message, data.lang, stations);
    }

    if (isAdmin) await supabaseAdmin.from("chatbot_messages").insert({
      session_id: data.sessionId,
      role: "assistant",
      content: reply,
    });

    return { ok: true as const, reply };
  });

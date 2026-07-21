import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
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

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => Input.parse(raw))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "AI is not configured yet." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

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
    const { data: recent } = await supabaseAdmin
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


    // Load recent history (last 20).
    const { data: history } = await supabaseAdmin
      .from("chatbot_messages")
      .select("role, content")
      .eq("session_id", data.sessionId)
      .order("created_at", { ascending: true })
      .limit(20);

    // Persist user message.
    await supabaseAdmin.from("chatbot_messages").insert({
      session_id: data.sessionId,
      role: "user",
      content: data.message,
    });

    // Retrieve grounding context from stations, news, jobs
    const grounding = await retrieveGrounding(supabaseAdmin, data.message, data.lang);
    const groundingBlock = formatGrounding(grounding, data.lang);

    const systemPrompt = (data.lang === "ar" ? SYSTEM_AR : SYSTEM_EN) + (groundingBlock ? `\n\n${groundingBlock}` : "");

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history ?? []).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: data.message },
    ];

    let reply = "";
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages,
        }),
      });

      if (res.status === 429) {
        return { ok: false as const, error: data.lang === "ar" ? "الخدمة مشغولة، حاول لاحقاً." : "Service busy, try later." };
      }
      if (res.status === 402) {
        return { ok: false as const, error: data.lang === "ar" ? "الرصيد غير كافٍ حالياً." : "AI credits exhausted. Please try later." };
      }
      if (!res.ok) {
        console.error("AI gateway error", res.status, await res.text().catch(() => ""));
        return { ok: false as const, error: data.lang === "ar" ? "حدث خطأ." : "Something went wrong." };
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      reply = json.choices?.[0]?.message?.content?.trim() ?? "";
    } catch (err) {
      console.error(err);
      return { ok: false as const, error: data.lang === "ar" ? "خطأ في الاتصال." : "Network error." };
    }

    if (!reply) {
      reply = data.lang === "ar" ? "عذراً، لم أستطع الرد الآن." : "Sorry, I couldn't answer just now.";
    }

    await supabaseAdmin.from("chatbot_messages").insert({
      session_id: data.sessionId,
      role: "assistant",
      content: reply,
    });

    return { ok: true as const, reply };
  });

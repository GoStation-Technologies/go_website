import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { retrieveGrounding, formatGrounding } from "./chat.grounding";

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

    // Rate limit: 20 messages per session per 10 min.
    const since = new Date(Date.now() - 10 * 60_000).toISOString();
    const { count } = await supabaseAdmin
      .from("chatbot_messages")
      .select("id", { count: "exact", head: true })
      .eq("session_id", data.sessionId)
      .eq("role", "user")
      .gte("created_at", since);
    if ((count ?? 0) >= 20) {
      return {
        ok: false as const,
        error: data.lang === "ar" ? "تجاوزت الحد. حاول لاحقاً." : "Rate limit exceeded. Try again shortly.",
      };
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

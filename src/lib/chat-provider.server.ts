import type { AiConfig } from "./ai-provider.server";

export type ProviderReply = { kind: "answer"; reply: string } | { kind: "fallback" } | { kind: "denied" };
/** One direct Google attempt; no paid provider switching or automatic retries. */
export async function requestChatReply(ai: AiConfig | null, systemPrompt: string, history: {role: string; content: string}[], message: string, fetcher: typeof fetch = fetch): Promise<ProviderReply> {
  if (!ai) return { kind: "fallback" };
  try {
    const response = await fetcher(ai.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": ai.key },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [...history.map(m => ({role: m.role === "assistant" ? "model" : "user", parts: [{text: m.content}]})), {role: "user", parts: [{text: message}]}],
        generationConfig: { thinkingConfig: { thinkingLevel: "low" } },
      }),
    });
    if (response.status === 403) return { kind: "denied" };
    if (!response.ok) return { kind: "fallback" };
    const json = await response.json() as {promptFeedback?: {blockReason?: string}; candidates?: {finishReason?: string; content?: {parts?: {text?: string; thought?: boolean}[]}}[]};
    const candidate = json.candidates?.[0];
    if (json.promptFeedback?.blockReason || ["SAFETY", "RECITATION", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII"].includes(candidate?.finishReason ?? "")) return { kind: "denied" };
    const reply = candidate?.content?.parts?.filter(part => !part.thought).map(part => part.text ?? "").join("").trim();
    return reply ? { kind: "answer", reply } : { kind: "fallback" };
  } catch {
    // Never log raw HTTP exceptions: they can contain credential-bearing URLs.
    return { kind: "fallback" };
  }
}
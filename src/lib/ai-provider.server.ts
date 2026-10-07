// Chat completion provider for self-hosting.
// Priority: OPENAI_API_KEY → GEMINI_API_KEY → LOVABLE_API_KEY (Lovable hosting).
export type ChatMsg = { role: string; content: string };

export type AiConfig = { url: string; key: string; model: string; name: string };

export function resolveAiConfig(): AiConfig | null {
  const openai = process.env.OPENAI_API_KEY;
  if (openai) {
    return {
      name: "openai",
      url: "https://api.openai.com/v1/chat/completions",
      key: openai,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    };
  }
  const gemini = process.env.GEMINI_API_KEY;
  if (gemini) {
    // Strip a redundant "models/" (or "models:") prefix if someone set it in GEMINI_MODEL.
    const sanitizedModel = (process.env.GEMINI_MODEL || "gemini-1.5-flash").replace(/^models[/:]/, "");
    return {
      name: "gemini",
      // Native GenerateContent endpoint (key goes in the query string, not a Bearer header).
      url: `https://generativelanguage.googleapis.com/v1beta/models/${sanitizedModel}:generateContent?key=${gemini}`,
      key: gemini,
      model: sanitizedModel,
    };
  }
  const lovable = process.env.LOVABLE_API_KEY;
  if (lovable) {
    return {
      name: "lovable",
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      key: lovable,
      model: "google/gemini-2.5-flash",
    };
  }
  return null;
}

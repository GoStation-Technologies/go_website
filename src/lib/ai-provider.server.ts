// Free-only Google project key; absent key means deterministic local replies.
export type ChatMsg = { role: string; content: string };

export type AiConfig = { url: string; key: string; model: string; name: string };

export function resolveAiConfig(): AiConfig | null {
  const gemini = process.env.GEMINI_API_KEY;
  if (gemini) {
    // Strip a redundant "models/" (or "models:") prefix if someone set it in GEMINI_MODEL.
    const sanitizedModel = (process.env.GEMINI_MODEL || "gemini-3.8-flash").replace(/^models[/:]/, "");
    return {
      name: "gemini",
      // Google accepts x-goog-api-key; keep credentials out of URLs and logs.
      url: `https://generativelanguage.googleapis.com/v1beta/models/${sanitizedModel}:generateContent`,
      key: gemini,
      model: sanitizedModel,
    };
  }
  return null;
}

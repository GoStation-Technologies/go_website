import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { chromium, type Browser } from "playwright";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.E2E_URL ?? "http://localhost:8080";

let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch();
}, 60_000);
afterAll(async () => {
  await browser?.close();
});

describe("Arabic chat widget", () => {
  it("opens the widget, sends a message, renders an AI reply, and persists the transcript across reload", async () => {
    const context = await browser.newContext({
      locale: "ar",
      extraHTTPHeaders: { "accept-language": "ar" },
    });
    const url = new URL(BASE_URL);
    await context.addCookies([
      { name: "gs_lang", value: "ar", domain: url.hostname, path: "/" },
    ]);
    const page = await context.newPage();

    await page.goto(BASE_URL + "/", { waitUntil: "networkidle" });

    // 1. Open the widget (aria-label from ar translations: "افتح المحادثة").
    const openBtn = page.getByRole("button", { name: "افتح المحادثة" });
    await openBtn.click();

    // Greeting appears in Arabic.
    await expect(
      page.getByText("مرحباً! أنا مساعد قوستيشن. كيف أستطيع مساعدتك؟"),
    ).toBeVisible({ timeout: 5_000 });

    // 2. Send a user message in Arabic.
    const userMsg = "أين أقرب محطة قوستيشن في الرياض؟";
    const input = page.getByPlaceholder("اكتب رسالتك…");
    await input.fill(userMsg);
    await page.getByRole("button", { name: "إرسال" }).click();

    // 3. User message renders immediately.
    await expect(page.getByText(userMsg)).toBeVisible();

    // 4. Wait for the assistant reply. Widget renders one assistant bubble
    //    (greeting) initially; wait until a second assistant bubble appears
    //    with non-empty text, and the busy spinner is gone.
    await page.waitForFunction(
      () => {
        const bubbles = document.querySelectorAll(
          '[class*="bg-muted"][class*="rounded-2xl"]',
        );
        // greeting + at least one reply, and no active spinner
        const hasReply = bubbles.length >= 2;
        const spinner = document.querySelector(".animate-spin");
        return hasReply && !spinner;
      },
      { timeout: 45_000 },
    );

    const assistantBubbles = await page
      .locator('[class*="bg-muted"][class*="rounded-2xl"]')
      .allInnerTexts();
    const reply = assistantBubbles[assistantBubbles.length - 1]?.trim() ?? "";
    expect(reply.length).toBeGreaterThan(0);
    expect(reply).not.toMatch(/Something went wrong|حدث خطأ|Network error/i);

    // 5. Capture the persistent session id from localStorage.
    const sessionId = await page.evaluate(() =>
      window.localStorage.getItem("gs_chat_session"),
    );
    expect(sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    // 6. Reload the page and confirm the session id survives.
    await page.reload({ waitUntil: "networkidle" });
    const sessionIdAfter = await page.evaluate(() =>
      window.localStorage.getItem("gs_chat_session"),
    );
    expect(sessionIdAfter).toBe(sessionId);

    // 7. Confirm the transcript persisted server-side for that session.
    //    Uses service role when available (local dev / sandbox). Skipped
    //    gracefully in environments where the key is not exposed.
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceKey && sessionId) {
      const admin = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await admin
        .from("chatbot_messages")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      expect(error).toBeNull();
      expect(data).toBeTruthy();
      const roles = (data ?? []).map((r) => r.role);
      expect(roles).toContain("user");
      expect(roles).toContain("assistant");
      const userRow = (data ?? []).find(
        (r) => r.role === "user" && r.content === userMsg,
      );
      expect(userRow, "user message persisted in chatbot_messages").toBeTruthy();
    } else {
      console.warn(
        "[chat-widget test] skipping DB persistence assertion — SUPABASE_SERVICE_ROLE_KEY not set",
      );
    }

    await context.close();
  }, 120_000);
});

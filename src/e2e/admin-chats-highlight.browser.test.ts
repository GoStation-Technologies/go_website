import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { chromium, type Browser } from "playwright";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const BASE_URL = process.env.E2E_URL ?? "http://localhost:8080";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const canRun = Boolean(SUPABASE_URL && SERVICE_KEY);
const maybe = canRun ? describe : describe.skip;

if (!canRun) {
  console.warn(
    "[admin-chats-highlight test] skipping — SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set",
  );
}

const admin: SupabaseClient | null = canRun
  ? createClient(SUPABASE_URL!, SERVICE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

type TestUser = { id: string; email: string; password: string };

async function createUser(label: string): Promise<TestUser> {
  const email = `e2e-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.gostation.test`;
  const password = "Test-" + Math.random().toString(36).slice(2) + "!A9";
  const { data, error } = await admin!.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser(${label}) failed: ${error?.message}`);
  return { id: data.user.id, email, password };
}

let browser: Browser;
let superAdmin: TestUser | null = null;
const sessionId = randomUUID();
// Message with mixed-case keyword occurring multiple times.
const KEYWORD = "Diesel";
const multiMatchContent = "diesel prices; DIESEL supply; Diesel demand rising";
const otherContent = "Assistant reply about fuel";

beforeAll(async () => {
  if (!canRun) return;
  browser = await chromium.launch();
  superAdmin = await createUser("hl");
  await admin!.from("user_roles").insert({ user_id: superAdmin.id, role: "super_admin" });
  const { error } = await admin!.from("chatbot_messages").insert([
    { session_id: sessionId, role: "user", content: multiMatchContent },
    { session_id: sessionId, role: "assistant", content: otherContent },
  ]);
  if (error) throw new Error(`seed failed: ${error.message}`);
}, 90_000);

afterAll(async () => {
  await browser?.close();
  if (!canRun) return;
  try { await admin!.from("chatbot_messages").delete().eq("session_id", sessionId); } catch { /* ignore */ }
  if (superAdmin) await admin!.auth.admin.deleteUser(superAdmin.id).catch(() => {});
});

async function signIn(user: TestUser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(BASE_URL + "/manage-portal-9f4c2ab7/login", { waitUntil: "networkidle" });
  await page.locator('input[name="email"]').fill(user.email);
  await page.locator('input[name="password"]').fill(user.password);
  await Promise.all([
    page.waitForURL((u) => new URL(u).pathname === "/", { timeout: 15_000 }),
    page.locator('form button[type="submit"]').click(),
  ]);
  return { context, page };
}

maybe("Admin chats — keyword highlighting", () => {
  it("renders <mark> for each case-insensitive match in message content and preserves source casing", async () => {
    const { context, page } = await signIn(superAdmin!);
    // Query lowercase to prove case-insensitive matching against mixed-case source.
    const q = KEYWORD.toLowerCase();
    await page.goto(`${BASE_URL}/manage-portal-9f4c2ab7/chats?q=${encodeURIComponent(q)}`, {
      waitUntil: "networkidle",
    });

    const details = page.locator(`details[data-session-id="${sessionId}"]`);
    await details.waitFor({ state: "visible", timeout: 15_000 });

    // Multi-match message: exactly 3 highlights inside the user bubble.
    const userBubble = details.locator('[data-testid="chats-message-content"][data-role="user"]');
    const marks = userBubble.locator('mark[data-testid="chats-highlight"]');
    expect(await marks.count()).toBe(3);
    const markTexts = await marks.allInnerTexts();
    // Source casing preserved for each match.
    expect(markTexts).toEqual(["diesel", "DIESEL", "Diesel"]);

    // Reassembled bubble text still equals the seeded content.
    expect((await userBubble.innerText()).trim()).toBe(multiMatchContent);

    // Assistant bubble has no matches (no <mark>).
    const asst = details.locator('[data-testid="chats-message-content"][data-role="assistant"]');
    expect(await asst.locator('mark[data-testid="chats-highlight"]').count()).toBe(0);

    await context.close();
  }, 90_000);

  it("highlights the matched prefix inside the session-id label case-insensitively", async () => {
    const { context, page } = await signIn(superAdmin!);
    // Query first 4 hex chars of the session id, uppercased, to exercise
    // case-insensitive matching against the lowercased UUID prefix in the UI.
    const prefix = sessionId.slice(0, 4);
    const q = prefix.toUpperCase();
    await page.goto(`${BASE_URL}/manage-portal-9f4c2ab7/chats?q=${encodeURIComponent(q)}`, {
      waitUntil: "networkidle",
    });

    const details = page.locator(`details[data-session-id="${sessionId}"]`);
    await details.waitFor({ state: "visible", timeout: 15_000 });

    const idLabel = details.locator('[data-testid="chats-session-id"]');
    const marks = idLabel.locator('mark[data-testid="chats-highlight"]');
    expect(await marks.count()).toBe(1);
    // Source casing (lowercase UUID) preserved inside the mark.
    expect((await marks.first().innerText()).trim()).toBe(prefix);
    // Full 8-char prefix still visible around the mark.
    expect((await idLabel.innerText()).trim()).toBe(sessionId.slice(0, 8));

    await context.close();
  }, 90_000);

  it("renders no <mark> elements when q is empty", async () => {
    const { context, page } = await signIn(superAdmin!);
    await page.goto(`${BASE_URL}/manage-portal-9f4c2ab7/chats`, { waitUntil: "networkidle" });
    const details = page.locator(`details[data-session-id="${sessionId}"]`);
    await details.waitFor({ state: "visible", timeout: 15_000 });
    expect(await page.locator('mark[data-testid="chats-highlight"]').count()).toBe(0);
    await context.close();
  }, 90_000);
});

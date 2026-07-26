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
    "[admin-chats test] skipping — SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set",
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
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser(${label}) failed: ${error?.message}`);
  return { id: data.user.id, email, password };
}
async function deleteUser(u: TestUser | null) {
  if (!u) return;
  await admin!.auth.admin.deleteUser(u.id).catch(() => {});
}

let browser: Browser;
let superAdmin: TestUser | null = null;
let outsider: TestUser | null = null;

// Two independent chat sessions we can distinguish deterministically.
const sessionA = randomUUID();
const sessionB = randomUUID();
const uniqA = `alpha-${randomUUID().slice(0, 8)}`;
const uniqB = `bravo-${randomUUID().slice(0, 8)}`;
const transcriptA = [
  { role: "user", content: `Hello from session A — token ${uniqA}` },
  { role: "assistant", content: `Reply A — token ${uniqA}` },
];
const transcriptB = [
  { role: "user", content: `Hello from session B — token ${uniqB}` },
  { role: "assistant", content: `Reply B — token ${uniqB}` },
];

beforeAll(async () => {
  if (!canRun) return;
  browser = await chromium.launch();
  [superAdmin, outsider] = await Promise.all([createUser("chatadm"), createUser("chatout")]);
  await admin!.from("user_roles").insert({ user_id: superAdmin!.id, role: "super_admin" });
  const rows = [
    ...transcriptA.map((m) => ({ session_id: sessionA, ...m })),
    ...transcriptB.map((m) => ({ session_id: sessionB, ...m })),
  ];
  const { error } = await admin!.from("chatbot_messages").insert(rows);
  if (error) throw new Error(`seed chats failed: ${error.message}`);
}, 90_000);

afterAll(async () => {
  await browser?.close();
  if (!canRun) return;
  try {
    await admin!.from("chatbot_messages").delete().in("session_id", [sessionA, sessionB]);
  } catch { /* ignore */ }
  await Promise.all([deleteUser(superAdmin), deleteUser(outsider)]);
});

async function signIn(user: TestUser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(BASE_URL + "/admin/login", { waitUntil: "networkidle" });
  await page.locator('input[name="email"]').fill(user.email);
  await page.locator('input[name="password"]').fill(user.password);
  await Promise.all([
    page.waitForURL((u) => new URL(u).pathname === "/", { timeout: 15_000 }),
    page.locator('form button[type="submit"]').click(),
  ]);
  return { context, page };
}

maybe("Admin chat logs — filter & access control", () => {
  it("super_admin sees both sessions, filter narrows to one, transcript matches", async () => {
    const { context, page } = await signIn(superAdmin!);
    await page.goto(BASE_URL + "/admin/chats", { waitUntil: "networkidle" });
    expect(new URL(page.url()).pathname).toBe("/admin/chats");

    const sessionAEl = page.locator(`details[data-session-id="${sessionA}"]`);
    const sessionBEl = page.locator(`details[data-session-id="${sessionB}"]`);
    await sessionAEl.waitFor({ state: "visible", timeout: 15_000 });
    await sessionBEl.waitFor({ state: "visible", timeout: 15_000 });

    // Filter by session A's full UUID → only A remains
    const filter = page.getByLabel("Filter by session ID");
    await filter.fill(sessionA);
    await sessionAEl.waitFor({ state: "visible", timeout: 5_000 });
    await sessionBEl.waitFor({ state: "detached", timeout: 5_000 });

    // Transcript rendered matches what we seeded, in order
    const bubbles = sessionAEl.locator("[data-role]");
    const count = await bubbles.count();
    expect(count).toBe(transcriptA.length);
    for (let i = 0; i < transcriptA.length; i++) {
      const b = bubbles.nth(i);
      expect(await b.getAttribute("data-role")).toBe(transcriptA[i].role);
      expect((await b.innerText()).trim()).toBe(transcriptA[i].content);
    }

    // Filter by a prefix that matches nothing → empty state
    await filter.fill("ffffffff-ffff-ffff-ffff-ffffffffffff");
    await page.getByTestId("chats-empty").waitFor({ state: "visible", timeout: 5_000 });

    // Filter to session B → session A's unique token is nowhere on the page
    await filter.fill(sessionB);
    await sessionBEl.waitFor({ state: "visible", timeout: 5_000 });
    const body = await page.locator("body").innerText();
    expect(body).toContain(uniqB);
    expect(body).not.toContain(uniqA);

    await context.close();
  }, 90_000);

  it("signed-in outsider cannot reach /admin/chats and no chat content leaks", async () => {
    const { context, page } = await signIn(outsider!);
    await page.goto(BASE_URL + "/admin/chats", { waitUntil: "networkidle" });
    const pathname = new URL(page.url()).pathname;
    expect(pathname).not.toMatch(/^\/admin(\/|$)/);
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).not.toContain(uniqA.toLowerCase());
    expect(body).not.toContain(uniqB.toLowerCase());
    expect(body).not.toContain(sessionA.toLowerCase());
    expect(body).not.toContain(sessionB.toLowerCase());
    await context.close();
  }, 60_000);

  it("unauthenticated visitor is bounced to /auth with no chat content leaked", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(BASE_URL + "/admin/chats", { waitUntil: "networkidle" });
    expect(new URL(page.url()).pathname).toBe("/admin/login");
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).not.toContain(uniqA.toLowerCase());
    expect(body).not.toContain(uniqB.toLowerCase());
    await context.close();
  }, 45_000);
});

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
    "[admin-chats-page-size test] skipping — SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set",
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
async function deleteUser(u: TestUser | null) {
  if (!u) return;
  await admin!.auth.admin.deleteUser(u.id).catch(() => {});
}

let browser: Browser;
let superAdmin: TestUser | null = null;

const N = 13;
const seededIds: string[] = [];

beforeAll(async () => {
  if (!canRun) return;
  browser = await chromium.launch();
  superAdmin = await createUser("chatpagesize");
  await admin!.from("user_roles").insert({ user_id: superAdmin.id, role: "super_admin" });

  const base = Date.now() - N * 60_000;
  const rows: Array<{ session_id: string; role: string; content: string; created_at: string }> = [];
  for (let i = 0; i < N; i++) {
    const sessionId = randomUUID();
    seededIds.push(sessionId);
    const sessionStart = base + i * 60_000;
    for (let m = 0; m < 3; m++) {
      const ts = new Date(sessionStart + m * 500).toISOString();
      rows.push({
        session_id: sessionId,
        role: m % 2 === 0 ? "user" : "assistant",
        content: `page-size session ${i} msg ${m}`,
        created_at: ts,
      });
    }
  }
  const { error } = await admin!.from("chatbot_messages").insert(rows);
  if (error) throw new Error(`seed chats failed: ${error.message}`);
}, 120_000);

afterAll(async () => {
  await browser?.close();
  if (!canRun) return;
  if (seededIds.length) {
    try { await admin!.from("chatbot_messages").delete().in("session_id", seededIds); } catch { /* ignore */ }
  }
  await deleteUser(superAdmin);
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

async function readList(page: import("playwright").Page) {
  const list = page.getByTestId("chats-list");
  await list.waitFor({ state: "visible", timeout: 15_000 });
  return {
    total: Number(await list.getAttribute("data-total")),
    pageSize: Number(await list.getAttribute("data-page-size")),
    pageIdx: Number(await list.getAttribute("data-page")),
    pageCount: Number(await list.getAttribute("data-page-count")),
    rendered: await list.locator("details[data-session-id]").count(),
  };
}

maybe("Admin chat logs — pageSize + last-page behavior", () => {
  it("changing pageSize updates pageCount and last-page Next/Prev behave correctly", async () => {
    const { context, page } = await signIn(superAdmin!);

    // Start at pageSize=5
    await page.goto(BASE_URL + `/admin/chats?page=1&pageSize=5&sort=newest`, { waitUntil: "networkidle" });
    const s5 = await readList(page);
    expect(s5.pageSize).toBe(5);
    expect(s5.pageCount).toBe(Math.max(1, Math.ceil(s5.total / 5)));
    expect(s5.pageCount).toBeGreaterThanOrEqual(Math.ceil(N / 5));

    // Change pageSize to 25 via the select — pageCount must shrink
    await page.getByLabel("Rows per page").selectOption("25");
    await page.waitForURL(/[?&]pageSize=25(?:&|$)/, { timeout: 5_000 });
    const s25 = await readList(page);
    expect(s25.pageSize).toBe(25);
    expect(s25.pageIdx).toBe(1); // page must reset to 1
    expect(s25.pageCount).toBe(Math.max(1, Math.ceil(s25.total / 25)));
    expect(s25.pageCount).toBeLessThanOrEqual(s5.pageCount);
    expect(s25.total).toBe(s5.total);

    // Change to pageSize=10 and land on the last page
    await page.getByLabel("Rows per page").selectOption("10");
    await page.waitForURL(/[?&]pageSize=10(?:&|$)/, { timeout: 5_000 });
    const s10 = await readList(page);
    expect(s10.pageSize).toBe(10);
    expect(s10.pageIdx).toBe(1);
    expect(s10.pageCount).toBe(Math.max(1, Math.ceil(s10.total / 10)));

    await page.goto(
      BASE_URL + `/admin/chats?page=${s10.pageCount}&pageSize=10&sort=newest`,
      { waitUntil: "networkidle" },
    );
    const last = await readList(page);
    expect(last.pageIdx).toBe(s10.pageCount);
    expect(last.rendered).toBeGreaterThan(0);
    expect(last.rendered).toBeLessThanOrEqual(10);
    // Expected count on the last page equals total - (pageCount-1)*pageSize
    const expectedLast = last.total - (last.pageCount - 1) * last.pageSize;
    expect(last.rendered).toBe(expectedLast);

    // Next disabled on last page, Prev enabled
    expect(await page.getByRole("button", { name: "Next page" }).isDisabled()).toBe(true);
    expect(await page.getByRole("button", { name: "Previous page" }).isDisabled()).toBe(false);

    // Prev → not-last → Next disabled becomes enabled
    await page.getByRole("button", { name: "Previous page" }).click();
    await page.waitForURL(new RegExp(`[?&]page=${last.pageCount - 1}(?:&|$)`), { timeout: 5_000 });
    const prev = await readList(page);
    expect(prev.pageIdx).toBe(last.pageCount - 1);
    expect(await page.getByRole("button", { name: "Next page" }).isDisabled()).toBe(false);

    // Back to last page → Next disabled again, rendered count stable
    await page.getByRole("button", { name: "Next page" }).click();
    await page.waitForURL(new RegExp(`[?&]page=${last.pageCount}(?:&|$)`), { timeout: 5_000 });
    const lastAgain = await readList(page);
    expect(lastAgain.pageIdx).toBe(last.pageCount);
    expect(lastAgain.rendered).toBe(expectedLast);
    expect(await page.getByRole("button", { name: "Next page" }).isDisabled()).toBe(true);

    // On last page, bump pageSize up — should reset to page 1 and shrink pageCount
    await page.getByLabel("Rows per page").selectOption("50");
    await page.waitForURL(/[?&]pageSize=50(?:&|$)/, { timeout: 5_000 });
    const s50 = await readList(page);
    expect(s50.pageSize).toBe(50);
    expect(s50.pageIdx).toBe(1);
    expect(s50.pageCount).toBe(Math.max(1, Math.ceil(s50.total / 50)));
    expect(s50.total).toBe(last.total);

    await context.close();
  }, 180_000);
});

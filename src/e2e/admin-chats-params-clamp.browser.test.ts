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
    "[admin-chats-params-clamp test] skipping — SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set",
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

const N = 11;
const seededIds: string[] = [];

beforeAll(async () => {
  if (!canRun) return;
  browser = await chromium.launch();
  superAdmin = await createUser("chatparams");
  await admin!.from("user_roles").insert({ user_id: superAdmin.id, role: "super_admin" });

  const base = Date.now() - N * 60_000;
  const rows: Array<{ session_id: string; role: string; content: string; created_at: string }> = [];
  for (let i = 0; i < N; i++) {
    const sessionId = randomUUID();
    seededIds.push(sessionId);
    const start = base + i * 60_000;
    for (let m = 0; m < 2; m++) {
      rows.push({
        session_id: sessionId,
        role: m % 2 === 0 ? "user" : "assistant",
        content: `params-clamp session ${i} msg ${m}`,
        created_at: new Date(start + m * 500).toISOString(),
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
  await page.goto(BASE_URL + "/manage-portal-9f4c2ab7/login", { waitUntil: "networkidle" });
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
    sort: await list.getAttribute("data-sort"),
    rendered: await list.locator("details[data-session-id]").count(),
  };
}

maybe("Admin chat logs — query param clamping & rejection", () => {
  it("clamps out-of-range/garbage page, pageSize, sort and still renders last-page correctly", async () => {
    const { context, page } = await signIn(superAdmin!);

    // 1) Garbage sort → falls back to "newest"; garbage numbers → defaults.
    await page.goto(
      BASE_URL + `/manage-portal-9f4c2ab7/chats?page=abc&pageSize=xyz&sort=bogus`,
      { waitUntil: "networkidle" },
    );
    const garbage = await readList(page);
    expect(garbage.sort).toBe("newest");
    expect(garbage.pageSize).toBe(10);
    expect(garbage.pageIdx).toBe(1);
    expect(garbage.pageCount).toBe(Math.max(1, Math.ceil(garbage.total / 10)));
    expect(garbage.rendered).toBeLessThanOrEqual(10);
    expect(garbage.rendered).toBeGreaterThan(0);

    // 2) Negative / zero values → clamped to sane minimums.
    await page.goto(
      BASE_URL + `/manage-portal-9f4c2ab7/chats?page=-5&pageSize=0&sort=newest`,
      { waitUntil: "networkidle" },
    );
    const neg = await readList(page);
    expect(neg.pageIdx).toBe(1);
    expect(neg.pageSize).toBeGreaterThanOrEqual(1);
    expect(neg.rendered).toBeGreaterThan(0);

    // 3) Absurdly huge page → server clamps to last page; Next disabled, Prev enabled.
    const total = neg.total;
    await page.goto(
      BASE_URL + `/manage-portal-9f4c2ab7/chats?page=99999&pageSize=5&sort=newest`,
      { waitUntil: "networkidle" },
    );
    const huge = await readList(page);
    const expectedPageCount = Math.max(1, Math.ceil(total / 5));
    expect(huge.total).toBe(total);
    expect(huge.pageSize).toBe(5);
    expect(huge.pageCount).toBe(expectedPageCount);
    // Server returns the last page even though URL asked for 99999.
    expect(huge.pageIdx).toBe(expectedPageCount);
    const expectedLast = huge.total - (huge.pageCount - 1) * huge.pageSize;
    expect(huge.rendered).toBe(expectedLast);
    expect(await page.getByRole("button", { name: "Next page" }).isDisabled()).toBe(true);
    expect(await page.getByRole("button", { name: "Previous page" }).isDisabled()).toBe(false);

    // 4) Excessively large pageSize → clamped (server caps at 100). Still renders page 1.
    await page.goto(
      BASE_URL + `/manage-portal-9f4c2ab7/chats?page=1&pageSize=999999&sort=newest`,
      { waitUntil: "networkidle" },
    );
    const bigSize = await readList(page);
    expect(bigSize.pageSize).toBeLessThanOrEqual(100);
    expect(bigSize.pageSize).toBeGreaterThanOrEqual(1);
    expect(bigSize.pageIdx).toBe(1);
    expect(bigSize.pageCount).toBe(Math.max(1, Math.ceil(bigSize.total / bigSize.pageSize)));

    await context.close();
  }, 180_000);
});

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
    "[admin-chats-last-page test] skipping — SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set",
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

const N = 12;
const seededIds: string[] = [];

beforeAll(async () => {
  if (!canRun) return;
  browser = await chromium.launch();
  superAdmin = await createUser("chatlast");
  await admin!.from("user_roles").insert({ user_id: superAdmin.id, role: "super_admin" });

  const base = Date.now() - N * 60_000;
  const rows: Array<{ session_id: string; role: string; content: string; created_at: string }> = [];
  for (let i = 0; i < N; i++) {
    const sessionId = randomUUID();
    seededIds.push(sessionId);
    const messageCount = i + 2;
    const sessionStart = base + i * 60_000;
    for (let m = 0; m < messageCount; m++) {
      const ts = new Date(sessionStart + m * 500).toISOString();
      rows.push({
        session_id: sessionId,
        role: m % 2 === 0 ? "user" : "assistant",
        content: `last-page session ${i} msg ${m}`,
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
  await page.goto(BASE_URL + "/auth", { waitUntil: "networkidle" });
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
  const total = Number(await list.getAttribute("data-total"));
  const pageSize = Number(await list.getAttribute("data-page-size"));
  const pageIdx = Number(await list.getAttribute("data-page"));
  const pageCount = Number(await list.getAttribute("data-page-count"));
  const details = list.locator("details[data-session-id]");
  const n = await details.count();
  const ids: string[] = [];
  for (let i = 0; i < n; i++) {
    ids.push((await details.nth(i).getAttribute("data-session-id")) ?? "");
  }
  return { total, pageSize, pageIdx, pageCount, ids };
}

maybe("Admin chat logs — last-page behavior", () => {
  it("Next is disabled on the last page and pageCount matches total/pageSize math", async () => {
    const { context, page } = await signIn(superAdmin!);
    const pageSize = 5;
    await page.goto(BASE_URL + `/admin/chats?page=1&pageSize=${pageSize}&sort=newest`, { waitUntil: "networkidle" });

    const first = await readList(page);
    expect(first.pageCount).toBe(Math.max(1, Math.ceil(first.total / pageSize)));
    expect(first.pageCount).toBeGreaterThanOrEqual(Math.ceil(N / pageSize));

    // Jump directly to the last page via URL
    await page.goto(
      BASE_URL + `/admin/chats?page=${first.pageCount}&pageSize=${pageSize}&sort=newest`,
      { waitUntil: "networkidle" },
    );
    const last = await readList(page);
    expect(last.pageIdx).toBe(first.pageCount);
    expect(last.pageCount).toBe(first.pageCount);
    expect(last.ids.length).toBeGreaterThan(0);
    expect(last.ids.length).toBeLessThanOrEqual(pageSize);

    // Next disabled, Prev enabled
    expect(await page.getByRole("button", { name: "Next page" }).isDisabled()).toBe(true);
    expect(await page.getByRole("button", { name: "Previous page" }).isDisabled()).toBe(false);

    // Summary text reflects the correct page count
    const summary = await page.getByTestId("chats-summary").textContent();
    expect(summary ?? "").toContain(`Page ${last.pageIdx} of ${last.pageCount}`);
    expect(summary ?? "").toContain(`${last.total} sessions`);

    await context.close();
  }, 120_000);

  it("walking every page yields no duplicate ids and Prev/Next round-trip to the last page is stable", async () => {
    const { context, page } = await signIn(superAdmin!);
    const pageSize = 5;
    await page.goto(BASE_URL + `/admin/chats?page=1&pageSize=${pageSize}&sort=newest`, { waitUntil: "networkidle" });

    const first = await readList(page);
    const pageCount = first.pageCount;

    const seen = new Set<string>();
    const perPage: string[][] = [];
    for (const id of first.ids) {
      expect(seen.has(id)).toBe(false);
      seen.add(id);
    }
    perPage.push(first.ids);

    for (let p = 2; p <= pageCount; p++) {
      await page.getByRole("button", { name: "Next page" }).click();
      await page.waitForURL(new RegExp(`[?&]page=${p}(?:&|$)`), { timeout: 5_000 });
      const info = await readList(page);
      expect(info.pageIdx).toBe(p);
      expect(info.ids.length).toBeGreaterThan(0);
      expect(info.ids.length).toBeLessThanOrEqual(pageSize);
      for (const id of info.ids) {
        expect(seen.has(id)).toBe(false);
        seen.add(id);
      }
      perPage.push(info.ids);
    }

    // Now on last page — Next disabled
    expect(await page.getByRole("button", { name: "Next page" }).isDisabled()).toBe(true);

    // Total rendered across pages equals total (bounded by pageSize * pageCount)
    const rendered = perPage.reduce((n, arr) => n + arr.length, 0);
    expect(rendered).toBe(first.total);

    // All seeded ids were seen somewhere
    for (const sid of seededIds) expect(seen.has(sid)).toBe(true);

    // Round-trip: Prev then Next returns to identical last page
    const lastIdsBefore = perPage[perPage.length - 1];
    await page.getByRole("button", { name: "Previous page" }).click();
    await page.waitForURL(new RegExp(`[?&]page=${pageCount - 1}(?:&|$)`), { timeout: 5_000 });
    await page.getByRole("button", { name: "Next page" }).click();
    await page.waitForURL(new RegExp(`[?&]page=${pageCount}(?:&|$)`), { timeout: 5_000 });
    const lastAgain = await readList(page);
    expect(lastAgain.ids).toEqual(lastIdsBefore);
    expect(await page.getByRole("button", { name: "Next page" }).isDisabled()).toBe(true);

    await context.close();
  }, 180_000);
});

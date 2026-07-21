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
    "[admin-chats-pagination test] skipping — SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set",
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

// Build N sessions with strictly increasing `firstAt` and varying message
// counts. Session index i (0..N-1) gets i+2 messages so "messages" sort has a
// clean total ordering.
const N = 12;
type Seeded = { sessionId: string; messageCount: number; firstAt: string; lastAt: string };
const seeded: Seeded[] = [];

beforeAll(async () => {
  if (!canRun) return;
  browser = await chromium.launch();
  superAdmin = await createUser("chatpage");
  await admin!.from("user_roles").insert({ user_id: superAdmin.id, role: "super_admin" });

  const base = Date.now() - N * 60_000; // spread over the last N minutes
  const rows: Array<{ session_id: string; role: string; content: string; created_at: string }> = [];
  for (let i = 0; i < N; i++) {
    const sessionId = randomUUID();
    const messageCount = i + 2; // 2..N+1
    const sessionStart = base + i * 60_000;
    const firstAt = new Date(sessionStart).toISOString();
    let lastAt = firstAt;
    for (let m = 0; m < messageCount; m++) {
      const ts = new Date(sessionStart + m * 500).toISOString();
      lastAt = ts;
      rows.push({
        session_id: sessionId,
        role: m % 2 === 0 ? "user" : "assistant",
        content: `session ${i} msg ${m}`,
        created_at: ts,
      });
    }
    seeded.push({ sessionId, messageCount, firstAt, lastAt });
  }
  const { error } = await admin!.from("chatbot_messages").insert(rows);
  if (error) throw new Error(`seed chats failed: ${error.message}`);
}, 120_000);

afterAll(async () => {
  await browser?.close();
  if (!canRun) return;
  const ids = seeded.map((s) => s.sessionId);
  if (ids.length) {
    try { await admin!.from("chatbot_messages").delete().in("session_id", ids); } catch { /* ignore */ }
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

// The DB may contain unrelated chatbot_messages seeded by other tests; we only
// assert about the sessions we own. Helpers below filter the rendered list to
// our known IDs so the assertions stay deterministic.
async function readList(page: import("playwright").Page) {
  const list = page.getByTestId("chats-list");
  await list.waitFor({ state: "visible", timeout: 15_000 });
  const total = Number(await list.getAttribute("data-total"));
  const pageSize = Number(await list.getAttribute("data-page-size"));
  const pageIdx = Number(await list.getAttribute("data-page"));
  const pageCount = Number(await list.getAttribute("data-page-count"));
  const sort = await list.getAttribute("data-sort");
  const detailsAll = list.locator("details[data-session-id]");
  const rendered: Array<{ sessionId: string; messageCount: number; lastAt: string }> = [];
  const n = await detailsAll.count();
  for (let i = 0; i < n; i++) {
    const d = detailsAll.nth(i);
    rendered.push({
      sessionId: (await d.getAttribute("data-session-id")) ?? "",
      messageCount: Number(await d.getAttribute("data-message-count")),
      lastAt: (await d.getAttribute("data-last-at")) ?? "",
    });
  }
  return { total, pageSize, pageIdx, pageCount, sort, rendered };
}

function ownedOrder(rendered: { sessionId: string }[], ownedIds: Set<string>) {
  return rendered.map((r) => r.sessionId).filter((id) => ownedIds.has(id));
}

maybe("Admin chat logs — pagination and sorting", () => {
  it("newest sort: owned sessions appear on page 1 in descending lastAt order, page size honored", async () => {
    const { context, page } = await signIn(superAdmin!);
    // pageSize large enough that all N seeded sessions land on page 1
    await page.goto(BASE_URL + "/admin/chats?page=1&pageSize=50&sort=newest", { waitUntil: "networkidle" });

    const info = await readList(page);
    expect(info.sort).toBe("newest");
    expect(info.pageSize).toBe(50);
    expect(info.total).toBeGreaterThanOrEqual(N);
    expect(info.rendered.length).toBeLessThanOrEqual(50);

    const ownedIds = new Set(seeded.map((s) => s.sessionId));
    const ownedRenderedOrder = ownedOrder(info.rendered, ownedIds);
    // All N owned sessions should be present in the first page window
    expect(ownedRenderedOrder.length).toBe(N);
    // Expected newest → oldest by lastAt (i.e. reverse seeding order)
    const expectedNewest = [...seeded].sort((a, b) => b.lastAt.localeCompare(a.lastAt)).map((s) => s.sessionId);
    expect(ownedRenderedOrder).toEqual(expectedNewest);

    await context.close();
  }, 90_000);

  it("oldest sort reverses order relative to newest for the owned sessions", async () => {
    const { context, page } = await signIn(superAdmin!);
    await page.goto(BASE_URL + "/admin/chats?page=1&pageSize=50&sort=oldest", { waitUntil: "networkidle" });

    const info = await readList(page);
    expect(info.sort).toBe("oldest");
    const ownedIds = new Set(seeded.map((s) => s.sessionId));
    const ownedRenderedOrder = ownedOrder(info.rendered, ownedIds);
    const expectedOldest = [...seeded].sort((a, b) => a.firstAt.localeCompare(b.firstAt)).map((s) => s.sessionId);
    // The oldest owned session must render before any newer owned session
    expect(ownedRenderedOrder.slice(0, N)).toEqual(expectedOldest);

    await context.close();
  }, 90_000);

  it("messages sort puts the biggest owned transcript before smaller ones", async () => {
    const { context, page } = await signIn(superAdmin!);
    await page.goto(BASE_URL + "/admin/chats?page=1&pageSize=50&sort=messages", { waitUntil: "networkidle" });

    const info = await readList(page);
    expect(info.sort).toBe("messages");
    const ownedIds = new Set(seeded.map((s) => s.sessionId));
    const ownedRendered = info.rendered.filter((r) => ownedIds.has(r.sessionId));
    const expectedByMessages = [...seeded]
      .sort((a, b) => b.messageCount - a.messageCount || b.lastAt.localeCompare(a.lastAt))
      .map((s) => s.sessionId);
    expect(ownedRendered.map((r) => r.sessionId)).toEqual(expectedByMessages);
    // Sanity: messageCount attribute matches what we seeded
    for (const r of ownedRendered) {
      const s = seeded.find((x) => x.sessionId === r.sessionId)!;
      expect(r.messageCount).toBe(s.messageCount);
    }

    await context.close();
  }, 90_000);

  it("pagination: pageSize=5 renders at most 5 rows and Next/Prev walk correct pages without overlap", async () => {
    const { context, page } = await signIn(superAdmin!);
    await page.goto(BASE_URL + "/admin/chats?page=1&pageSize=5&sort=newest", { waitUntil: "networkidle" });

    const p1 = await readList(page);
    expect(p1.pageSize).toBe(5);
    expect(p1.pageIdx).toBe(1);
    expect(p1.rendered.length).toBe(5);
    expect(p1.pageCount).toBeGreaterThanOrEqual(Math.ceil(N / 5));

    // Next page
    await page.getByRole("button", { name: "Next page" }).click();
    await page.waitForURL(/[?&]page=2(?:&|$)/, { timeout: 5_000 });
    const p2 = await readList(page);
    expect(p2.pageIdx).toBe(2);
    expect(p2.rendered.length).toBeLessThanOrEqual(5);
    expect(p2.rendered.length).toBeGreaterThan(0);

    const idsP1 = new Set(p1.rendered.map((r) => r.sessionId));
    for (const r of p2.rendered) expect(idsP1.has(r.sessionId)).toBe(false);

    // Prev returns to page 1 with the same IDs
    await page.getByRole("button", { name: "Previous page" }).click();
    await page.waitForURL(/[?&]page=1(?:&|$)/, { timeout: 5_000 });
    const p1b = await readList(page);
    expect(p1b.pageIdx).toBe(1);
    expect(p1b.rendered.map((r) => r.sessionId)).toEqual(p1.rendered.map((r) => r.sessionId));

    // Prev on page 1 is disabled
    expect(await page.getByRole("button", { name: "Previous page" }).isDisabled()).toBe(true);

    await context.close();
  }, 90_000);

  it("changing sort via the select updates the URL, resets to page 1, and reorders rows", async () => {
    const { context, page } = await signIn(superAdmin!);
    await page.goto(BASE_URL + "/admin/chats?page=2&pageSize=5&sort=newest", { waitUntil: "networkidle" });
    await page.getByLabel("Sort chats").selectOption("oldest");
    await page.waitForURL(/[?&]sort=oldest(?:&|$)/, { timeout: 5_000 });
    await page.waitForURL(/[?&]page=1(?:&|$)/, { timeout: 5_000 });
    const info = await readList(page);
    expect(info.sort).toBe("oldest");
    expect(info.pageIdx).toBe(1);
    await context.close();
  }, 60_000);
});

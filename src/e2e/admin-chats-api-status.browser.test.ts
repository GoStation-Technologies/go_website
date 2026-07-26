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
    "[admin-chats-api-status test] skipping — SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set",
  );
}

const admin: SupabaseClient | null = canRun
  ? createClient(SUPABASE_URL!, SERVICE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

const SERVER_FN = "src_lib_admin_functions_ts--adminListChats_createServerFn_handler";

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
const N = 7;
const seededIds: string[] = [];

beforeAll(async () => {
  if (!canRun) return;
  browser = await chromium.launch();
  superAdmin = await createUser("chatapi");
  await admin!.from("user_roles").insert({ user_id: superAdmin.id, role: "super_admin" });

  const base = Date.now() - N * 60_000;
  const rows: Array<{ session_id: string; role: string; content: string; created_at: string }> = [];
  for (let i = 0; i < N; i++) {
    const sessionId = randomUUID();
    seededIds.push(sessionId);
    for (let m = 0; m < 2; m++) {
      rows.push({
        session_id: sessionId,
        role: m % 2 === 0 ? "user" : "assistant",
        content: `api-status session ${i} msg ${m}`,
        created_at: new Date(base + i * 60_000 + m * 500).toISOString(),
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
  if (superAdmin) await admin!.auth.admin.deleteUser(superAdmin.id).catch(() => {});
});

async function signInAndGetPage() {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(BASE_URL + "/manage-portal-9f4c2ab7/login", { waitUntil: "networkidle" });
  await page.locator('input[name="email"]').fill(superAdmin!.email);
  await page.locator('input[name="password"]').fill(superAdmin!.password);
  await Promise.all([
    page.waitForURL((u) => new URL(u).pathname === "/", { timeout: 15_000 }),
    page.locator('form button[type="submit"]').click(),
  ]);
  // Warm the router / server-fn manifest by touching the admin route so any
  // client-side bearer middleware initializes before the raw fetch calls.
  await page.goto(BASE_URL + "/manage-portal-9f4c2ab7/chats", { waitUntil: "networkidle" });
  return { context, page };
}

/** POST a server-fn call from inside the authenticated page context. */
async function callServerFn(page: import("playwright").Page, payload: unknown) {
  return await page.evaluate(
    async ({ url, body }) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ data: body }),
      });
      const text = await res.text();
      let json: unknown = null;
      try { json = JSON.parse(text); } catch { /* leave as text */ }
      return { status: res.status, text, json };
    },
    { url: `/_serverFn/${SERVER_FN}`, body: payload },
  );
}

function extractResult(json: unknown): {
  page?: number; pageSize?: number; sort?: string;
  total?: number; pageCount?: number; sessions?: unknown[];
} | null {
  if (!json || typeof json !== "object") return null;
  const j = json as Record<string, unknown>;
  // TanStack server-fn RPC responses commonly nest under `result` / `data`.
  const candidates = [j, j.result, j.data, (j.result as Record<string, unknown> | undefined)?.data]
    .filter((v): v is Record<string, unknown> => Boolean(v && typeof v === "object"));
  for (const c of candidates) {
    if ("page" in c && "pageSize" in c && "sort" in c) return c as never;
  }
  return null;
}

maybe("Admin chats server-fn — HTTP status + normalized response", () => {
  it("200 + clamps out-of-range page to last page and echoes normalized page/pageSize/sort", async () => {
    const { context, page } = await signInAndGetPage();

    // Establish the true total/pageCount at pageSize=3 using a valid call.
    const baseline = await callServerFn(page, { page: 1, pageSize: 3, sort: "newest" });
    expect(baseline.status).toBe(200);
    const baseR = extractResult(baseline.json);
    expect(baseR, `baseline body: ${baseline.text.slice(0, 400)}`).not.toBeNull();
    const total = baseR!.total!;
    const expectedPageCount = Math.max(1, Math.ceil(total / 3));

    // Absurdly high page → server clamps to last page, keeps pageSize/sort.
    const huge = await callServerFn(page, { page: 99999, pageSize: 3, sort: "newest" });
    expect(huge.status).toBe(200);
    const hugeR = extractResult(huge.json)!;
    expect(hugeR.total).toBe(total);
    expect(hugeR.pageSize).toBe(3);
    expect(hugeR.sort).toBe("newest");
    expect(hugeR.pageCount).toBe(expectedPageCount);
    expect(hugeR.page).toBe(expectedPageCount);
    const expectedLast = total - (expectedPageCount - 1) * 3;
    expect(hugeR.sessions?.length).toBe(expectedLast);

    // Defaults: empty payload → page=1, pageSize=10, sort="newest".
    const defaults = await callServerFn(page, {});
    expect(defaults.status).toBe(200);
    const defR = extractResult(defaults.json)!;
    expect(defR.page).toBe(1);
    expect(defR.pageSize).toBe(10);
    expect(defR.sort).toBe("newest");
    expect(defR.pageCount).toBe(Math.max(1, Math.ceil(defR.total! / 10)));

    await context.close();
  }, 120_000);

  it("returns 400 + structured error body naming the invalid fields", async () => {
    const { context, page } = await signInAndGetPage();

    type Case = { label: string; payload: unknown; fields: string[] };
    const cases: Case[] = [
      { label: "page=0",        payload: { page: 0,   pageSize: 10, sort: "newest" }, fields: ["page"] },
      { label: "page=-5",       payload: { page: -5,  pageSize: 10, sort: "newest" }, fields: ["page"] },
      { label: "page=1.5",      payload: { page: 1.5, pageSize: 10, sort: "newest" }, fields: ["page"] },
      { label: 'page="1"',      payload: { page: "1", pageSize: 10, sort: "newest" }, fields: ["page"] },
      { label: "pageSize=0",    payload: { page: 1, pageSize: 0,      sort: "newest" }, fields: ["pageSize"] },
      { label: "pageSize=101",  payload: { page: 1, pageSize: 101,    sort: "newest" }, fields: ["pageSize"] },
      { label: "pageSize=huge", payload: { page: 1, pageSize: 999999, sort: "newest" }, fields: ["pageSize"] },
      { label: "sort=bogus",    payload: { page: 1, pageSize: 10, sort: "bogus" }, fields: ["sort"] },
      { label: "sort=empty",    payload: { page: 1, pageSize: 10, sort: "" },      fields: ["sort"] },
      { label: "multi-invalid", payload: { page: -1, pageSize: 0, sort: "bogus" }, fields: ["page", "pageSize", "sort"] },
    ];

    for (const c of cases) {
      const res = await callServerFn(page, c.payload);

      expect(
        res.status,
        `expected 400 for ${c.label}, got ${res.status}: ${res.text.slice(0, 300)}`,
      ).toBe(400);

      // Body must be JSON with a structured error envelope, not the results shape.
      expect(extractResult(res.json), `unexpected results envelope for ${c.label}`).toBeNull();
      expect(res.json, `expected JSON error body for ${c.label}, got: ${res.text.slice(0, 200)}`)
        .not.toBeNull();

      const body = res.json as {
        error?: string; message?: string;
        fields?: string[]; fieldErrors?: Record<string, string[]>;
      };
      expect(body.error).toBe("invalid_input");
      expect(typeof body.message).toBe("string");
      expect(body.message!.length).toBeGreaterThan(0);
      expect(Array.isArray(body.fields)).toBe(true);
      expect(body.fieldErrors && typeof body.fieldErrors === "object").toBe(true);

      for (const f of c.fields) {
        expect(body.fields, `${c.label}: fields missing ${f}`).toContain(f);
        const msgs = body.fieldErrors?.[f];
        expect(Array.isArray(msgs) && msgs.length > 0, `${c.label}: fieldErrors.${f} empty`).toBe(true);
      }
    }

    await context.close();
  }, 180_000);
});

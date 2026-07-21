import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { chromium, type Browser, type Request as PWRequest } from "playwright";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const BASE_URL = process.env.E2E_URL ?? "http://localhost:8080";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const canRun = Boolean(SUPABASE_URL && SERVICE_KEY);
const maybe = canRun ? describe : describe.skip;

if (!canRun) {
  console.warn(
    "[admin-chats-ui-params test] skipping — SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set",
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
const N = 13;
const seededIds: string[] = [];

beforeAll(async () => {
  if (!canRun) return;
  browser = await chromium.launch();
  superAdmin = await createUser("chatui");
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
        content: `ui-params session ${i} msg ${m}`,
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

/** Capture the outbound adminListChats server-fn request body while navigating. */
function captureNextChatsRequest(page: import("playwright").Page): Promise<PWRequest> {
  return page.waitForRequest(
    (req) => req.url().includes(`/_serverFn/${SERVER_FN}`) && req.method() === "POST",
    { timeout: 15_000 },
  );
}

maybe("Admin chats UI — sends pagination params & renders normalized/errored response", () => {
  it("sends URL params to the server and renders the server-normalized page/pageSize/sort", async () => {
    const { context, page } = await signIn(superAdmin!);

    // Kick off navigation and grab the outbound request body in parallel.
    const [req] = await Promise.all([
      captureNextChatsRequest(page),
      page.goto(BASE_URL + "/admin/chats?page=99999&pageSize=5&sort=newest", {
        waitUntil: "networkidle",
      }),
    ]);

    // The UI must forward the URL params verbatim; the server does the clamping.
    const posted = JSON.parse(req.postData() ?? "{}") as { data?: unknown };
    expect(posted.data).toEqual({ page: 99999, pageSize: 5, sort: "newest" });

    // No error banner and the list rendered with server-normalized attributes.
    expect(await page.getByTestId("chats-error").count()).toBe(0);
    const list = page.getByTestId("chats-list");
    await list.waitFor({ state: "visible", timeout: 15_000 });

    const total = Number(await list.getAttribute("data-total"));
    const pageCount = Number(await list.getAttribute("data-page-count"));
    const shownPage = Number(await list.getAttribute("data-page"));
    const shownPageSize = Number(await list.getAttribute("data-page-size"));
    const shownSort = await list.getAttribute("data-sort");
    const expectedPageCount = Math.max(1, Math.ceil(total / 5));

    expect(shownPageSize).toBe(5);
    expect(shownSort).toBe("newest");
    expect(pageCount).toBe(expectedPageCount);
    // Server clamped 99999 → last page; UI reflects the response, not the URL.
    expect(shownPage).toBe(expectedPageCount);

    // Rendered row count matches the last-page arithmetic.
    const rendered = await list.locator("details[data-session-id]").count();
    expect(rendered).toBe(total - (expectedPageCount - 1) * 5);

    // Summary text mirrors the normalized values.
    const summary = (await page.getByTestId("chats-summary").innerText()).toLowerCase();
    expect(summary).toContain(`page ${expectedPageCount} of ${expectedPageCount}`);
    expect(summary).toContain(`${total} sessions`);

    // Next disabled on last page; Prev enabled.
    expect(await page.getByRole("button", { name: "Next page" }).isDisabled()).toBe(true);
    expect(await page.getByRole("button", { name: "Previous page" }).isDisabled()).toBe(false);

    await context.close();
  }, 120_000);

  it("shows the structured 400 error message + offending field list for invalid params", async () => {
    const { context, page } = await signIn(superAdmin!);

    // pageSize=999999 is a valid integer (fallback doesn't rewrite it) but
    // exceeds the server's max=100 rule, so the server must return 400 and
    // the UI must render the structured error banner.
    const [req] = await Promise.all([
      captureNextChatsRequest(page),
      page.goto(BASE_URL + "/admin/chats?page=1&pageSize=999999&sort=newest", {
        waitUntil: "networkidle",
      }),
    ]);
    const posted = JSON.parse(req.postData() ?? "{}") as { data?: unknown };
    expect(posted.data).toEqual({ page: 1, pageSize: 999999, sort: "newest" });

    const banner = page.getByTestId("chats-error");
    await banner.waitFor({ state: "visible", timeout: 15_000 });

    expect(await banner.getAttribute("data-status")).toBe("400");
    expect(await banner.getAttribute("data-error")).toBe("invalid_input");
    const fieldsAttr = (await banner.getAttribute("data-fields")) ?? "";
    expect(fieldsAttr.split(",").filter(Boolean)).toContain("pageSize");

    const msg = await page.getByTestId("chats-error-message").innerText();
    expect(msg).toBe("One or more pagination parameters are invalid.");

    // Field list is rendered with a per-field bullet and a non-empty message.
    const fieldItem = page.locator('[data-testid="chats-error-fields"] li[data-field="pageSize"]');
    expect(await fieldItem.count()).toBe(1);
    const fieldText = await fieldItem.innerText();
    expect(fieldText).toContain("pageSize");
    expect(fieldText.length).toBeGreaterThan("pageSize".length + 1);

    // Results list must NOT be visible when the error banner is shown.
    expect(await page.getByTestId("chats-list").count()).toBe(0);
    // Pagination controls disabled while errored.
    expect(await page.getByRole("button", { name: "Next page" }).isDisabled()).toBe(true);
    expect(await page.getByRole("button", { name: "Previous page" }).isDisabled()).toBe(true);

    await context.close();
  }, 120_000);

  it("reports every invalid field when multiple params are out of range", async () => {
    const { context, page } = await signIn(superAdmin!);

    await page.goto(
      BASE_URL + "/admin/chats?page=0&pageSize=999999&sort=bogus",
      { waitUntil: "networkidle" },
    );

    const banner = page.getByTestId("chats-error");
    await banner.waitFor({ state: "visible", timeout: 15_000 });
    expect(await banner.getAttribute("data-status")).toBe("400");

    const fields = ((await banner.getAttribute("data-fields")) ?? "")
      .split(",")
      .filter(Boolean);
    expect(new Set(fields)).toEqual(new Set(["page", "pageSize", "sort"]));

    for (const f of ["page", "pageSize", "sort"]) {
      const item = page.locator(`[data-testid="chats-error-fields"] li[data-field="${f}"]`);
      expect(await item.count(), `missing bullet for ${f}`).toBe(1);
    }

    await context.close();
  }, 120_000);
});

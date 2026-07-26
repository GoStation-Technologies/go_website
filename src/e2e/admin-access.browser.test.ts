import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { chromium, type Browser } from "playwright";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.E2E_URL ?? "http://localhost:8080";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const canRun = Boolean(SUPABASE_URL && SERVICE_KEY);
const maybe = canRun ? describe : describe.skip;

if (!canRun) {
  console.warn(
    "[admin-access test] skipping — SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set",
  );
}

const admin = canRun
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

async function grantRole(userId: string, role: string) {
  const { error } = await admin!.from("user_roles").insert({ user_id: userId, role });
  if (error) throw new Error(`grantRole(${role}) failed: ${error.message}`);
}

let browser: Browser;
let superAdmin: TestUser | null = null;
let nonStaff: TestUser | null = null;
let staffNoRole: TestUser | null = null;

beforeAll(async () => {
  if (!canRun) return;
  browser = await chromium.launch();
  [superAdmin, nonStaff, staffNoRole] = await Promise.all([
    createUser("superadmin"),
    createUser("public"),
    createUser("empty"),
  ]);
  await grantRole(superAdmin!.id, "super_admin");
  // staffNoRole intentionally has NO user_roles row → not staff.
  // (Any role currently grants /admin access, so a "no-role signed-in user"
  //  is the second blocked case beyond fully public.)
}, 90_000);

afterAll(async () => {
  await browser?.close();
  if (!canRun) return;
  await Promise.all([deleteUser(superAdmin), deleteUser(nonStaff), deleteUser(staffNoRole)]);
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

maybe("Admin dashboard access control", () => {
  it("blocks unauthenticated visitors — /admin redirects to /admin/login and leaks no admin content", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(BASE_URL + "/admin", { waitUntil: "networkidle" });
    expect(new URL(page.url()).pathname).toBe("/admin/login");
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).not.toContain("chat logs");
    expect(body).not.toContain("submissions");
    expect(body).not.toContain("gostation admin");
    await context.close();
  }, 45_000);

  it("blocks signed-in users without any staff role — redirects off /admin and leaks no admin content", async () => {
    const { context, page } = await signIn(nonStaff!);
    await page.goto(BASE_URL + "/admin", { waitUntil: "networkidle" });
    const pathname = new URL(page.url()).pathname;
    expect(pathname, `expected redirect away from /admin, got ${pathname}`).not.toBe("/admin");
    expect(pathname).not.toMatch(/^\/admin(\/|$)/);
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).not.toContain("chat logs");
    expect(body).not.toContain("gostation admin");

    // Direct server-fn calls must also refuse to leak. The overview stats
    // call uses requireSupabaseAuth; with no matching RLS the counts stay 0
    // (never surfacing another user's data) and the chat logs list must be
    // empty for a non-support role.
    const leak = await page.evaluate(async () => {
      const call = async (name: string) => {
        const res = await fetch(`/_serverFn/${name}`, {
          method: "GET",
          headers: { accept: "application/json" },
        });
        return { status: res.status, text: await res.text() };
      };
      return {
        chats: await call("src_lib_admin_functions_ts--adminListChats_createServerFn_handler"),
      };
    });
    // The exact server-fn URL is opaque; regardless of status, the body must
    // not contain another session's chat content markers.
    expect(leak.chats.text).not.toMatch(/"session_id"\s*:\s*"[0-9a-f-]{36}"/i);
    await context.close();
  }, 60_000);

  it("blocks signed-in users with no user_roles row — same treatment as non-staff", async () => {
    const { context, page } = await signIn(staffNoRole!);
    await page.goto(BASE_URL + "/admin", { waitUntil: "networkidle" });
    const pathname = new URL(page.url()).pathname;
    expect(pathname).not.toMatch(/^\/admin(\/|$)/);
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).not.toContain("chat logs");
    expect(body).not.toContain("gostation admin");
    await context.close();
  }, 45_000);

  it("allows a super_admin — /admin renders the dashboard shell with role indicator", async () => {
    const { context, page } = await signIn(superAdmin!);
    await page.goto(BASE_URL + "/admin", { waitUntil: "networkidle" });
    expect(new URL(page.url()).pathname).toBe("/admin");

    const body = await page.locator("body").innerText();
    expect(body).toContain("GoStation Admin");
    expect(body.toLowerCase()).toContain("overview");
    expect(body.toLowerCase()).toContain("submissions");
    expect(body.toLowerCase()).toContain("chat logs");
    expect(body).toContain("super_admin");

    // Chat logs subroute reachable.
    await page.goto(BASE_URL + "/admin/chats", { waitUntil: "networkidle" });
    expect(new URL(page.url()).pathname).toBe("/admin/chats");
    const chatsBody = (await page.locator("body").innerText()).toLowerCase();
    expect(chatsBody).toMatch(/chat logs|no chatbot conversations/);
    await context.close();
  }, 60_000);
});

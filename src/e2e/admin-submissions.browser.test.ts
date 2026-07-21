import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { chromium, type Browser } from "playwright";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BASE_URL = process.env.E2E_URL ?? "http://localhost:8080";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const canRun = Boolean(SUPABASE_URL && SERVICE_KEY);
const maybe = canRun ? describe : describe.skip;

if (!canRun) {
  console.warn(
    "[admin-submissions test] skipping — SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set",
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
let seededId: string | null = null;
let seededRef: string | null = null;
const seededEmail = `sub-${Date.now()}@e2e.gostation.test`;
const seededName = `E2E Seeded ${Date.now()}`;
const seededMessage = `unique-msg-${Math.random().toString(36).slice(2)}`;

beforeAll(async () => {
  if (!canRun) return;
  browser = await chromium.launch();
  [superAdmin, outsider] = await Promise.all([createUser("subadmin"), createUser("subout")]);
  await admin!.from("user_roles").insert({ user_id: superAdmin!.id, role: "super_admin" });
  const { data, error } = await admin!
    .from("contact_messages")
    .insert({
      full_name: seededName,
      email: seededEmail,
      category: "general",
      subject: "E2E submission",
      message: seededMessage,
    })
    .select("id, reference")
    .single();
  if (error || !data) throw new Error(`seed contact failed: ${error?.message}`);
  seededId = data.id as string;
  seededRef = data.reference as string;
}, 90_000);

afterAll(async () => {
  await browser?.close();
  if (!canRun) return;
  if (seededId) {
    try { await admin!.from("contact_messages").delete().eq("id", seededId); } catch { /* ignore */ }
  }
  await Promise.all([deleteUser(superAdmin), deleteUser(outsider)]);
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

maybe("Admin submissions — status updates & access control", () => {
  it("super_admin sees the seeded submission and status change persists in DB", async () => {
    const { context, page } = await signIn(superAdmin!);
    await page.goto(BASE_URL + "/admin/submissions", { waitUntil: "networkidle" });
    expect(new URL(page.url()).pathname).toBe("/admin/submissions");

    // Switch to Contact tab
    await page.getByRole("button", { name: "Contact" }).click();

    // Row for the seeded submission should appear
    const row = page.locator("tr", { hasText: seededEmail });
    await row.waitFor({ state: "visible", timeout: 15_000 });
    await expect(row).toContainText(seededName);

    // Change status new → reviewing via the row's select
    const statusSelect = row.locator("select");
    await expect(statusSelect).toHaveValue("new");
    await statusSelect.selectOption("reviewing");

    // Wait for the DB to reflect the change (mutation runs through server fn)
    let dbStatus = "new";
    for (let i = 0; i < 20; i++) {
      const { data } = await admin!
        .from("contact_messages")
        .select("status")
        .eq("id", seededId!)
        .single();
      dbStatus = (data?.status as string) ?? "new";
      if (dbStatus === "reviewing") break;
      await new Promise((r) => setTimeout(r, 250));
    }
    expect(dbStatus).toBe("reviewing");

    // Filter to "reviewing" and confirm the row is still present
    await page.locator('select').first().selectOption("reviewing");
    await page.locator("tr", { hasText: seededEmail }).first().waitFor({ state: "visible", timeout: 10_000 });

    // Filter to "new" and confirm it is gone (status changed)
    await page.locator('select').first().selectOption("new");
    await expect(page.locator("tr", { hasText: seededEmail })).toHaveCount(0, { timeout: 10_000 });

    await context.close();
  }, 90_000);

  it("signed-in outsider cannot see the submission and cannot change its status", async () => {
    // Reset seed to a known state
    await admin!.from("contact_messages").update({ status: "new" }).eq("id", seededId!);

    const { context, page } = await signIn(outsider!);
    // /admin/submissions must not render the admin page for a non-staff user
    await page.goto(BASE_URL + "/admin/submissions", { waitUntil: "networkidle" });
    const pathname = new URL(page.url()).pathname;
    expect(pathname).not.toMatch(/^\/admin(\/|$)/);

    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).not.toContain(seededEmail.toLowerCase());
    expect(body).not.toContain(seededName.toLowerCase());
    expect(body).not.toContain(seededMessage.toLowerCase());
    expect(seededRef && body).not.toContain((seededRef ?? "").toLowerCase());

    // DB row must still be "new" — outsider had no way to mutate it
    const { data } = await admin!
      .from("contact_messages")
      .select("status")
      .eq("id", seededId!)
      .single();
    expect(data?.status).toBe("new");

    await context.close();
  }, 60_000);

  it("unauthenticated visitor cannot reach /admin/submissions and cannot mutate", async () => {
    await admin!.from("contact_messages").update({ status: "new" }).eq("id", seededId!);
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(BASE_URL + "/admin/submissions", { waitUntil: "networkidle" });
    expect(new URL(page.url()).pathname).toBe("/auth");
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).not.toContain(seededEmail.toLowerCase());
    expect(body).not.toContain(seededMessage.toLowerCase());
    const { data } = await admin!
      .from("contact_messages")
      .select("status")
      .eq("id", seededId!)
      .single();
    expect(data?.status).toBe("new");
    await context.close();
  }, 45_000);
});

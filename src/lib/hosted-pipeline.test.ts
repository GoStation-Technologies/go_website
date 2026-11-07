import { afterEach, describe, expect, it, vi } from "vitest";
const currentRequest = vi.hoisted(() => ({ value: new Request("https://gostation.sa/") }));
vi.mock("@tanstack/react-start/server", () => ({ getRequest: () => currentRequest.value }));
vi.mock("./public-supabase-env", () => ({ publicSupabaseEnv: () => ({ url: "https://example.com", key: "sb_publishable_test" }) }));
import { PipelineInput, HOSTED_PIPELINE_URL } from "./hosted-pipeline";
import { forwardPipeline, shouldForwardPipeline } from "./hosted-pipeline.server";
import { handlePipeline } from "./hosted-pipeline-handler.server";

const contact = { operation: "contact" as const, payload: { full_name: "Test", email: "visitor@example.com", phone: "", category: "general", subject: "QA", message: "Test enquiry" } };
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("Hosted notification boundary", () => {
  it("forwards gostation.sa submissions without a service-role key", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    currentRequest.value = new Request("https://gostation.sa/");
    const fetcher = vi.fn().mockResolvedValue(Response.json({ reference: "GS-CONTACT-1" }));
    vi.stubGlobal("fetch", fetcher);
    expect(shouldForwardPipeline()).toBe(true);
    expect(await forwardPipeline(contact)).toEqual({ reference: "GS-CONTACT-1" });
    expect(fetcher.mock.calls[0][0]).toBe(HOSTED_PIPELINE_URL);
    expect(new Headers(fetcher.mock.calls[0][1].headers).get("authorization")).toBeNull();
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual(contact);
  });
  it("forwards the caller session for admin Send Test Email", async () => {
    currentRequest.value = new Request("https://gostation.sa/", { headers: { Authorization: "Bearer test.staff.session" } });
    const fetcher = vi.fn().mockResolvedValue(Response.json({ sent: true, recipients: 1 }));
    vi.stubGlobal("fetch", fetcher);
    await forwardPipeline({ operation: "test", payload: { category: "careers" } });
    expect(new Headers(fetcher.mock.calls[0][1].headers).get("authorization")).toBe("Bearer test.staff.session");
  });
  it("rejects anonymous admin test sends before delivery", async () => {
    const result = await handlePipeline(new Request(HOSTED_PIPELINE_URL, { method: "POST", headers: { apikey: "sb_publishable_test" }, body: JSON.stringify({ operation: "test", payload: { category: "careers" } }) }));
    expect(result.status).toBe(401);
  });
  it("denies a verified user without the super_admin role", async () => {
    const fetcher = vi.fn().mockImplementation(async (url: string) => {
      if (String(url).includes("/auth/v1/user")) return Response.json({ id: "12345678-1234-1234-1234-123456789012", aud: "authenticated", role: "authenticated" });
      return Response.json(null);
    });
    vi.stubGlobal("fetch", fetcher);
    const result = await handlePipeline(new Request(HOSTED_PIPELINE_URL, { method: "POST", headers: { apikey: "sb_publishable_test", Authorization: "Bearer test.user.session" }, body: JSON.stringify({ operation: "test", payload: { category: "careers" } }) }));
    expect(result.status).toBe(403);
    expect(fetcher.mock.calls.some(([url]) => String(url).includes("/emails"))).toBe(false);
  });
  it("rejects arbitrary RPC actions and invalid form data", () => {
    expect(PipelineInput.safeParse({ operation: "rpc", payload: {} }).success).toBe(false);
    expect(PipelineInput.safeParse({ ...contact, payload: { ...contact.payload, email: "invalid" } }).success).toBe(false);
  });
  it("retains corporate fueling enquiries on the contact pipeline", () => {
    expect(PipelineInput.parse({ ...contact, payload: { ...contact.payload, category: "corporate_fueling" } }).operation).toBe("contact");
  });
});
import { afterEach, describe, expect, it, vi } from "vitest";
import { sendTemplateEmail, ResendDeliveryError } from "./send-email";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("Resend template delivery", () => {
  it("sends one request with the fixed sender, saved recipients, true CC and visitor Reply-To", async () => {
    vi.stubEnv("LOVABLE_API_KEY", "test-only");
    vi.stubEnv("RESEND_API_KEY", "test-only");
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "test-email" })));
    vi.stubGlobal("fetch", request);
    expect(await sendTemplateEmail("form-notification", ["one@gostation.net", "two@gostation.net"], {
      fromEmail: "wrong@gostation.net", fromName: "Wrong sender",
      cc: ["cc@gostation.net"], replyTo: "visitor@example.com", idempotencyKey: "test-send",
      templateData: { title: "Test", reference: "TEST", fields: {}, links: [], timestamp: "2026-11-07", subject: "Test" },
    })).toEqual({ sent: true });
    expect(request).toHaveBeenCalledTimes(1);
    const [url, options] = request.mock.calls[0];
    expect(url).toBe("https://connector-gateway.lovable.dev/resend/emails");
    expect(JSON.parse(options.body)).toMatchObject({ from: "GoStation | قوستيشن <noreply@gostation.sa>", to: ["one@gostation.net", "two@gostation.net"], cc: ["cc@gostation.net"], reply_to: "visitor@example.com" });
    expect(options.headers["Idempotency-Key"]).toBe("test-send");
  });
  it("preserves provider failure status and body without claiming success", async () => {
    vi.stubEnv("LOVABLE_API_KEY", "test-only");
    vi.stubEnv("RESEND_API_KEY", "test-only");
    const body = JSON.stringify({ name: "validation_error", message: "Domain not verified" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 403 })));
    await expect(sendTemplateEmail("form-notification", "one@gostation.net")).rejects.toMatchObject({ code: "validation_error", status: 403, providerBody: body });
  });
  it("does not attempt delivery without the Resend connection", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const request = vi.fn(); vi.stubGlobal("fetch", request);
    expect(await sendTemplateEmail("form-notification", "one@gostation.net")).toEqual({ sent: false, reason: "missing_api_key" });
    expect(request).not.toHaveBeenCalled();
  });
});
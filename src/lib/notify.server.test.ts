import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
const send = vi.hoisted(() => vi.fn());
vi.mock("./email-templates/send-email", async (importOriginal) => ({ ...await importOriginal<typeof import("./email-templates/send-email")>(), sendTemplateEmail: send }));
import { notifySubmission } from "./notify.server";
const settings = { category: "franchise", is_enabled: true, recipients: ["owner@example.com"], cc_recipients: ["staff@example.com"], from_name: "GoStation", from_email: null, reply_to: "reply@example.com", subject_prefix: "[Franchise]" };
const client = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: settings, error: null }) }) }) }) } as unknown as SupabaseClient<Database>;
const args = { category: "franchise" as const, title: "New franchise application", reference: "TEST-NOTIFICATION", fields: { full_name: "Test", message: "Request" }, client };
describe("Submission notification delivery", () => {
  beforeEach(() => send.mockReset());
  it("sends once with saved routing and full submitted fields", async () => {
    send.mockResolvedValue({ sent: true });
    expect(await notifySubmission(args)).toEqual({ sent: true, recipients: 2 });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith("form-notification", ["owner@example.com"], expect.objectContaining({ cc: ["staff@example.com"], replyTo: "reply@example.com", templateData: expect.objectContaining({ fields: args.fields, subject: "[Franchise] New franchise application — TEST-NOTIFICATION" }) }));
  });
  it("sets Reply-To to the actual submitted visitor email", async () => {
    send.mockResolvedValue({ sent: true });
    await notifySubmission({ ...args, fields: { email: "visitor@example.com" } });
    expect(send).toHaveBeenCalledWith("form-notification", ["owner@example.com"], expect.objectContaining({ replyTo: "visitor@example.com" }));
  });
  it("does not report suppressed recipients as successful sends", async () => {
    send.mockResolvedValue({ sent: false, reason: "recipient_suppressed" });
    expect(await notifySubmission(args)).toEqual({ sent: false, reason: "recipient_suppressed" });
  });
  it("contains a settings failure without undoing the saved submission", async () => {
    const failedClient = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: { code: "unavailable" } }) }) }) }) } as unknown as SupabaseClient<Database>;
    expect(await notifySubmission({ ...args, client: failedClient })).toMatchObject({ sent: false, reason: "configuration_error" });
    expect(send).not.toHaveBeenCalled();
  });
});
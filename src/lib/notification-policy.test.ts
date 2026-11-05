import { describe, expect, it } from "vitest";
import { notificationRouting, notificationSender } from "./notification-policy";
const settings = { is_enabled: true, recipients: ["owner@example.com"], cc_recipients: ["staff@example.com"], from_name: "GoStation", from_email: null, reply_to: "reply@example.com", subject_prefix: "[Franchise]" };
describe("Notification routing", () => {
  it("uses stored recipient, CC, sender name, reply-to and prefix", () => {
    expect(notificationRouting(settings)).toEqual({ ok: true, to: "owner@example.com", cc: ["staff@example.com"], fromName: "GoStation", replyTo: "reply@example.com", prefix: "[Franchise]" });
  });
  it("does not send disabled category notifications", () => expect(notificationRouting({ ...settings, is_enabled: false })).toEqual({ ok: false, reason: "disabled" }));
  it("permits an explicit admin test when notifications are disabled", () => expect(notificationRouting({ ...settings, is_enabled: false }, true).ok).toBe(true));
  it("does not pretend to send without recipients", () => expect(notificationRouting({ ...settings, recipients: [] })).toEqual({ ok: false, reason: "no_recipients" }));
  it("does not silently split a notification into a bulk recipient loop", () => expect(notificationRouting({ ...settings, recipients: ["one@example.com", "two@example.com"] })).toEqual({ ok: false, reason: "recipient_limit" }));
  it("deduplicates CC recipients", () => expect(notificationRouting({ ...settings, cc_recipients: ["owner@example.com", "staff@example.com", "staff@example.com"] })).toMatchObject({ cc: ["staff@example.com"] }));
  it("uses the configured verified domain instead of an unverified sender", () => expect(notificationSender("owner@gostation.net", "notify.gostation.sa")).toBe("noreply@notify.gostation.sa"));
  it("preserves sender addresses on the verified domain", () => expect(notificationSender("support@notify.gostation.sa", "notify.gostation.sa")).toBe("support@notify.gostation.sa"));
});
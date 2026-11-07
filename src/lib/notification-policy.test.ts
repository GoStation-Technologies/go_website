import { describe, expect, it } from "vitest";
import { notificationRouting, notificationSender, notificationReplyTo } from "./notification-policy";
const settings = { is_enabled: true, recipients: ["owner@example.com"], cc_recipients: ["staff@example.com"], from_name: "GoStation", from_email: null, reply_to: "reply@example.com", subject_prefix: "[Franchise]" };
describe("Notification routing", () => {
  it("uses stored recipient, CC, sender name, reply-to and prefix", () => {
    expect(notificationRouting(settings)).toEqual({ ok: true, to: ["owner@example.com"], cc: ["staff@example.com"], fromName: "GoStation | قوستيشن", replyTo: "reply@example.com", prefix: "[Franchise]" });
  });
  it("does not send disabled category notifications", () => expect(notificationRouting({ ...settings, is_enabled: false })).toEqual({ ok: false, reason: "disabled" }));
  it("permits an explicit admin test when notifications are disabled", () => expect(notificationRouting({ ...settings, is_enabled: false }, true).ok).toBe(true));
  it("does not pretend to send without recipients", () => expect(notificationRouting({ ...settings, recipients: [] })).toEqual({ ok: false, reason: "no_recipients" }));
  it("keeps all admin recipients in one Resend notification", () => expect(notificationRouting({ ...settings, recipients: ["one@gostation.net", "two@gostation.net"] })).toMatchObject({ ok: true, to: ["one@gostation.net", "two@gostation.net"] }));
  it("deduplicates CC recipients", () => expect(notificationRouting({ ...settings, cc_recipients: ["owner@example.com", "staff@example.com", "staff@example.com"] })).toMatchObject({ cc: ["staff@example.com"] }));
  it("locks the sender to noreply@gostation.sa", () => expect(notificationSender()).toBe("noreply@gostation.sa"));
  it("ignores edited sender names", () => expect(notificationRouting({ ...settings, from_name: "Other sender" })).toMatchObject({ fromName: "GoStation | قوستيشن" }));
  it("uses the visitor email before the configured reply address", () => expect(notificationReplyTo("visitor@example.com", "team@gostation.net")).toBe("visitor@example.com"));
  it("uses the configured reply address for tests without visitor email", () => expect(notificationReplyTo(undefined, "team@gostation.net")).toBe("team@gostation.net"));
});
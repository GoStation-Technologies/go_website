import { describe, expect, it } from "vitest";
import { inquiryFromForm, IrInput, submissionTables } from "./investor-inquiry";

describe("investor inquiry submission", () => {
  it("preserves all six form fields for the database submission", () => {
    const form = new FormData();
    Object.entries({ name: "Investor Test", email: "investor@example.com", phone: "+966500000000", org: "Test Company", type: "analyst", message: "Please send investor information." }).forEach(([k, v]) => form.set(k, v));
    expect(inquiryFromForm(form)).toEqual({ full_name: "Investor Test", email: "investor@example.com", phone: "+966500000000", organization: "Test Company", inquiry_type: "analyst", message: "Please send investor information." });
  });
  it("routes admin investor inquiries to the same table used by the submission RPC", () => {
    expect(submissionTables.ir).toBe("ir_inquiries");
  });
  it("rejects invalid input before submission", () => {
    expect(IrInput.safeParse({ full_name: "", email: "invalid", message: "" }).success).toBe(false);
  });
});
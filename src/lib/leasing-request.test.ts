import { describe, expect, it } from "vitest";
import { filterSubmissionCategory, LeasingInput, leasingMetadata } from "./leasing-request";
import { submissionTables } from "./investor-inquiry";

describe("leasing requests", () => {
  it("uses the leasing category only for the dedicated tab", () => {
    const calls: unknown[] = [];
    const query = { eq: (key: string, value: string) => { calls.push(["eq", key, value]); return query; }, neq: (key: string, value: string) => { calls.push(["neq", key, value]); return query; } };
    filterSubmissionCategory(query, "leasing");
    expect(calls).toEqual([["eq", "category", "leasing"]]);
    expect(submissionTables.leasing).toBe("contact_messages");
  });
  it("excludes leasing submissions from general contact messages", () => {
    const calls: unknown[] = [];
    const query = { eq: () => query, neq: (key: string, value: string) => { calls.push([key, value]); return query; } };
    filterSubmissionCategory(query, "contact");
    expect(calls).toEqual([["category", "leasing"]]);
  });
  it("preserves contact details and all space requirements independently of language", () => {
    const data = LeasingInput.parse({ full_name: "Leasing Test", email: "leasing@example.com", phone: "+966500000000", notes: "Cafe space", requirements: { company: "Test Company", activity: "Cafe", city: "riyadh", district: "Olaya", area_sqm: "85.5", lease_years: "3" } });
    expect(data).toEqual({ full_name: "Leasing Test", email: "leasing@example.com", phone: "+966500000000", notes: "Cafe space", requirements: { company: "Test Company", activity: "Cafe", city: "riyadh", district: "Olaya", area_sqm: 85.5, lease_years: 3 }, documents: [] });
  });
  it("reads saved document names and private paths", () => {
    expect(leasingMetadata({ leasing_metadata: { documents: [{ name: "Business profile.pdf", path: "requests/test.pdf" }] } }).documents).toEqual([{ name: "Business profile.pdf", path: "requests/test.pdf" }]);
  });
});
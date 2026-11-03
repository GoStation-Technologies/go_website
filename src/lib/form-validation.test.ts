import { describe, expect, it } from "vitest";
import { normalizeSaudiPhone, optionalUrlSchema } from "./form-validation";
import { ApplyInput } from "./job-application";

describe("Saudi phone formats", () => {
  it.each(["+966 512345678", "966512345678", "0512345678", "512345678", "00966 51 234 5678"])("accepts %s", (v) => {
    expect(normalizeSaudiPhone(v)).toBe("0512345678");
  });
  it("rejects short numbers", () => expect(normalizeSaudiPhone("05123")).toBeNull());
});

describe("job application limits", () => {
  const base = { job_id: "00000000-0000-4000-8000-000000000000", full_name: "A", email: "a@b.co", phone: "0512345678" };
  it("accepts a long LinkedIn URL with query parameters", () => {
    const url = `https://www.linkedin.com/in/someone?${"x=1&".repeat(200)}`;
    expect(optionalUrlSchema.safeParse(url).success).toBe(true);
    expect(ApplyInput.safeParse({ ...base, linkedin_url: url }).success).toBe(true);
  });
  it("accepts a 10,000-character cover letter", () => {
    expect(ApplyInput.safeParse({ ...base, cover_letter: "x".repeat(10000) }).success).toBe(true);
  });
  it("rejects an invalid LinkedIn link", () => {
    expect(ApplyInput.safeParse({ ...base, linkedin_url: "not a url" }).success).toBe(false);
  });
});

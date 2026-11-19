import { describe, expect, it } from "vitest";
import { FranchiseInput, AcquisitionInput } from "./submission-schemas";
import { documentFileError } from "./application-form";

const franchise = { full_name: "Test Applicant", country: "Saudi Arabia", nationality: "Saudi", phone: "0501234567", company_name: "Test Company", cr_number: "1234567890", city: "Riyadh" };
const acquisition = { full_name: "Test Applicant", phone: "0501234567", entity_name: "Test Entity", city: "Riyadh", acquisition_type: "land" };
describe("Business application requirements", () => {
  for (const key of ["full_name", "country", "nationality", "phone", "company_name", "cr_number", "city"]) {
    it(`requires franchise ${key}`, () => expect(FranchiseInput.safeParse({ ...franchise, [key]: "" }).success).toBe(false));
  }
  for (const key of ["full_name", "phone", "entity_name", "city", "acquisition_type"]) {
    it(`requires acquisition ${key}`, () => expect(AcquisitionInput.safeParse({ ...acquisition, [key]: "" }).success).toBe(false));
  }
  it("does not require email or optional franchise fields", () => expect(FranchiseInput.parse(franchise).notes).toBe(""));
  it("does not require email or optional acquisition fields", () => expect(AcquisitionInput.parse(acquisition).address).toBe(""));
  it("admits exactly land and fuel stations acquisition types", () => {
    expect(AcquisitionInput.safeParse({ ...acquisition, acquisition_type: "fuel_stations" }).success).toBe(true);
    expect(AcquisitionInput.safeParse({ ...acquisition, acquisition_type: "other" }).success).toBe(false);
  });
  it("requires phone format 05xxxxxxxx", () => {
    expect(FranchiseInput.safeParse({ ...franchise, phone: "+966501234567" }).success).toBe(false);
    expect(FranchiseInput.safeParse({ ...franchise, phone: "050123456" }).success).toBe(false);
  });
  it("rejects fractional station counts", () => expect(FranchiseInput.safeParse({ ...franchise, station_count: "1.5" }).success).toBe(false));
  it("rejects negative financial values", () => expect(FranchiseInput.safeParse({ ...franchise, annual_income_sar: "-1" }).success).toBe(false));
  it("accepts PDF DOCX JPG PNG and rejects other file types", () => {
    for (const extension of ["pdf", "docx", "jpg", "png"]) expect(documentFileError({ name: `document.${extension}`, size: 100 })).toBeNull();
    expect(documentFileError({ name: "script.html", size: 100 })).toBe("type");
  });
  it("rejects documents over 5 MB", () => expect(documentFileError({ name: "document.pdf", size: 5 * 1024 * 1024 + 1 })).toBe("size"));
  it("accepts documents only from their application category", () => {
    const doc = { name: "proof.pdf", path: "acquisition/12345678-1234-1234-1234-123456789012.pdf" };
    expect(AcquisitionInput.safeParse({ ...acquisition, documents: [doc] }).success).toBe(true);
    expect(FranchiseInput.safeParse({ ...franchise, documents: [doc] }).success).toBe(false);
    expect(AcquisitionInput.safeParse({ ...acquisition, documents: Array(6).fill(doc) }).success).toBe(false);
  });
});
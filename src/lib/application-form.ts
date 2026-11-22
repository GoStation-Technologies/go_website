import { z } from "zod";

export const APPLICATION_DOCUMENT_LIMIT = 5;
export const APPLICATION_DOCUMENT_BYTES = 20 * 1024 * 1024;
export const ApplicationDocument = z.object({
  name: z.string().trim().min(1).max(200),
  path: z.string().regex(/^(franchise|acquisition)\/[0-9a-f-]{36}\.(pdf|docx|jpg|png)$/),
});
export const applicationDocuments = (kind: "franchise" | "acquisition") => z.array(ApplicationDocument)
  .max(APPLICATION_DOCUMENT_LIMIT).default([]).refine(docs => docs.every(doc => doc.path.startsWith(`${kind}/`)));
export const optionalAmount = z.string().trim().max(30).default("").refine(v => v === "" || /^\d+(\.\d{1,2})?$/.test(v));
export const mobilePhone = z.string().trim().regex(/^05\d{8}$/, "phone");
export type ApplicationKind = "franchise" | "acquisition";
export type ApplicationField = { key: string; ar: string; en: string; required?: boolean; type?: "tel" | "number" | "acquisition"; max?: number };
const personal: ApplicationField[] = [
  { key: "full_name", ar: "الاسم الكامل", en: "Full Name", required: true },
  { key: "phone", ar: "الهاتف", en: "Phone Number", type: "tel", required: true },
  { key: "address", ar: "العنوان", en: "Address", max: 500 },
];
export const applicationSections: Record<ApplicationKind, { ar: string; en: string; fields: ApplicationField[] }[]> = {
  franchise: [
    { ar: "المعلومات الشخصية", en: "Personal Information", fields: [personal[0],
      { key: "country", ar: "الدولة", en: "Country", required: true, max: 120 },
      { key: "nationality", ar: "الجنسية", en: "Nationality", required: true, max: 120 }, personal[1], personal[2]] },
    { ar: "بيانات الشركة", en: "Company Details", fields: [
      { key: "company_name", ar: "اسم الشركة", en: "Company Name", required: true },
      { key: "cr_number", ar: "رقم السجل التجاري", en: "Commercial Registration Number", required: true, max: 100 },
      { key: "city", ar: "مدينة الشركة", en: "Company City", required: true, max: 120 },
      { key: "station_count", ar: "عدد محطات الوقود", en: "Number of Fuel Stations", type: "number", max: 9 },
    ] },
    { ar: "الحالة المالية", en: "Financial Status", fields: [
      { key: "annual_income_sar", ar: "إجمالي الدخل السنوي الحالي", en: "Current Total Annual Income", type: "number", max: 30 },
      { key: "investment_capital_sar", ar: "رأس المال المتوقع للبدء", en: "Expected Startup Capital", type: "number", max: 30 },
    ] },
  ],
  acquisition: [
    { ar: "المعلومات الشخصية", en: "Personal Information", fields: personal },
    { ar: "بيانات الشركة", en: "Company / Entity Details", fields: [
      { key: "entity_name", ar: "اسم الجهة", en: "Entity / Organization Name", required: true },
      { key: "city", ar: "المدينة", en: "City", required: true, max: 120 },
      { key: "acquisition_type", ar: "نوع الاستحواذ", en: "Acquisition Type", type: "acquisition", required: true },
    ] },
  ],
};

export function documentFileError(file: { name: string; size: number }) {
  if (!/\.(pdf|docx|jpe?g|png)$/i.test(file.name)) return "type";
  if (file.size > APPLICATION_DOCUMENT_BYTES || file.size === 0) return "size";
  return null;
}
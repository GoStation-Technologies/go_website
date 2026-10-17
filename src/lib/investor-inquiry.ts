import { z } from "zod";

export const IrInput = z.object({
  full_name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(50).default(""),
  organization: z.string().trim().max(200).default(""),
  inquiry_type: z.enum(["general", "analyst", "press", "investor"]).default("general"),
  message: z.string().trim().min(1).max(4000),
});

export function inquiryFromForm(form: FormData) {
  return IrInput.parse({
    full_name: form.get("name"),
    email: form.get("email"),
    phone: form.get("phone") ?? "",
    organization: form.get("org") ?? "",
    inquiry_type: form.get("type") ?? "general",
    message: form.get("message"),
  });
}

export const submissionTables = {
  franchise: "franchise_applications",
  acquisitions: "acquisition_requests",
  contact: "contact_messages",
  ir: "ir_inquiries",
} as const;
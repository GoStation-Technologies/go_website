import { z } from "zod";
import { optionalUrlSchema, phoneSchema } from "./form-validation";

/** Shared by the apply form and the server so both enforce identical limits. */
export const ApplyInput = z.object({
  job_id: z.string().uuid(),
  full_name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(255),
  phone: phoneSchema,
  linkedin_url: optionalUrlSchema,
  cover_letter: z.string().trim().max(10000).optional().default(""),
  /** Storage path of a CV the browser uploaded directly to the private "cvs" bucket. */
  cv_path: z
    .string()
    .regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(pdf|doc|docx)$/)
    .nullable()
    .optional()
    .default(null),
});

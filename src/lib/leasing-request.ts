import { z } from "zod";

const text = (max: number) => z.string().trim().max(max).default("");
const optionalNumber = z.preprocess((value) => value === "" || value == null ? null : value, z.coerce.number().positive().nullable());
export const LeasingMetadata = z.object({
  company: text(200), activity: text(200), city: text(120), district: text(120),
  area_sqm: optionalNumber, lease_years: optionalNumber,
  documents: z.array(z.object({ name: z.string(), path: z.string() })).default([]),
});
export const LeasingInput = z.object({
  full_name: z.string().trim().min(1).max(200), email: z.string().trim().email().max(255),
  phone: z.string().trim().min(1).max(50), notes: text(4000),
  requirements: LeasingMetadata.omit({ documents: true }),
  documents: z.array(z.object({ name: z.string().min(1).max(200), type: z.enum(["application/pdf", "image/jpeg", "image/png"]), data: z.string().min(1).max(7_000_000) })).max(5).default([]),
});

export function leasingMetadata(row: Record<string, unknown>) {
  const parsed = LeasingMetadata.safeParse(row.leasing_metadata ?? {});
  return parsed.success ? parsed.data : LeasingMetadata.parse({});
}

export function filterSubmissionCategory<T extends { eq: (column: string, value: string) => T; neq: (column: string, value: string) => T }>(query: T, kind: string): T {
  if (kind === "leasing") return query.eq("category", "leasing");
  if (kind === "contact") return query.neq("category", "leasing");
  return query;
}
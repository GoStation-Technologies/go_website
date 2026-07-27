import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Public form submissions are handled server-side. The underlying
// SECURITY DEFINER database functions are no longer callable by anon /
// authenticated roles; only the trusted server runtime may invoke them.

const str = (max: number) => z.string().trim().max(max);

const ContactInput = z.object({
  full_name: str(200).min(1),
  email: str(255).email(),
  phone: str(50).optional().default(""),
  category: str(40).min(1),
  subject: str(200).min(1),
  message: str(4000).min(1),
});

const AcquisitionInput = z.object({
  full_name: str(200).min(1),
  phone: str(50).min(1),
  email: str(255).email(),
  station_name: str(200).optional().default(""),
  city: str(120).optional().default(""),
  district: str(120).optional().default(""),
  land_area_sqm: str(30).optional().default(""),
  fuel_pumps_count: str(30).optional().default(""),
  avg_daily_sales_sar: str(30).optional().default(""),
  notes: str(4000).optional().default(""),
});

const FranchiseInput = z.object({
  full_name: str(200).min(1),
  national_id: str(50).min(1),
  phone: str(50).min(1),
  email: str(255).email(),
  city: str(120).min(1),
  cr_number: str(60).optional().default(""),
  proposed_city: str(120).optional().default(""),
  proposed_district: str(120).optional().default(""),
  land_area_sqm: str(30).optional().default(""),
  ownership_status: str(60).optional().default(""),
  investment_capital_sar: str(30).optional().default(""),
  notes: str(4000).optional().default(""),
});

async function callSubmit(fn: string, payload: Record<string, string>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin.rpc as any)(fn, { payload });
  if (error) {
    console.error(`[submissions] ${fn} failed`, error);
    throw new Error("submission_failed");
  }
  return { reference: data as string };
}

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => ContactInput.parse(raw))
  .handler(async ({ data }) => callSubmit("submit_contact_message", data));

export const submitAcquisitionRequest = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => AcquisitionInput.parse(raw))
  .handler(async ({ data }) => callSubmit("submit_acquisition_request", data));

export const submitFranchiseApplication = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => FranchiseInput.parse(raw))
  .handler(async ({ data }) => callSubmit("submit_franchise_application", data));

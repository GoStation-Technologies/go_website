import { z } from "zod";
import { optionalPhoneSchema, phoneSchema } from "./form-validation";

const str = (max: number) => z.string().trim().max(max);
export const ContactInput = z.object({
  full_name: str(200).min(1), email: str(255).email(), phone: optionalPhoneSchema,
  category: str(40).min(1), subject: str(200).min(1), message: str(4000).min(1),
});
export const AcquisitionInput = z.object({
  full_name: str(200).min(1), phone: phoneSchema, email: str(255).email(),
  station_name: str(200).optional().default(""), city: str(120).optional().default(""),
  district: str(120).optional().default(""), land_area_sqm: str(30).optional().default(""),
  fuel_pumps_count: str(30).optional().default(""), avg_daily_sales_sar: str(30).optional().default(""),
  notes: str(4000).optional().default(""),
});
export const FranchiseInput = z.object({
  full_name: str(200).min(1), phone: phoneSchema, email: str(255).email(), city: str(120).min(1),
  proposed_city: str(120).optional().default(""), proposed_district: str(120).optional().default(""),
  land_area_sqm: str(30).optional().default(""), ownership_status: str(60).optional().default(""),
  investment_capital_sar: str(30).optional().default(""), notes: str(4000).optional().default(""),
});
import { z } from "zod";
import { optionalPhoneSchema, phoneSchema } from "./form-validation";
import { applicationDocuments, mobilePhone, optionalAmount } from "./application-form";

const str = (max: number) => z.string().trim().max(max);
export const ContactInput = z.object({
  full_name: str(200).min(1), email: str(255).email(), phone: optionalPhoneSchema,
  category: str(40).min(1), subject: str(200).min(1), message: str(4000).min(1),
});
export const AcquisitionInput = z.object({
  full_name: str(200).min(1), phone: mobilePhone, address: str(500).default(""),
  entity_name: str(200).min(1), city: str(120).min(1), acquisition_type: z.enum(["fuel_stations", "land"]),
  notes: str(4000).default(""), documents: applicationDocuments("acquisition"),
});
export const FranchiseInput = z.object({
  full_name: str(200).min(1), country: str(120).min(1), nationality: str(120).min(1), phone: mobilePhone,
  address: str(500).default(""), company_name: str(200).min(1), cr_number: str(100).min(1), city: str(120).min(1),
  station_count: str(9).default("").refine(v => v === "" || /^\d+$/.test(v)),
  annual_income_sar: optionalAmount, investment_capital_sar: optionalAmount,
  notes: str(4000).default(""), documents: applicationDocuments("franchise"),
});
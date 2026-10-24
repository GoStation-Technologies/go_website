import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { IrInput } from "./investor-inquiry";
import { LeasingInput } from "./leasing-request";

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
  phone: str(50).min(1),
  email: str(255).email(),
  city: str(120).min(1),
  proposed_city: str(120).optional().default(""),
  proposed_district: str(120).optional().default(""),
  land_area_sqm: str(30).optional().default(""),
  ownership_status: str(60).optional().default(""),
  investment_capital_sar: str(30).optional().default(""),
  notes: str(4000).optional().default(""),
});

async function callSubmit(
  fn: string,
  payload: Record<string, string>,
  notify: { category: "franchise" | "acquisition" | "contact"; title: string },
) {
  const { getServerSupabase } = await import("./supabase-server.server");
  const { client } = await getServerSupabase();
  if (!client) throw new Error("submission_unavailable");
  const { data, error } = await (client.rpc as any)(fn, { payload });
  if (error) {
    console.error(`[submissions] ${fn} failed`, error);
    throw new Error("submission_failed");
  }
  const reference = data as string;

  // Route the notification using the per-category settings in the admin panel.
  try {
    const { notifySubmission } = await import("./notify.server");
    await notifySubmission({
      category: notify.category,
      title: notify.title,
      reference,
      fields: payload,
    });
  } catch (e) {
    console.warn("[submissions] notification skipped", e);
  }

  return { reference };
}

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => ContactInput.parse(raw))
  .handler(async ({ data }) =>
    callSubmit("submit_contact_message", data, { category: "contact", title: "New contact message" }),
  );

export const submitLeasingRequest = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => LeasingInput.parse(raw))
  .handler(async ({ data }) => {
    const { getAdminClientOrNull } = await import("./supabase-server.server");
    const client = await getAdminClientOrNull();
    if (!client) throw new Error("submission_unavailable");
    const documents: Array<{ name: string; path: string }> = [];
    try {
      for (const file of data.documents) {
        const bytes = Uint8Array.from(atob(file.data), (c) => c.charCodeAt(0));
        if (bytes.length > 5 * 1024 * 1024) throw new Error("document_too_large");
        const pdf = String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
        const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
        const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
        if (!(file.type === "application/pdf" ? pdf : file.type === "image/png" ? png : jpg)) throw new Error("invalid_document");
        const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
        const path = `requests/${crypto.randomUUID()}.${ext}`;
        const { error } = await client.storage.from("leasing-documents").upload(path, bytes, { contentType: file.type });
        if (error) throw new Error("document_upload_failed");
        documents.push({ name: file.name, path });
      }
      const { data: reference, error } = await client.rpc("submit_contact_message", { payload: {
        full_name: data.full_name, email: data.email, phone: data.phone, category: "leasing",
        subject: "طلب تأجير مساحة / Leasing request", message: data.notes || "Leasing request",
        leasing_metadata: { ...data.requirements, documents },
      } });
      if (error) throw new Error("submission_failed");
      try {
        const { notifySubmission } = await import("./notify.server");
        await notifySubmission({ category: "contact", title: "New leasing request", reference: String(reference), fields: { full_name: data.full_name, email: data.email, phone: data.phone, ...Object.fromEntries(Object.entries(data.requirements).map(([k,v]) => [k, String(v ?? "")])), message: data.notes } });
      } catch (error) { console.warn("[leasing] notification skipped", error); }
      return { reference: String(reference) };
    } catch (error) {
      if (documents.length) await client.storage.from("leasing-documents").remove(documents.map((d) => d.path));
      throw error;
    }
  });

export const submitAcquisitionRequest = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => AcquisitionInput.parse(raw))
  .handler(async ({ data }) =>
    callSubmit("submit_acquisition_request", data, {
      category: "acquisition",
      title: "New acquisition request",
    }),
  );

export const submitFranchiseApplication = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => FranchiseInput.parse(raw))
  .handler(async ({ data }) =>
    callSubmit("submit_franchise_application", data, {
      category: "franchise",
      title: "New franchise application",
    }),
  );


export const submitIrInquiry = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => IrInput.parse(raw))
  .handler(async ({ data }) =>
    callSubmit("submit_ir_inquiry", data, { category: "contact", title: "New investor relations inquiry" }),
  );

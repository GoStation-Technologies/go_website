import { createServerFn } from "@tanstack/react-start";
import { IrInput } from "./investor-inquiry";
import { LeasingInput } from "./leasing-request";
import { ContactInput, AcquisitionInput, FranchiseInput } from "./submission-schemas";
export { ContactInput, AcquisitionInput, FranchiseInput } from "./submission-schemas";

async function callSubmit(
  fn: string,
  payload: Record<string, string>,
  notify: { category: "franchise" | "acquisition" | "contact" | "investor"; title: string },
) {
  const { shouldForwardPipeline, forwardPipeline } = await import("./hosted-pipeline.server");
  if (shouldForwardPipeline()) return forwardPipeline<{ reference: string }>({ operation: notify.category, payload } as import("./hosted-pipeline").PipelineRequest);
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
      client,
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
    const { shouldForwardPipeline, forwardPipeline } = await import("./hosted-pipeline.server");
    if (shouldForwardPipeline()) return forwardPipeline<{ reference: string }>({ operation: "leasing", payload: data });
    const { getServerSupabase } = await import("./supabase-server.server");
    const { client } = await getServerSupabase();
    if (!client) throw new Error("submission_unavailable");
    // Documents were uploaded by the browser straight to private storage.
    const documents = data.documents;
    {
      const { data: reference, error } = await client.rpc("submit_contact_message", { payload: {
        full_name: data.full_name, email: data.email, phone: data.phone, category: "leasing",
        subject: "طلب تأجير مساحة / Leasing request", message: data.notes || "Leasing request",
        leasing_metadata: { ...data.requirements, documents },
      } });
      if (error) {
        console.error("[leasing] submission failed", error);
        throw new Error("submission_failed");
      }
      try {
        const { notifySubmission } = await import("./notify.server");
        await notifySubmission({ category: "contact", title: "New leasing request", reference: String(reference), client,
          attachments: documents.map(document => ({ bucket: "leasing-documents", path: document.path, name: document.name })),
          fields: { full_name: data.full_name, email: data.email, phone: data.phone, ...data.requirements, message: data.notes } });
      } catch (error) { console.warn("[leasing] notification skipped", error); }
      return { reference: String(reference) };
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
    callSubmit("submit_ir_inquiry", data, { category: "investor", title: "New investor relations inquiry" }),
  );

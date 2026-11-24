import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), job: vi.fn(), notify: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => {
  const builder = {
    middleware: () => builder,
    inputValidator: () => builder,
    handler: (handler: (args: unknown) => unknown) => handler,
  };
  return builder;
} }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("./hosted-pipeline.server", () => ({ shouldForwardPipeline: () => false, forwardPipeline: vi.fn() }));
vi.mock("./supabase-server.server", () => ({ getServerSupabase: async () => ({ client: {
  rpc: mocks.rpc,
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.job }) }) }),
} }) }));
vi.mock("./notify.server", () => ({ notifySubmission: mocks.notify }));
vi.mock("./audit", () => ({ writeAudit: vi.fn() }));
import { submitLeasingRequest } from "./submissions.functions";
import { submitJobApplication } from "./careers.functions";

describe("Leasing and HR application routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rpc.mockResolvedValue({ data: "GS-TEST-1", error: null });
    mocks.notify.mockResolvedValue({ sent: true, recipients: 1 });
    mocks.job.mockResolvedValue({ data: { title_ar: "محاسب", title_en: "Accountant", department: "Finance", department_ar: "المالية", department_en: "Finance" }, error: null });
  });
  const leasing = { full_name: "Test applicant", email: "visitor@example.com", phone: "0501234567", notes: "Commercial lease", requirements: { company: "Test business", activity: "Retail", city: "Riyadh", district: "North", area_sqm: 120, lease_years: 3 }, documents: [{ name: "license.pdf", path: "requests/12345678-1234-1234-1234-123456789012.pdf" }] };
  it("saves leasing requirements and routes exclusively to Leasing with private documents", async () => {
    await submitLeasingRequest({ data: leasing });
    expect(mocks.rpc).toHaveBeenCalledWith("submit_contact_message", { payload: expect.objectContaining({ category: "leasing", leasing_metadata: { ...leasing.requirements, documents: leasing.documents } }) });
    expect(mocks.notify).toHaveBeenCalledTimes(1);
    expect(mocks.notify).toHaveBeenCalledWith(expect.objectContaining({ category: "leasing", fields: { full_name: leasing.full_name, email: leasing.email, phone: leasing.phone, ...leasing.requirements, message: leasing.notes }, attachments: [{ bucket: "leasing-documents", ...leasing.documents[0] }] }));
  });
  it("routes job title, department, applicant details, cover note and CV to HR", async () => {
    const jobId = "12345678-1234-1234-1234-123456789012";
    const applicant = { job_id: jobId, full_name: "Candidate", email: "candidate@example.com", phone: "0501234567", linkedin_url: "", cover_letter: "My cover note", cv_path: `${jobId}/12345678-1234-1234-1234-123456789012.pdf` };
    await submitJobApplication({ data: applicant });
    expect(mocks.notify).toHaveBeenCalledWith(expect.objectContaining({ category: "careers", fields: { full_name: "Candidate", email: "candidate@example.com", phone: "0501234567", linkedin_url: "", job_title: "محاسب / Accountant", department: "المالية / Finance", cover_letter: "My cover note", cv_attached: "yes" }, attachments: [{ bucket: "cvs", path: applicant.cv_path, name: "CV / السيرة الذاتية" }] }));
  });
  it("keeps a saved leasing request successful if its notification fails", async () => {
    mocks.notify.mockRejectedValue(new Error("provider unavailable"));
    expect(await submitLeasingRequest({ data: leasing })).toEqual({ reference: "GS-TEST-1" });
  });
});
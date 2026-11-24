import { z } from "zod";
import { NOTIFY_CATEGORIES } from "./notification-policy";
import { ContactInput, AcquisitionInput, FranchiseInput } from "./submission-schemas";
import { ApplyInput } from "./job-application";
import { LeasingInput } from "./leasing-request";
import { IrInput } from "./investor-inquiry";

export const HOSTED_PIPELINE_URL = "https://org-story-weaver.lovable.app/api/public/submissions";
export const PipelineInput = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("contact"), payload: ContactInput }),
  z.object({ operation: z.literal("franchise"), payload: FranchiseInput }),
  z.object({ operation: z.literal("acquisition"), payload: AcquisitionInput }),
  z.object({ operation: z.literal("investor"), payload: IrInput }),
  z.object({ operation: z.literal("leasing"), payload: LeasingInput }),
  z.object({ operation: z.literal("careers"), payload: ApplyInput }),
  z.object({ operation: z.literal("test"), payload: z.object({ category: z.enum(NOTIFY_CATEGORIES) }) }),
]);
export type PipelineRequest = z.infer<typeof PipelineInput>;

export function isHostedRuntime(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".lovable.app");
}
import { auth, defineMcp } from "@lovable.dev/mcp-js";

import listStations from "./tools/list-stations";
import listNews from "./tools/list-news";
import listJobOpenings from "./tools/list-job-openings";
import listSubmissions from "./tools/list-submissions";
import updateSubmissionStatus from "./tools/update-submission-status";
import portalOverview from "./tools/portal-overview";

// The OAuth issuer must be the direct Supabase host; the project ref is the only
// Supabase value that survives publish unchanged.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "org-website-builder",
  title: "Org Website Builder",
  version: "0.1.0",
  instructions:
    "Tools for the GoStation website and admin portal. Read stations, news/events, and career openings; " +
    "staff callers can also review franchise, acquisition, and contact submissions and update their status. " +
    "All access is enforced by the signed-in user's own permissions.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listStations,
    listNews,
    listJobOpenings,
    listSubmissions,
    updateSubmissionStatus,
    portalOverview,
  ],
});

import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/site/legal-page";
import { legalDocumentQuery } from "@/lib/legal-pages.query";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy-policy")({
  loader: ({ context }) => context.queryClient.ensureQueryData(legalDocumentQuery("privacy-policy")),
  component: () => <LegalPage slug="privacy-policy" />,
  head: () => pageHead({ path: "/privacy-policy", title: "Privacy Policy — GoStation", description: "Read the privacy policy for GoStation, Hala Saudi Petroleum Services, in Arabic and English." }),
});
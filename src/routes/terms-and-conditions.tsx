import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/site/legal-page";
import { legalDocumentQuery } from "@/lib/legal-pages.query";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/terms-and-conditions")({
  loader: ({ context }) => context.queryClient.ensureQueryData(legalDocumentQuery("terms-and-conditions")),
  component: () => <LegalPage slug="terms-and-conditions" />,
  head: () => pageHead({ path: "/terms-and-conditions", title: "Terms & Conditions — GoStation", description: "Read the terms and conditions for the GoStation website in Arabic and English." }),
});
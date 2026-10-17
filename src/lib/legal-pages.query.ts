import { queryOptions } from "@tanstack/react-query";
import { getLegalDocument } from "@/lib/legal-pages.functions";
import type { LegalPageSlug } from "@/lib/legal-pages";

export const legalDocumentQuery = (slug: LegalPageSlug) => queryOptions({
  queryKey: ["cms", "legal", slug],
  queryFn: () => getLegalDocument({ data: { slug } }),
  staleTime: 0,
});
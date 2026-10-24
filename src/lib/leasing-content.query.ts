import { queryOptions } from "@tanstack/react-query";
import { getLeasingSections } from "@/lib/leasing-content.functions";

export const leasingContentQuery = queryOptions({
  queryKey: ["cms", "page_sections", "leasing"],
  queryFn: () => getLeasingSections(),
  staleTime: 0,
  refetchOnWindowFocus: true,
});
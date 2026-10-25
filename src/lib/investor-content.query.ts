import { queryOptions } from "@tanstack/react-query";
import { getInvestorContent } from "@/lib/reports.functions";

export const investorContentQuery = queryOptions({
  queryKey: ["cms", "investor-content"],
  queryFn: () => getInvestorContent(),
  staleTime: 0,
});
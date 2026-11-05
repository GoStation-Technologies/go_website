import { supabase } from "@/integrations/supabase/client";
import { isLocatorStation } from "@/lib/station-status";

/** Both public maps share visibility and a separate cache from admin/all-station reads. */
export const locatorStationsQuery = {
  queryKey: ["stations", "public-locator"],
  queryFn: async () => {
    const { data, error } = await supabase.from("stations").select("*");
    if (error) throw error;
    return (data ?? []).filter(isLocatorStation);
  },
  refetchOnMount: "always" as const,
};
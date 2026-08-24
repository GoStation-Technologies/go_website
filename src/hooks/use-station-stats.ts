import { useQuery } from "@tanstack/react-query";
import {
  getActiveStationRegions,
  getAllKSARegions,
  getStationStats,
  STATION_STATS_FALLBACK,
  type RegionRow,
  type StationStats,
} from "@/lib/stations.functions";

const FIVE_MIN = 5 * 60_000;

/**
 * Site-wide live network numbers: total stations and distinct active regions.
 * Always returns usable values (falls back while loading).
 */
export function useStationStats(): StationStats & { isLoading: boolean } {
  const q = useQuery({
    queryKey: ["station-stats"],
    queryFn: () => getStationStats(),
    staleTime: FIVE_MIN,
    retry: 1,
  });
  return {
    stationsCount: q.data?.stationsCount ?? STATION_STATS_FALLBACK.stationsCount,
    activeRegionsCount: q.data?.activeRegionsCount ?? STATION_STATS_FALLBACK.activeRegionsCount,
    isLoading: q.isLoading,
  };
}

/** The 13 official KSA provinces — corporate forms only. */
export function useKSARegions() {
  return useQuery<RegionRow[]>({
    queryKey: ["ksa-regions"],
    queryFn: () => getAllKSARegions(),
    staleTime: FIVE_MIN,
  });
}

/** Distinct areas that have at least one station — locator filters only. */
export function useActiveStationRegions() {
  return useQuery({
    queryKey: ["active-station-regions"],
    queryFn: () => getActiveStationRegions(),
    staleTime: FIVE_MIN,
  });
}

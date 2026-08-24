import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type RegionRow = {
  id: string;
  name: string;
  name_ar: string | null;
  name_en: string | null;
  is_master_ksa: boolean;
};

export type StationStats = { stationsCount: number; activeRegionsCount: number };

/** Fallback used while loading or if the backend is unreachable. */
export const STATION_STATS_FALLBACK: StationStats = { stationsCount: 193, activeRegionsCount: 56 };

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Total stations + number of distinct areas that have stations. */
export const getStationStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<StationStats> => {
    try {
      const { data, error } = await publicClient().rpc("station_network_stats");
      if (error) throw error;
      const row = data?.[0];
      if (!row?.stations_count) return STATION_STATS_FALLBACK;
      return {
        stationsCount: row.stations_count,
        activeRegionsCount: row.active_regions_count ?? STATION_STATS_FALLBACK.activeRegionsCount,
      };
    } catch (err) {
      console.error("[station stats]", err);
      return STATION_STATS_FALLBACK;
    }
  },
);

/**
 * The 13 official KSA administrative provinces.
 * Use for acquisition/franchise/inquiry forms — never for station filters.
 */
export const getAllKSARegions = createServerFn({ method: "GET" }).handler(
  async (): Promise<RegionRow[]> => {
    const { data, error } = await publicClient()
      .from("regions")
      .select("id, name, name_ar, name_en, is_master_ksa")
      .eq("is_master_ksa", true)
      .order("name", { ascending: true });
    if (error) {
      console.error("[ksa regions]", error);
      return [];
    }
    return data ?? [];
  },
);

/**
 * Every distinct area that currently has at least one station linked to it.
 * Use for the station locator / coverage filters and counters.
 */
export const getActiveStationRegions = createServerFn({ method: "GET" }).handler(
  async (): Promise<Array<RegionRow & { stations_count: number }>> => {
    const { data, error } = await publicClient().rpc("active_station_regions");
    if (error) {
      console.error("[active station regions]", error);
      return [];
    }
    return (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      name_ar: r.name_ar,
      name_en: r.name_en,
      is_master_ksa: r.is_master_ksa,
      stations_count: r.stations_count,
    }));
  },
);

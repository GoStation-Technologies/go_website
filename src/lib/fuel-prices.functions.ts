import { createServerFn } from "@tanstack/react-start";
import { getServerSupabase } from "@/lib/supabase-server.server";

/**
 * Live fuel prices, scraped from Aramco's official retail fuels page.
 * Aramco updates prices monthly; there is no official API, so we parse the
 * public page and cache the result in system_cache (key: aramco_fuel_prices)
 * for 12 hours. On any failure we fall back to the cached value, then to the
 * manually edited site_settings.fuel_prices, then to hardcoded defaults.
 */

export type FuelPrices = {
  prices: Record<string, number>;
  currency: string;
  updated_at: string;
  source: "live" | "cache" | "manual" | "fallback";
};

const ARAMCO_URL = "https://www.aramco.com/en/what-we-do/energy-products/retail-fuels";
const CACHE_KEY = "aramco_fuel_prices";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const FALLBACK: FuelPrices = {
  prices: { "91": 2.33, "95": 2.66, "98": 3.05, diesel: 1.15 },
  currency: "SAR",
  updated_at: "",
  source: "fallback",
};

// Match e.g. "### 2.18\n\nGasoline 91" blocks on the Aramco page.
function parseAramcoPage(html: string): Record<string, number> | null {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");

  const prices: Record<string, number> = {};
  const patterns: Array<[string, RegExp]> = [
    ["91", /(\d+(?:\.\d+)?)\s*Gasoline\s*91/i],
    ["95", /(\d+(?:\.\d+)?)\s*Gasoline\s*95/i],
    ["98", /(\d+(?:\.\d+)?)\s*Gasoline\s*98/i],
    ["diesel", /(\d+(?:\.\d+)?)\s*Diesel/i],
  ];
  for (const [key, re] of patterns) {
    const m = text.match(re);
    if (m) {
      const n = Number(m[1]);
      // Sanity check: KSA pump prices are well under 10 SAR/L.
      if (Number.isFinite(n) && n > 0 && n < 10) prices[key] = n;
    }
  }
  return Object.keys(prices).length >= 2 ? prices : null;
}

async function fetchLive(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(ARAMCO_URL, {
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GoStation/1.0)" },
    });
    if (!res.ok) return null;
    return parseAramcoPage(await res.text());
  } catch {
    return null;
  }
}

export const getFuelPrices = createServerFn({ method: "GET" }).handler(
  async (): Promise<FuelPrices> => {
    const supabase = await getServerSupabase();
    const now = new Date();

    // 1. Fresh cache?
    try {
      const { data: cached } = await supabase
        .from("system_cache")
        .select("value")
        .eq("key", CACHE_KEY)
        .maybeSingle();
      const cv = cached?.value as FuelPrices | undefined;
      if (cv?.prices && cv.updated_at) {
        const age = now.getTime() - new Date(cv.updated_at).getTime();
        if (age < CACHE_TTL_MS) return { ...cv, source: "cache" };
      }

      // 2. Live fetch from Aramco, then refresh the cache.
      const live = await fetchLive();
      if (live) {
        const fresh: FuelPrices = {
          prices: live,
          currency: "SAR",
          updated_at: now.toISOString(),
          source: "live",
        };
        await supabase
          .from("system_cache")
          .upsert({ key: CACHE_KEY, value: fresh as never, updated_at: now.toISOString() });
        return fresh;
      }

      // 3. Stale cache is better than nothing.
      if (cv?.prices) return { ...cv, source: "cache" };
    } catch {
      // cache unavailable — continue to manual settings
    }

    // 4. Manually edited prices from Admin → Settings.
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "fuel_prices")
        .maybeSingle();
      const v = data?.value as Partial<FuelPrices> | undefined;
      if (v?.prices && Object.keys(v.prices).length > 0) {
        return {
          prices: v.prices,
          currency: v.currency ?? "SAR",
          updated_at: v.updated_at ?? "",
          source: "manual",
        };
      }
    } catch {
      // fall through
    }

    return FALLBACK;
  },
);

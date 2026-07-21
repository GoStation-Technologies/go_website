import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Flame } from "lucide-react";

type Prices = { prices: Record<string, number>; currency: string; updated_at: string };

async function fetchPrices(): Promise<Prices> {
  const { data } = await supabase.from("system_cache").select("value").eq("key", "aramco_fuel_prices").maybeSingle();
  return (data?.value as Prices) ?? { prices: { "91": 2.33, "95": 2.66, "98": 3.05, diesel: 1.15 }, currency: "SAR", updated_at: "" };
}

export function FuelTicker() {
  const { t, i18n } = useTranslation();
  const { data } = useQuery({ queryKey: ["fuel-prices"], queryFn: fetchPrices, staleTime: 60_000 });
  const items = data ? Object.entries(data.prices) : [];
  const labels: Record<string, { en: string; ar: string }> = {
    "91": { en: "Petrol 91", ar: "بنزين 91" },
    "95": { en: "Petrol 95", ar: "بنزين 95" },
    "98": { en: "Petrol 98", ar: "بنزين 98" },
    diesel: { en: "Diesel", ar: "ديزل" },
  };
  const lng = (i18n.language || "en").startsWith("ar") ? "ar" : "en";
  const doubled = [...items, ...items];

  return (
    <div className="border-y bg-primary/95 text-primary-foreground">
      <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-hidden px-4 py-3">
        <div className="flex shrink-0 items-center gap-2 text-sm font-semibold">
          <Flame className="h-4 w-4 text-accent" />
          <span className="hidden sm:inline">{t("home.pricesTitle")}</span>
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="marquee-track flex gap-8 whitespace-nowrap">
            {doubled.map(([k, v], i) => (
              <span key={i} className="flex items-center gap-2 text-sm">
                <span className="font-medium text-primary-foreground/70">{labels[k]?.[lng] ?? k}</span>
                <span className="font-bold text-accent">{v.toFixed(2)}</span>
                <span className="text-primary-foreground/60">{data?.currency ?? "SAR"}/L</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

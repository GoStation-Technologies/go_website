import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Calculator, TrendingUp, Timer, Wallet, RotateCcw, Droplets, BadgeDollarSign, Banknote, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEFAULTS = {
  litersPerDay: 12000,
  marginPerLiter: 0.15,
  storeMonthlyRevenue: 45000,
  storeMargin: 25,
  monthlyOpex: 90000,
  initialInvestment: 3500000,
};

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

export function RoiCalculator() {
  const { t } = useTranslation();
  const [v, setV] = useState(DEFAULTS);
  const set = (k: keyof typeof DEFAULTS, value: number) =>
    setV((s) => ({ ...s, [k]: Number.isFinite(value) ? value : 0 }));

  const r = useMemo(() => {
    const fuelGross = v.litersPerDay * v.marginPerLiter * 365;
    const storeGross = v.storeMonthlyRevenue * 12 * (v.storeMargin / 100);
    const opex = v.monthlyOpex * 12;
    const net = fuelGross + storeGross - opex;
    const roi = v.initialInvestment > 0 ? (net / v.initialInvestment) * 100 : 0;
    const payback = net > 0 ? v.initialInvestment / net : 0;
    return { fuelGross, storeGross, opex, net, roi, payback };
  }, [v]);

  return (
    <section id="roi" className="scroll-mt-24 bg-background py-16">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            <Calculator className="h-3.5 w-3.5" />
            {t("franchise.roi.eyebrow")}
          </span>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">{t("franchise.roi.title")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{t("franchise.roi.subtitle")}</p>
        </div>

        <Card className="overflow-hidden border border-border/80 shadow-xl">
          <div className="grid lg:grid-cols-[1fr,280px]">
            <CardContent className="p-6 md:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold">{t("franchise.roi.inputsTitle")}</h3>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" onClick={() => setV(DEFAULTS)}>
                  <RotateCcw className="h-4 w-4" />
                  {t("franchise.roi.reset")}
                </Button>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  icon={Droplets}
                  label={t("franchise.roi.f.liters")}
                  suffix={t("franchise.roi.u.liters")}
                  value={v.litersPerDay}
                  min={2000}
                  max={40000}
                  step={500}
                  onChange={(n) => set("litersPerDay", n)}
                />
                <Field
                  icon={BadgeDollarSign}
                  label={t("franchise.roi.f.margin")}
                  suffix={t("franchise.roi.u.sarPerLiter")}
                  value={v.marginPerLiter}
                  min={0.05}
                  max={0.5}
                  step={0.01}
                  decimals={2}
                  onChange={(n) => set("marginPerLiter", n)}
                />
                <Field
                  icon={Banknote}
                  label={t("franchise.roi.f.opex")}
                  suffix={t("franchise.roi.u.sarMonth")}
                  value={v.monthlyOpex}
                  min={10000}
                  max={500000}
                  step={5000}
                  onChange={(n) => set("monthlyOpex", n)}
                />
                <Field
                  icon={Landmark}
                  label={t("franchise.roi.f.investment")}
                  suffix={t("franchise.roi.u.sar")}
                  value={v.initialInvestment}
                  min={500000}
                  max={15000000}
                  step={100000}
                  onChange={(n) => set("initialInvestment", n)}
                />
              </div>

              <div className="mt-8 border-t pt-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Result icon={Wallet} label={t("franchise.roi.r.net")} value={nf.format(Math.round(r.net))} unit={t("franchise.roi.u.sarYear")} />
                  <Result icon={TrendingUp} label={t("franchise.roi.r.roi")} value={`${nf1.format(r.roi)}%`} />
                  <Result
                    icon={Timer}
                    label={t("franchise.roi.r.payback")}
                    value={r.payback > 0 ? `${nf1.format(r.payback)}` : "—"}
                    unit={r.payback > 0 ? t("franchise.roi.u.years") : undefined}
                  />
                </div>
              </div>
            </CardContent>

            <div className="relative flex flex-col justify-between bg-primary p-6 text-primary-foreground md:p-8">
              <div aria-hidden className="pointer-events-none absolute inset-0 opacity-10">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-white/30 blur-3xl" />
              </div>

              <div className="relative">
                <p className="text-sm font-medium opacity-80">{t("franchise.roi.r.net")}</p>
                <p className="mt-2 text-4xl font-extrabold tabular-nums md:text-5xl" dir="ltr">
                  {nf.format(Math.round(r.net))}
                </p>
                <p className="mt-1 text-sm opacity-80">{t("franchise.roi.u.sarYear")}</p>
              </div>

              <div className="relative mt-8 space-y-4">
                <MiniRow label={t("franchise.roi.r.roi")} value={`${nf1.format(r.roi)}%`} />
                <MiniRow label={t("franchise.roi.r.payback")} value={r.payback > 0 ? `${nf1.format(r.payback)} ${t("franchise.roi.u.years")}` : "—"} />
              </div>

              <p className="relative mt-8 text-xs leading-relaxed opacity-70">{t("franchise.roi.disclaimer")}</p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

function Field({
  icon: Icon,
  label,
  suffix,
  value,
  min,
  max,
  step,
  decimals = 0,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  suffix: string;
  value: number;
  min: number;
  max: number;
  step: number;
  decimals?: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Icon className="h-4 w-4" />
        </span>
        <label className="text-sm font-semibold">{label}</label>
      </div>
      <div className="flex items-center gap-3">
        <Input
          type="number"
          dir="ltr"
          min={min}
          max={max}
          step={step}
          value={decimals ? value.toFixed(decimals) : value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="h-10 flex-1 text-end tabular-nums"
        />
        <span className="w-16 shrink-0 text-xs text-muted-foreground">{suffix}</span>
      </div>
      <Slider dir="ltr" value={[Math.min(Math.max(value, min), max)]} min={min} max={max} step={step} onValueChange={([n]) => onChange(n)} />
    </div>
  );
}

function Result({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold tabular-nums" dir="ltr">
            {value}
            {unit ? <span className="ms-1 text-xs font-medium text-muted-foreground">{unit}</span> : null}
          </p>
        </div>
      </div>
    </div>
  );
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 last:border-0 last:pb-0">
      <span className="text-sm opacity-80">{label}</span>
      <span className="text-sm font-bold tabular-nums" dir="ltr">
        {value}
      </span>
    </div>
  );
}


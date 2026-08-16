import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Calculator, TrendingUp, Timer, Wallet, RotateCcw } from "lucide-react";
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
    <section id="roi" className="scroll-mt-24 border-b bg-background py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            <Calculator className="h-3.5 w-3.5" />
            {t("franchise.roi.eyebrow")}
          </span>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">{t("franchise.roi.title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("franchise.roi.subtitle")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardContent className="space-y-6 p-6 md:p-8">
              <Field
                label={t("franchise.roi.f.liters")}
                suffix={t("franchise.roi.u.liters")}
                value={v.litersPerDay}
                min={2000}
                max={40000}
                step={500}
                onChange={(n) => set("litersPerDay", n)}
              />
              <Field
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
                label={t("franchise.roi.f.store")}
                suffix={t("franchise.roi.u.sarMonth")}
                value={v.storeMonthlyRevenue}
                min={0}
                max={400000}
                step={5000}
                onChange={(n) => set("storeMonthlyRevenue", n)}
              />
              <Field
                label={t("franchise.roi.f.storeMargin")}
                suffix="%"
                value={v.storeMargin}
                min={5}
                max={60}
                step={1}
                onChange={(n) => set("storeMargin", n)}
              />
              <Field
                label={t("franchise.roi.f.opex")}
                suffix={t("franchise.roi.u.sarMonth")}
                value={v.monthlyOpex}
                min={10000}
                max={500000}
                step={5000}
                onChange={(n) => set("monthlyOpex", n)}
              />
              <Field
                label={t("franchise.roi.f.investment")}
                suffix={t("franchise.roi.u.sar")}
                value={v.initialInvestment}
                min={500000}
                max={15000000}
                step={100000}
                onChange={(n) => set("initialInvestment", n)}
              />

              <Button variant="ghost" size="sm" className="gap-2" onClick={() => setV(DEFAULTS)}>
                <RotateCcw className="h-4 w-4" />
                {t("franchise.roi.reset")}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4 lg:col-span-2">
            <Card className="bg-brand-radial text-white">
              <CardContent className="p-6 md:p-8">
                <p className="text-sm/6 opacity-80">{t("franchise.roi.r.net")}</p>
                <p className="mt-1 text-3xl font-extrabold tabular-nums md:text-4xl" dir="ltr">
                  {nf.format(Math.round(r.net))} <span className="text-base font-semibold opacity-80">{t("franchise.roi.u.sarYear")}</span>
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <Result icon={TrendingUp} label={t("franchise.roi.r.roi")} value={`${nf1.format(r.roi)}%`} />
              <Result
                icon={Timer}
                label={t("franchise.roi.r.payback")}
                value={r.payback > 0 ? `${nf1.format(r.payback)} ${t("franchise.roi.u.years")}` : "—"}
              />
              <Result icon={Wallet} label={t("franchise.roi.r.fuelGross")} value={nf.format(Math.round(r.fuelGross))} />
              <Result icon={Wallet} label={t("franchise.roi.r.storeGross")} value={nf.format(Math.round(r.storeGross))} />
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">{t("franchise.roi.disclaimer")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  suffix,
  value,
  min,
  max,
  step,
  decimals = 0,
  onChange,
}: {
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
    <div>
      <div className="flex items-center justify-between gap-4">
        <label className="text-sm font-semibold">{label}</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            dir="ltr"
            min={min}
            max={max}
            step={step}
            value={decimals ? value.toFixed(decimals) : value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="h-9 w-32 text-end tabular-nums"
          />
          <span className="w-20 text-xs text-muted-foreground">{suffix}</span>
        </div>
      </div>
      <Slider
        className="mt-3"
        dir="ltr"
        value={[Math.min(Math.max(value, min), max)]}
        min={min}
        max={max}
        step={step}
        onValueChange={([n]) => onChange(n)}
      />
    </div>
  );
}

function Result({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold tabular-nums" dir="ltr">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calculator, TrendingUp, Timer, Wallet, RotateCcw, Droplets, BadgeDollarSign, Banknote, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEFAULTS = {
  litersPerDay: 25000,
  marginPerLiter: 0.18,
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
  const [showResults, setShowResults] = useState(false);
  const set = (k: keyof typeof DEFAULTS, value: number) => {
    setV((s) => ({ ...s, [k]: Number.isFinite(value) ? value : 0 }));
    setShowResults(false);
  };

  const reset = () => {
    setV(DEFAULTS);
    setShowResults(false);
  };

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
            {t("investors.roi.eyebrow")}
          </span>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">{t("investors.roi.title")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{t("investors.roi.subtitle")}</p>
        </div>

        <Card className="overflow-hidden border border-border/80 shadow-xl">
          <CardContent className="p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">{t("investors.roi.inputsTitle")}</h3>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" onClick={reset}>
                <RotateCcw className="h-4 w-4" />
                {t("investors.roi.reset")}
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                icon={Droplets}
                label={t("investors.roi.f.liters")}
                suffix={t("investors.roi.u.liters")}
                value={v.litersPerDay}
                min={2000}
                max={40000}
                step={500}
                onChange={(n) => set("litersPerDay", n)}
              />
              <Field
                icon={BadgeDollarSign}
                label={t("investors.roi.f.margin")}
                suffix={t("investors.roi.u.sarPerLiter")}
                value={v.marginPerLiter}
                min={0.05}
                max={0.5}
                step={0.01}
                decimals={2}
                onChange={(n) => set("marginPerLiter", n)}
              />
              <Field
                icon={Banknote}
                label={t("investors.roi.f.opex")}
                suffix={t("investors.roi.u.sarMonth")}
                value={v.monthlyOpex}
                min={10000}
                max={500000}
                step={5000}
                onChange={(n) => set("monthlyOpex", n)}
              />
              <Field
                icon={Landmark}
                label={t("investors.roi.f.investment")}
                suffix={t("investors.roi.u.sar")}
                value={v.initialInvestment}
                min={500000}
                max={15000000}
                step={100000}
                onChange={(n) => set("initialInvestment", n)}
              />
            </div>

            <div className="mt-8 flex justify-center">
              <Button size="lg" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setShowResults(true)}>
                <Calculator className="h-4 w-4" />
                {t("investors.roi.calculate")}
              </Button>
            </div>

            {showResults ? (
              <div className="mt-8 border-t pt-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Result icon={Wallet} label={t("investors.roi.r.net")} value={nf.format(Math.round(r.net))} unit={t("investors.roi.u.sarYear")} />
                  <Result icon={TrendingUp} label={t("investors.roi.r.roi")} value={`${nf1.format(r.roi)}%`} />
                  <Result
                    icon={Timer}
                    label={t("investors.roi.r.payback")}
                    value={r.payback > 0 ? `${nf1.format(r.payback)}` : "—"}
                    unit={r.payback > 0 ? t("investors.roi.u.years") : undefined}
                  />
                </div>
              </div>
            ) : null}

            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">{t("investors.roi.disclaimer")}</p>
          </CardContent>
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

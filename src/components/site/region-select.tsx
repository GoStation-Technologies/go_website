import { useTranslation } from "react-i18next";
import { getContentLanguage } from "@/lib/i18n";
import { useKSARegions } from "@/hooks/use-station-stats";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Picker for the 13 official KSA administrative provinces.
 * Corporate forms only (acquisitions, franchise, inquiries) — station
 * locator filters use the dynamic active-station regions instead.
 */
export function RegionSelect({
  value,
  onChange,
  placeholder,
}: {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
}) {
  const { i18n } = useTranslation();
  const ar = getContentLanguage(i18n.resolvedLanguage ?? i18n.language) === "ar";
  const { data = [] } = useKSARegions();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder ?? (ar ? "المنطقة" : "Region")} />
      </SelectTrigger>
      <SelectContent className="z-[2000]">
        {data.map((r) => (
          <SelectItem key={r.id} value={r.name}>
            {(ar ? r.name_ar : r.name_en) ?? r.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

import { useTranslation } from "react-i18next";
import { citiesFor } from "@/lib/cities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Localized city picker. The value stored is always the canonical English
 * name, while the visible label follows the active language so a form never
 * mixes Arabic and English city names.
 */
export function CitySelect({
  value,
  onChange,
  name,
  placeholder,
}: {
  value?: string;
  onChange?: (v: string) => void;
  name?: string;
  placeholder?: string;
}) {
  const { t, i18n } = useTranslation();
  const options = citiesFor(i18n.language);
  return (
    <Select value={value || undefined} onValueChange={onChange} name={name}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder ?? t("common.selectCity")} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

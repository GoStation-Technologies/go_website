import * as React from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronsUpDown } from "lucide-react";
import { SAUDI_CITIES, cityLabel } from "@/lib/cities";
import { getContentLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Searchable, keyboard-navigable city picker. The value stored is always the
 * canonical English name, while the visible label follows the active language
 * so a form never mixes Arabic and English city names. Typing matches both the
 * Arabic and English spelling, so either input finds the right city.
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
  const [open, setOpen] = React.useState(false);
  const ar = getContentLanguage(i18n.language) === "ar";

  const options = React.useMemo(
    () =>
      SAUDI_CITIES.map((c) => ({ value: c.value, label: ar ? c.ar : c.en, keywords: [c.en, c.ar, c.value] })).sort(
        (a, b) => a.label.localeCompare(b.label, ar ? "ar" : "en"),
      ),
    [ar],
  );

  const selectedLabel = value ? cityLabel(value, i18n.language) : "";

  return (
    <>
      {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className={cn("truncate", !selectedLabel && "text-muted-foreground")}>
              {selectedLabel || placeholder || t("common.selectCity")}
            </span>
            <ChevronsUpDown className="ms-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command
            filter={(itemValue, search, keywords) => {
              const q = search.trim().toLowerCase();
              if (!q) return 1;
              const hay = [itemValue, ...(keywords ?? [])].join(" ").toLowerCase();
              return hay.includes(q) ? 1 : 0;
            }}
          >
            <CommandInput placeholder={t("common.searchCity")} />
            <CommandList>
              <CommandEmpty>{t("common.noCityFound")}</CommandEmpty>
              <CommandGroup>
                {options.map((o) => (
                  <CommandItem
                    key={o.value}
                    value={o.value}
                    keywords={o.keywords}
                    onSelect={(v) => {
                      onChange?.(v);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("me-2 size-4", value === o.value ? "opacity-100" : "opacity-0")} />
                    {o.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Shared crisp input styling for every admin form control. */
export const inputCls =
  "rounded-md border border-input bg-background shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring";

/** Native <select> styling that matches Input. */
export const selectCls = cn("h-10 w-full px-2 text-sm", inputCls);

/** Disabled identifier / slug / code styling. */
export const disabledCls =
  "cursor-not-allowed bg-muted text-muted-foreground disabled:opacity-100";

/**
 * Admin form grid. Column order is pinned with an explicit LTR container so it
 * never mirrors with the UI language: the first declared cell is always the
 * left column (English) and the second is always the right column (Arabic).
 */
export function FormGrid({
  children,
  className,
  cols = 2,
}: {
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2;
}) {
  return (
    <div
      dir="ltr"
      className={cn("grid gap-6", cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1", className)}
    >
      {children}
    </div>
  );
}

/** Full-width row inside FormGrid (toggles, action separators). Follows the UI language. */
export function FormRow({ children, className }: { children: React.ReactNode; className?: string }) {
  const uiDir = useUiDir();
  return (
    <div
      dir={uiDir}
      className={cn("mt-6 flex flex-wrap items-center gap-6 border-t pt-6 sm:col-span-2", className)}
    >
      {children}
    </div>
  );
}

function useUiDir() {
  const { i18n } = useTranslation();
  return i18n.language?.startsWith("ar") ? "rtl" : "ltr";
}

/**
 * Labeled field. `lang` pins direction and text alignment of the control:
 * "ar" → rtl / text-right, "en" → ltr / text-left. Without `lang` the field
 * follows the active admin language.
 */
export function Field({
  label,
  children,
  hint,
  lang,
  className,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  lang?: "ar" | "en";
  className?: string;
}) {
  const uiDir = useUiDir();
  const dir = lang ? (lang === "en" ? "ltr" : "rtl") : uiDir;
  const align = dir === "ltr" ? "text-left" : "text-right";
  return (
    <div dir={dir} className={cn("min-w-0", align, className)}>
      <Label className="mb-1.5 block text-sm font-semibold text-foreground">{label}</Label>
      <div
        className={cn(
          "[&_input]:w-full [&_textarea]:w-full",
          dir === "ltr"
            ? "[&_input]:text-left [&_textarea]:text-left [&_select]:text-left"
            : "[&_input]:text-right [&_textarea]:text-right [&_select]:text-right",
        )}
      >
        {children}
      </div>
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Read-only identifier / slug / code field. */
export function IdField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Field label={label} lang="en" hint={hint}>
      <Input dir="ltr" disabled readOnly value={value} className={cn(inputCls, disabledCls, "text-left")} />
    </Field>
  );
}

import { useTranslation } from "react-i18next";
import { formMessage } from "@/lib/form-validation";

/** Inline Arabic/English guidance under a form field. */
export function FieldError({ id, code }: { id: string; code?: string }) {
  const { i18n } = useTranslation();
  if (!code) return null;
  return (
    <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
      {formMessage(i18n.resolvedLanguage ?? i18n.language, code)}
    </p>
  );
}

export function invalidProps(id: string, code?: string) {
  return code
    ? { "aria-invalid": true as const, "aria-describedby": `${id}-error`, className: "border-destructive focus-visible:ring-destructive" }
    : {};
}

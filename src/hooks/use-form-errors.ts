import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { z } from "zod";
import { fieldErrors, formMessage, serverErrorKey } from "@/lib/form-validation";

/** Shared client-side validation and friendly error reporting for public forms. */
export function useFormErrors() {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate<S extends z.ZodTypeAny>(schema: S, payload: unknown): z.output<S> | null {
    const parsed = schema.safeParse(payload);
    if (parsed.success) {
      setErrors({});
      return parsed.data;
    }
    setErrors(fieldErrors(parsed.error));
    toast.error(formMessage(lang, "fixFields"));
    return null;
  }

  function fail(error: unknown, scope: string) {
    console.error(`[${scope}] submission failed`, error);
    toast.error(formMessage(lang, serverErrorKey(error)));
  }

  return { errors, setErrors, validate, fail, lang };
}

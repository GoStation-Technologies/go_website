import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function CookieBanner() {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("gs_cookies")) setShow(true);
  }, []);
  if (!show) return null;
  const set = (v: string) => { localStorage.setItem("gs_cookies", v); setShow(false); };
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto mb-4 max-w-4xl rounded-2xl border bg-card px-4 py-3 shadow-lg sm:mx-4 sm:px-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{t("cookies.text")}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => set("declined")}>{t("cookies.decline")}</Button>
          <Button size="sm" onClick={() => set("accepted")}>{t("cookies.accept")}</Button>
        </div>
      </div>
    </div>
  );
}

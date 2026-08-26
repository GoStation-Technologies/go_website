import { useTranslation } from "react-i18next";
import { ArrowUpRight } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-cms";
import { getContentLanguage } from "@/lib/i18n";

/** Optional site-wide announcement strip, managed from the admin settings page. */
export function AnnouncementBar() {
  const { i18n } = useTranslation();
  const { settings, setting } = useSiteSettings();
  const ar = getContentLanguage(i18n.resolvedLanguage ?? i18n.language) === "ar";

  const enabled = settings["announcement_bar"]?.["enabled"] === true;
  const text = setting("announcement_bar", ar ? "text_ar" : "text_en");
  const href = setting("announcement_bar", "href");
  if (!enabled || !text) return null;

  const content = (
    <span className="inline-flex items-center gap-1.5">
      {text}
      {href ? <ArrowUpRight className="h-3.5 w-3.5" /> : null}
    </span>
  );

  return (
    <div className="bg-ember px-4 py-2 text-center text-xs font-semibold text-white sm:text-sm">
      {href ? (
        <a href={href} className="hover:underline">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}

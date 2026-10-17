import markAsset from "@/assets/gostation-brand-mark.png";
import whiteMarkAsset from "@/assets/gostation-brand-mark-white.png";

/** Supplied brand symbol, paired with the bilingual legal company name. */
export function CompanyLogo({
  inverse = false,
  footer = false,
}: {
  inverse?: boolean;
  footer?: boolean;
}) {
  return (
    <span
      dir="ltr"
      className={`company-logo ${inverse ? "company-logo-inverse" : ""} ${footer ? "company-logo-footer" : ""}`}
      role="img"
      aria-label="GOStation — شركة هلا السعودية للخدمات البترولية — Hala Saudi Petroleum Services"
    >
      <span className="company-logo-mark" aria-hidden="true">
        <img src={markAsset} alt="" width={868} height={829} className="company-logo-color" />
        <img src={whiteMarkAsset} alt="" width={868} height={829} className="company-logo-white" />
      </span>
      <span className="company-logo-name" aria-hidden="true">
        <span className="company-logo-brand font-display">GOStation</span>
        <span className="company-logo-ar font-arabic" lang="ar" dir="rtl">شركة هلا السعودية للخدمات البترولية</span>
        <span className="company-logo-en font-sans" lang="en">Hala Saudi Petroleum Services</span>
      </span>
    </span>
  );
}
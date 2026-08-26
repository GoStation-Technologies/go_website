import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

const KEYS: Record<string, string> = {
  "manage-portal-9f4c2ab7": "admin.brand",
  stations: "admin.nav.stations",
  news: "admin.nav.news",
  careers: "admin.nav.careers",
  submissions: "admin.nav.submissions",
  chats: "admin.nav.chats",
  abuse: "admin.nav.abuse",
  audit: "admin.nav.audit",
  notifications: "admin.nav.notifications",
  content: "admin.nav.content",
  faqs: "admin.nav.faqs",
  "otp-whitelist": "admin.nav.otpWhitelist",
  settings: "admin.nav.settings",
  testimonials: "admin.nav.testimonials",
  pages: "admin.nav.content",
  home: "admin.nav.pageHome",
  about: "admin.nav.pageAbout",
  franchise: "admin.nav.pageFranchise",
  acquisitions: "admin.nav.pageAcquisitions",
  investors: "admin.nav.pageInvestors",
};

export function AdminBreadcrumbs() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const parts = pathname.split("/").filter(Boolean);

  const crumbs = parts.map((part, i) => {
    const href = "/" + parts.slice(0, i + 1).join("/");
    const key = KEYS[part];
    const label = key ? t(key) : part;
    return { href, label, isLast: i === parts.length - 1 };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((c) => (
          <Fragment key={c.href}>
            <BreadcrumbItem>
              {c.isLast ? (
                <BreadcrumbPage>{c.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={c.href as never}>{c.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!c.isLast && <BreadcrumbSeparator className="rtl:rotate-180" />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

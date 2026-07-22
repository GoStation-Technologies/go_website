import { Link, useRouterState } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

const LABELS: Record<string, string> = {
  admin: "Admin",
  stations: "Stations",
  news: "News",
  careers: "Careers",
  submissions: "Submissions",
  chats: "Chat logs",
  abuse: "Abuse events",
};

export function AdminBreadcrumbs() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const parts = pathname.split("/").filter(Boolean);

  const crumbs = parts.map((part, i) => {
    const href = "/" + parts.slice(0, i + 1).join("/");
    const label = LABELS[part] ?? part;
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
            {!c.isLast && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

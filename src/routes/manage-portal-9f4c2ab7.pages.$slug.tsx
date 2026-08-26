import { createFileRoute, notFound } from "@tanstack/react-router";
import { PAGE_CMS, PageSectionsEditor } from "@/components/admin/page-sections-editor";

export const Route = createFileRoute("/manage-portal-9f4c2ab7/pages/$slug")({
  component: PageCmsRoute,
});

function PageCmsRoute() {
  const { slug } = Route.useParams();
  const page = PAGE_CMS.find((p) => p.slug === slug);
  if (!page) throw notFound();
  return <PageSectionsEditor page={page} />;
}

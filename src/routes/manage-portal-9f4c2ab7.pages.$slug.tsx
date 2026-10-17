import { createFileRoute, notFound } from "@tanstack/react-router";
import { PAGE_CMS, PageSectionsEditor } from "@/components/admin/page-sections-editor";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/manage-portal-9f4c2ab7/pages/$slug")({
  component: PageCmsRoute,
  head: ({ params }) => {
    const page = PAGE_CMS.find((item) => item.slug === params.slug);
    return pageHead({ path: `/manage-portal-9f4c2ab7/pages/${params.slug}`, title: `${page?.en ?? "Page content"} — GoStation Admin`, description: `Manage bilingual ${page?.en ?? "page"} content and publication on GoStation.` });
  },
});

function PageCmsRoute() {
  const { slug } = Route.useParams();
  const page = PAGE_CMS.find((p) => p.slug === slug);
  if (!page) throw notFound();
  return <PageSectionsEditor key={slug} page={page} />;
}

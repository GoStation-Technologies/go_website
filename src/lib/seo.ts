export const SITE_URL = "https://org-story-weaver.lovable.app";

type PageHeadInput = {
  /** Route path, e.g. "/about". */
  path: string;
  title: string;
  description: string;
  ogType?: "website" | "article";
};

/**
 * Shared per-route head metadata: title, description, Open Graph, Twitter and
 * a self-referencing canonical / og:url.
 */
export function pageHead({ path, title, description, ogType = "website" }: PageHeadInput) {
  const url = `${SITE_URL}${path}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: ogType },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

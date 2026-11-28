/** Exact bundled snapshots only: a new CMS upload must remain editable. */
const savedBanners: Record<string, string> = {
  "https://org-story-weaver.lovable.app/api/public/media/cms/e0bad1c1-fe5b-4774-8d1d-1ff2cb3ba2bc.jpg": "/images/home-hero.jpg",
  "https://org-story-weaver.lovable.app/api/public/media/cms/a5f66b4d-88bc-46c0-9838-1764cc660641.png": "/images/about-hero.png",
  "https://org-story-weaver.lovable.app/api/public/media/cms/dc2bb6fa-9cd5-4eb0-a506-af75b7fada33.png": "/images/franchise-hero.png",
  "https://org-story-weaver.lovable.app/api/public/media/cms/23b1baa0-2820-41ba-bf67-63b11e9f6ed9.jpg": "/images/contact-hero.jpg",
};

const bundledFiles = new Set([
  "station-canopy.jpg", "hero-cinematic.jpg", "hero-station.jpg",
  "gostation-logo.png", "gostation-logo-white.png", "gostation-pylon.jpg",
  "gostation-qr.png", "chairman-cutout.png", "iso-logo.png",
  "accessibility-icon.png", "franchise-station.jpg",
  "go-app-points.jpg", "go-app-reports.jpg", "go-app-download.jpg",
]);

export function localAsset(source: string): string {
  const saved = savedBanners[source];
  if (saved) return saved;
  // Keep existing CMS values that reference the old public root portable.
  if (source.startsWith("/") && bundledFiles.has(source.slice(1))) {
    return `/images${source}`;
  }
  return source;
}
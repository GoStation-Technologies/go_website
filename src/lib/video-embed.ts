/** Turns a YouTube / Vimeo / direct file link into something playable. */
export type VideoSource =
  | { type: "iframe"; src: string }
  | { type: "file"; src: string }
  | null;

export function resolveVideo(url?: string | null): VideoSource {
  const u = (url ?? "").trim();
  if (!u) return null;
  const yt =
    u.match(/youtu\.be\/([\w-]{6,})/) ||
    u.match(/youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)([\w-]{6,})/);
  if (yt) return { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0` };
  const vm = u.match(/vimeo\.com\/(?:video\/|channels\/[\w-]+\/|groups\/[\w-]+\/videos\/)?(\d+)/);
  if (vm) return { type: "iframe", src: `https://player.vimeo.com/video/${vm[1]}` };
  if (/\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(u) || u.includes("/api/public/media/")) return { type: "file", src: u };
  return { type: "iframe", src: u };
}

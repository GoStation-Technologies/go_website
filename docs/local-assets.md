# Self-hosted fonts and core images

Fonts live in `public/fonts/` and core images in `public/images/`. Their URLs are
root-relative, so the browser fetches them from the same origin on Lovable or the
VPS. Lucide and social icons remain inline SVG source and need no CDN request.

The existing font families are preserved: IBM Plex Sans Arabic (400/500/600/700),
Manrope and Sora (400/500/600/700/800). Full glyph sets are bundled as WOFF2,
with `font-display: swap`; licenses accompany the files. The root head preloads
the primary Arabic regular/bold, English body regular and English heading bold.

Saved core page banners are mirrored locally through exact-source mappings in
`local-assets.ts`. New admin uploads are not overwritten by an old local snapshot.
News, report uploads, partner images, review avatars and live map tiles remain
dynamic and are intentionally not frozen into the repository.

## VPS deployment

Keep the existing Nitro build with `NITRO_PRESET=node-server`. Nitro copies the
Vite public directory into `.output/public/`, including `fonts/` and `images/`.
Deploy that directory alongside `.output/server/`; do not deploy only server files.
Nginx's static root should point at `/var/www/gostation/.output/public` and fall
back to the app proxy for application routes. Include standard MIME types so
WOFF2 responses use `font/woff2` and image responses use their image MIME types.

After the production build, check the static payload before restarting:

```sh
test -s .output/public/fonts/ibm-plex-sans-arabic-400.woff2
test -s .output/public/fonts/manrope-400.woff2
test -s .output/public/images/home-hero.jpg
test -s .output/public/images/gostation-brand-mark.png
```

After deployment, `/fonts/manrope-400.woff2` and `/images/home-hero.jpg` should
return binary files with HTTP 200, not the application's HTML fallback.
Use revalidation or short caching for stable filenames; do not apply year-long
immutable caching unless filenames are versioned when files change.

# GoStation Website + Admin — Final Plan

Single TanStack Start project. Public bilingual (AR/EN, RTL/LTR) marketing site + role-gated admin panel at `/admin`, sharing one Lovable Cloud (Postgres) backend. Auto-generated typed REST via PostgREST; custom TanStack server functions for webhooks, AI, and privileged ops. Brand direction inspired by gostation.net (white base, deep navy, orange accent).

## Tech stack

- **Framework:** TanStack Start (React 19, Vite 7, SSR on Cloudflare Workers)
- **UI:** Tailwind v4 + shadcn/ui, lucide-react, IBM Plex Sans Arabic + Inter
- **Data:** TanStack Query + Supabase JS client (typed); TanStack server functions for privileged/AI/webhook work
- **Backend:** Lovable Cloud (Postgres + Auth + Storage + Realtime + pg_cron)
- **i18n:** i18next + react-i18next, cookie-persisted, `dir="rtl"` toggled on `<html>`
- **Maps:** Leaflet + OSM now → swap to Google Maps in Phase 4 with your keys
- **Charts:** Recharts (ROI calculator, IR dashboard, admin analytics)
- **Rich text:** Tiptap (admin editor), react-markdown (public rendering)
- **AI:** Lovable AI Gateway (Gemini) via `@ai-sdk/react` streaming chat
- **Auth:** Supabase email/password + Google OAuth (admins only; public site needs no login)
- **RBAC:** `user_roles` table + `has_role()` SECURITY DEFINER function. Roles: `super_admin`, `bd`, `hr`, `media`, `ir`, `ops`, `support`
- **Exports:** exceljs + @react-pdf/renderer
- **Email:** Lovable Email in Phase 4 once sender domain verified

## Project structure

```text
src/routes/
├── __root.tsx                shared shell: nav, footer, chatbot, i18n, dark mode
├── index.tsx                 homepage
├── stations.tsx              interactive map
├── franchise.tsx             franchise + ROI + 3-step form
├── acquisition.tsx           acquisition + before/after slider + form
├── investors.tsx             IR: reports library + KPI dashboard + form
├── media/                    news & events grid + article detail
├── careers/                  job listings + detail + application
├── about/                    story, vision, leadership, awards, esg
├── loyalty.tsx, app.tsx, contact.tsx
├── auth.tsx                  admin sign-in
├── api/
│   ├── chat.ts               streaming AI chatbot
│   └── public/webhooks/aramco-prices.ts   HMAC-verified price webhook
└── _authenticated/admin/     ADMIN MODULE (role-gated, code-split)
    ├── route.tsx             sidebar layout + role gate
    ├── index.tsx             analytics overview (realtime)
    ├── franchise, acquisitions, stations, news, careers,
    │   pages, reports, tickets

src/modules/{public,admin,shared}/   feature code imported by routes
```

## Database (single migration, Phase 1)

Tables: `stations`, `system_cache` (fuel prices + google reviews snapshot), `news_articles`, `events`, `job_openings`, `job_applications`, `franchise_applications`, `acquisition_requests`, `financial_reports`, `report_downloads`, `ir_inquiries`, `contact_messages`, `support_tickets`, `chatbot_messages`, `leaders`, `awards`, `pages` (bilingual CMS blocks), `partner_offers`, `profiles`, `user_roles`, `application_status_history`, `page_views`.

Every table: GRANTs + `ENABLE RLS` + policies. Public tables get narrow `TO anon SELECT`; submission tables get `TO anon INSERT` on limited columns; admin tables gated by `has_role()`. Postgres function `generate_reference(prefix)` → `GS-FR-2026-00042`. Storage buckets: `franchise-docs`, `acquisition-photos`, `cv-uploads`, `financial-reports`, `news-media`, `station-photos`, `leader-photos`.

---

## Phase 1 — Foundation + Public Marketing Core

1. Enable Lovable Cloud; run migration (all tables + RLS + grants + seeds).
2. Design tokens (navy/orange, dark mode), i18n scaffold (AR/EN dictionaries + `dir` toggle), shared nav + footer + cookie banner + floating chatbot launcher.
3. **Homepage** — hero, live fuel-price ticker, animated stats, about snapshot, services grid, latest 3 news, Google-review carousel (seeded), Why GoStation.
4. **About** — Our Story (timeline), Vision/Mission/Values, Leadership grid, Awards, ESG (PDF download).
5. **Contact** — category-routed form, socials, map placeholder, IR link.
6. **Media Center** — grid + filters (News/Events/Upcoming/Past), article/event detail with slug + rich content + share + per-article SEO/OG.
7. SEO: per-route `head()`, `sitemap.xml`, `robots.txt`, JSON-LD Organization, hreflang.

## Phase 2 — Lead-Gen & Conversion Surfaces

8. **Stations Map** — Leaflet + OSM, geolocation, city search, fuel/service filters, station detail card with live prices + Open Now, "Get Directions".
9. **Franchise** — narrative, tiers, requirements, ROI calculator (Recharts), 3-step form with file uploads + email OTP + session draft + reference number + confirmation email.
10. **Acquisition** — hero, before/after slider, success stories, criteria, evaluation form with multi-image upload.
11. **Investor Relations** — filterable reports library (year/type + download tracking), KPI dashboard, IR inquiries form.
12. **Careers** — filterable listings, job detail, application form with CV upload.
13. **Loyalty + Mobile App landing** — CMS-driven, app-store CTAs, device mockups.

## Phase 3 — AI Chatbot + Admin Panel

14. **AI Chatbot** — floating widget, bilingual welcome + quick replies (Find Station, Prices, Complaint, General), FAQ knowledge base, live fuel/station lookup, complaint flow → `support_tickets` row + `GS-TKT-…` reference, human-agent handoff flag.
15. **Admin sign-in** (`/auth`) + `_authenticated/admin/*` layout with role-based sidebar.
16. **Admin modules** (each role sees only what they own):
    - Franchise applications (table, detail with map + doc downloads, status pipeline, notes, Excel/PDF export, auto-email on status change)
    - Acquisition requests (same shape, image gallery)
    - Stations CRUD (coordinates picker, hours, services, photos)
    - News & Events CMS (Tiptap bilingual, draft/publish, schedule, pin featured)
    - Careers manager (post vacancy, per-vacancy applicant pipeline, CV download)
    - Pages editor (bilingual About sub-pages)
    - Financial reports (PDF upload, year/type)
    - Support tickets queue (full chatbot transcript, status, notes)
    - Analytics home (visitors, submissions, top article, open tickets — Supabase Realtime, no polling)

## Phase 4 — Integrations, Polish & Launch

17. Swap Leaflet → Google Maps (`@vis.gl/react-google-maps`) once you share Maps JS + Places keys.
18. Real Aramco price feed → HMAC-verified webhook + pg_cron hourly.
19. Real Google Business Reviews → server function calling Business Profile API, cached in `system_cache`.
20. Lovable Email transactional templates (form receipts, status-change notifications, IR ticket receipts).
21. A11y, RTL, Lighthouse, dark-mode audits. Sitemap, robots, hreflang, LocalBusiness JSON-LD per station.
22. Publish + custom domain.

---

## Deferred (I'll seed clearly-marked placeholders you can edit from the CMS)

- Google Cloud keys (Maps JS, Places, Business Profile)
- Aramco feed URL/credentials
- Brand assets: logo SVG, hero photos/video, leadership photos, franchise station photos, before/after images, awards, ESG PDF
- Tier A/B/C figures, ROI coefficients, loyalty mechanics, per-department contact emails, social URLs
- Transactional email sender domain

---

## Execution

I'll build in order: **Phase 1 → 2 → 3 → 4**, pausing between phases only if I need input from you. Phase 1 starts as soon as you approve this plan.

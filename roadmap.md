# Company branding
- [x] Pair the supplied official mark with the full bilingual legal name in header, drawer, and footer.
- [x] Verify intact mark aspect ratio, loaded artwork, light/dark variants, and branding fit at 320–1920px in Arabic and English; no runtime errors.

# Investor inquiries
- [x] Repair submission and confirmation/reset for all inquiry fields (live inquiry GS-IR-2026-00031 saved all six fields).
- [x] Add investor inquiries to admin submissions with full details and status management; preserve IR/super-admin RLS restrictions.
- [ ] Verify authenticated admin list/status flow: blocked by missing requesting-user admin session; legacy login tests require OTP-aware setup.

# Customer reviews
- [x] Consolidate duplicate public review sections; existing CMS visibility and order controls remain authoritative.
- [x] Connect Google Maps.
- [x] List live Google Maps reviews in admin with per-review show/hide; only IDs stored.
- [x] Verify public display after consolidation: one customer-review section, three CMS cards, no legacy Google-review labels; build OK.

# Station visibility
- [x] Include all stations in public totals, maps and region filters.
- [x] Show gray inactive pins and bilingual source statuses.
- [x] Verify counts and status displays (224 listed; 214 mapped, with 10 lacking coordinates; status tests pass).
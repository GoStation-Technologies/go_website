# Investor statistics and reports
- [ ] Connect bilingual metric values and labels to investor CMS editing.
- [ ] Add annual PDF report management, publication and public view/download actions.
- [ ] Verify tests, public rendering and authenticated save/upload/readback when an admin session is available.

# Leasing submissions
- [x] Separate leasing requests from contact messages and preserve structured requirements and private documents; routing tests pass.
- [x] Display leasing metadata in the table and detail dialog; public submission with PDF confirmed as GS-MSG-2026-00040.
- [ ] Verify authenticated admin table/dialog and document download: requires admin sign-in in preview; requesting user has no matching app account.

# Leasing CMS
- [x] Add dedicated bilingual leasing editor and sidebar entry using the existing CMS.
- [x] Load banner and leasing guidelines dynamically with localized defaults; public page returns 200, images load, five tests pass and build OK.
- [ ] Verify authenticated upload/save/readback: requires the requesting user's admin sign-in in preview.

# Footer legal pages
- [x] Add bilingual privacy and terms pages and footer links; Arabic/English desktop and phone navigation verified with no runtime errors.
- [x] Add dedicated admin legal-page editing using the existing CMS and publication controls; 12 relevant tests pass and build OK.
- [ ] Publish approved legal text: awaiting company-provided Arabic and English policies.
- [ ] Verify authenticated editing/readback: requesting user has no matching admin account/session; requires admin sign-in in preview.

# Company branding
- [x] Verify Arabic header right alignment and unmirrored horizontal lockup at 320–1920px, both languages and light/dark surfaces; drawer checked, hydration test passed, no runtime errors.
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
# Cursor-effect removal
- [x] Remove hero cursor tracking, moving gradients, parallax and unused zoom animation; simplify header/home hover distortion.
- [x] Verify stable hero/header while moving the pointer; photo loads, no moving gradients or runtime errors, no phone overflow, build OK.

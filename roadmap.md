# Modular customer-service channels
- [ ] Add independent phone, WhatsApp and support-form settings in assistant controls; synchronize chat, footer and contact displays.
- [ ] Validate channel values, enforce disabled ticket submission, test optional-channel rules and verify public flows.

# Assistant knowledge and handover
- [x] Prioritize published bilingual FAQs; add admin persona, quick-action and escalation controls.
- [x] Add inline customer-service card, validated support form and transcript; expose tickets and status follow-up in admin, protected by existing support/super-admin RLS.
- [x] Test escalation rules and FAQ precedence (37 tests); verify Arabic public submission/readback GS-TKT-2026-00041 with five transcript messages, English offline FAQ/handover and mobile form without overflow; preview build OK.
- [ ] Verify authenticated settings save and ticket status readback: requesting user has no matching admin account; requires admin sign-in in preview.
- [x] WhatsApp remains optional and hidden until staff enable it and supply an approved value.

# Mobile homepage
- [x] Simplify mobile header, refine hero typography and paired CTAs, compact readiness badge, and clear chat bubble; checked Arabic/English at 320–1440px, drawer tools, language switch, chat opening and both CTA destinations. Homepage hydration/accessibility test passed and preview build is clean.

# Assistant fallback
- [x] Add deterministic bilingual station/service matching and general fallback, prevent paid provider fallback, protect credentials and abuse controls; 24 tests pass and live Arabic plus interrupted-network replies verified. Gemini key saved securely.
- [ ] Verify successful Gemini generation/free-tier eligibility: Google returned 402 RESOURCE_EXHAUSTED; owner must restore free-tier access. All 224 station service arrays are currently empty, so service/brand availability cannot be confirmed until staff record it.

# About Senior Management
- [x] Apply the image-204 circular-portrait and centered-statement reference to both homepage and Senior Management; verified desktop/mobile Arabic and English, loaded available portraits and no overflow or runtime errors. Homepage CEO official portrait remains awaiting upload as noted below.
- [x] Reorganize chairman and Salem Saleh Al-Nahdi CEO/Board Member statements into a balanced pair above the three requested executive profiles; restore original supplied CEO and deputy portraits and keep homepage unchanged.
- [x] Verify Arabic/English desktop and mobile display with all five official headshots loaded, no overflow or runtime errors, three grouping tests passing and clean build.

# Homepage leadership statements
- [x] Rebuild the single chairman pull-quote as two balanced cards (chairman, CEO) with portrait, name, role and full quote; side-by-side on desktop, stacked on phone, in Arabic and English.
- [x] Save the full approved statements in the CMS with Arabic versions, add CEO and section-heading editors, and verify 120 tests, clean build, no runtime errors or overflow.
- [ ] Upload the CEO's official portrait: no real photo exists in the database or CMS, so his card shows an initials placeholder until Admin → Homepage → CEO message gets one.

# Cursor-following glow removal
- [x] Delete every pointer-tracking layer site-wide: the accessibility reading-guide band (mousemove listener, its styles, labels and menu tile) plus the breathing glow orbs and hover scale/glow effects on contact, footer, franchise CTA, video cards and the chat bubble.
- [x] Verify with 120 tests, a clean build, and pixel diffs showing no change when the pointer moves on the homepage and contact hero; menu no longer offers the reading guide.

# Investor statistics and reports
- [x] Connect bilingual metric values, labels and units to investor CMS editing with loader-primed public reads.
- [x] Add annual PDF report management, year/type editing and publication; PDF endpoint checks publication and sets view/download headers.
- [x] Verify 11 tests, public metric rendering, unpublished report 404 and clean build.
- [ ] Verify authenticated save/upload/readback and actual PDF actions: requesting user has no matching app account; needs admin sign-in and an official PDF (existing reports are unpublished sample placeholders).

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

# Roadmap — QA fixes (ملاحظات الموقع 6-1)

## Station locator visibility
- [x] Preserve full-footprint total; public maps/lists share active/development filtering and green/amber markers. Live checks: 224 total, 175 visible stations (128 active + 47 development/construction/renovation), all 40 closed and nine other inactive records excluded; desktop/mobile and homepage verified.

## Email notifications
- [x] Switch transactional notifications to connected Resend, lock sender identity, prioritize visitor Reply-To and retain saved recipients/CC. Seventeen tests pass; a real application-helper franchise test was delivered, confirmed in Resend.
- [ ] Click-test admin save/test with a super-admin session: no requesting-user account matches; user must sign in to preview. Contact, acquisition and investor recipients remain empty and need admin configuration.
- [x] Prepare notify.gostation.sa managed sending and branded form template; authenticated preview renders and unauthenticated preview returns 401. Central dispatch now uses saved category routing, true CC, safe domain sender, full job details and signed attachment links; investor routing and save-before-test corrected. Provider supports one To plus four CC; no bulk recipient loop.
- [x] Replace the pending notify.gostation.sa sender with the user's verified gostation.sa Resend domain; real franchise test delivered from the locked sender to the saved recipient with true CC.
- [ ] Redeploy gostation.sa with the connected Resend credentials available server-side; external server access is unavailable here.

## Leadership hierarchy
- [x] Pair chairman and CEO in the featured Senior Management section above deputy → COO → CFO; immutable record IDs preserve slots after editable fields change. Seven tests pass; Arabic/English desktop/mobile verified with all portraits loaded and no overflow; build OK. Admin save/readback not exercised; existing saves preserve IDs and sort_order.

- [x] Add the missing email control directly to the Contact Us page editor, using the shared contact setting.

- [x] 1. News images cropping: object-contain on all news/event covers (home, media, archive, detail)
- [x] 2. About Us brief text width: hero max-w-3xl, story max-w-6xl mx-auto leading-relaxed
- [x] 3. Contact page fully CMS-editable: contact PageDef (hero/info/hq/channels/hours/form/map) + sidebar link + page wired to cms.field
- [x] 4. AI assistant: page_sections grounding added, bare "موظف"/"بشري"/"agent" etc. trigger handover card (verified live: no station match), persona enforced in prompt
- [x] 5. Job application fix: cvs bucket storage policies (public upload, staff read), signed URL via staff session, spinner; live test GS-JOB-2026-00043 with CV upload
- [x] 6. Duplicate job titles: uniqueSlug() auto-suffixes slugs (accountant-2…); titles free to repeat
- [x] 7. Map station labels: "GO1 - ضاحية الملك فهد" format, district with city fallback (verified live)
- [x] 8. Mock-data flash: no hardcoded fallback arrays exist; added skeleton loaders + refetchOnMount:"always" on stations/news queries

Open: admin Contact editor not click-tested (no admin account for requesting user in preview); AI answers still need a working Google key (402 on current key) — grounding code path ready.

## Direct Google reviews
- [x] Production fix: server-runtime key resolution, stored selected reviews first, no sample fallback, detailed errors; 15 review tests passed and build OK.
- [ ] Production deployment/Google validation: requires gostation.sa redeployment with a real runtime Google key and admin refresh/save of existing ID-only selections; server and Google behavior cannot be tested from the sandbox.
- [x] Remove proprietary token dependency from review fetching and listing search; resolve the three requested key fallbacks and preserve Google error details.
- [x] Keep review configuration reads/writes on standard public/authenticated clients without service-role requirements.
- [x] Verify local tests and build signals: 19 tests passed and build OK; Google-dependent live checks remain unverified and require user validation on an authorized deployed origin with a real Google key (not a connector token). Existing Places (New) review selections need reselection because legacy review IDs differ.

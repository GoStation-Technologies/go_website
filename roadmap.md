# Roadmap — QA fixes (ملاحظات الموقع 6-1)

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

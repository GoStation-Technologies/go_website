# Roadmap — QA fixes (ملاحظات الموقع 6-1)

- [ ] 1. News images cropping: responsive aspect ratio, no harsh fixed heights, object-cover object-center / contain
- [ ] 2. About Us brief text width: expand max-w to 5xl/6xl, leading-relaxed, mx-auto
- [ ] 3. Contact page fully CMS-editable (header, description, address, hours, email, response notes) AR+EN via admin
- [ ] 4. AI assistant: ground with public page content, obey admin persona, human/complaint → escalation card (no station search)
- [ ] 5. Careers job application submission fix: handler, CV upload bucket perms, job_applications anon INSERT RLS, spinner/toast/success modal with reference
- [ ] 6. Allow duplicate job titles: drop UNIQUE on title, rely on UUID id
- [ ] 7. Map station labels: "[Code] - [District]" format, fallback to city
- [ ] 8. Remove mock-data flash: no hardcoded fallback arrays, skeleton loaders, proper cache invalidation

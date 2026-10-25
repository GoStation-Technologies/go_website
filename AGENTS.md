<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Public marketing links are stored in `site_settings` so Admin Settings remains the single editable source of truth.
- Investor inquiry form and server validation share one schema; admin submission mappings include the same `ir_inquiries` table so public submissions and staff management stay aligned.
- Investor metrics use bilingual `page_sections` records; annual PDFs use `financial_reports`, RLS-controlled admin management and loader-primed public reads, so edits and publication have one source of truth. Uploaded reports store relative CMS paths; the public report endpoint checks publication and sets inline/attachment headers for portable PDF actions.
- Render public customer testimonials through the shared CMS-driven Testimonials component, never a parallel system-cache grid, so publication controls govern every displayed review.
- Public station queries include every station under SELECT-only RLS; shared labels preserve source operational states so inactive stations are not advertised as open.
- Header, mobile drawer, and footer share CompanyLogo with paired source-mark variants and surface-aware styling; the lockup inherits interface direction while each text line preserves its own language direction, so RTL places the unmirrored mark on the right without distorting artwork.
- Legal pages store a bilingual `document` section in the existing `page_sections` CMS and reuse its admin editor; public SSR reads only visible documents and never substitutes another language's legal text.
- Leasing content uses the existing `page_sections` CMS and dedicated page editor, with loader-primed public reads and localized defaults, so copy and imagery have one editable source of truth.
- Leasing submissions use contact_messages category isolation and structured leasing_metadata; documents stay in private leasing-documents storage with staff RLS access, so requirements are language-independent and never publicly exposed.
- About Senior Management uses the existing leaders records for identities, portraits and role descriptions, grouped by role into a statement pair and executive grid; About statement overrides live in its own page_sections so homepage identities and messages remain independent.
- Homepage and About leadership statements share LeadershipStatement and StatementPair for consistent presentation; executive profiles remain separate so statement styling does not change team cards.

- No surface may track the pointer: components must not attach mousemove/pointermove listeners or write pointer-derived CSS variables, so cursor movement never changes any section's lighting or geometry. HeroBackdrop is a static image with a fixed navy veil, and the accessibility menu has no reading-guide band.

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
- Render public customer testimonials through the shared CMS-driven Testimonials component, never a parallel system-cache grid, so publication controls govern every displayed review.
- Public station queries include every station under SELECT-only RLS; shared labels preserve source operational states so inactive stations are not advertised as open.
- Header, mobile drawer, and footer share CompanyLogo with paired source-mark variants and surface-aware styling; the lockup inherits interface direction while each text line preserves its own language direction, so RTL places the unmirrored mark on the right without distorting artwork.
- Legal pages store a bilingual `document` section in the existing `page_sections` CMS and reuse its admin editor; public SSR reads only visible documents and never substitutes another language's legal text.
- Leasing content uses the existing `page_sections` CMS and dedicated page editor, with loader-primed public reads and localized defaults, so copy and imagery have one editable source of truth.
- Leasing submissions use contact_messages category isolation and structured leasing_metadata; documents stay in private leasing-documents storage with staff RLS access, so requirements are language-independent and never publicly exposed.

- HeroBackdrop is a static image with a fixed navy veil and no pointer/scroll listeners or motion variables, so pointer movement cannot change the hero lighting or geometry.

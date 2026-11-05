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
- The Contact page editor edits email through the existing contact site setting, preserving other contact fields, so it stays synchronized with Site Settings and public contact displays.
- Investor inquiry form and server validation share one schema; admin submission mappings include the same `ir_inquiries` table so public submissions and staff management stay aligned.
- Investor metrics use bilingual `page_sections` records; annual PDFs use `financial_reports`, RLS-controlled admin management and loader-primed public reads, so edits and publication have one source of truth. Uploaded reports store relative CMS paths; the public report endpoint checks publication and sets inline/attachment headers for portable PDF actions.
- Render public customer testimonials through the shared CMS-driven Testimonials component, never a parallel system-cache grid, so publication controls govern every displayed review.
- Public station queries include every station under SELECT-only RLS; shared labels preserve source operational states so inactive stations are not advertised as open.
- Header, mobile drawer, and footer share CompanyLogo with paired source-mark variants and surface-aware styling; the lockup inherits interface direction while each text line preserves its own language direction, so RTL places the unmirrored mark on the right without distorting artwork.
- Mobile header uses a constrained two-track grid with auxiliary controls relocated to the drawer; homepage image-content height uses stable small-viewport units separately from the stats strip, so mobile browser chrome and dynamic content cannot force a clipped fixed-height hero.
- Legal pages store a bilingual `document` section in the existing `page_sections` CMS and reuse its admin editor; public SSR reads only visible documents and never substitutes another language's legal text.
- Leasing content uses the existing `page_sections` CMS and dedicated page editor, with loader-primed public reads and localized defaults, so copy and imagery have one editable source of truth.
- Leasing submissions use contact_messages category isolation and structured leasing_metadata; documents stay in private leasing-documents storage with staff RLS access, so requirements are language-independent and never publicly exposed.
- About Senior Management uses existing leaders and explicit sort_order queries with a shared identity/role hierarchy fallback; chairman is separate from the CEO-first executive grid, so title edits never change seniority. About statement overrides remain in page_sections independently of homepage messages.
- Homepage and About reuse LeadershipStatement, with StatementPair retained on the homepage; About executive profiles remain separate so statement styling does not change team cards.

- No surface may track the pointer: components must not attach mousemove/pointermove listeners or write pointer-derived CSS variables, so cursor movement never changes any section's lighting or geometry. HeroBackdrop is a static image with a fixed navy veil, and the accessibility menu has no reading-guide band.
- Chat uses direct Google calls only when a private Gemini key exists, with no paid provider chain; published FAQ matching precedes generation and recoverable failures use deterministic local knowledge plus human handover, while access denials/refusals and abuse protection remain terminal. Pure policy and provider helpers carry deterministic tests.
- Assistant controls use site_settings.ai_agent with RLS-managed writes; its channels object is the sole phone/WhatsApp/support-form source for chat, footer and contact. Public configuration projects safe resolved channels, quick actions and published FAQs only, keeping prompts private; absent configuration disables channels. Support handovers reuse support_tickets with staff-only transcripts, and submission checks the current form toggle server-side.
- Assistant action rules share a pure policy module and live in site_settings.ai_agent.actions; complaint/human and second-miss decisions precede generation. Private server-issued handover events bind ticket priority to a validated complaint outcome, never client tags or transcripts; unresolved_questions uses support/super-admin RLS and server-only inserts so visitor queries remain staff-only.

- Google reviews resolve secrets inside server handlers and call Places (New) directly on standalone hosts; the existing relay is restricted to recognized Lovable hosts. Admin selections persist bounded dated snapshots in site_settings.google_reviews through authenticated CMS RLS; public reads prefer selected snapshots and never display static sample reviews, so Google failures cannot replace publication choices. Expired snapshots require a fresh fetch/admin refresh.
- Preserve each Google review's own googleMapsUri through parsing, stored snapshots and Testimonials; render only valid HTTPS external actions, so missing review URLs never become misleading station links.
- Public form attachments (CVs, leasing documents) upload from the browser straight to private buckets under strict path policies, and server functions receive only validated paths, so proxy body-size limits never break submissions. Public form schemas live in client-safe modules shared by the form and its server function, so inline field errors and server checks never disagree.

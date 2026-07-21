## Goal

Complete Phase 4 of the GoStation build:

1. **AI Chatbot** — bilingual (AR/EN) support assistant powered by Lovable AI Gateway (Gemini), grounded in site content (stations, news, careers).
2. **Admin Dashboard** — role-gated back-office to manage stations, news articles, careers, and to review submissions (franchise, acquisitions, contact, chat transcripts).

Phase 3 form routes (franchise, acquisitions, careers apply, investors, contact) already exist and persist to the DB — this phase adds the tooling to review and manage them.

## Approach

### Part A — AI Chatbot

- Floating chat widget (`ChatWidget`) mounted globally in `SiteLayout`, visible on every page.
- Server function `sendChatMessage` (`createServerFn`, public, rate-limited by IP+session) calls Lovable AI Gateway (`google/gemini-2.5-flash`) with:
  - System prompt in the user's language (AR/EN) describing GoStation scope and guardrails.
  - Retrieval context: top matching stations/news pulled from Supabase by simple keyword match (no embeddings needed for MVP).
  - Streaming disabled for MVP; return final message JSON.
- Persist transcripts to `chat_conversations` + `chat_messages` for admin review.
- Handle 429/402 from the gateway with friendly toast messages.

### Part B — Admin Dashboard

- New pathless layout `src/routes/_admin.tsx` gated by `has_role(auth.uid(),'admin')`; non-admins redirected to `/auth`.
- Sidebar shell with sections:
  - **Overview** — counts (stations, pending applications, unread contacts, chats/24h).
  - **Stations** — list/create/edit (bilingual fields, coordinates, fuel prices).
  - **News** — list/create/edit bilingual articles, publish toggle.
  - **Careers** — list/create/edit job postings; view applications.
  - **Submissions** — tabs for Franchise, Acquisitions, Contact; status workflow (new → reviewing → closed).
  - **Chat Logs** — recent conversations, expand to view messages.
- All mutations via `createServerFn` with `requireSupabaseAuth` middleware; admin check via `context.supabase` querying `user_roles` (never `supabaseAdmin` for authorization).
- Reuse shadcn `Table`, `Dialog`, `Tabs`, `Badge`.

### Part C — Database additions

Single migration adds:

- `chat_conversations` (id, session_id, user_id nullable, lang, started_at, last_message_at)
- `chat_messages` (id, conversation_id, role enum(user|assistant|system), content, created_at)
- Status columns on `franchise_applications`, `acquisitions_submissions`, `contact_messages` if missing (`status` enum, `reviewed_by`, `reviewed_at`).
- GRANTs + RLS: chatbot tables writable by `anon`+`authenticated` (insert only for their session), readable only by admins. Submission status updates admin-only.

### Part D — Wiring

- Add `ChatWidget` to `SiteLayout`.
- Add `/admin` link in `SiteHeader` visible only when `has_role` returns true (client check via server function).
- Head metadata + i18n strings for all new pages.

## Steps

1. Migration: chat tables + status columns + GRANTs + RLS.
2. Server fns: `sendChatMessage` (public), `adminListSubmissions`, `adminUpdateStatus`, `adminCrudStation`, `adminCrudNews`, `adminCrudJob`, `adminListChats`, `checkIsAdmin`.
3. `ChatWidget` component + translations.
4. `_admin` layout with role gate + sidebar.
5. Admin pages: overview, stations, news, careers, submissions, chats.
6. Header: conditional admin link.
7. i18n additions (AR/EN) for chatbot + admin.
8. E2E: extend hydration/browser test suite with a chatbot smoke (opens widget, sends message, asserts response renders).
9. `bun run build` + full test suite green.

## Technical notes

- Lovable AI Gateway: `LOVABLE_API_KEY` (auto-provisioned); endpoint `https://ai.gateway.lovable.dev/v1/chat/completions`; default model `google/gemini-2.5-flash` (free during promo). Handle 429 (rate limit) and 402 (credits) explicitly.
- Server fns live in `src/lib/*.functions.ts` per template rules; admin fns use `requireSupabaseAuth` middleware and verify role via `context.supabase` before any privileged action.
- Retrieval: `ilike` match on station city/news title for MVP — no vector search yet.
- Admin auth: gate at layout, not per-page; loader safe under `_authenticated`-style pattern (`_admin` route uses `beforeLoad` to redirect on missing role).
- SSR: chatbot widget rendered client-only (`<ClientOnly>`) to avoid hydrating an open panel state.
- Chat rate limit: per session_id, max 20 msgs / 10 min, enforced in server fn via a simple query.

## Out of scope (deferred)

- Vector embeddings / semantic retrieval.
- Streaming chat responses.
- Bulk CSV import/export in admin.
- Investor Relations financial data upload (Phase 4.5).
- Advanced analytics dashboards (charts beyond simple counts).
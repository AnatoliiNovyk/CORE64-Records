# 2026-08-01 — Audit Phase 0 + Phase 1: repository hygiene and contact-form hardening

## Phase 0 — repository hygiene

- **`.gitignore`**: added `.env`, `.env.*` with a `!.env.example` exception. The
  repository is public and `.env` was untracked but *not* ignored, so any
  `git add .` would have committed live credentials.
- **`.env.example`**: replaced the real project URL and anon key with
  placeholders plus a short comment on where to get them.
- **`.env.local`**: deleted. It held byte-identical values to `.env` (same
  project ref, same key) and only created ambiguity, since Vite gives
  `.env.local` priority.
- **`public/`**: removed four unused images — `image.png`, `image copy.png`,
  `image copy copy.png` and `files_6809630-…-image.png` (~225 KB, three of them
  identical duplicates). None were referenced from `src/` or `index.html`.
  `hero-bg.webp` (1.08 MB) and `core64-logo.webp` are also currently unreferenced
  but were kept — they are brand assets and are earmarked for the favicon and
  `og:image` work.

## Phase 1 — security

### Contact form no longer bypasses its own protections

Previously `contact.tsx` fell back to a direct client-side INSERT whenever the
`submit-contact` edge function returned anything other than `200` or a
reCAPTCHA error. A `429 rate_limited` response therefore *guaranteed* the
message was written anyway, and any client could skip the edge function
entirely by POSTing to PostgREST.

- `contact.tsx`: the fallback insert is gone. The edge function is the only
  write path. A `429` / `rate_limited` response now surfaces a dedicated
  message; other failures show the generic error.
- `use-data.ts`: `useSubmitContact()` removed (it was the fallback's vehicle).
- **New migration** `20260801160000_harden_contact_messages.sql`:
  - drops the `public_insert_contact_messages` RLS policy, so `anon` and
    `authenticated` can no longer write to `contact_messages`; the edge
    function is unaffected because it uses the service role;
  - adds `CHECK` constraints mirroring the edge function's limits (name ≤ 100,
    email ≤ 254, subject ≤ 200, message ≤ 5000, non-empty). Added `NOT VALID`
    so legacy rows are untouched while new writes are enforced.

### Admin check no longer guesses

`auth.tsx` `checkIsAdmin()` fell through to `email.includes('admin') ||
user.id.includes('admin')` whenever the `is_admin()` RPC returned anything
other than `true` — including a legitimate `false`. RLS meant no data was
exposed, but the admin UI opened for anyone with a matching email. The function
now returns `false` on error, on crash, and on any non-`true` result.

### Missing configuration is no longer silently successful

`supabase.ts`'s fallback client returned `{ error: null }` for every operation,
so with a broken `.env` the admin panel reported "saved" without saving.

- Every fallback operation now resolves with an `Error`, so React Query surfaces
  it and mutations reject.
- A `console.error` fires at module load.
- `App.tsx` renders a sticky banner when `hasSupabaseConfig` is false, with
  `config.title` / `config.body` strings added to both locales.

## Verification

- `tsc --noEmit`: clean.
- `vite build`: succeeds; `dist` is 2.4 MB (down from 2.7 MB).
- Landing page and `/admin` → `/admin/login` redirect verified in the browser
  with no console errors.
- Missing-config path verified by running the dev server with empty Supabase
  env vars: banner renders and the console error fires.

## Production status — applied and verified

The migration has been applied to the live project (`lctbdjrmxqvmtylaxdof`) and
recorded in the migration history via `supabase migration repair`.

State before, read straight from the database:

- `public_insert_contact_messages | INSERT | {anon,authenticated}` — the direct
  write path was live in production.
- No CHECK constraints on `contact_messages`.

State after:

- INSERT policy gone; only `SELECT` / `UPDATE` / `DELETE` for `authenticated`
  remain.
- All four length constraints present (`NOT VALID`, as designed).
- An anonymous `POST /rest/v1/contact_messages` with the public anon key now
  returns `HTTP 401` / `42501 new row violates row-level security policy`. No
  row is written.

### Migration history is incomplete — do not run `supabase db push`

`supabase_migrations.schema_migrations` contains only 4 of the 12 migration
files: `20260801013535`, `20260801013705`, `20260801101813` and the new
`20260801160000`. The eight older migrations (`20260625030913` through
`20260705054625`) were applied outside the CLI and are not recorded.

`db push` would therefore try to replay those eight against the already-rebuilt
schema. Use `supabase db query --linked -f <file>` for targeted changes, followed
by `supabase migration repair --status applied <version>`, until the history is
backfilled.

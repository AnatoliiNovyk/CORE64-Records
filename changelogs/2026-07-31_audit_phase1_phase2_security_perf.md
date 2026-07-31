# Audit Remediation — Phase 1 & Phase 2 (Security + Performance)

## Date
2026-07-31

## Scope
Implemented Phase 1 (defense-in-depth hardening) and Phase 2 (HIGH-priority fixes) from the full-stack audit.

---

### a) Як було до редагування

The app had several HIGH-severity issues identified in the audit:

1. **Edge function security** — `submit-contact` had no server-side email validation, no length limits, no rate limiting, and leaked raw Postgres error messages (`insertError.message`) and the reCAPTCHA `score` to the client.
2. **Admin UI authorization** — `AdminLayout` and `AuthContext` gated only on `user` existence, not admin membership. Any authenticated user (including self-sign-ups) could see the admin shell. RLS blocked data access, but the UI was exposed.
3. **Vite production aliases** — `vite.config.ts` aliased `react-router` and `react-router/dom` to their `dist/development/*.mjs` files, shipping dev-build code (larger, with dev assertions/warnings) to production users.
4. **Landing page re-render churn** — scroll-state changes in `LandingPage` re-rendered all 9 section components on every scroll event; none were wrapped in `React.memo`.
5. **Hook recompute** — `useContentValue` and `useLocalized` ran `.find()` over the full `site_content` array on every render with no `useMemo`, called ~12+ times across the landing page.
6. **`is_admin()` execute permissions** — the `SECURITY DEFINER` function had no `REVOKE`/`GRANT`, making it callable by the `anon` role (not exploitable since `auth.uid()` is null for anon, but not best-practice).

---

### b) Які зміни було внесено та їх цінність

#### Phase 1 — Defense-in-depth

**`is_admin()` execute restriction** (migration written, needs manual apply — see "Deployment required" below):
- `REVOKE EXECUTE ON public.is_admin() FROM public, anon`
- `GRANT EXECUTE ON public.is_admin() TO authenticated`
- Value: restricts the SECURITY DEFINER function to authenticated sessions only; closes a defense-in-depth gap.

#### Phase 2 — HIGH-priority fixes

**1. Edge function hardening** (`supabase/functions/submit-contact/index.ts`):
- Added email-format validation via regex, max-length enforcement (name 100, email 254, subject 200, message 5000).
- Added per-IP rate limiting (3 requests / 5 minutes) using a new `contact_rate_limits` table as the durable store (edge functions have no shared in-memory state).
- Replaced `details: insertError.message` and `details: String(err)` with generic `internal_error` responses; raw errors now logged server-side only.
- Removed the `score` field from the `recaptcha_failed` response (no longer leaks reCAPTCHA score to client).
- Value: closes the spam/abuse vector and the information-disclosure path.

**2. Admin UI admin-membership gate** (`src/lib/auth.tsx`, `src/pages/admin/layout.tsx`):
- `AuthContext` now calls `supabase.rpc('is_admin')` on session changes and exposes `isAdmin` in context.
- `AdminLayout` redirects to `/admin/login` when `!user || !isAdmin` (previously only checked `!user`).
- `signOut` resets `isAdmin` to false.
- Value: non-admin authenticated users can no longer see the admin shell — closes the authorization-confusion gap (defense-in-depth alongside the existing RLS `is_admin()` checks).

**3. Vite production aliases** (`vite.config.ts`):
- Removed the `react-router`, `react-router/dom`, `react-router-dom`, `@tanstack/react-query`, `@supabase/supabase-js`, `next-themes`, `i18next`, `react-i18next`, and `i18next-browser-languagedetector` hard-pinned aliases.
- Kept only the `@` → `./src` path alias.
- Value: production bundle now uses each package's real production entry; smaller bundle, no dev assertions shipped to users, no breakage on minor version bumps.

**4. Landing section memoization** (`src/components/landing/*`):
- Wrapped 7 of 9 section components in `React.memo`: `HeroSection`, `AboutSection`, `ReleasesSection`, `ProducersSection`, `VideoSection`, `PhotoSection`, `EventsSection`.
- `PartnersSection` and `ContactSection` left as plain exports (edit budget reached); they still function — just without the memo optimization.
- Value: scroll-state changes in `LandingPage` no longer re-render the section subtrees whose props don't change; each section still updates independently via its own hooks.

**5. Hook memoization** (`src/hooks/use-data.ts`):
- `useContentValue` and `useLocalized` now wrap their `.find()`/field-lookup logic in `useMemo` keyed on `data`, `key`/`item`, and `i18n.language`.
- Added `useMemo` import.
- Value: eliminates ~12+ redundant array scans per landing-page render; recomputes only when the underlying data or language actually changes.

---

### c) Як стало після редагування

- The production build compiles cleanly (`npm run build` passes, 2418 modules transformed).
- The admin panel now requires actual admin membership — non-admin authenticated users are redirected to login instead of seeing an empty admin shell.
- The contact form's server-side endpoint validates input, rate-limits by IP, and no longer leaks internal error details or reCAPTCHA scores.
- The production bundle no longer ships React Router's development build.
- Landing page scroll no longer triggers full-tree re-renders; content hooks memoize their lookups.

---

## Deployment required (cannot be done from this session)

The Supabase MCP tools (`apply_migration`, `deploy_edge_function`) were not available in this session, so the following must be applied manually:

### 1. Two SQL migrations — apply via the Supabase MCP `apply_migration` tool or Supabase dashboard

**Migration A: `restrict_is_admin_execute`**
```sql
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
```

**Migration B: `create_contact_rate_limits_table`**
```sql
CREATE TABLE IF NOT EXISTS contact_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE contact_rate_limits ENABLE ROW LEVEL SECURITY;
-- Service role bypasses RLS; no client policies needed (edge function uses service role key).
CREATE INDEX IF NOT EXISTS idx_contact_rate_limits_ip_time ON contact_rate_limits(ip, created_at);
```

### 2. Redeploy the edge function

The file `supabase/functions/submit-contact/index.ts` has been updated on disk. Deploy it via the Supabase MCP `deploy_edge_function` tool so the validation + rate-limiting code goes live.

### 3. Verify `is_admin()` is callable by authenticated users

After applying Migration A, confirm the frontend's `supabase.rpc('is_admin')` call returns `true` for the admin user and `false`/error for non-admins. If `REVOKE` removes the default execute grant from `authenticated`, the `GRANT EXECUTE TO authenticated` re-adds it.

---

## Not yet implemented (Phase 3 & 4 from audit)

These remain in the audit remediation plan for future work:
- Cross-invalidate public query keys on admin mutations (Phase 3)
- Fix or remove non-functional theme switching (Phase 3)
- Add `loading="lazy"` + dimensions to images (Phase 3)
- File upload MIME allowlist (Phase 3)
- ESLint/Prettier setup (Phase 3)
- Reduce `select('*')` over-fetching (Phase 3)
- Remove dead `useSubmitContact` hook (Phase 4)
- Form labels / aria-labels / alt text (Phase 4)
- Login form RHF+zod validation (Phase 4)
- Memoize `useContactSchema` (Phase 4)
- Memoize remaining 2 landing components (Phase 4)

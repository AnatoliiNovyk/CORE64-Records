# CORE64 Records

Website and admin panel for CORE64 Records — a Neurofunk, DnB, Breakbeat, Dub,
Techstep and Hard Techno record label.

A single-page React app with a public landing page and a password-protected admin
panel for managing releases, producers, videos, photos, events, partners and
incoming contact messages. Content is bilingual (Ukrainian and English).

## Stack

| | |
|---|---|
| Build | Vite 7, TypeScript 5.9 (strict, project references) |
| UI | React 19, Tailwind CSS 4, shadcn-style primitives on Radix |
| Data | Supabase (self-hosted) via `@supabase/supabase-js`, TanStack Query |
| Forms | react-hook-form + zod |
| i18n | i18next, `uk` and `en`, `uk` as fallback |
| Tests | Vitest |

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the two values
npm run dev
```

The app runs at `http://localhost:5173`. Without valid Supabase credentials it
still starts, but shows a configuration banner instead of pretending to work.

### Environment

Only two variables, both from Supabase → Project Settings → API:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Vite inlines every `VITE_*` variable into the client bundle at build time, so
**only publishable values belong there**. A secret placed in `.env` ships to
every visitor. `.env` is gitignored; `.env.example` holds placeholders.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | dev server with HMR |
| `npm run build` | type-check, then production build into `dist/` |
| `npm run typecheck` | `tsc -b` across both tsconfig projects |
| `npm run lint` | ESLint (flat config) |
| `npm test` | Vitest suite |
| `npm run preview` | serve the production build locally |

CI runs lint → typecheck → test → build on every push and pull request
(`.github/workflows/ci.yml`).

## Layout

```
src/
  components/
    landing/    public page sections (hero, releases, producers, …)
    admin/      admin-only form widgets
    player/     audio player bar and visualiser
    ui/         shadcn primitives
  pages/
    landing.tsx public page composition
    admin/      dashboard, releases, producers, videos, photos,
                events, partners, messages, settings, login
  hooks/        use-data.ts (all queries and mutations), use-file-upload.ts
  lib/          supabase client, auth context, player state
  locales/      uk/ and en/ translation files
supabase/
  migrations/   database schema and RLS policies
  functions/    submit-contact edge function
  deploy-vps.sh applies migrations and functions to the self-hosted stack
changelogs/     one file per change, newest last
```

Conventions for working in this repository are in [AGENTS.md](AGENTS.md): use the
shared hooks in `src/hooks/use-data.ts` rather than ad-hoc Supabase calls, keep
user-facing strings in `src/locales`, and avoid `any`.

## Admin panel

Reachable at `/admin`. Access is gated by the `is_admin()` database function,
which checks membership in the `admin_users` table — being logged in is not
enough. Every write policy in the schema keys off the same function.

The contact form posts to the `submit-contact` edge function, which owns rate
limiting (3 submissions per IP per 5 minutes), reCAPTCHA verification and field
length limits. There is deliberately no client-side fallback that writes to the
database directly: such a fallback would bypass all three.

## Deployment

Built as a Docker image (`Dockerfile`): Node 22 builds the app, nginx serves
`dist/` with an SPA fallback so `/admin` survives a page refresh. Supabase
variables are passed as build arguments — they are baked into the bundle, not
read at runtime.

Database and edge function changes go out with `supabase/deploy-vps.sh`, run on
the server. It is idempotent and prints a verification summary.

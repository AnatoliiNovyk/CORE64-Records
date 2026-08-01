# AGENTS.md

## Project overview
- This repository is a Vite + React 19 + TypeScript app for CORE64 Records.
- The main app shell is in [src/App.tsx](src/App.tsx) and bootstrapping happens in [src/main.tsx](src/main.tsx).
- Use the alias import style from [tsconfig.app.json](tsconfig.app.json) with `@/*` for source imports.

## Working conventions
- Keep UI components in [src/components](src/components) and page-level composition in [src/pages](src/pages).
- Prefer existing data hooks in [src/hooks/use-data.ts](src/hooks/use-data.ts) and the Supabase client in [src/lib/supabase.ts](src/lib/supabase.ts) instead of introducing ad-hoc fetch logic.
- Follow the existing React Query pattern: define hooks for reads and mutations, then invalidate related queries after writes.
- The app is multilingual. Use the existing i18n setup in [src/i18n.ts](src/i18n.ts) and translation files in [src/locales](src/locales); avoid hardcoding visible user-facing strings when possible.
- Admin features live under [src/pages/admin](src/pages/admin) and are lazily routed from [src/App.tsx](src/App.tsx).
- Keep changes aligned with the existing Tailwind-based styling and shadcn-style UI primitives under [src/components/ui](src/components/ui).

## Commands
- Install dependencies: `npm install`
- Start the dev server: `npm run dev`
- Type-check: `npm run typecheck`
- Build for production: `npm run build`

## Environment and gotchas
- Supabase configuration is expected via `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- The project uses strict TypeScript, so keep types explicit and avoid `any`.

## Documentation
- Start with [README.md](README.md) for high-level context and use the changelog notes in [changelogs](changelogs) for recent product decisions and fixes.

# Copilot instructions

## Scope
- Focus on the CORE64 Records web app in this repository.
- Prefer the existing patterns in the app over introducing new abstractions.

## Architecture and conventions
- Keep UI in [src/components](src/components) and route-level composition in [src/pages](src/pages).
- Use the shared data hooks in [src/hooks/use-data.ts](src/hooks/use-data.ts) and the Supabase client in [src/lib/supabase.ts](src/lib/supabase.ts) instead of creating ad-hoc fetch logic.
- Follow the established React Query flow: read data with hooks, mutate through hooks, and invalidate related queries after writes.
- Keep admin functionality under [src/pages/admin](src/pages/admin) and route it through [src/App.tsx](src/App.tsx).
- Use the existing localization approach from [src/i18n.ts](src/i18n.ts) and the translation files in [src/locales](src/locales); avoid introducing hardcoded visible strings.
- Preserve the Tailwind-based styling and shadcn-style UI primitives under [src/components/ui](src/components/ui).

## Admin and data-layer guidance
- For admin screens, prefer shared hooks such as `useSiteContent`, `useAdminReleases`, `useAdminProducers`, and `useUpsertMutation` rather than writing direct Supabase calls in components.
- When editing content that can be localized, keep both the base field and the localized field behavior consistent with the existing admin patterns.
- When adding or changing a data entity, update the relevant TypeScript interface in [src/types/database.ts](src/types/database.ts) and the matching UI/data hooks.
- For upload-related changes, reuse the existing upload hook in [src/hooks/use-file-upload.ts](src/hooks/use-file-upload.ts) and keep the upload flow consistent with the current admin pages.

## Commands
- Install dependencies: `npm install`
- Start the dev server: `npm run dev`
- Type-check: `npm run typecheck`
- Build for production: `npm run build`

## Environment
- Supabase configuration is expected via `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- The project uses strict TypeScript, so keep types explicit and avoid `any`.

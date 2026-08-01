# 2026-08-01 — Audit Phase 2: linting, tests and CI

The project had no linter, no tests and no CI. Every release depended on a manual
check. This adds all three and fixes a type-checking gap found along the way.

## ESLint

- `eslint.config.js` — flat config on ESLint 10 with `typescript-eslint`,
  `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`.
- `dist`, `node_modules` and `supabase/functions` are ignored; the edge functions
  are Deno code with `npm:` / `jsr:` specifiers this config does not model.
- `react-refresh/only-export-components` is disabled for `src/components/ui/**`:
  shadcn primitives are generated and deliberately co-export variants next to
  components, so the rule is pure noise there.
- `@typescript-eslint/no-explicit-any` is an error, matching the "avoid `any`"
  rule in AGENTS.md.

First run found 1 error and 12 warnings. The error (`prefer-const` in
`audio-visualizer.tsx`) was auto-fixed. Current state: **0 errors, 3 warnings**,
all fast-refresh hints in application code.

## Tests

Vitest with `vitest.config.ts` (node environment, `@` alias, `src/**/*.test.ts`).
21 tests across three files:

- `src/lib/player.test.ts` — queue navigation: advancing, `repeat: 'off'`
  returning `-1` at the end, `repeat: 'all'` wrapping, empty track lists, shuffle
  never selecting the current track (100 iterations), and the single-track case
  where the shuffle loop would otherwise never terminate.
- `src/hooks/use-file-upload.test.ts` — `extractPath` against public storage
  URLs, nested folders, other buckets, unrelated URLs and the empty string.
- `src/hooks/use-data.test.ts` — `getLocalizedField` translation lookup and its
  fallbacks.

### Supporting refactor

`pickNextIndex` / `pickPrevIndex` were module-private in `player.tsx`. Rather
than export them from a file full of React context (which also tripped the
fast-refresh rule), the pure queue logic moved to **`src/lib/player-queue.ts`**
with a narrow `QueueState` type. `player.tsx` imports them and re-exports
`RepeatMode` so its public surface is unchanged. Tests now import no React at
all. `extractPath` in `use-file-upload.ts` is now exported.

## CI

`.github/workflows/ci.yml` — on push and PR to `main`: install → lint →
typecheck → test → build. Build runs last because it is the slowest step.
Supabase env vars are deliberately absent on CI; the app surfaces its
configuration banner rather than pretending to work.

## Fixes found while wiring this up

- **`npm run typecheck` was a no-op.** `tsconfig.json` is solution-style
  (`"files": []` plus `references`), so `tsc --noEmit` checked nothing at all —
  it exited 0 on code that `tsc -b` rejects. The script is now `tsc -b`; both
  referenced configs already set `noEmit`. This is why the type errors in the new
  test files only appeared during `npm run build`.
- `tsconfig.node.json` now includes `vitest.config.ts`, which was otherwise
  unchecked.
- `npm audit fix` applied the compatible fixes (esbuild/vite advisories).

## Deferred with reason

`npm audit` still reports one high-severity advisory: **react-router
GHSA-qwww-vcr4-c8h2**, an RSC-mode CSRF bypass. The fix requires a major upgrade
(`npm audit fix --force`). This app is a Vite SPA using `BrowserRouter` with no
RSC, so the advisory does not apply to it. Left alone rather than forcing a
breaking router upgrade that would need its own migration and testing.

## Verification

`npm run lint` (0 errors), `npm run typecheck` (clean, and now genuinely
checking), `npm test` (21 passed), `npm run build` (succeeds). Landing page
reloaded in the browser after the player refactor with no console errors.

End-to-end playback was **not** exercised: the only release in the database has
0 tracks and 0 audio files, so the play control does not render. The queue logic
is covered by unit tests instead.

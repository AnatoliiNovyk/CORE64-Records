# 2026-09-05 — Phase 3: dead code, code splitting, SEO

The last outstanding phase from the 2026-08-01 audit.

## Removed unused UI and dependencies

30 of the 56 shadcn primitives under `src/components/ui/` were never imported
anywhere. Deleted, along with the five dependencies that existed only to serve
them: `recharts`, `input-otp`, `cmdk`, `react-day-picker`,
`react-resizable-panels`.

Checked before deleting that `carousel`, `drawer`, `sidebar` and `sheet` are
genuinely reachable — they are, via partners, the player bar, the admin layout
and the mobile menu.

## Split the landing page

`Hero` and `About` are above the fold and stay in the entry chunk. The seven
sections below it are `React.lazy` imports behind one `Suspense`, so the first
paint no longer waits on the carousel, the player wiring or the contact form's
validation stack.

`landing.tsx` observed section elements once on mount to drive nav highlighting,
which would have missed every lazily-mounted section. The effect now re-attaches
through a `MutationObserver` as sections appear, and tracks what it has already
observed so nothing is double-observed.

### Result

| | before | after |
|---|---|---|
| entry JS | 394.13 kB (117.50 kB gz) | **221.27 kB (67.99 kB gz)** |
| CSS | 141.40 kB (21.26 kB gz) | **94.82 kB (15.05 kB gz)** |

The CSS shrank because Tailwind no longer generates classes for the deleted
components.

## SEO

- `public/robots.txt` — allows everything, disallows `/admin`, points at the
  sitemap.
- `public/sitemap.xml` — one entry. The site is a single page; the nav targets
  are anchors, not separate URLs.
- `public/favicon.svg` — replaces the default Vite logo. A `64` monogram in the
  brand green (`#00ff80`) on the theme background. Placeholder-quality: swap it
  for a real mark whenever one exists.
- `index.html` — added canonical, `og:url`, `og:site_name`, `og:image` with
  declared dimensions, `og:locale` plus alternate, and the Twitter card tags.
  Link previews previously had no image at all.

`public/vite.svg` deleted; nothing referenced it after the favicon change.

## Verification

`npm run lint` 0 errors, `npm run typecheck` clean, 28 tests pass,
`npm run build` succeeds. All nine sections mount and are present in the DOM
after lazy loading (9/9).

**Not verified:** the nav highlighting itself. `IntersectionObserver` does not
fire when the preview pane is not compositing frames, so the observer stayed
silent for sections that were provably 100% visible — including a control
observer created by hand. This says nothing about real browsers either way.
Worth a manual check on the deployed site: scroll down and confirm the active
nav item follows the current section.

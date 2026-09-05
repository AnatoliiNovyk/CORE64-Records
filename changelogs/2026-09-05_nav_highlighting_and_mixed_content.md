# 2026-09-05 — Nav highlighting, and two tracks that never played on production

## Nav highlighting

The active nav item was driven by an `IntersectionObserver` with
`threshold: 0.3`. Two problems, independent of each other:

- **Tall sections can never activate.** A section taller than about 3.3
  viewports never reaches 30% visibility. `Releases` is already 953px against a
  900px viewport and grows with the catalogue.
- **No stable answer when two sections are visible.** Whichever entry fired last
  won, and that order has nothing to do with scroll direction — scrolling up and
  scrolling down could disagree.

Replaced with geometry: the active section is the last one whose top edge has
crossed a line a third of the way down the viewport, with the final section
forced when the page is scrolled to the bottom (it may be too short to reach the
line otherwise).

The decision is a pure function in `src/lib/section-tracking.ts`, covered by nine
cases including the tall-section one the old approach could not handle.

The side benefit is that this is *verifiable*. `IntersectionObserver` callbacks
never fire when the preview pane is not compositing frames, which is why the
previous implementation could not be checked here — a control observer created
by hand stayed silent on sections that were provably 100% visible. Scroll
listeners plus `getBoundingClientRect` do not depend on compositing.

Verified in the browser: all nine sections highlight their own nav item scrolling
down, all nine again scrolling back up, and the page top and bottom resolve to
`home` and `contact`.

## Two tracks never played on production

While checking the page's network activity, one image was being requested over
`http://` rather than `https://`. The database held three such rows — one release
cover and **two of the five track audio files** — left over from when
`VITE_SUPABASE_URL` was still `http://`.

The site is served over HTTPS, so browsers block those as mixed content. Two
tracks would not play, and one cover would not render.

Fixed in place: `http://supabasekong.…` → `https://supabasekong.…` for
`releases.cover_art_url` and `tracks.audio_url`. All 7 media URLs are now https
and return 200.

### Why the earlier check missed it

Audio was verified by issuing `HEAD` requests from Node, which reports
reachability and does not apply the browser's mixed-content policy. The files
were reachable the whole time; the browser simply refused to load them. Checking
reachability is not the same as checking that the page can use the resource.

New uploads are unaffected — URLs are built from `VITE_SUPABASE_URL`, which has
been https since this morning.

## Not a problem

`/favicon.ico` 404s. Browsers request it implicitly even when an SVG icon is
declared, and `nginx.conf` matches `.ico` in its static-asset block before the
SPA fallback, so it returns an honest 404 instead of serving `index.html` as an
icon. That is the correct outcome; the declared SVG is used.

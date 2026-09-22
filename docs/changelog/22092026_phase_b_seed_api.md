# 22092026 — Phase B: auto-seed releases + /api/releases

## Why
Admin at https://records.core64.studio/admin showed an empty table: `getDb()` created an empty `releases` table, seed lived only in `scripts/init-db.mjs`, and Dockerfile CMD was `node server.js` (never `db:init`). Persistent volume `/app/data` kept the empty DB.

## What
- `lib/db.ts`: `ensureSeed(db)` after CREATE TABLE — if `COUNT(*)=0`, insert YIELD POINT + BRITTLE (CORE64, Visible=No, cover=unknown). `listReleases` unchanged in contract.
- `app/api/releases/route.ts`: GET JSON `{ releases }` via `listReleases`, `force-dynamic`.
- `app/page.tsx`: live First AI Music Label wording + `/admin` link; honest CRM MVP (no Local skeleton / waiting-on-DNS).
- `Dockerfile` runner: `ENV DATA_DIR=/app/data`. CMD still `node server.js` (seed via getDb).
- `app/admin/page.tsx`: show release count + "seeded if empty on first open".

## Out of scope
Admin auth, cover upload, auto Visible=Yes, apex/suno/HostGuard/supabase, OpenHands/Redis/PG.

## Ship
Commit: `fix(crm): auto-seed releases + /api/releases for Phase B`
Coolify redeploy uuid `ezvxvp0n6s7wtluw7vylxm4x`.
Smoke: `/admin` contains YIELD POINT + BRITTLE; `/api/releases` 200 JSON; `/` 200.

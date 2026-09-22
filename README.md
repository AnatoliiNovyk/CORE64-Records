# CORE64 Records — First AI Music Label (platform)

Site + CRM skeleton for **`records.core64.studio`** (Coolify Application).

| Item | Value |
|------|-------|
| Product | CORE64 Records — First AI Music Label |
| Domain | `records.core64.studio` → `169.58.250.236` (DNS A live) |
| Host | `169.58.250.236` via Coolify + Traefik |
| Stack | Next.js 14 + SQLite (`better-sqlite3`) — root app |
| Status | Coolify-ready Dockerfile; not deployed |

## Stack (honest)

- Next.js 14 App Router + SQLite (`better-sqlite3`)
- **Not** assuming OpenHands / Redis / Postgres day-1

## Local

```bash
cd platform
npm install
npm run db:init
npm run dev
```

Open http://localhost:3000 and http://localhost:3000/admin.

## Coolify

See [`docs/COOLIFY.md`](docs/COOLIFY.md):

1. **New** Application (do **not** mutate existing `core64.studio` nginx app)
2. Build: Dockerfile, port `3000`
3. Persistent volume: `/app/data`
4. Domain: `records.core64.studio` (DNS A → `169.58.250.236` live)
5. **LEAVE:** suno-clone, suno-sb, HostGuard

## Blockers before Coolify create

1. GitHub repo URL (separate from core64.studio product)
2. Coolify UI login to create the application

## Note

Primary app is root `app/` (Next.js 14 + better-sqlite3).

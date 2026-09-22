# Coolify create — records.core64.studio

**Source of truth:** this `platform/` folder (separate GitHub project; not product `core64.studio`).

## Create Application (NEW app)

| Field | Value |
|-------|--------|
| Type | Dockerfile |
| Port | `3000` |
| Domain | `records.core64.studio` |
| Volume | host path → `/app/data` (SQLite persist) |
| Network | Coolify / Traefik (same as other apps) |

## Hard rules

- Create a **new** Coolify Application — do **not** mutate / edit the existing Coolify nginx app for apex `core64.studio`
- **LEAVE** suno-clone / suno-sb / HostGuard alone
- DNS A for `records.core64.studio` → `169.58.250.236` is **live** (required before public Let's Encrypt)

## Labels

Prefer Coolify UI domain attach (generates Traefik labels). Manual Host rule only if UI fails — never point Host to suno services.

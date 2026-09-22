# 22092026 — GitHub platform prep

## Before

- SoT lived local-only under `platform/`
- Dead leftover `apps/` (old Next 15 monorepo stub) still present
- README DNS text stale (“not live yet”) and broken markdown in the domain table row

## After

- Confirmed root `package.json` is Next.js 14 + `better-sqlite3` (site+CRM); deleted obsolete `apps/`
- `.gitignore` covers `.env*` (keeps `node_modules/`, `.next/`, `data/*.db`)
- README: DNS live — `records.core64.studio` → `169.58.250.236`; table markdown fixed
- `docs/COOLIFY.md` aligned: NEW Coolify app, port 3000, volume `/app/data`, LEAVE apex/suno/HostGuard
- Relevant changelog entries copied into `platform/docs/changelog/`

## Benefit

Platform tree cleaned and ready to push when GitHub auth works. No secrets committed; no remote push in this step.

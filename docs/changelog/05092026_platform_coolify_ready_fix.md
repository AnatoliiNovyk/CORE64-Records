# Changelog 05092026_platform_coolify_ready_fix

## Як було
Yezhi skeleton `platform/` існував (workspaces monorepo / битий Coolify DF з `nmp` і зайвою `)` у lockfile glob), root `package.json` без Next/SQLite deps — Coolify build для `records.core64.studio` не пройшов би.

## Як стало
Petru44o: Coolify-ready fix — root Next14 + `better-sqlite3`, виправлений multi-stage DF (`COPY package.json package-lock.json* ./` + `npm install` / `npm run build`), `docs/COOLIFY.md` (новий Application, port 3000, vol `/app/data`, DNS blocker). Seed CRM: YIELD POINT / BRITTLE Visible=No cover=unknown. Без OH/Redis/PG; suno / HostGuard / core64.studio product не чіпав.

## Користь
Можна створювати Coolify Application після GitHub remote; LE — після DNS A `records.core64.studio` → `169.58.250.236`.

## Самоперевірка
DF: рядки з `npm` (не `nmp`); `package-lock.json*` без зайвої `)`; `package.json` має `next`/`react`/`better-sqlite3`; немає Redis/PG/OH; changelog + ping Shranz.

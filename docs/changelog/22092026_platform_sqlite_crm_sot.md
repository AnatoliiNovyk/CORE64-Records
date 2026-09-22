# Changelog 22092026_platform_sqlite_crm_sot

## Як було
/admin був CRM shell без БД (або лише stub у monorepo apps/web).
## Як стало
SoT platform/: better-sqlite3, lib/db.ts, scripts/init-db.mjs, /admin читає releases (seed YIELD POINT/BRITTLE, Visible=No, cover=unknown). Без Redis/PG/OH.
## Користь
Локальний CRM для Coolify NEW Application після repo push; Cover/Visible gates чесні.
## Самоперевірка
package.json має better-sqlite3; seed defaults No/unknown; apex/suno/HostGuard не чіпались. Залишок apps/web stub — поза активним SoT root package.

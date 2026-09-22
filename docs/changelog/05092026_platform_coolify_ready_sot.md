# Changelog 05092026_platform_coolify_ready_sot

## Як було
SoT monorepo (Next 15 apps/web) + Dockerfile вже були; не було окремого create-checklist під scan.

## Як стало
Petru44o: checklist `docs/changelog/05092026_deploy_checklist_records.md` + цей changelog.
NEW Application: Dockerfile, port 3000, domain records.core64.studio.
Hard: не mutate apex Coolify nginx app; LEAVE suno-*; DNS A перед LE; без fake OH/Redis/PG.
SQLite CRM — крок @Yezhi.

## Користь
Можна UI create після GitHub remote + DNS A.

## Самоперевірка
Dockerfile SoT не ламав; suno/HostGuard не чіпав.

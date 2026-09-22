# 22092026 — Studio primary home at `/` (hostname product)

## Як було (Before)
- Studio mastering MVP (upload → ebur128 QC → TP alimiter → output.wav) жив на `/studio`
- `/` був label/CRM marketing shell («First AI Music Label» + links to Studio / Admin CRM)
- Admin CRM лишався на `/admin`

## Як стало (After)
- Studio MVP UI на **`/`** — primary product на `records.core64.studio`
- `/studio` → permanent redirect (308) на `/` (`next.config` + `permanentRedirect`)
- Marketing home stripped; CRM marketing більше не володіє `/`
- `/admin` CRM shell лишається (не чіпаємо expansion); APIs `/api/studio/*` без змін
- HARD LEAVE: apex `core64.studio`, suno-*, HostGuard, supabase, factory DSP

## Користь (Benefit)
Hostname = studio product per Anatolii/Alfred GO: користувач одразу в upload→QC→master→download, без маркетингового проміжного шару.

## Ship
- Commit: _(fill after push)_
- Coolify force deploy uuid `ezvxvp0n6s7wtluw7vylxm4x`
- Smoke: GET `/` → 200 studio UI; GET `/studio` → 308/301 → `/`

## Result (Kiev / UTC+3)
_(fill after deploy + smoke)_

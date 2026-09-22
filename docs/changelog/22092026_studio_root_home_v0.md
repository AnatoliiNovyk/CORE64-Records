# 22092026 — Studio primary home at `/` (hostname product)

## Як було (Before)
- Studio mastering MVP (upload → ebur128 QC → TP alimiter → output.wav) жив на `/studio`
- `/` був label/CRM marketing shell («First AI Music Label» + links to Studio / Admin CRM)
- Admin CRM лишався на `/admin`

## Як стало (After)
- Studio MVP UI на **`/`** — primary product на `records.core64.studio`
- `/studio` → permanent redirect **308** на `/` (`next.config` `permanent:true` + `permanentRedirect`)
- Marketing home stripped; CRM marketing більше не володіє `/`
- `/admin` CRM shell лишається (не чіпаємо expansion); APIs `/api/studio/*` без змін
- HARD LEAVE: apex `core64.studio`, suno-*, HostGuard, supabase, factory DSP

## Користь (Benefit)
Hostname = studio product per Anatolii/Alfred GO: користувач одразу в upload→QC→master→download, без маркетингового проміжного шару.

## Ship
- Commits: `70cc624` (root move) → `7a82a9f` (parallel align) → **`fdc7268`** (permanent 308 + ship note) — live SHA
- Coolify force deploy uuid `ezvxvp0n6s7wtluw7vylxm4x`
- Smoke: GET `/` → 200 studio UI; GET `/studio` → 308 → `/`

## Result (Kiev / UTC+3)
- Live commit: `fdc7268f900db5fcbaa3e080cfcd0825f4b2b174` (short `fdc7268`)
- Coolify deploy uuid `tovihfzzsvaxshgvrcq8zl1t` finished ~11:44 Kyiv (2026-09-22T08:44:58Z); image/SOURCE_COMMIT `fdc7268…`
- Prior force deploy `smudublwgnawdobcciesta4i` had landed `7a82a9f` (temporary 307); redeploy pulled HEAD fix
- Smoke verified:
  - `GET /` → **200** — Recording studio UI (alimiter / True Peak / Upload WAV / ebur128); title «CORE64 Records — Recording Studio»; no «First AI Music Label» marketing home
  - `GET /studio` → **308** `Location: /` (follow → 200 `/`)
  - `GET /admin` → **200** (CRM shell kept, not owning `/`)
  - Hot WAV API: input TP **0** → alimiter applied → output TP **−1.0** gate PASS; `output.wav` download **200**

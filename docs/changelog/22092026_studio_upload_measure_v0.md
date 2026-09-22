# 22092026 — Studio increment 1: upload + ebur128 QC measure

## Why
Recording studio MVP at `/studio` on records.core64.studio (Alfred RE-SCOPE GO).
Increment 1 = measure only — no alimiter / no mastered WAV.

## What
- `app/studio/page.tsx` — WAV upload UI; shows LUFS / TP / gate; download qc.json
- `app/api/studio/upload/route.ts` — multipart → `DATA_DIR/studio/jobs/<uuid>/`
- `lib/studio/measure.ts` — ffprobe + ffmpeg `ebur128=peak=true` null-sink; gate TP ≤ −1.0 dBTP
- `app/api/studio/jobs/[id]/route.ts` — GET status/qc
- `app/api/studio/jobs/[id]/download/route.ts` — download qc.json
- Dockerfile runner: install `ffmpeg`; `ENV DATA_DIR=/app/data`
- Home link to `/studio` (CRM untouched)
- Docs: `docs/tech/22092026_studio_mastering_mvp_v0.md` + this changelog

## Out of scope
CRM expansion, factory DSP, alimiter/output.wav (increment 2), apex/suno/HostGuard/supabase mutate.

## Ship
Commit: `feat(studio): /studio upload + ebur128 QC measure MVP`
Coolify force deploy uuid `ezvxvp0n6s7wtluw7vylxm4x`
Smoke: GET https://records.core64.studio/studio → 200

## Result (Kiev / UTC+3)
- Commit: `5d8e0628e479fe53f4188ff24e569bd9a2f5db3e` (short `5d8e062`)
- Coolify force deploy uuid `ezvxvp0n6s7wtluw7vylxm4x` HTTP 200 queued (`lk6x3bd5povjs63po3uqf1r0`); finished; image `5d8e0628e479fe53f4188ff24e569bd9a2f5db3e`
- Smoke: `/studio` 200; upload+measure+download qc.json OK; ffmpeg in runner

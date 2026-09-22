# 22092026 — Studio increment 2: true-peak safety + WAV download

## Why
Recording studio MVP Increment 2 on records.core64.studio: when measured True Peak > −1.0 dBTP, apply ffmpeg alimiter safety and offer output.wav + qc.json.

## What
- `lib/studio/master.ts` — studio-tool-only TP safety (`alimiter=limit≈0.89125`); copy when already under gate. **NOT factory DSP.**
- `lib/studio/measure.ts` — QcJson extended with `input` / `output` / `master`; increment `tp-safety`
- `app/api/studio/upload/route.ts` — measure → (alimiter | copy) → re-measure output → store both metrics in qc.json
- `app/api/studio/jobs/[id]/download/route.ts` — `?file=qc.json` (default) or `?file=output.wav`
- `app/studio/page.tsx` — before/after TP; download output.wav when present

## Out of scope
Factory DSP changes, CRM, apex/suno/HostGuard/supabase mutate.

## Ship
Commit: `feat(studio): true-peak safety master + WAV download`
Coolify force deploy uuid `ezvxvp0n6s7wtluw7vylxm4x`
Smoke: GET https://records.core64.studio/studio → 200

## Result (Kiev / UTC+3)
- Commit: (filled after ship)
- Coolify force deploy: (filled after ship)
- Smoke: (filled after ship)

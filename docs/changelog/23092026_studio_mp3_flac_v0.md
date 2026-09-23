# 23092026 — Studio: accept MP3 + FLAC (+ WAV)

## Before
- Upload UI and `/api/studio/upload` accepted **WAV only** (copy: «Preferred format for v0. FLAC/AIFF later»).
- Under-gate path byte-copied `input.*` → `output.wav` (fine for WAV; would break for compressed formats).

## After
- UI `accept`: `.wav,.flac,.mp3` + matching MIME; copy updated (no «WAV only / FLAC later»).
- API accepts those extensions; others → clear JSON `{ error, accepted }`.
- Pipeline: ffmpeg decodes FLAC/MP3 (and WAV when alimiter needed) → same ebur128 QC + TP≤−1.0 alimiter → **output.wav** + **qc.json**.
- Under gate + non-WAV: ffmpeg decode → `pcm_s24le` (not a raw copy). Under gate + WAV: still byte-copy.
- `qc.json` keeps `filename` (original) and adds `original_format` (`wav`|`flac`|`mp3`).

## Benefit
Artists can drop common delivery formats (MP3/FLAC) into the studio tool without a local convert step; download remains delivery-ready WAV + QC.

## Scope / leave
Studio tool only. Unchanged: apex core64.studio, suno-*, HostGuard, supabase, CRM/marketing, auth/retention, factory DSP ban.

## Files
- `app/page.tsx`, `app/layout.tsx`
- `app/api/studio/upload/route.ts`
- `lib/studio/master.ts`, `lib/studio/measure.ts`
- `docs/changelog/23092026_studio_mp3_flac_v0.md`

## Smoke (post-deploy)
Upload one mp3 + one flac + one wav → HTTP 200 + `qc.status=done`; download output.wav + qc.json.

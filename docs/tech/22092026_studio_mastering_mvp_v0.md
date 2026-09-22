# Recording studio MVP v0 — `/studio` on records.core64.studio

**Date:** 2026-09-22 · **Owner:** Shranz → Tech · **Authority:** Anatolii via Alfred RE-SCOPE GO

## Product
**Recording studio / track mastering module** at `https://records.core64.studio/studio`  
(not label marketing site; not CRM UI churn). Apex `core64.studio` stays the label site.

## MVP (only)
1. **Upload** track (WAV preferred; FLAC/AIFF later)
2. **QC measure** via ffmpeg `ebur128=peak=true` (same meter concept as factory)
3. **Mastering step (smallest):** true-peak safety to ≤ −1.0 dBTP when measured TP exceeds gate (explicit studio job — **not** factory packaging)
4. **Download** result + `qc.json` / short qc text

## Align with factory — without breaking SCOPE_LOCK
| Path | Role |
|------|------|
| `factory/` | Measure + package only; **HARD BAN DSP** (SoundProducer owns artistic remaster) |
| `/studio` | User-operated mastering **tool** on the platform; may rewrite audio for downloadable result |

Studio reuses factory **meter semantics** (LUFS integrated, true peak dBTP, gate −1.0 dBTP). It does **not** call factory scripts to remaster packaging folders.

## Out of scope v0
- OpenHands / Redis / Postgres day-1 (SQLite or filesystem job queue OK)
- Label CRM / Visible / Cover upload UI
- Store distribution, HostGuard, suno stacks
- Full multi-band mix bus, stem mastering, AI remaster cloud

## Technical sketch
- Next.js route `/studio` (same Coolify app `ezvxvp0n6s7wtluw7vylxm4x`)
- Job dir under `DATA_DIR/studio/jobs/<id>/` : `input.*`, `qc.json`, `output.wav`
- Server: `ffprobe` + ffmpeg ebur128 null-sink measure → optional `-af alimiter=limit=0.89125` (≈ −1 dBTP) only when TP over gate
- Sync process first (small files); queue later if needed
- Docker image: add `ffmpeg` to runner stage

## Increments
1. Design note (this) + changelog
2. `/studio` UI + upload + measure-only download of qc
3. Safety master when TP over gate + download WAV
4. Auth / retention / size limits

## LEAVE
apex core64.studio, suno-*, HostGuard, supabase Degraded (later)

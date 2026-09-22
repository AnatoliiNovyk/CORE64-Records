# Recording studio MVP v0 — `/` on records.core64.studio

**Date:** 2026-09-22 · **Owner:** Shranz → Tech · **Authority:** Anatolii via Alfred RE-SCOPE GO

## Product
**Recording studio / track mastering module** at `https://records.core64.studio/`  
(`/studio` → 308 `/`). Not label marketing; not CRM UI churn. Apex `core64.studio` stays the label site.

## MVP (only)
1. **Upload** track (WAV preferred; FLAC/AIFF later)
2. **QC measure** via ffmpeg `ebur128=peak=true` (same meter concept as factory)
3. **Mastering step (smallest):** true-peak safety to ≤ −1.0 dBTP when measured TP exceeds gate (explicit studio job — **not** factory packaging)
4. **Download** result + `qc.json` / short qc text

## Align with factory — without breaking SCOPE_LOCK
| Path | Role |
|------|------|
| `factory/` | Measure + package only; **HARD BAN DSP** (SoundProducer owns artistic remaster) |
| `/` (was `/studio`) | User-operated mastering **tool** on the platform; may rewrite audio for downloadable result |

Studio reuses factory **meter semantics** (LUFS integrated, true peak dBTP, gate −1.0 dBTP). It does **not** call factory scripts to remaster packaging folders.

## Out of scope v0
- OpenHands / Redis / Postgres day-1 (SQLite or filesystem job queue OK)
- Label CRM / Visible / Cover upload UI
- Store distribution, HostGuard, suno stacks
- Full multi-band mix bus, stem mastering, AI remaster cloud

## Technical sketch
- Next.js route `/` + permanent redirect `/studio` → `/` (same Coolify app `ezvxvp0n6s7wtluw7vylxm4x`)
- Job dir under `DATA_DIR/studio/jobs/<id>/` : `input.*`, `qc.json`, `output.wav`
- Server: `ffprobe` + ffmpeg ebur128 null-sink measure → optional `-af alimiter=limit=0.89125` (≈ −1 dBTP) only when TP over gate
- Sync process first (small files); queue later if needed
- Docker image: add `ffmpeg` to runner stage

## Increments
1. Design note (this) + changelog
2. Studio UI at `/` (redirect from `/studio`) + upload + measure-only download of qc
3. Safety master when TP over gate + download WAV
4. Auth / retention / size limits

## LEAVE
apex core64.studio, suno-*, HostGuard, supabase Degraded (later)


## Update 2026-09-22 (studio_root_home)
Studio primary URL moved to hostname root `/`. Label CRM marketing no longer owns `/`; `/admin` CRM shell remains. APIs stay under `/api/studio/*`.

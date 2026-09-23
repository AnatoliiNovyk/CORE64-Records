# 23092026 — Studio: password auth + 24h job retention

## Why
Alfred/Anatolii GO: gate records.core64.studio mastering UI + `/api/studio/*` behind a shared password; auto-delete job artifacts after 24h.

## What
- **Auth (fail-closed):** env `STUDIO_ACCESS_PASSWORD` required. Missing → config-needed UI + API `503`. Wrong/missing session → login UI (HTML) / `401` JSON (API).
- **Session:** httpOnly `c64_studio_session` cookie after `POST /api/studio/login` (JSON or form). Timing-safe password compare. HMAC session token; secret from `SESSION_SECRET` (≥16) or derived from password (never logged).
- **Routes gated:** `/api/studio/upload`, `/api/studio/jobs/[id]`, `/api/studio/jobs/[id]/download`. Public: `/api/studio/login`, `/api/studio/logout`, `/api/studio/session` (session returns 401/503 without granting studio).
- **Retention:** opportunistic sweep on upload/job/download/session — delete job dirs older than 24h (`qc.created_at` or mtime). UI note documents TTL.
- Formats / QC / TP≤−1.0 alimiter path **unchanged**.

## Coolify env (human)
Set variable name only: `STUDIO_ACCESS_PASSWORD` on app `ezvxvp0n6s7wtluw7vylxm4x`. Optional: `SESSION_SECRET`. Do not commit values. Apex `rp3c9bors2kqh02wqolq7pc6` auto-deploy left OFF.

## Leave
Apex core64.studio, suno-*, HostGuard, supabase, factory DSP.

## Files
- `lib/studio/auth.ts`, `lib/studio/retention.ts`
- `app/page.tsx`, `app/studio-home.tsx`, `app/studio-login.tsx`, `app/studio-config-needed.tsx`
- `app/api/studio/login|logout|session/route.ts`
- `app/api/studio/upload/route.ts`, `app/api/studio/jobs/[id]/route.ts`, `app/api/studio/jobs/[id]/download/route.ts`
- `docs/changelog/23092026_studio_auth_retention_v0.md`

# 2026-09-05 — Restore real authorization on the VPS, fix the contact form

## What was actually running

Verified directly against the live self-hosted stack before changing anything.

`is_admin()` was a stub:

```sql
BEGIN RETURN (auth.role() = 'authenticated'); END;
```

Every logged-in user was an admin. `admin_users` did not exist. GoTrue has
`DISABLE_SIGNUP=false`, so anyone could register and inherit those rights.

Policies found live:

| Table | Policy | Effect |
|---|---|---|
| `contact_messages` | `Public read contact_messages` SELECT to `public` | anyone could read every submitted message |
| `contact_messages` | `Public insert contact` INSERT to `public` | anyone could write, no validation |
| `contact_messages` | `Admin contact_messages` ALL, `USING=true` | any logged-in user, full access |
| `storage.objects` | `Allow all on storage objects` ALL to `public`, `USING=true` | anonymous write and delete on every bucket |
| `storage.buckets` | `Allow all on storage buckets` ALL to `public` | anonymous bucket management |
| `storage.objects` | `Authenticated upload media objects` ALL | any logged-in user |

`contact_rate_limits` was missing entirely, and `submit-contact` had never been copied to
the VPS — `OPTIONS /functions/v1/submit-contact` returned 500 while the stock `hello`
returned 200. Since the direct-insert fallback was deliberately removed on 2026-08-01, the
contact form had no working path at all.

The message table was empty, so nothing had leaked — only because the form was broken.

## Changes applied

Migration `20260905120000_restore_storage_rls_and_contact_rate_limits.sql`, applied in one
transaction:

- Created `admin_users`, seeded it with the single existing account, and replaced
  `is_admin()` with the real membership check. The transaction aborts if the seed produces
  no rows, so the owner cannot be locked out.
- Dropped all three `contact_messages` policies; recreated SELECT/UPDATE/DELETE gated on
  `is_admin()`. No INSERT policy — the edge function writes through the service role.
- Created `contact_rate_limits` with RLS on and no policies (deny-all; service role
  bypasses).
- Added the four length CHECK constraints, NOT VALID.
- Dropped both `Allow all ...` storage policies and `Authenticated upload media objects`;
  added `is_admin()`-gated insert/update/delete on the `media` bucket. Kept
  `Public read media objects`, which serves the site.
- Revoked only INSERT/UPDATE/DELETE from `anon` on storage, leaving USAGE and SELECT.

Deployed `submit-contact` into the functions volume and restarted the edge runtime.

Rebuilt the frontend without R2 and replaced `/root/core64-dist` wholesale — the previous
directory kept two stale `file-upload-*.js` chunks that still contained the R2 credentials
and were reachable by direct URL. Old directory retained as `core64-dist.old` plus a
timestamped backup.

## Verification

- Anonymous read of `contact_messages` returns `[]` against a row that provably exists
  (inserted server-side, then removed) — RLS filters it. Anonymous insert returns
  `401 / 42501`.
- Contact form end to end: `POST /functions/v1/submit-contact` → `{"success":true}`.
  Rate limiting confirmed: submissions 1–3 succeed, 4 and 5 return `429 rate_limited`.
  An over-length name returns `400 Field too long`. All probe rows removed afterwards.
- Public site unaffected: releases, tracks, producers, videos, photos, events, partners
  and site_content all still readable anonymously; all 5 audio files return HTTP 200.
- `https://core64.studio` serves no R2 credentials in any asset; both old chunks now 404;
  `/admin` still resolves through the SPA fallback.

## Access

Password-based root SSH was replaced with a dedicated ed25519 key
(`claude-code-core64-vps` in `/root/.ssh/authorized_keys`).

## Still open

- **`DISABLE_SIGNUP=false`.** Registration is public. This no longer grants admin rights,
  but it still allows account spam. Changing it means editing the GoTrue service
  environment and recreating that container.
- The root password appeared in terminal output during this session and is stored in clear
  text in `~/ops/core64/vps_ssh.sh`. It should be rotated.
- The frontend container is still a hand-run `docker run` detached from Coolify, so
  deploys remain manual.

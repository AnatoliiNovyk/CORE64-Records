# 2026-09-05 — Remove Cloudflare R2: credentials were shipping in the client bundle

## Problem

`src/lib/r2.ts` built an `S3Client` **in the browser** from `VITE_`-prefixed variables.
Vite inlines those at build time and `Dockerfile` passed all five as `ARG`/`ENV`, so the R2
access key id and secret access key were compiled into `dist/assets/file-upload-*.js` — a
file served publicly to every visitor of core64.studio. Verified by searching the built
bundle for the literal values.

Because the module imported `PutObjectCommand` and `DeleteObjectCommand`, anyone who opened
the site could extract those two strings and gain write and delete access to the `core64bk`
bucket.

## Why removal rather than server-side signing

The integration was dead code. Checked against the live self-hosted database:

- 2 releases, 5 tracks, 1 producer — every `audio_url` and `cover_art_url` points at
  Supabase Storage. Nothing was ever stored in R2.
- R2 was only a *fallback*, reached solely after a Supabase Storage failure
  (`use-file-upload.ts`), and that path evidently never succeeded.
- The stored audio files are 7.7–10.6 MB and all return HTTP 200, so the file-size ceiling
  was never the reason the fallback existed.

Moving the signing to an edge function would have been substantially more work to secure a
path that has never carried a single byte. Removing it eliminates the leak along with the
code.

Cost removed: the `file-upload` chunk was 196,931 bytes, almost entirely AWS SDK, and
`@aws-sdk/client-s3` occupied 9 MB in `node_modules`.

## Changes

- Deleted `src/lib/r2.ts` (74 lines) — the only consumer of `@aws-sdk/client-s3`.
- `src/hooks/use-file-upload.ts` — dropped the R2 import, the fallback block in `upload()`
  and the R2 branch in `remove()`. User-visible behaviour is unchanged: the surfaced `error`
  always held the Supabase message anyway, since a thrown R2 error never overwrote it.
- `package.json` — removed `@aws-sdk/client-s3`.
- `Dockerfile` — removed the five `VITE_R2_*` `ARG`/`ENV` pairs and added a comment noting
  that anything listed there is inlined into the client bundle.
- `.env.example` — removed the R2 block, replaced with the same warning.

`extractPath` is untouched and still covered by its 5 tests.

## Verification

- `npm run lint` 0 errors, `npm run typecheck` clean, 28 tests pass, `npm run build` succeeds.
- The R2 account id, access key id and secret access key are all **absent** from `dist`.
- `file-upload` chunk: 196,931 → 3,319 bytes (−98%).
- `grep -rn "aws-sdk\|S3Client\|uploadToR2" src/` — no matches.
- Playback regression: all 5 `audio_url` values still return HTTP 200 at their original
  sizes, since every file lives in Supabase Storage.

## Still required from the account owner

The exposed token must be **revoked** in Cloudflare (R2 → API → Manage API tokens).
Deleting the code stops new builds from leaking it, but the key already shipped and stays
valid until revoked. No replacement token is needed — R2 is no longer used.

Also remove the five `VITE_R2_*` variables from the Coolify application environment.

## Found while investigating — not fixed here

- **The contact form is broken in production.** `OPTIONS /functions/v1/submit-contact`
  returns 500 (the function was never copied to the self-hosted stack; only the stock
  `hello` responds 200), and `contact_rate_limits` does not exist in the VPS database.
  The deliberate removal of the direct-insert fallback on 2026-08-01 means nothing reaches
  `contact_messages`.
- **Supabase Storage accepts anonymous writes.** `setup_storage_admin.sh` applied
  `FOR ALL USING (true) WITH CHECK (true)` policies plus `GRANT ALL ... TO anon` on
  `storage.objects` / `storage.buckets`, undoing
  `20260630141943_restrict_storage_listing.sql`. This is the same exposure the R2 key
  represented, in the store that actually holds the files — removing R2 does not close it.
- **`git push` does not deploy.** The live frontend is a hand-started
  `docker run nginx:alpine` bind-mounting `/root/core64-dist`, detached from Coolify since
  2026-08-29. New builds must be copied there, or the deployment returned to Coolify.

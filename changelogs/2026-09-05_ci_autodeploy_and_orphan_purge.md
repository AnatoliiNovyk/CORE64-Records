# 2026-09-05 — CI on our own runner, auto-deploy, and the orphan purge

## CI runs again

Every GitHub-hosted run died in 2–4 seconds with an empty `runner_name` and
"the job was not started because your account is locked due to a billing issue".
Actions minutes are free on public repositories, so the restriction comes from
metered usage elsewhere on the account, not from this repository. Rather than
wait for that, CI now runs on a self-hosted runner on the VPS. It costs nothing.

- Runner 2.337.0, systemd service, user `ghrunner` — **not** in the `docker`
  group and without sudo.
- `actions/checkout` and `actions/setup-node` bumped v4 → v7; the v4 pair still
  targeted Node 20 and every run carried a deprecation warning.

**The `pull_request` trigger is gone, and that matters more than the runner.**
This repository is public; a self-hosted runner executing fork PR workflows would
run arbitrary code on the machine that also hosts the site, Supabase and Coolify.
Only pushes to `main` trigger CI now, so only someone who can already push there
can make the runner execute anything. `workflow_dispatch` covers manual runs.

Result: green in 55 seconds, three pre-existing react-refresh warnings, no errors.

## Auto-deploy from a push

Coolify already had `is_auto_deploy_enabled = true`, but the application uses the
public-repository source (`source_id = 0`), which needs a webhook GitHub can call
— and no webhook existed. Created one against Coolify's manual-source endpoint,
signed with the application's stored `manual_webhook_secret_github`, `push` events
only. GitHub's ping returned 200.

Note the endpoint is plain HTTP: Coolify has no domain or certificate. The
payload is public-repository metadata and the HMAC signature protects
authenticity, so this is acceptable, but giving Coolify a domain with TLS would
be better.

## Nine orphaned files removed

13 MB, 30% of the bucket, all dating from the VPS migration window.

Made reversible before touching anything: every file was downloaded to
`/root/storage-orphans-backup-<timestamp>/` on the VPS with a `_list.txt`
manifest — 9 of 9 saved, 13 MB. Only then were they deleted, through the Storage
API with the service role key so both the `storage.objects` row and the blob go,
rather than deleting rows and stranding the data.

The orphan list was recomputed immediately before the backup rather than reused
from the earlier session, scanning every `text`, `varchar` and `jsonb` column in
`public` for media URLs.

Bucket: 30 objects → 21, which is exactly the referenced count. Verified
afterwards that all 21 still return 200 and the site is unaffected.

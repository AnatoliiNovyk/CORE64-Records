# 2026-09-05 — Disable public signup on the self-hosted Supabase

## Why

GoTrue ran with `DISABLE_SIGNUP=false`, so anyone could register against the
public auth endpoint. Until earlier today that also handed them admin rights,
because `is_admin()` was a stub returning `auth.role() = 'authenticated'`. That
part is fixed, so this is no longer an authorization hole — but an open
registration endpoint on a private label site still invites junk accounts.

## The variable that must not be touched

The compose file exposes three signup-shaped variables, and only one of them
means what it sounds like:

| Variable | Maps to | Effect |
|---|---|---|
| `DISABLE_SIGNUP` | `GOTRUE_DISABLE_SIGNUP` | blocks new registrations — the one we want |
| `ENABLE_EMAIL_SIGNUP` | `GOTRUE_EXTERNAL_EMAIL_ENABLED` | the email **login provider** |
| `ENABLE_PHONE_SIGNUP` | `GOTRUE_EXTERNAL_PHONE_ENABLED` | the phone login provider |

Turning off `ENABLE_EMAIL_SIGNUP` would have locked the owner out of the admin
panel entirely, since it disables the provider used to sign in. Only
`DISABLE_SIGNUP` was changed.

## Where it was changed

Coolify owns this service's configuration in its own database and regenerates
both `.env` and `docker-compose.yml` from it, so editing the files alone would
be undone on the next service deploy. The value was set in three places:

- the Coolify environment variable for the service,
- the generated compose stored in Coolify (`DISABLE_SIGNUP: 'true'`),
- the on-disk `.env` and `docker-compose.yml`, each backed up first.

Only `supabase-auth` was recreated (`docker compose up -d --no-deps
--force-recreate supabase-auth`). Recreating the whole service would have
restarted the database, Kong and storage for no reason.

## Verification

Inside the container:

```
DISABLE_SIGNUP=true
GOTRUE_DISABLE_SIGNUP=true
GOTRUE_EXTERNAL_EMAIL_ENABLED=true   <- login provider still on
```

From outside:

- `POST /auth/v1/signup` → `422 signup_disabled`, "Signups not allowed for this instance"
- `POST /auth/v1/token?grant_type=password` with deliberately invalid credentials
  → `400 invalid_credentials`, i.e. the provider still answers and a real login
  will succeed
- `/auth/v1/health` 200, container healthy
- Site, `/admin` and anonymous reads all 200

## Left alone

`ENABLE_PHONE_SIGNUP` is still `true` and `GOTRUE_SMS_AUTOCONFIRM` is on. With
signups disabled this cannot be used to register, so it is redundant rather than
dangerous. Worth turning off as defence in depth if phone auth is never intended.

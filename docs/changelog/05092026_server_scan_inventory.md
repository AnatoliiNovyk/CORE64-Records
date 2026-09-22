# Changelog — 2026-09-05 — VPS server scan inventory

## Before
- Unclear whether 169.58.250.236 already ran Coolify / CapRover / Dokku / Portainer for CORE64 Records.
- Risk of installing a second publish stack or colliding with suno-clone / HostGuard.

## After
- Read-only SSH inventory completed; markdown report written:
  - `docs/tech/05092026_server_scan_169.58.250.236.md`
- Verdict documented with evidence paths: **Coolify 4.3.14** at `/data/coolify`, Traefik `coolify-proxy`, UI port 8000.
- Neighbors listed with LEAVE guidance for suno-clone / suno-sb; no mutate, no deploy, no HostGuard apply.

## Benefit
- Safe deploy path for `records.core64.studio`: reuse Coolify + Traefik; add DNS + new Coolify app; avoid parallel PaaS and suno stack interference.
- Password/credentials not recorded in docs.

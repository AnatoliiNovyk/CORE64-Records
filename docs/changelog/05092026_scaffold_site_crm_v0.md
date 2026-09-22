# Changelog — scaffold site + CRM v0

**Date:** 2026-09-05 · **Product:** CORE64 Records — First AI Music Label

## Before
- Greenfield plan + server scan existed; Coolify 4.3.14 confirmed on host.
- No local `platform/` code skeleton for site + CRM.
- Stack choice still open; DNS for `records.core64.studio` not live; no GitHub repo on this box.

## After
- Greenfield doc updated with Scan verdict Coolify, Alfred GO scaffold, DNS blocker, next steps.
- Scaffold plan doc: `docs/tech/05092026_scaffold_site_crm_coolify_v0.md` (Next.js monorepo `apps/web`).
- Local runnable skeleton under `platform/` (public home + `/admin` CRM shell, Dockerfile + compose stubs).
- Explicit LEAVE list and Coolify blockers documented (GitHub URL, DNS A, Coolify UI login).

## Benefit
- Tech can iterate locally without inventing live Coolify apps or touching suno / core64.studio / factory.
- Clear boring stack and deploy path when GitHub + DNS + Coolify UI are ready.

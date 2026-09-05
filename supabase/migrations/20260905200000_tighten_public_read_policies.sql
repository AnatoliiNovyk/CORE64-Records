/*
# Narrow the public read policies

## Overview
Every public-facing table is readable by `public` through a policy with
`USING (true)`. Two consequences, both latent today but wrong by construction:

1. **`settings` exposes every key.** The table is empty right now, but it is
   where `recaptcha_secret_key` belongs — the submit-contact edge function reads
   it from there. The moment reCAPTCHA is configured, the secret becomes
   world-readable through PostgREST. The repository's own
   `20260705054625_tighten_settings_rls.sql` restricted this to
   `recaptcha_site_key`; the VPS never received it.

2. **`is_visible` is not enforced.** The landing page filters with
   `.eq('is_visible', true)`, but that is a client-side convenience. Anyone
   querying the API directly sees unpublished releases, producers, videos,
   photos, events and partners. There are none hidden at the moment, so nothing
   leaks yet — but the feature does not actually hide anything.

`site_content` additionally carries two identical public read policies
(`Public read site_content` and `Public read content`); one is dropped.

## Data safety
No rows are read, modified or deleted. Admin access is unaffected: the
`is_admin()`-gated policies stay as they are, and admins keep seeing hidden rows
because those policies do not filter on `is_visible`.
*/

BEGIN;

-- settings: only the publishable reCAPTCHA site key --------------------------
DROP POLICY IF EXISTS "Public read settings" ON public.settings;
DROP POLICY IF EXISTS "public_read_recaptcha_site_key" ON public.settings;
CREATE POLICY "public_read_recaptcha_site_key" ON public.settings FOR SELECT
  TO public USING (key = 'recaptcha_site_key');

-- Content tables: hidden rows stay hidden ------------------------------------
DROP POLICY IF EXISTS "Public read releases" ON public.releases;
CREATE POLICY "Public read releases" ON public.releases FOR SELECT
  TO public USING (is_visible);

DROP POLICY IF EXISTS "Public read producers" ON public.producers;
CREATE POLICY "Public read producers" ON public.producers FOR SELECT
  TO public USING (is_visible);

DROP POLICY IF EXISTS "Public read videos" ON public.videos;
CREATE POLICY "Public read videos" ON public.videos FOR SELECT
  TO public USING (is_visible);

DROP POLICY IF EXISTS "Public read photos" ON public.photos;
CREATE POLICY "Public read photos" ON public.photos FOR SELECT
  TO public USING (is_visible);

DROP POLICY IF EXISTS "Public read events" ON public.events;
CREATE POLICY "Public read events" ON public.events FOR SELECT
  TO public USING (is_visible);

DROP POLICY IF EXISTS "Public read partners" ON public.partners;
CREATE POLICY "Public read partners" ON public.partners FOR SELECT
  TO public USING (is_visible);

-- tracks: visible only while their release is ---------------------------------
DROP POLICY IF EXISTS "Public read tracks" ON public.tracks;
CREATE POLICY "Public read tracks" ON public.tracks FOR SELECT
  TO public USING (
    EXISTS (SELECT 1 FROM public.releases r WHERE r.id = tracks.release_id AND r.is_visible)
  );

-- site_content: drop the duplicate -------------------------------------------
DROP POLICY IF EXISTS "Public read content" ON public.site_content;

COMMIT;

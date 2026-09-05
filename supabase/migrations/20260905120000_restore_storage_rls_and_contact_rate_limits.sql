/*
# Restore real authorization on the self-hosted stack

## Overview
The VPS database had drifted far from this repository. Verified live before changing
anything:

- `is_admin()` was a stub returning `auth.role() = 'authenticated'`, so every logged-in
  user counted as an admin. `admin_users` did not exist at all.
- GoTrue has `DISABLE_SIGNUP=false`, so anyone could register and immediately inherit
  those admin rights.
- `contact_messages` carried `Public read contact_messages` (SELECT to `public`), so every
  submitted message was world-readable, plus `Public insert contact` and an
  `Admin contact_messages` policy whose USING clause was literally `true`.
- `storage.objects` and `storage.buckets` carried `Allow all ... USING (true) WITH CHECK
  (true)` for `public`, and `Authenticated upload media objects` gated only on being
  logged in.
- `contact_rate_limits` was missing, so the submit-contact edge function could not run.

## Data safety
No rows are read, modified or deleted. Storage grants are narrowed rather than reset:
only INSERT/UPDATE/DELETE are revoked from `anon`, leaving USAGE and SELECT so public
object serving keeps working. CHECK constraints are NOT VALID so existing rows stand.
The admin seed aborts the transaction rather than risk locking the owner out.
*/


-- 1. Real admin registry ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_admin_users" ON public.admin_users;
CREATE POLICY "admin_read_admin_users" ON public.admin_users FOR SELECT
  TO authenticated USING (auth.uid() = id);

INSERT INTO public.admin_users (id)
SELECT id FROM auth.users WHERE email = 'anovyk@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Abort rather than lock the owner out of their own admin panel.
DO $$
BEGIN
  IF (SELECT count(*) FROM public.admin_users) = 0 THEN
    RAISE EXCEPTION 'admin_users seed produced no rows - aborting';
  END IF;
END $$;

-- 2. is_admin() stops meaning "any logged-in user" ----------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()) $$;

-- 3. contact_messages ---------------------------------------------------
DROP POLICY IF EXISTS "Public read contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Public insert contact"        ON public.contact_messages;
DROP POLICY IF EXISTS "Admin contact_messages"       ON public.contact_messages;

CREATE POLICY "admin_read_contact_messages"   ON public.contact_messages FOR SELECT
  TO authenticated USING (public.is_admin());
CREATE POLICY "admin_update_contact_messages" ON public.contact_messages FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_delete_contact_messages" ON public.contact_messages FOR DELETE
  TO authenticated USING (public.is_admin());
-- No INSERT policy: the submit-contact edge function writes via service_role.

CREATE TABLE IF NOT EXISTS public.contact_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.contact_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_contact_rate_limits_ip      ON public.contact_rate_limits(ip);
CREATE INDEX IF NOT EXISTS idx_contact_rate_limits_created ON public.contact_rate_limits(created_at);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='contact_messages_name_len_check') THEN
    ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_name_len_check
      CHECK (char_length(btrim(name)) BETWEEN 1 AND 100) NOT VALID; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='contact_messages_email_len_check') THEN
    ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_email_len_check
      CHECK (char_length(btrim(email)) BETWEEN 1 AND 254) NOT VALID; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='contact_messages_subject_len_check') THEN
    ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_subject_len_check
      CHECK (subject IS NULL OR char_length(subject) <= 200) NOT VALID; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='contact_messages_message_len_check') THEN
    ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_message_len_check
      CHECK (char_length(btrim(message)) BETWEEN 1 AND 5000) NOT VALID; END IF;
END $$;

-- 4. Storage -------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all on storage objects"        ON storage.objects;
DROP POLICY IF EXISTS "Allow all on storage buckets"        ON storage.buckets;
DROP POLICY IF EXISTS "Authenticated upload media objects"  ON storage.objects;
-- "Public read media objects" is deliberately kept: it serves the site.

CREATE POLICY "admin_insert_media" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id='media' AND public.is_admin());
CREATE POLICY "admin_update_media" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id='media' AND public.is_admin())
  WITH CHECK (bucket_id='media' AND public.is_admin());
CREATE POLICY "admin_delete_media" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id='media' AND public.is_admin());

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON storage.objects FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON storage.buckets FROM anon;
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
GRANT SELECT ON storage.objects, storage.buckets TO anon, authenticated;
GRANT ALL ON storage.objects, storage.buckets TO service_role;


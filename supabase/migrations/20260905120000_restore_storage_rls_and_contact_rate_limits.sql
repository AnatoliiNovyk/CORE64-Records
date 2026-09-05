/*
# Restore storage RLS, add contact_rate_limits, harden contact_messages (self-hosted VPS)

## Overview
The self-hosted database on the VPS drifted from this repository:

1. `contact_rate_limits` was never created there — `vps_migration_public.sql` omitted it.
   The `submit-contact` edge function queries it first, so the contact form cannot work
   until the table exists.
2. `20260801160000_harden_contact_messages.sql` was never applied there, so the anonymous
   INSERT policy on `contact_messages` and the missing length limits are still in place.
3. An operations script applied `FOR ALL USING (true) WITH CHECK (true)` policies to
   `storage.objects` and `storage.buckets` plus `GRANT ALL ... TO anon`, which undid
   `20260630141943_restrict_storage_listing.sql`. Storage currently accepts anonymous
   writes and deletes.

This migration is idempotent and safe to re-run.

## Data safety
- No rows are read, modified or deleted.
- Storage GRANT changes are deliberately narrow: only INSERT/UPDATE/DELETE are revoked
  from `anon`. `USAGE` on the schema and `SELECT` are left intact so that public object
  serving and any existing read paths keep working.
- The CHECK constraints are added NOT VALID so pre-existing rows are untouched.
*/

-- ============================================================
-- 1. contact_rate_limits (required by the submit-contact function)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contact_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.contact_rate_limits ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: deny-all for anon/authenticated. The edge function uses the
-- service role, which bypasses RLS.

CREATE INDEX IF NOT EXISTS idx_contact_rate_limits_ip ON public.contact_rate_limits(ip);
CREATE INDEX IF NOT EXISTS idx_contact_rate_limits_created ON public.contact_rate_limits(created_at);

-- ============================================================
-- 2. contact_messages: revoke the direct anonymous write path
-- ============================================================
DROP POLICY IF EXISTS "public_insert_contact_messages" ON public.contact_messages;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_name_len_check') THEN
    ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_name_len_check
      CHECK (char_length(btrim(name)) BETWEEN 1 AND 100) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_email_len_check') THEN
    ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_email_len_check
      CHECK (char_length(btrim(email)) BETWEEN 1 AND 254) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_subject_len_check') THEN
    ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_subject_len_check
      CHECK (subject IS NULL OR char_length(subject) <= 200) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_message_len_check') THEN
    ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_message_len_check
      CHECK (char_length(btrim(message)) BETWEEN 1 AND 5000) NOT VALID;
  END IF;
END $$;

-- ============================================================
-- 3. Storage: remove the anonymous free-for-all
-- ============================================================
DROP POLICY IF EXISTS "Allow all on storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow all on storage buckets" ON storage.buckets;

-- Narrow revoke: keep USAGE and SELECT, drop write rights from anonymous callers.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON storage.objects FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON storage.buckets FROM anon;

-- Make sure the roles storage-api relies on still have what they need.
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
GRANT SELECT ON storage.objects, storage.buckets TO anon, authenticated;
GRANT ALL ON storage.objects, storage.buckets TO service_role;

-- Admin-only writes on the media bucket, matching the repository migrations.
DROP POLICY IF EXISTS "admin_list_media" ON storage.objects;
CREATE POLICY "admin_list_media" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'media' AND public.is_admin());

DROP POLICY IF EXISTS "admin_upload_media" ON storage.objects;
CREATE POLICY "admin_upload_media" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'media' AND public.is_admin());

DROP POLICY IF EXISTS "admin_update_media" ON storage.objects;
CREATE POLICY "admin_update_media" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'media' AND public.is_admin())
  WITH CHECK (bucket_id = 'media' AND public.is_admin());

DROP POLICY IF EXISTS "admin_delete_media" ON storage.objects;
CREATE POLICY "admin_delete_media" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'media' AND public.is_admin());

-- The 'media' bucket stays public, so anonymous reads continue to be served through
-- /storage/v1/object/public/... without needing a SELECT policy here.

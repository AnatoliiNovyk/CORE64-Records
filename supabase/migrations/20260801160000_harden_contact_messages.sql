/*
# Harden contact_messages against direct anonymous writes

## Overview
The contact form previously had two write paths: the `submit-contact` edge
function (which enforces rate limiting, reCAPTCHA and field-length limits) and
a direct client-side INSERT permitted by the `public_insert_contact_messages`
RLS policy. Because the second path existed, all three protections were
optional — any client could POST straight to PostgREST and skip them.

This migration removes the direct path and adds field-length limits at the
database level so the constraints hold regardless of which caller writes.

## Changes
1. Drop the `public_insert_contact_messages` policy. With no INSERT policy,
   anon and authenticated roles can no longer write to contact_messages.
   The edge function is unaffected: it uses the service role, which bypasses
   RLS.
2. Add CHECK constraints mirroring the edge function's limits:
   - name: non-empty, <= 100 chars
   - email: non-empty, <= 254 chars
   - subject: <= 200 chars (nullable)
   - message: non-empty, <= 5000 chars

## Data safety
- No rows are modified or deleted.
- The CHECK constraints are added as NOT VALID so pre-existing rows (which may
  predate the limits) are left untouched while every new INSERT/UPDATE is
  enforced. After confirming legacy rows comply, they can be promoted with:
    ALTER TABLE contact_messages VALIDATE CONSTRAINT contact_messages_name_len_check;
    ALTER TABLE contact_messages VALIDATE CONSTRAINT contact_messages_email_len_check;
    ALTER TABLE contact_messages VALIDATE CONSTRAINT contact_messages_subject_len_check;
    ALTER TABLE contact_messages VALIDATE CONSTRAINT contact_messages_message_len_check;

## Rollback
Re-create the policy from 20260801000000_rebuild_schema_to_match_codebase.sql
if the client-side insert path ever needs to be restored (not recommended).
*/

-- ============================================================
-- 1. Revoke the direct anonymous insert path
-- ============================================================
DROP POLICY IF EXISTS "public_insert_contact_messages" ON contact_messages;

-- ============================================================
-- 2. Enforce field lengths at the database level
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_name_len_check') THEN
    ALTER TABLE contact_messages
      ADD CONSTRAINT contact_messages_name_len_check
      CHECK (char_length(btrim(name)) BETWEEN 1 AND 100) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_email_len_check') THEN
    ALTER TABLE contact_messages
      ADD CONSTRAINT contact_messages_email_len_check
      CHECK (char_length(btrim(email)) BETWEEN 1 AND 254) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_subject_len_check') THEN
    ALTER TABLE contact_messages
      ADD CONSTRAINT contact_messages_subject_len_check
      CHECK (subject IS NULL OR char_length(subject) <= 200) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_message_len_check') THEN
    ALTER TABLE contact_messages
      ADD CONSTRAINT contact_messages_message_len_check
      CHECK (char_length(btrim(message)) BETWEEN 1 AND 5000) NOT VALID;
  END IF;
END $$;

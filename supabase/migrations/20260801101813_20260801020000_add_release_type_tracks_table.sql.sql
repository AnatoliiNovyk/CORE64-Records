/*
# Add Release Type + Tracks Table

## Overview
Extends the releases system to support three release types (Single, EP, Album)
and adds a dedicated `tracks` table so EP/Album releases can hold multiple
audio tracks with ordering, duration, and audio file URLs.

## Changes

### Modified Tables
- `releases`
  - Adds `release_type` column (text, NOT NULL, default 'single')
  - Valid values: 'single' | 'ep' | 'album'
  - All existing releases are set to 'single'
  - Adds a CHECK constraint to enforce valid release types

### New Tables
- `tracks`
  - `id` (uuid, primary key)
  - `release_id` (uuid, references releases.id ON DELETE CASCADE)
  - `title` (text, not null)
  - `duration` (integer, nullable, stores seconds; null until audio metadata read)
  - `audio_url` (text, nullable, public storage URL of the uploaded audio file)
  - `track_number` (integer, not null, default 1, ordering within a release)
  - `created_at` (timestamptz, default now())

### Indexes
- `tracks_release_id_idx` on tracks(release_id) for fast per-release lookups
- `tracks_release_order_idx` on tracks(release_id, track_number) for ordered fetches

### Security (RLS)
- `tracks` table: RLS enabled
  - SELECT: public (anon + authenticated) — visitors can browse track lists
  - INSERT/UPDATE/DELETE: admin-only via public.is_admin()

## Notes
1. Existing releases are automatically marked as 'single'.
2. The tracks table is a child of releases; deleting a release cascades to its tracks.
3. Single releases are expected to have exactly one track row (enforced at the
   application layer via zod validation, not at the DB level, so legacy releases
   without any tracks remain valid).
*/

-- ============================================================
-- releases: add release_type column
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'releases'
      AND column_name = 'release_type'
  ) THEN
    ALTER TABLE releases ADD COLUMN release_type text NOT NULL DEFAULT 'single';
  END IF;
END $$;

-- Backfill any nulls / set existing rows to single (safe to re-run)
UPDATE releases SET release_type = 'single' WHERE release_type IS NULL OR release_type NOT IN ('single', 'ep', 'album');

-- Enforce valid release types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'releases_release_type_check'
  ) THEN
    ALTER TABLE releases
      ADD CONSTRAINT releases_release_type_check
      CHECK (release_type IN ('single', 'ep', 'album'));
  END IF;
END $$;

-- ============================================================
-- tracks table
-- ============================================================
CREATE TABLE IF NOT EXISTS tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  title text NOT NULL,
  duration integer,
  audio_url text,
  track_number integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS tracks_release_id_idx ON tracks(release_id);
CREATE INDEX IF NOT EXISTS tracks_release_order_idx ON tracks(release_id, track_number);

-- Public read (anon + authenticated) so the landing page can list tracks
DROP POLICY IF EXISTS "public_select_tracks" ON tracks;
CREATE POLICY "public_select_tracks" ON tracks FOR SELECT
  TO anon, authenticated USING (true);

-- Admin-only writes
DROP POLICY IF EXISTS "admin_insert_tracks" ON tracks;
CREATE POLICY "admin_insert_tracks" ON tracks FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_tracks" ON tracks;
CREATE POLICY "admin_update_tracks" ON tracks FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_tracks" ON tracks;
CREATE POLICY "admin_delete_tracks" ON tracks FOR DELETE
  TO authenticated USING (public.is_admin());

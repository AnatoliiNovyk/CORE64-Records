/*
# Add music_links column to producers table

## Overview
Adds a `music_links` JSONB column to the `producers` table to store music platform
profile URLs (Spotify, Apple Music, Amazon Music, SoundCloud, Beatport, etc.)
separately from social media links.

## Modified Tables
- `producers`
  - Added `music_links` (jsonb, default '{}') - stores music platform URLs as key-value pairs
    Keys: spotify, apple_music, amazon_music, soundcloud, beatport, youtube_music, tidal, deezer, bandcamp

## Security
- No RLS changes needed — existing policies on `producers` already cover all operations.

## Notes
- The column uses the same JSONB pattern as existing `social_links`.
- Default is an empty JSON object so existing rows are unaffected.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'producers' AND column_name = 'music_links'
  ) THEN
    ALTER TABLE producers ADD COLUMN music_links jsonb DEFAULT '{}';
  END IF;
END $$;

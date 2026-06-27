/*
# Add multilingual content support

## Overview
Adds a `value_uk` column to the `site_content` table and a `translations` JSONB column
to all content entity tables to support Ukrainian + English bilingual content management.

## Modified Tables

### site_content
- Added `value_uk` (text, default '') - Ukrainian translation of the content value.
  The existing `value` column stores English content.

### releases
- Added `translations` (jsonb, default '{}') - Stores per-language translations for
  title and description: {"uk": {"title": "...", "description": "..."}}

### events
- Added `translations` (jsonb, default '{}') - Stores per-language translations for
  title, description, venue: {"uk": {"title": "...", "description": "...", "venue": "..."}}

### producers
- Added `translations` (jsonb, default '{}') - Stores per-language translations for
  bio: {"uk": {"bio": "..."}}

### videos
- Added `translations` (jsonb, default '{}') - Stores per-language translations for
  title, description: {"uk": {"title": "...", "description": "..."}}

### photos
- Added `translations` (jsonb, default '{}') - Stores per-language translations for
  title, caption: {"uk": {"title": "...", "caption": "..."}}

### partners
- Added `translations` (jsonb, default '{}') - Stores per-language translations for
  name: {"uk": {"name": "..."}}

## Security
- No RLS changes needed - existing policies cover all operations on these tables.

## Notes
1. The `value` column in site_content remains as the English (default) value.
2. The `value_uk` column is separate for site_content because it's a simple key-value store.
3. Entity tables use JSONB `translations` for flexibility - any language can be added later.
4. Default value '{}' ensures backward compatibility with existing data.
5. English content stays in the original columns; translations JSONB holds other languages.
*/

-- site_content: add Ukrainian value column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_content' AND column_name = 'value_uk'
  ) THEN
    ALTER TABLE site_content ADD COLUMN value_uk text DEFAULT '';
  END IF;
END $$;

-- releases: add translations column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'releases' AND column_name = 'translations'
  ) THEN
    ALTER TABLE releases ADD COLUMN translations jsonb DEFAULT '{}';
  END IF;
END $$;

-- events: add translations column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'translations'
  ) THEN
    ALTER TABLE events ADD COLUMN translations jsonb DEFAULT '{}';
  END IF;
END $$;

-- producers: add translations column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'producers' AND column_name = 'translations'
  ) THEN
    ALTER TABLE producers ADD COLUMN translations jsonb DEFAULT '{}';
  END IF;
END $$;

-- videos: add translations column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'translations'
  ) THEN
    ALTER TABLE videos ADD COLUMN translations jsonb DEFAULT '{}';
  END IF;
END $$;

-- photos: add translations column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photos' AND column_name = 'translations'
  ) THEN
    ALTER TABLE photos ADD COLUMN translations jsonb DEFAULT '{}';
  END IF;
END $$;

-- partners: add translations column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'translations'
  ) THEN
    ALTER TABLE partners ADD COLUMN translations jsonb DEFAULT '{}';
  END IF;
END $$;

/*
# CORE64 Records -- Full Schema

## Overview
Complete database schema for the CORE64 Records music label website.
Includes content management, releases catalog, producers, events, media, partners, and contact messages.

## New Tables

### site_content
Stores all editable text and image content for the landing page.
- `id` (uuid, primary key)
- `section_key` (text, unique) - identifies which part of the site this content belongs to (e.g. "home_hero_title")
- `content_type` (text) - "text", "image", or "html"
- `value` (text) - the actual content string or image URL
- `label` (text) - human-readable description for the admin panel
- `sort_order` (int) - ordering within groups
- `created_at`, `updated_at` (timestamps)

### releases
Music release catalog entries.
- `id` (uuid, primary key)
- `title` (text) - release title
- `catalog_number` (text) - catalog identifier (e.g. "CORE64-001")
- `artist_name` (text) - primary artist name
- `genre` (text) - neurofunk, dnb, breakbeat, techstep
- `release_date` (date)
- `cover_art_url` (text) - URL to cover image
- `description` (text) - release description
- `buy_link` (text) - purchase link
- `stream_links` (jsonb) - JSON object with streaming platform URLs
- `sort_order` (int), `is_visible` (boolean)
- `created_at` (timestamp)

### producers
Artist/producer roster.
- `id` (uuid, primary key)
- `name` (text) - producer name
- `slug` (text, unique) - URL-friendly identifier
- `bio` (text) - biography
- `avatar_url` (text) - profile image URL
- `genres` (jsonb) - array of genre tags
- `social_links` (jsonb) - JSON object of social media URLs
- `sort_order` (int), `is_visible` (boolean)
- `created_at` (timestamp)

### videos
YouTube video embeds.
- `id` (uuid, primary key)
- `title` (text) - video title
- `youtube_url` (text) - full YouTube URL
- `description` (text)
- `sort_order` (int), `is_visible` (boolean)
- `created_at` (timestamp)

### photos
Photo gallery images.
- `id` (uuid, primary key)
- `title` (text) - photo title
- `image_url` (text) - image URL
- `caption` (text) - photo caption
- `category` (text) - grouping category
- `sort_order` (int), `is_visible` (boolean)
- `created_at` (timestamp)

### events
Upcoming and past events.
- `id` (uuid, primary key)
- `title` (text) - event name
- `date` (timestamptz) - event date and time
- `venue` (text) - venue name
- `city` (text) - city
- `description` (text)
- `image_url` (text) - event flyer/image
- `ticket_link` (text) - ticket purchase URL
- `lineup` (jsonb) - array of lineup entries
- `is_visible` (boolean)
- `created_at` (timestamp)

### partners
Friends, partners, and sponsors.
- `id` (uuid, primary key)
- `name` (text) - partner name
- `logo_url` (text) - partner logo URL
- `website_url` (text) - partner website
- `category` (text) - "friend", "partner", or "sponsor"
- `sort_order` (int), `is_visible` (boolean)
- `created_at` (timestamp)

### contact_messages
Contact form submissions from site visitors.
- `id` (uuid, primary key)
- `name` (text) - sender name
- `email` (text) - sender email
- `subject` (text) - message subject
- `message` (text) - message body
- `is_read` (boolean) - admin read status
- `created_at` (timestamp)

## Security
- RLS enabled on ALL tables.
- Public (anon + authenticated) SELECT on content tables (site_content, releases, producers, videos, photos, events, partners) for landing page display.
- Public INSERT on contact_messages for form submissions.
- Full CRUD for authenticated users (admin) on all tables.

## Notes
- The admin panel uses Supabase Auth (email/password) for authentication.
- All content tables have `sort_order` and `is_visible` for admin control.
- `site_content` acts as a key-value store for all editable page text/images.
*/

-- site_content table
CREATE TABLE IF NOT EXISTS site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  content_type text NOT NULL DEFAULT 'text',
  value text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_site_content" ON site_content;
CREATE POLICY "public_read_site_content" ON site_content FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_site_content" ON site_content;
CREATE POLICY "admin_insert_site_content" ON site_content FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_site_content" ON site_content;
CREATE POLICY "admin_update_site_content" ON site_content FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_site_content" ON site_content;
CREATE POLICY "admin_delete_site_content" ON site_content FOR DELETE
  TO authenticated USING (true);

-- releases table
CREATE TABLE IF NOT EXISTS releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  catalog_number text,
  artist_name text NOT NULL,
  genre text NOT NULL DEFAULT 'dnb',
  release_date date,
  cover_art_url text,
  description text,
  buy_link text,
  stream_links jsonb DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE releases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_releases" ON releases;
CREATE POLICY "public_read_releases" ON releases FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_releases" ON releases;
CREATE POLICY "admin_insert_releases" ON releases FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_releases" ON releases;
CREATE POLICY "admin_update_releases" ON releases FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_releases" ON releases;
CREATE POLICY "admin_delete_releases" ON releases FOR DELETE
  TO authenticated USING (true);

-- producers table
CREATE TABLE IF NOT EXISTS producers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  bio text,
  avatar_url text,
  genres jsonb DEFAULT '[]',
  social_links jsonb DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE producers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_producers" ON producers;
CREATE POLICY "public_read_producers" ON producers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_producers" ON producers;
CREATE POLICY "admin_insert_producers" ON producers FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_producers" ON producers;
CREATE POLICY "admin_update_producers" ON producers FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_producers" ON producers;
CREATE POLICY "admin_delete_producers" ON producers FOR DELETE
  TO authenticated USING (true);

-- videos table
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  youtube_url text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_videos" ON videos;
CREATE POLICY "public_read_videos" ON videos FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_videos" ON videos;
CREATE POLICY "admin_insert_videos" ON videos FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_videos" ON videos;
CREATE POLICY "admin_update_videos" ON videos FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_videos" ON videos;
CREATE POLICY "admin_delete_videos" ON videos FOR DELETE
  TO authenticated USING (true);

-- photos table
CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  image_url text NOT NULL,
  caption text,
  category text DEFAULT 'general',
  sort_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_photos" ON photos;
CREATE POLICY "public_read_photos" ON photos FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_photos" ON photos;
CREATE POLICY "admin_insert_photos" ON photos FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_photos" ON photos;
CREATE POLICY "admin_update_photos" ON photos FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_photos" ON photos;
CREATE POLICY "admin_delete_photos" ON photos FOR DELETE
  TO authenticated USING (true);

-- events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date timestamptz NOT NULL,
  venue text,
  city text,
  description text,
  image_url text,
  ticket_link text,
  lineup jsonb DEFAULT '[]',
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_events" ON events;
CREATE POLICY "public_read_events" ON events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_events" ON events;
CREATE POLICY "admin_insert_events" ON events FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_events" ON events;
CREATE POLICY "admin_update_events" ON events FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_events" ON events;
CREATE POLICY "admin_delete_events" ON events FOR DELETE
  TO authenticated USING (true);

-- partners table
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  website_url text,
  category text NOT NULL DEFAULT 'partner',
  sort_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_partners" ON partners;
CREATE POLICY "public_read_partners" ON partners FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_partners" ON partners;
CREATE POLICY "admin_insert_partners" ON partners FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_partners" ON partners;
CREATE POLICY "admin_update_partners" ON partners FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_partners" ON partners;
CREATE POLICY "admin_delete_partners" ON partners FOR DELETE
  TO authenticated USING (true);

-- contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_contact_messages" ON contact_messages;
CREATE POLICY "public_insert_contact_messages" ON contact_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_contact_messages" ON contact_messages;
CREATE POLICY "admin_read_contact_messages" ON contact_messages FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_contact_messages" ON contact_messages;
CREATE POLICY "admin_update_contact_messages" ON contact_messages FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_contact_messages" ON contact_messages;
CREATE POLICY "admin_delete_contact_messages" ON contact_messages FOR DELETE
  TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_site_content_section_key ON site_content(section_key);
CREATE INDEX IF NOT EXISTS idx_releases_genre ON releases(genre);
CREATE INDEX IF NOT EXISTS idx_releases_sort ON releases(sort_order);
CREATE INDEX IF NOT EXISTS idx_producers_slug ON producers(slug);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_partners_category ON partners(category);
CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON contact_messages(is_read);

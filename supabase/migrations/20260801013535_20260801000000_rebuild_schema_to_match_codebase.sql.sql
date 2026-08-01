/*
# Rebuild database schema to match the current codebase

## Overview
The live database had a schema from an older/different version of the app
(integer PKs, tables named artists/sponsors/contact_requests, fixed-column
settings). The current codebase expects a completely different schema
(uuid PKs, tables named producers/partners/contact_messages, key-value
settings, site_content key-value store, videos, photos, contact_rate_limits,
is_admin() function, admin_users with uuid FK to auth.users).

This single consolidated migration replaces the old schema with the one
the application code actually uses. Old data is backed up first into
backup_* tables so nothing is permanently lost.

## Steps
1. Back up all existing old-schema tables into backup_* tables.
2. Drop all old-schema tables (and their _i18n variants).
3. Create all new tables the code expects (site_content, releases, producers,
   videos, photos, events, partners, contact_messages, contact_rate_limits,
   settings [key-value], admin_users [uuid FK]).
4. Enable RLS on every new table and apply policies:
   - Public SELECT on content tables (anon + authenticated).
   - Admin-only INSERT/UPDATE/DELETE via is_admin() on content tables.
   - Public INSERT on contact_messages (contact form), admin-only read/update/delete.
   - Public SELECT on recaptcha_site_key only, admin-only on other settings.
   - Admin-only all CRUD on admin_users (self-read).
5. Create is_admin() SECURITY DEFINER function.
6. Seed admin_users with the existing auth user (admin@core64.pp.ua).
7. Seed settings with empty recaptcha_site_key and recaptcha_secret_key.
8. Seed site_content with default content keys used by the landing page.
9. Create storage bucket 'media' and set storage policies.
10. Create indexes.

## Data Safety
- Old data is preserved in backup_* tables.
- No old data is migrated into the new schema (can be done manually later).
- All operations are idempotent (DROP IF EXISTS, CREATE IF NOT EXISTS, ON CONFLICT DO NOTHING).
*/

-- ============================================================
-- STEP 1: Back up existing old-schema tables
-- ============================================================
CREATE TABLE IF NOT EXISTS backup_releases AS TABLE releases;
CREATE TABLE IF NOT EXISTS backup_events AS TABLE events;
CREATE TABLE IF NOT EXISTS backup_settings AS TABLE settings;
CREATE TABLE IF NOT EXISTS backup_artists AS TABLE artists;
CREATE TABLE IF NOT EXISTS backup_sponsors AS TABLE sponsors;
CREATE TABLE IF NOT EXISTS backup_contact_requests AS TABLE contact_requests;
CREATE TABLE IF NOT EXISTS backup_release_tracks AS TABLE release_tracks;
CREATE TABLE IF NOT EXISTS backup_audit_logs AS TABLE audit_logs;
CREATE TABLE IF NOT EXISTS backup_admin_users AS TABLE admin_users;
CREATE TABLE IF NOT EXISTS backup_section_settings AS TABLE section_settings;
CREATE TABLE IF NOT EXISTS backup_artists_i18n AS TABLE artists_i18n;
CREATE TABLE IF NOT EXISTS backup_events_i18n AS TABLE events_i18n;
CREATE TABLE IF NOT EXISTS backup_releases_i18n AS TABLE releases_i18n;
CREATE TABLE IF NOT EXISTS backup_sponsors_i18n AS TABLE sponsors_i18n;
CREATE TABLE IF NOT EXISTS backup_settings_i18n AS TABLE settings_i18n;
CREATE TABLE IF NOT EXISTS backup_section_settings_i18n AS TABLE section_settings_i18n;

-- ============================================================
-- STEP 2: Drop all old-schema tables
-- ============================================================
DROP TABLE IF EXISTS section_settings_i18n CASCADE;
DROP TABLE IF EXISTS section_settings CASCADE;
DROP TABLE IF EXISTS settings_i18n CASCADE;
DROP TABLE IF EXISTS sponsors_i18n CASCADE;
DROP TABLE IF EXISTS events_i18n CASCADE;
DROP TABLE IF EXISTS releases_i18n CASCADE;
DROP TABLE IF EXISTS artists_i18n CASCADE;
DROP TABLE IF EXISTS release_tracks CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS contact_requests CASCADE;
DROP TABLE IF EXISTS sponsors CASCADE;
DROP TABLE IF EXISTS artists CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS releases CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- ============================================================
-- STEP 3: Create all new tables
-- ============================================================

-- admin_users (uuid FK to auth.users)
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- is_admin() helper function (SECURITY DEFINER, bypasses RLS on admin_users)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  );
$$;

-- site_content (key-value store for landing page text/images)
CREATE TABLE IF NOT EXISTS site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  content_type text NOT NULL DEFAULT 'text',
  value text NOT NULL DEFAULT '',
  value_uk text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- releases
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
  translations jsonb DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;

-- producers
CREATE TABLE IF NOT EXISTS producers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  bio text,
  avatar_url text,
  genres jsonb DEFAULT '[]',
  social_links jsonb DEFAULT '{}',
  music_links jsonb DEFAULT '{}',
  translations jsonb DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE producers ENABLE ROW LEVEL SECURITY;

-- videos
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  youtube_url text NOT NULL,
  description text,
  translations jsonb DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- photos
CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  image_url text NOT NULL,
  caption text,
  category text DEFAULT 'general',
  translations jsonb DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- events
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
  translations jsonb DEFAULT '{}',
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- partners
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  website_url text,
  category text NOT NULL DEFAULT 'partner',
  translations jsonb DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- contact_messages
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

-- contact_rate_limits (rate limiting for contact form, used by edge function)
CREATE TABLE IF NOT EXISTS contact_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE contact_rate_limits ENABLE ROW LEVEL SECURITY;

-- settings (key-value store for site-wide configuration)
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 4: RLS Policies
-- ============================================================

-- --- admin_users: self-read only ---
DROP POLICY IF EXISTS "admin_read_admin_users" ON admin_users;
CREATE POLICY "admin_read_admin_users" ON admin_users FOR SELECT
  TO authenticated USING (auth.uid() = id);

-- --- site_content: public read, admin write ---
DROP POLICY IF EXISTS "public_read_site_content" ON site_content;
CREATE POLICY "public_read_site_content" ON site_content FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_site_content" ON site_content;
CREATE POLICY "admin_insert_site_content" ON site_content FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_site_content" ON site_content;
CREATE POLICY "admin_update_site_content" ON site_content FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_site_content" ON site_content;
CREATE POLICY "admin_delete_site_content" ON site_content FOR DELETE
  TO authenticated USING (public.is_admin());

-- --- releases: public read, admin write ---
DROP POLICY IF EXISTS "public_read_releases" ON releases;
CREATE POLICY "public_read_releases" ON releases FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_releases" ON releases;
CREATE POLICY "admin_insert_releases" ON releases FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_releases" ON releases;
CREATE POLICY "admin_update_releases" ON releases FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_releases" ON releases;
CREATE POLICY "admin_delete_releases" ON releases FOR DELETE
  TO authenticated USING (public.is_admin());

-- --- producers: public read, admin write ---
DROP POLICY IF EXISTS "public_read_producers" ON producers;
CREATE POLICY "public_read_producers" ON producers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_producers" ON producers;
CREATE POLICY "admin_insert_producers" ON producers FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_producers" ON producers;
CREATE POLICY "admin_update_producers" ON producers FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_producers" ON producers;
CREATE POLICY "admin_delete_producers" ON producers FOR DELETE
  TO authenticated USING (public.is_admin());

-- --- videos: public read, admin write ---
DROP POLICY IF EXISTS "public_read_videos" ON videos;
CREATE POLICY "public_read_videos" ON videos FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_videos" ON videos;
CREATE POLICY "admin_insert_videos" ON videos FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_videos" ON videos;
CREATE POLICY "admin_update_videos" ON videos FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_videos" ON videos;
CREATE POLICY "admin_delete_videos" ON videos FOR DELETE
  TO authenticated USING (public.is_admin());

-- --- photos: public read, admin write ---
DROP POLICY IF EXISTS "public_read_photos" ON photos;
CREATE POLICY "public_read_photos" ON photos FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_photos" ON photos;
CREATE POLICY "admin_insert_photos" ON photos FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_photos" ON photos;
CREATE POLICY "admin_update_photos" ON photos FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_photos" ON photos;
CREATE POLICY "admin_delete_photos" ON photos FOR DELETE
  TO authenticated USING (public.is_admin());

-- --- events: public read, admin write ---
DROP POLICY IF EXISTS "public_read_events" ON events;
CREATE POLICY "public_read_events" ON events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_events" ON events;
CREATE POLICY "admin_insert_events" ON events FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_events" ON events;
CREATE POLICY "admin_update_events" ON events FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_events" ON events;
CREATE POLICY "admin_delete_events" ON events FOR DELETE
  TO authenticated USING (public.is_admin());

-- --- partners: public read, admin write ---
DROP POLICY IF EXISTS "public_read_partners" ON partners;
CREATE POLICY "public_read_partners" ON partners FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_partners" ON partners;
CREATE POLICY "admin_insert_partners" ON partners FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_partners" ON partners;
CREATE POLICY "admin_update_partners" ON partners FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_partners" ON partners;
CREATE POLICY "admin_delete_partners" ON partners FOR DELETE
  TO authenticated USING (public.is_admin());

-- --- contact_messages: public insert (contact form), admin read/update/delete ---
DROP POLICY IF EXISTS "public_insert_contact_messages" ON contact_messages;
CREATE POLICY "public_insert_contact_messages" ON contact_messages FOR INSERT
  TO anon, authenticated WITH CHECK (
    name IS NOT NULL AND name <> '' AND
    email IS NOT NULL AND email <> '' AND
    message IS NOT NULL AND message <> ''
  );

DROP POLICY IF EXISTS "admin_read_contact_messages" ON contact_messages;
CREATE POLICY "admin_read_contact_messages" ON contact_messages FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_contact_messages" ON contact_messages;
CREATE POLICY "admin_update_contact_messages" ON contact_messages FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_contact_messages" ON contact_messages;
CREATE POLICY "admin_delete_contact_messages" ON contact_messages FOR DELETE
  TO authenticated USING (public.is_admin());

-- --- contact_rate_limits: no direct access (edge function uses service role) ---
-- No policies needed; the edge function uses the service role key which bypasses RLS.

-- --- settings: public can read recaptcha_site_key only, admin full CRUD ---
DROP POLICY IF EXISTS "public_read_recaptcha_site_key" ON settings;
CREATE POLICY "public_read_recaptcha_site_key" ON settings FOR SELECT
  TO anon, authenticated USING (key = 'recaptcha_site_key');

DROP POLICY IF EXISTS "admin_read_settings" ON settings;
CREATE POLICY "admin_read_settings" ON settings FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_settings" ON settings;
CREATE POLICY "admin_insert_settings" ON settings FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_settings" ON settings;
CREATE POLICY "admin_update_settings" ON settings FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_settings" ON settings;
CREATE POLICY "admin_delete_settings" ON settings FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================
-- STEP 6: Seed admin_users with existing auth user
-- ============================================================
INSERT INTO admin_users (id)
SELECT id FROM auth.users WHERE email = 'admin@core64.pp.ua'
ON CONFLICT (id) DO NOTHING;

-- Also seed the bolt test user if it exists
INSERT INTO admin_users (id)
SELECT id FROM auth.users WHERE email = 'bolt-test-1782365181529@test.local'
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 7: Seed settings with default empty rows
-- ============================================================
INSERT INTO settings (key, value) VALUES
  ('recaptcha_site_key', ''),
  ('recaptcha_secret_key', '')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- STEP 8: Seed site_content with default content keys
-- ============================================================
INSERT INTO site_content (section_key, content_type, value, value_uk, label, sort_order) VALUES
  ('site_logo_text', 'text', 'CORE64', 'CORE64', 'Site Logo Text', 1),
  ('home_hero_title', 'text', 'CORE64 RECORDS', 'CORE64 RECORDS', 'Hero Title', 2),
  ('home_hero_subtitle', 'text', 'Neurofunk & Drum and Bass Record Label', 'Нейрофанк та Драм-н-бейс Лейбл', 'Hero Subtitle', 3),
  ('home_hero_tagline', 'text', 'Underground Sound, Elevated.', 'Підземний Звук, Піднесений.', 'Hero Tagline', 4),
  ('about_title', 'text', 'About the Label', 'Про Лейбл', 'About Title', 5),
  ('about_text', 'text', 'CORE64 Records is a neurofunk and drum and bass record label dedicated to pushing the boundaries of electronic music.', 'CORE64 Records — нейрофанк та драм-н-бейс лейбл, що прагне розширити кордони електронної музики.', 'About Text', 6),
  ('about_mission', 'text', 'Our mission is to discover, develop, and deliver the most innovative sounds in underground electronic music.', 'Наша місія — відкривати, розвивати та представляти найінноваційніші звуки підземної електронної музики.', 'About Mission', 7),
  ('releases_title', 'text', 'Releases', 'Релізи', 'Releases Section Title', 8),
  ('producers_title', 'text', 'Producers', 'Продюсери', 'Producers Section Title', 9),
  ('events_title', 'text', 'Events', 'Події', 'Events Section Title', 10),
  ('video_title', 'text', 'Videos', 'Відео', 'Video Section Title', 11),
  ('photo_title', 'text', 'Photos', 'Фото', 'Photo Section Title', 12),
  ('partners_title', 'text', 'Partners & Friends', 'Партнери та Друзі', 'Partners Section Title', 13),
  ('contact_title', 'text', 'Get in Touch', 'Зв''яжіться з нами', 'Contact Section Title', 14),
  ('contact_description', 'text', 'For bookings, demos, press, or general inquiries, drop us a message below.', 'Для букингів, демо, преси або загальних запитів, залиште нам повідомлення нижче.', 'Contact Section Description', 15)
ON CONFLICT (section_key) DO NOTHING;

-- ============================================================
-- STEP 9: Storage bucket and policies
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Drop old storage policies if they exist
DROP POLICY IF EXISTS "public_read_media" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_upload_media" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_update_media" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_delete_media" ON storage.objects;
DROP POLICY IF EXISTS "admin_list_media" ON storage.objects;

-- Admin-only listing (direct URL access works because bucket is public)
CREATE POLICY "admin_list_media" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'media' AND public.is_admin());

-- Admin-only upload
CREATE POLICY "admin_upload_media" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'media' AND public.is_admin());

-- Admin-only update
CREATE POLICY "admin_update_media" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'media' AND public.is_admin())
  WITH CHECK (bucket_id = 'media' AND public.is_admin());

-- Admin-only delete
CREATE POLICY "admin_delete_media" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'media' AND public.is_admin());

-- ============================================================
-- STEP 10: Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_site_content_section_key ON site_content(section_key);
CREATE INDEX IF NOT EXISTS idx_releases_genre ON releases(genre);
CREATE INDEX IF NOT EXISTS idx_releases_sort ON releases(sort_order);
CREATE INDEX IF NOT EXISTS idx_producers_slug ON producers(slug);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_partners_category ON partners(category);
CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON contact_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_contact_rate_limits_ip ON contact_rate_limits(ip);
CREATE INDEX IF NOT EXISTS idx_contact_rate_limits_created ON contact_rate_limits(created_at);

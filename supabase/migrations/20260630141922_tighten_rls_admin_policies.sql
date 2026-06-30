/*
# Tighten RLS Policies - Admin-Only Write Access

## Overview
Fixes security issue where ANY authenticated user could INSERT, UPDATE, DELETE
on all content tables. Creates an `admin_users` table and a helper function
`public.is_admin()` that checks whether the current session user is in that table.
All write policies are then scoped to admin users only.

## Changes

### New Tables
- `admin_users` - stores user IDs of administrators
  - `id` (uuid, primary key, references auth.users)
  - `created_at` (timestamptz)

### New Functions
- `public.is_admin()` - returns true if auth.uid() is in admin_users table

### Modified Policies (all content tables)
- INSERT policies: now check `is_admin()` instead of `true`
- UPDATE policies: now check `is_admin()` instead of `true`
- DELETE policies: now check `is_admin()` instead of `true`
- SELECT policies: unchanged (remain public)

### Tables affected:
- site_content, releases, producers, videos, photos, events, partners, contact_messages

### contact_messages special handling:
- INSERT remains open for anon+authenticated (contact form)
- SELECT, UPDATE, DELETE restricted to admins only

## Security
- Only users listed in `admin_users` can modify content
- Public read access preserved for landing page
- Contact form submission preserved for anonymous users
- Admin check uses a dedicated table rather than JWT claims for simplicity

## Notes
1. Existing admin user (anovyk@gmail.com) is seeded into admin_users
2. The is_admin() function uses SECURITY DEFINER to bypass RLS on admin_users lookup
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_admin_users" ON admin_users;
CREATE POLICY "admin_read_admin_users" ON admin_users FOR SELECT
  TO authenticated USING (auth.uid() = id);

-- Seed the existing admin user
INSERT INTO admin_users (id)
SELECT id FROM auth.users WHERE email = 'anovyk@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Create is_admin() helper function
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

-- ============================================================
-- site_content policies
-- ============================================================
DROP POLICY IF EXISTS "admin_insert_site_content" ON site_content;
CREATE POLICY "admin_insert_site_content" ON site_content FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_site_content" ON site_content;
CREATE POLICY "admin_update_site_content" ON site_content FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_site_content" ON site_content;
CREATE POLICY "admin_delete_site_content" ON site_content FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================
-- releases policies
-- ============================================================
DROP POLICY IF EXISTS "admin_insert_releases" ON releases;
CREATE POLICY "admin_insert_releases" ON releases FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_releases" ON releases;
CREATE POLICY "admin_update_releases" ON releases FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_releases" ON releases;
CREATE POLICY "admin_delete_releases" ON releases FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================
-- producers policies
-- ============================================================
DROP POLICY IF EXISTS "admin_insert_producers" ON producers;
CREATE POLICY "admin_insert_producers" ON producers FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_producers" ON producers;
CREATE POLICY "admin_update_producers" ON producers FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_producers" ON producers;
CREATE POLICY "admin_delete_producers" ON producers FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================
-- videos policies
-- ============================================================
DROP POLICY IF EXISTS "admin_insert_videos" ON videos;
CREATE POLICY "admin_insert_videos" ON videos FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_videos" ON videos;
CREATE POLICY "admin_update_videos" ON videos FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_videos" ON videos;
CREATE POLICY "admin_delete_videos" ON videos FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================
-- photos policies
-- ============================================================
DROP POLICY IF EXISTS "admin_insert_photos" ON photos;
CREATE POLICY "admin_insert_photos" ON photos FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_photos" ON photos;
CREATE POLICY "admin_update_photos" ON photos FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_photos" ON photos;
CREATE POLICY "admin_delete_photos" ON photos FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================
-- events policies
-- ============================================================
DROP POLICY IF EXISTS "admin_insert_events" ON events;
CREATE POLICY "admin_insert_events" ON events FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_events" ON events;
CREATE POLICY "admin_update_events" ON events FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_events" ON events;
CREATE POLICY "admin_delete_events" ON events FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================
-- partners policies
-- ============================================================
DROP POLICY IF EXISTS "admin_insert_partners" ON partners;
CREATE POLICY "admin_insert_partners" ON partners FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_partners" ON partners;
CREATE POLICY "admin_update_partners" ON partners FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_partners" ON partners;
CREATE POLICY "admin_delete_partners" ON partners FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================
-- contact_messages policies
-- ============================================================

-- INSERT stays open for anon (contact form), but restrict to basic validation
DROP POLICY IF EXISTS "public_insert_contact_messages" ON contact_messages;
CREATE POLICY "public_insert_contact_messages" ON contact_messages FOR INSERT
  TO anon, authenticated WITH CHECK (
    name IS NOT NULL AND name <> '' AND
    email IS NOT NULL AND email <> '' AND
    message IS NOT NULL AND message <> ''
  );

-- SELECT restricted to admins
DROP POLICY IF EXISTS "admin_read_contact_messages" ON contact_messages;
CREATE POLICY "admin_read_contact_messages" ON contact_messages FOR SELECT
  TO authenticated USING (public.is_admin());

-- UPDATE restricted to admins
DROP POLICY IF EXISTS "admin_update_contact_messages" ON contact_messages;
CREATE POLICY "admin_update_contact_messages" ON contact_messages FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- DELETE restricted to admins
DROP POLICY IF EXISTS "admin_delete_contact_messages" ON contact_messages;
CREATE POLICY "admin_delete_contact_messages" ON contact_messages FOR DELETE
  TO authenticated USING (public.is_admin());

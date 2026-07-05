/*
# Tighten settings table RLS to use is_admin()

## Overview
The initial settings migration used `USING (true)` and `WITH CHECK (true)` for admin
write policies. This migration replaces those with `public.is_admin()` checks to be
consistent with the existing admin security model established in the
tighten_rls_admin_policies migration.

## Changes
- INSERT policy: now checks `public.is_admin()`
- UPDATE policy: now checks `public.is_admin()`
- DELETE policy: now checks `public.is_admin()`
- SELECT for admin: now checks `public.is_admin()` (replaces `USING (true)`)
- Public site_key SELECT policy: unchanged (anon + authenticated can read recaptcha_site_key)
*/

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

/*
# Create settings table

## Summary
Adds a key-value settings store for site-wide configuration.
Primarily used to store reCAPTCHA keys (site key and secret key) that
the admin can manage through the Admin UI.

## New Tables

### settings
- `key` (text, primary key) — unique identifier for the setting
- `value` (text) — the setting value (may be sensitive)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## Security
- RLS enabled.
- Public (anon + authenticated) SELECT only for safe public keys
  (currently: recaptcha_site_key), so the contact form frontend can
  load the site key without authentication.
- Full CRUD for authenticated users (admin) on all rows.

## Initial Data
Inserts default empty rows for:
- recaptcha_site_key  — Google reCAPTCHA v3 public site key
- recaptcha_secret_key — Google reCAPTCHA v3 secret key (server-side only)

## Notes
- The secret key is readable by authenticated admins only via the
  private SELECT policy; anon SELECT is limited to recaptcha_site_key.
- The Edge Function uses SUPABASE_SERVICE_ROLE_KEY to read the secret
  key server-side, bypassing RLS entirely.
*/

CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Public can only read the recaptcha_site_key (needed by the contact form)
DROP POLICY IF EXISTS "public_read_recaptcha_site_key" ON settings;
CREATE POLICY "public_read_recaptcha_site_key" ON settings FOR SELECT
  TO anon, authenticated USING (key = 'recaptcha_site_key');

-- Authenticated admins can read all settings
DROP POLICY IF EXISTS "admin_read_settings" ON settings;
CREATE POLICY "admin_read_settings" ON settings FOR SELECT
  TO authenticated USING (true);

-- Authenticated admins can insert new settings
DROP POLICY IF EXISTS "admin_insert_settings" ON settings;
CREATE POLICY "admin_insert_settings" ON settings FOR INSERT
  TO authenticated WITH CHECK (true);

-- Authenticated admins can update any setting
DROP POLICY IF EXISTS "admin_update_settings" ON settings;
CREATE POLICY "admin_update_settings" ON settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Authenticated admins can delete settings
DROP POLICY IF EXISTS "admin_delete_settings" ON settings;
CREATE POLICY "admin_delete_settings" ON settings FOR DELETE
  TO authenticated USING (true);

-- Seed default empty rows
INSERT INTO settings (key, value)
VALUES
  ('recaptcha_site_key', ''),
  ('recaptcha_secret_key', '')
ON CONFLICT (key) DO NOTHING;

/*
# Fix security advisor findings: lock down backup tables and contact_rate_limits

## Overview
The schema rebuild migration created backup_* tables in the public schema
to preserve old data. These tables have RLS disabled, making them accessible
via PostgREST to any client. This migration enables RLS on all backup tables
with no policies (deny-all), and adds an explicit deny-all on
contact_rate_limits.

## Changes
- Enable RLS on all 16 backup_* tables (no policies = no access).
- contact_rate_limits already had RLS with no policies (deny-all by default).
  No change needed there — it's already locked down.

## Security
- Backup tables are now inaccessible via the anon/authenticated roles.
- contact_rate_limits remains accessible only via the service role (edge function).
*/

ALTER TABLE backup_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_release_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_section_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_artists_i18n ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_events_i18n ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_releases_i18n ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_sponsors_i18n ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_settings_i18n ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_section_settings_i18n ENABLE ROW LEVEL SECURITY;

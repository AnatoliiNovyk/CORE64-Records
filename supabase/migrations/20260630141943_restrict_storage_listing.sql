/*
# Restrict Storage Bucket Listing to Admins

## Overview
The public `media` bucket previously had a broad SELECT policy that allowed
any client to list all files. Public buckets serve files via direct URL without
needing a SELECT policy. This migration restricts file listing to admin users only
while keeping direct URL access working for everyone.

## Changes
- Replaced broad `public_read_media` SELECT policy on storage.objects
- New policy only allows authenticated admin users to list bucket contents
- Direct object URL access remains unaffected (public bucket serves files by URL)

## Security
- Anonymous clients can no longer enumerate all files in the bucket
- Admins can still list files for the admin panel file browser
- Public URL access to specific files is unchanged
*/

DROP POLICY IF EXISTS "public_read_media" ON storage.objects;
CREATE POLICY "admin_list_media" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'media' AND public.is_admin());

-- Create a public storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "authenticated_upload_media" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'media');

-- Allow authenticated users to update their uploads
CREATE POLICY "authenticated_update_media" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'media') WITH CHECK (bucket_id = 'media');

-- Allow authenticated users to delete files
CREATE POLICY "authenticated_delete_media" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'media');

-- Allow public read access to all media files
CREATE POLICY "public_read_media" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'media');

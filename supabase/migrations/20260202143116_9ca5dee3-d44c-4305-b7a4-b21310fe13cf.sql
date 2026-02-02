-- Create storage bucket for site files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-files', 
  'site-files', 
  false,
  52428800, -- 50MB limit
  ARRAY['text/plain', 'text/html', 'text/css', 'text/javascript', 'application/javascript', 'application/json', 'application/xml', 'image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp', 'application/pdf', 'application/zip', 'application/x-tar', 'application/gzip']
);

-- RLS policy: Users can view files for sites they have access to
CREATE POLICY "Users can view files for their sites"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'site-files' 
  AND public.has_site_access(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- RLS policy: Users can upload files to sites they have admin access to
CREATE POLICY "Admins can upload files to their sites"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'site-files' 
  AND public.get_site_role(auth.uid(), (storage.foldername(name))[1]::uuid) IN ('owner', 'admin', 'developer')
);

-- RLS policy: Users can update files for sites they have access to
CREATE POLICY "Admins can update files for their sites"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'site-files' 
  AND public.get_site_role(auth.uid(), (storage.foldername(name))[1]::uuid) IN ('owner', 'admin', 'developer')
);

-- RLS policy: Users can delete files for sites they have admin access to
CREATE POLICY "Admins can delete files from their sites"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'site-files' 
  AND public.get_site_role(auth.uid(), (storage.foldername(name))[1]::uuid) IN ('owner', 'admin')
);
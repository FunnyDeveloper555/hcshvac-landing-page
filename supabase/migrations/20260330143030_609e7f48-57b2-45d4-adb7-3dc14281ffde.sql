
-- Create fileserver storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('fileserver', 'fileserver', true);

-- Storage RLS: anyone can read
CREATE POLICY "Anyone can read fileserver files"
ON storage.objects FOR SELECT
USING (bucket_id = 'fileserver');

-- Storage RLS: authenticated users can upload
CREATE POLICY "Authenticated users can upload to fileserver"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fileserver');

-- Storage RLS: authenticated users can delete
CREATE POLICY "Authenticated users can delete from fileserver"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'fileserver');

-- Create fileserver_items table
CREATE TABLE public.fileserver_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fileserver_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view files
CREATE POLICY "Anyone can view fileserver items"
ON public.fileserver_items FOR SELECT
USING (true);

-- Authenticated users can insert
CREATE POLICY "Authenticated users can insert fileserver items"
ON public.fileserver_items FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users can delete
CREATE POLICY "Authenticated users can delete fileserver items"
ON public.fileserver_items FOR DELETE
TO authenticated
USING (true);

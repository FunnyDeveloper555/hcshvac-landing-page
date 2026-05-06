
-- Add file URL column for certificates uploads
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS resume_certificates_file_url TEXT;

-- Create storage bucket for employee files
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-files', 'employee-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Public can view employee files" ON storage.objects;
CREATE POLICY "Public can view employee files"
ON storage.objects FOR SELECT
USING (bucket_id = 'employee-files');

DROP POLICY IF EXISTS "Authenticated can upload employee files" ON storage.objects;
CREATE POLICY "Authenticated can upload employee files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'employee-files');

DROP POLICY IF EXISTS "Authenticated can update employee files" ON storage.objects;
CREATE POLICY "Authenticated can update employee files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'employee-files');

DROP POLICY IF EXISTS "Authenticated can delete employee files" ON storage.objects;
CREATE POLICY "Authenticated can delete employee files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'employee-files');

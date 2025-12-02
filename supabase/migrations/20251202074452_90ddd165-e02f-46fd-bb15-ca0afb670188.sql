-- Create storage bucket for business CSV imports
INSERT INTO storage.buckets (id, name, public) 
VALUES ('business-imports', 'business-imports', false)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload files to business-imports bucket
CREATE POLICY "Admins can upload to business-imports"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-imports' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to read files from business-imports bucket
CREATE POLICY "Admins can read from business-imports"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-imports' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete files from business-imports bucket
CREATE POLICY "Admins can delete from business-imports"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-imports' 
  AND public.has_role(auth.uid(), 'admin')
);
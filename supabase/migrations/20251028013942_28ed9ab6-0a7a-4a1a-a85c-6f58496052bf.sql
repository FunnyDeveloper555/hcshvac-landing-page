-- Create storage bucket for hero images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hero-images',
  'hero-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
);

-- Storage policies for hero images
CREATE POLICY "Anyone can view hero images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'hero-images');

CREATE POLICY "Admins can upload hero images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'hero-images' 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update hero images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'hero-images' 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete hero images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'hero-images' 
  AND has_role(auth.uid(), 'admin')
);
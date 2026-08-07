DROP POLICY IF EXISTS "Anyone can read fileserver files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to fileserver" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from fileserver" ON storage.objects;

CREATE POLICY "Owner or admin can read fileserver files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'fileserver'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
    OR EXISTS (
      SELECT 1 FROM public.fileserver_items fi
      WHERE fi.storage_path = storage.objects.name
        AND fi.uploaded_by = auth.uid()
    )
  )
);

CREATE POLICY "Authenticated can upload fileserver files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'fileserver');

CREATE POLICY "Owner or admin can delete fileserver files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'fileserver'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
    OR EXISTS (
      SELECT 1 FROM public.fileserver_items fi
      WHERE fi.storage_path = storage.objects.name
        AND fi.uploaded_by = auth.uid()
    )
  )
);

CREATE POLICY "Owner or admin can update fileserver files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'fileserver'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
    OR EXISTS (
      SELECT 1 FROM public.fileserver_items fi
      WHERE fi.storage_path = storage.objects.name
        AND fi.uploaded_by = auth.uid()
    )
  )
);
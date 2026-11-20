DROP POLICY IF EXISTS "Signed-in read finance plans" ON public.finance_plans;
DROP POLICY IF EXISTS "Anyone can upload vendor logos" ON storage.objects;
CREATE POLICY "Staff can upload vendor logos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vendor-logos' AND public.is_staff(auth.uid()));
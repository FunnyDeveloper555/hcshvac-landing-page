
CREATE POLICY "Admins & mods read site-profile-photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'site-profile-photos'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
);

CREATE POLICY "Admins & mods upload site-profile-photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'site-profile-photos'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
);

CREATE POLICY "Admins & mods update site-profile-photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'site-profile-photos'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
);

CREATE POLICY "Admins & mods delete site-profile-photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'site-profile-photos'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
);

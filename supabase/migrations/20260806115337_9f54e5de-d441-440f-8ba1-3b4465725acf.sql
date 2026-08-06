DROP POLICY IF EXISTS "Authenticated can delete employee files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update employee files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload employee files" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated can view installations" ON public.installation_records;
DROP POLICY IF EXISTS "Authenticated can insert installations" ON public.installation_records;
DROP POLICY IF EXISTS "Authenticated can update installations" ON public.installation_records;
DROP POLICY IF EXISTS "Authenticated can delete installations" ON public.installation_records;

CREATE POLICY "Admins and moderators can view installations"
ON public.installation_records FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins and moderators can insert installations"
ON public.installation_records FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins and moderators can update installations"
ON public.installation_records FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins and moderators can delete installations"
ON public.installation_records FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
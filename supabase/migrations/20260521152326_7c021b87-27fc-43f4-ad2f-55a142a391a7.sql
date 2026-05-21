
-- 1. admin_modules: authenticated only
DROP POLICY IF EXISTS "Authenticated users can view active modules" ON public.admin_modules;
CREATE POLICY "Authenticated users can view active modules"
  ON public.admin_modules FOR SELECT TO authenticated
  USING (is_active = true);

-- 2. user_groups: authenticated only
DROP POLICY IF EXISTS "Authenticated users can view active groups" ON public.user_groups;
CREATE POLICY "Authenticated users can view active groups"
  ON public.user_groups FOR SELECT TO authenticated
  USING (is_active = true);

-- 3. booking_invitations: drop open SELECT/UPDATE, add token RPCs
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.booking_invitations;
DROP POLICY IF EXISTS "Anyone can update invitation status" ON public.booking_invitations;

CREATE OR REPLACE FUNCTION public.get_booking_invitation_by_token(_token text)
RETURNS SETOF public.booking_invitations
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.booking_invitations
   WHERE token = _token
     AND (expires_at IS NULL OR expires_at > now())
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.mark_booking_invitation_opened(_token text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.booking_invitations
     SET status = CASE WHEN status = 'sent' THEN 'opened' ELSE status END,
         opened_at = COALESCE(opened_at, now())
   WHERE token = _token
     AND (expires_at IS NULL OR expires_at > now());
END; $$;

CREATE OR REPLACE FUNCTION public.complete_booking_invitation(_token text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.booking_invitations
     SET status = 'completed', completed_at = now()
   WHERE token = _token
     AND (expires_at IS NULL OR expires_at > now());
END; $$;

GRANT EXECUTE ON FUNCTION public.get_booking_invitation_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_booking_invitation_opened(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_booking_invitation(text) TO anon, authenticated;

-- 4. hire_invitations: same pattern
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.hire_invitations;
DROP POLICY IF EXISTS "Anyone can update invitation status" ON public.hire_invitations;

CREATE OR REPLACE FUNCTION public.get_hire_invitation_by_token(_token text)
RETURNS SETOF public.hire_invitations
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.hire_invitations
   WHERE token = _token
     AND (expires_at IS NULL OR expires_at > now())
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.mark_hire_invitation_opened(_token text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.hire_invitations
     SET opened_at = COALESCE(opened_at, now())
   WHERE token = _token
     AND (expires_at IS NULL OR expires_at > now());
END; $$;

CREATE OR REPLACE FUNCTION public.complete_hire_invitation(_token text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.hire_invitations
     SET status = 'completed', completed_at = now()
   WHERE token = _token
     AND (expires_at IS NULL OR expires_at > now());
END; $$;

GRANT EXECUTE ON FUNCTION public.get_hire_invitation_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_hire_invitation_opened(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_hire_invitation(text) TO anon, authenticated;

-- 5. companies: hide POC contact columns from anon
REVOKE SELECT (
  poc_first_name, poc_last_name, poc_phone, poc_email, poc_title,
  secondary_poc_first_name, secondary_poc_last_name, secondary_poc_phone,
  secondary_poc_email, secondary_poc_title
) ON public.companies FROM anon;

-- 6. product_reviews: hide reviewer_email from anon
REVOKE SELECT (reviewer_email) ON public.product_reviews FROM anon;

-- 7. content_comments: hide author_email from anon
REVOKE SELECT (author_email) ON public.content_comments FROM anon;

-- 8. product_suppliers: admin only (drop public policy)
DROP POLICY IF EXISTS "Anyone can view active product suppliers" ON public.product_suppliers;

-- 9. employees: admin/moderator only
DROP POLICY IF EXISTS "Anyone can view employees" ON public.employees;
CREATE POLICY "Admins and moderators can view employees"
  ON public.employees FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Public-safe team list (no PII)
CREATE OR REPLACE FUNCTION public.get_public_employees()
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  city text,
  state text
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, first_name, last_name, city, state
    FROM public.employees
   ORDER BY created_at ASC;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_employees() TO anon, authenticated;

-- 10. employee-files bucket: private + admin/moderator only
UPDATE storage.buckets SET public = false WHERE id = 'employee-files';
DROP POLICY IF EXISTS "Public can view employee files" ON storage.objects;
DROP POLICY IF EXISTS "Admins and moderators can view employee files" ON storage.objects;
DROP POLICY IF EXISTS "Admins and moderators can upload employee files" ON storage.objects;
DROP POLICY IF EXISTS "Admins and moderators can update employee files" ON storage.objects;
DROP POLICY IF EXISTS "Admins and moderators can delete employee files" ON storage.objects;

CREATE POLICY "Admins and moderators can view employee files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'employee-files'
         AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role)));
CREATE POLICY "Admins and moderators can upload employee files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'employee-files'
              AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role)));
CREATE POLICY "Admins and moderators can update employee files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'employee-files'
         AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role)));
CREATE POLICY "Admins and moderators can delete employee files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'employee-files'
         AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role)));

-- 11. fileserver_items: uploader or admin
DROP POLICY IF EXISTS "Anyone can view fileserver items" ON public.fileserver_items;
DROP POLICY IF EXISTS "Anyone can delete fileserver items" ON public.fileserver_items;
DROP POLICY IF EXISTS "Authenticated users can delete fileserver items" ON public.fileserver_items;
DROP POLICY IF EXISTS "Authenticated users can insert fileserver items" ON public.fileserver_items;
DROP POLICY IF EXISTS "Owners or admins can view fileserver items" ON public.fileserver_items;
DROP POLICY IF EXISTS "Owners or admins can delete fileserver items" ON public.fileserver_items;
DROP POLICY IF EXISTS "Authenticated users can insert their own fileserver items" ON public.fileserver_items;

CREATE POLICY "Owners or admins can view fileserver items"
  ON public.fileserver_items FOR SELECT TO authenticated
  USING (uploaded_by = auth.uid() OR has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Authenticated users can insert their own fileserver items"
  ON public.fileserver_items FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Owners or admins can delete fileserver items"
  ON public.fileserver_items FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid() OR has_role(auth.uid(),'admin'::app_role));

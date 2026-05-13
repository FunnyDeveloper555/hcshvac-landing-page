-- Replace permissive policies with admin-only access
DROP POLICY IF EXISTS "Authenticated users can view registrations" ON public.customer_registrations;
DROP POLICY IF EXISTS "Authenticated users can update registrations" ON public.customer_registrations;
DROP POLICY IF EXISTS "Authenticated users can delete registrations" ON public.customer_registrations;

CREATE POLICY "Admins can view registrations"
  ON public.customer_registrations
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update registrations"
  ON public.customer_registrations
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete registrations"
  ON public.customer_registrations
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
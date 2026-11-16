DROP POLICY IF EXISTS "Authenticated users can view files" ON public.file_items;
CREATE POLICY "Staff can view files" ON public.file_items FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can view folders" ON public.file_folders;
CREATE POLICY "Staff can view folders" ON public.file_folders FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Staff can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Staff can update tasks" ON public.tasks;
CREATE POLICY "Staff can view tasks" ON public.tasks FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can create tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can view tickets" ON public.tickets;
DROP POLICY IF EXISTS "Staff can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Staff can update tickets" ON public.tickets;
CREATE POLICY "Staff can view tickets" ON public.tickets FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can create tickets" ON public.tickets FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update tickets" ON public.tickets FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff manage notification targets" ON public.notification_targets;
CREATE POLICY "Staff manage notification targets" ON public.notification_targets FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Anyone can submit vendor registration" ON public.vendors;
CREATE POLICY "Anyone can submit vendor registration" ON public.vendors FOR INSERT TO anon, authenticated
  WITH CHECK (length(btrim(coalesce(vendor_name,''))) BETWEEN 1 AND 200 AND our_account_number IS NULL);

DROP POLICY IF EXISTS "Anyone can insert vendor industries" ON public.vendor_industries;
CREATE POLICY "Anyone can insert vendor industries" ON public.vendor_industries FOR INSERT TO anon, authenticated
  WITH CHECK (vendor_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.created_at > now() - interval '1 hour'));

DROP POLICY IF EXISTS "Anyone can submit booking" ON public.service_bookings;
CREATE POLICY "Anyone can submit booking" ON public.service_bookings FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending' AND length(btrim(coalesce(full_name,''))) BETWEEN 1 AND 200);

DROP POLICY IF EXISTS "Anyone can submit registration" ON public.customer_registrations;
CREATE POLICY "Anyone can submit registration" ON public.customer_registrations FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'active' AND staff_escalation_sent_at IS NULL AND last_visit_date IS NULL);

DROP POLICY IF EXISTS "Anyone can submit a review" ON public.product_reviews;
CREATE POLICY "Anyone can submit a review" ON public.product_reviews FOR INSERT TO anon, authenticated
  WITH CHECK (is_approved = false AND is_verified_purchase = false AND rating BETWEEN 1 AND 5);

DROP POLICY IF EXISTS "Anyone can submit hire application" ON public.hire_applications;
CREATE POLICY "Anyone can submit hire application" ON public.hire_applications FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'submitted' AND length(btrim(coalesce(first_name,''))) BETWEEN 1 AND 100);

DROP POLICY IF EXISTS "Authenticated can upload fileserver files" ON storage.objects;
CREATE POLICY "Staff can upload fileserver files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'fileserver' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Anyone can upload vendor logos" ON storage.objects;
CREATE POLICY "Anyone can upload vendor logos" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'vendor-logos' AND (public.is_staff(auth.uid())
    OR name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpe?g|gif|webp|svg)$'));
CREATE TABLE public.installation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customer_registrations(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  supply_vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  completed_by_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  completed_by_name text,
  install_date date,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','sent')),
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.installation_jobs TO authenticated;
GRANT ALL ON public.installation_jobs TO service_role;

ALTER TABLE public.installation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view installation jobs"
  ON public.installation_jobs FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
CREATE POLICY "Admins can insert installation jobs"
  ON public.installation_jobs FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
CREATE POLICY "Admins can update installation jobs"
  ON public.installation_jobs FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
CREATE POLICY "Admins can delete installation jobs"
  ON public.installation_jobs FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));

CREATE TRIGGER update_installation_jobs_updated_at
  BEFORE UPDATE ON public.installation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_install_jobs_customer ON public.installation_jobs(customer_id);
CREATE INDEX idx_install_jobs_appointment ON public.installation_jobs(appointment_id);
CREATE INDEX idx_install_jobs_vendor ON public.installation_jobs(supply_vendor_id);

ALTER TABLE public.installation_records
  ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES public.installation_jobs(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_install_records_job ON public.installation_records(job_id);

ALTER TABLE public.installation_records DROP CONSTRAINT IF EXISTS installation_records_category_check;
ALTER TABLE public.installation_records
  ADD CONSTRAINT installation_records_category_check
  CHECK (category IN ('residential_hvac','commercial_hvac','educational_hvac','industrial_hvac','electrical','plumbing'));

CREATE TABLE public.installation_pickup_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.installation_jobs(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.installation_records(id) ON DELETE CASCADE,
  slot text NOT NULL CHECK (slot IN ('front','left','right','back','top','bottom')),
  storage_path text NOT NULL,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.installation_pickup_photos TO authenticated;
GRANT ALL ON public.installation_pickup_photos TO service_role;

ALTER TABLE public.installation_pickup_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view pickup photos"
  ON public.installation_pickup_photos FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
CREATE POLICY "Admins can insert pickup photos"
  ON public.installation_pickup_photos FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
CREATE POLICY "Admins can update pickup photos"
  ON public.installation_pickup_photos FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
CREATE POLICY "Admins can delete pickup photos"
  ON public.installation_pickup_photos FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));

CREATE INDEX idx_pickup_photos_job ON public.installation_pickup_photos(job_id);
CREATE INDEX idx_pickup_photos_item ON public.installation_pickup_photos(item_id);

CREATE POLICY "Admins can view installation photo files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'installation-photos'
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role)));
CREATE POLICY "Admins can upload installation photo files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'installation-photos'
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role)));
CREATE POLICY "Admins can update installation photo files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'installation-photos'
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role)));
CREATE POLICY "Admins can delete installation photo files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'installation-photos'
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role)));
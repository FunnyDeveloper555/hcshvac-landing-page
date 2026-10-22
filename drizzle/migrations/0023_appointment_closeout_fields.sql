ALTER TABLE public.appointments
  ADD COLUMN visit_summary_notes text,
  ADD COLUMN closure_photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN cancellation_reason text;

COMMENT ON COLUMN public.appointments.visit_summary_notes IS 'Staff visit summary entered when closing the appointment';
COMMENT ON COLUMN public.appointments.closure_photos IS 'JSON array of storage paths in the appointment-files bucket uploaded at close-out';
COMMENT ON COLUMN public.appointments.cancellation_reason IS 'Reason entered by staff when the appointment is cancelled';

CREATE POLICY "Staff read appointment files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'appointment-files' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff upload appointment files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'appointment-files' AND public.is_staff(auth.uid()));
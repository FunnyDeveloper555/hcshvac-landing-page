CREATE TABLE public.notification_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL DEFAULT '',
  phone TEXT,
  email TEXT,
  notify_appointments BOOLEAN NOT NULL DEFAULT true,
  notify_submissions BOOLEAN NOT NULL DEFAULT true,
  notify_events BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_targets TO authenticated;
GRANT ALL ON public.notification_targets TO service_role;

ALTER TABLE public.notification_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage notification targets"
ON public.notification_targets
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

COMMENT ON TABLE public.notification_targets IS 'Extra phones/emails (pagers, office lines) that receive appointment, submission, and event alerts alongside staff.';
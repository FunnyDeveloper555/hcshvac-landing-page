-- Calendars (company / employee)
CREATE TABLE IF NOT EXISTS public.calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_name text NOT NULL,
  calendar_type text NOT NULL DEFAULT 'company' CHECK (calendar_type IN ('company','employee')),
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  email text,
  phone text,
  description text,
  color text NOT NULL DEFAULT '#3b82f6',
  google_calendar_id text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendars TO authenticated;
GRANT ALL ON public.calendars TO service_role;
ALTER TABLE public.calendars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage calendars" ON public.calendars;
CREATE POLICY "Admins manage calendars" ON public.calendars
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

DROP TRIGGER IF EXISTS calendars_updated_at ON public.calendars;
CREATE TRIGGER calendars_updated_at BEFORE UPDATE ON public.calendars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Appointment scheduling / reminder fields
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS calendar_id uuid REFERENCES public.calendars(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS technician_phone text,
  ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS google_event_id text,
  ADD COLUMN IF NOT EXISTS google_calendar_id text,
  ADD COLUMN IF NOT EXISTS sms_reminders_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS booking_sms_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_sms_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS appointments_sched_idx ON public.appointments (scheduled_date, scheduled_time);

-- Log of every reminder/confirmation text
CREATE TABLE IF NOT EXISTS public.appointment_sms_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  recipient_type text NOT NULL CHECK (recipient_type IN ('customer','technician')),
  phone text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('booking','reminder')),
  message text,
  status text NOT NULL DEFAULT 'sent',
  error text,
  provider_sid text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.appointment_sms_log TO authenticated;
GRANT ALL ON public.appointment_sms_log TO service_role;
ALTER TABLE public.appointment_sms_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read appointment sms log" ON public.appointment_sms_log;
CREATE POLICY "Admins read appointment sms log" ON public.appointment_sms_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

ALTER TABLE public.customer_registrations ADD COLUMN IF NOT EXISTS staff_escalation_sent_at timestamptz;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS staff_escalation_sent_at timestamptz;
COMMENT ON COLUMN public.customer_registrations.staff_escalation_sent_at IS 'When the one-time 12-hour unfinished-submission SMS was sent to clerical staff.';
COMMENT ON COLUMN public.appointments.staff_escalation_sent_at IS 'When the one-time 12-hour unfinished-submission SMS was sent to clerical staff.';
-- Tickets
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text,
  customer_id uuid REFERENCES public.customer_registrations(id) ON DELETE SET NULL,
  customer_name text,
  customer_phone text,
  subject text NOT NULL,
  reason text,
  priority text NOT NULL DEFAULT 'normal',
  notes text,
  expected_completion_date date,
  scheduled_date date,
  scheduled_time text,
  duration_minutes integer DEFAULT 60,
  assigned_team jsonb NOT NULL DEFAULT '[]'::jsonb,
  assigned_employee_id uuid,
  calendar_id uuid REFERENCES public.calendars(id) ON DELETE SET NULL,
  google_event_id text,
  send_sms_reminder boolean NOT NULL DEFAULT true,
  reminder_sent_at timestamptz,
  status text NOT NULL DEFAULT 'open',
  completed_at timestamptz,
  created_by uuid,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view tickets" ON public.tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can create tickets" ON public.tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can update tickets" ON public.tickets FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can delete tickets" ON public.tickets FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Tasks
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_number text,
  task_type text NOT NULL DEFAULT 'other',
  title text NOT NULL,
  location text,
  customer_id uuid REFERENCES public.customer_registrations(id) ON DELETE SET NULL,
  customer_name text,
  notes text,
  due_date date,
  scheduled_date date,
  scheduled_time text,
  duration_minutes integer DEFAULT 60,
  assigned_team jsonb NOT NULL DEFAULT '[]'::jsonb,
  assigned_employee_id uuid,
  calendar_id uuid REFERENCES public.calendars(id) ON DELETE SET NULL,
  google_event_id text,
  send_sms_reminder boolean NOT NULL DEFAULT true,
  reminder_sent_at timestamptz,
  status text NOT NULL DEFAULT 'open',
  completed_at timestamptz,
  created_by uuid,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can create tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can delete tasks" ON public.tasks FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Numbering
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  yr text := to_char(now(), 'YY');
  seq int;
BEGIN
  IF NEW.ticket_number IS NULL THEN
    SELECT COALESCE(MAX(NULLIF(regexp_replace(ticket_number, '^TKT\d{2}', ''), '')::int), 0) + 1
      INTO seq FROM public.tickets WHERE ticket_number LIKE 'TKT' || yr || '%';
    NEW.ticket_number := 'TKT' || yr || lpad(seq::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tickets_number BEFORE INSERT ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.generate_ticket_number();

CREATE OR REPLACE FUNCTION public.generate_task_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  yr text := to_char(now(), 'YY');
  seq int;
BEGIN
  IF NEW.task_number IS NULL THEN
    SELECT COALESCE(MAX(NULLIF(regexp_replace(task_number, '^TSK\d{2}', ''), '')::int), 0) + 1
      INTO seq FROM public.tasks WHERE task_number LIKE 'TSK' || yr || '%';
    NEW.task_number := 'TSK' || yr || lpad(seq::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tasks_number BEFORE INSERT ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.generate_task_number();

CREATE TRIGGER trg_tickets_updated_at BEFORE UPDATE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_scheduled_date ON public.tickets(scheduled_date);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_scheduled_date ON public.tasks(scheduled_date);
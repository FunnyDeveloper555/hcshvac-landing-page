ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS company_initials text;

ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS employee_code text;

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS for_type text NOT NULL DEFAULT 'employee',
  ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vendor_name text,
  ADD COLUMN IF NOT EXISTS public_notes text,
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reminder_night_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_2h_sent_at timestamptz;

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS for_type text NOT NULL DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vendor_name text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS public_notes text,
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reminder_night_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_2h_sent_at timestamptz;

CREATE OR REPLACE FUNCTION public.work_item_prefix(_company_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(NULLIF(upper(trim((SELECT company_initials FROM public.companies WHERE id = _company_id))), ''), 'HCS')
$$;

CREATE OR REPLACE FUNCTION public.generate_task_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE yr text := to_char(now(), 'YY'); seq int;
BEGIN
  IF NEW.task_number IS NULL THEN
    SELECT COALESCE(MAX(NULLIF(substring(task_number from 'TSK' || yr || '(\d+)$'), '')::int), 0) + 1
      INTO seq FROM public.tasks WHERE task_number ~ ('TSK' || yr || '\d+$');
    NEW.task_number := public.work_item_prefix(NEW.company_id) || '-TSK' || yr || lpad(seq::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE yr text := to_char(now(), 'YY'); seq int;
BEGIN
  IF NEW.ticket_number IS NULL THEN
    SELECT COALESCE(MAX(NULLIF(substring(ticket_number from 'TKT' || yr || '(\d+)$'), '')::int), 0) + 1
      INTO seq FROM public.tickets WHERE ticket_number ~ ('TKT' || yr || '\d+$');
    NEW.ticket_number := public.work_item_prefix(NEW.company_id) || '-TKT' || yr || lpad(seq::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.set_employee_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE loc text;
BEGIN
  loc := upper(left(regexp_replace(COALESCE(NEW.city, ''), '[^A-Za-z]', '', 'g'), 2));
  IF loc = '' THEN loc := 'CORP'; END IF;
  NEW.employee_code := public.work_item_prefix(NEW.company_id) || '-' || loc;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_employee_code ON public.employees;
CREATE TRIGGER trg_set_employee_code BEFORE INSERT OR UPDATE OF city, company_id ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.set_employee_code();

UPDATE public.employees SET employee_code = public.work_item_prefix(company_id) || '-' ||
  COALESCE(NULLIF(upper(left(regexp_replace(COALESCE(city, ''), '[^A-Za-z]', '', 'g'), 2)), ''), 'CORP');

CREATE OR REPLACE FUNCTION public.refresh_employee_codes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.company_initials IS DISTINCT FROM OLD.company_initials THEN
    UPDATE public.employees SET employee_code = public.work_item_prefix(company_id) || '-' ||
      COALESCE(NULLIF(upper(left(regexp_replace(COALESCE(city, ''), '[^A-Za-z]', '', 'g'), 2)), ''), 'CORP')
    WHERE company_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_refresh_employee_codes ON public.companies;
CREATE TRIGGER trg_refresh_employee_codes AFTER UPDATE OF company_initials ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.refresh_employee_codes();

CREATE TABLE public.work_item_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL CHECK (item_type IN ('ticket','task')),
  item_id uuid NOT NULL,
  author_id uuid,
  author_name text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.work_item_replies TO authenticated;
GRANT ALL ON public.work_item_replies TO service_role;
ALTER TABLE public.work_item_replies ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_work_item_replies_item ON public.work_item_replies(item_type, item_id, created_at);
CREATE POLICY "Staff read replies" ON public.work_item_replies FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE POLICY "Staff add replies" ON public.work_item_replies FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')) AND author_id = auth.uid());
CREATE POLICY "Authors or admins delete replies" ON public.work_item_replies FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Staff read workitem files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'workitem-files' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')));
CREATE POLICY "Staff upload workitem files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'workitem-files' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')));
CREATE POLICY "Staff delete workitem files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'workitem-files' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')));
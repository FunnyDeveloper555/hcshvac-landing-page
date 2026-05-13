-- Add fields to previous employers
ALTER TABLE public.employee_previous_employers
  ADD COLUMN IF NOT EXISTS prev_corporate_name TEXT,
  ADD COLUMN IF NOT EXISTS prev_website_url TEXT,
  ADD COLUMN IF NOT EXISTS prev_work_phone_extension TEXT,
  ADD COLUMN IF NOT EXISTS prev_corporate_phone_extension TEXT;

-- Add languages and assessment JSONB on employees
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS comfort_assessment JSONB DEFAULT '{}'::jsonb;

-- References table
CREATE TABLE IF NOT EXISTS public.employee_references (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  position_held TEXT,
  phone_number TEXT,
  email_address TEXT,
  known_for TEXT,
  validates_strengths TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage employee references"
  ON public.employee_references
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_employee_references_emp ON public.employee_references(employee_id);

CREATE TRIGGER update_employee_references_updated_at
  BEFORE UPDATE ON public.employee_references
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
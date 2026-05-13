-- Education records (multiple per employee)
CREATE TABLE public.employee_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  school_type TEXT,
  school_name TEXT,
  certificates_held TEXT,
  licenses_held TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_employee_education_employee_id ON public.employee_education(employee_id);

ALTER TABLE public.employee_education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage employee_education"
ON public.employee_education FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER trg_employee_education_updated_at
BEFORE UPDATE ON public.employee_education
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Previous employers (multiple per employee)
CREATE TABLE public.employee_previous_employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  prev_business_name TEXT,
  prev_work_address TEXT,
  prev_work_city TEXT,
  prev_work_state TEXT,
  prev_work_zip_code TEXT,
  prev_work_phone_number TEXT,
  prev_work_contact_person TEXT,
  prev_corporate_address TEXT,
  prev_corporate_city TEXT,
  prev_corporate_state TEXT,
  prev_corporate_zip_code TEXT,
  prev_corporate_phone_number TEXT,
  prev_corporate_contact_person TEXT,
  prev_start_month TEXT,
  prev_start_year TEXT,
  prev_end_month TEXT,
  prev_end_year TEXT,
  prev_starting_position TEXT,
  prev_ending_position TEXT,
  prev_reason_for_leaving TEXT,
  prev_eligible_for_rehire BOOLEAN DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_employee_prev_employers_employee_id ON public.employee_previous_employers(employee_id);

ALTER TABLE public.employee_previous_employers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage employee_previous_employers"
ON public.employee_previous_employers FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER trg_employee_prev_employers_updated_at
BEFORE UPDATE ON public.employee_previous_employers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
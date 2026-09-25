CREATE OR REPLACE FUNCTION public.employee_code_for(_company_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.work_item_prefix(_company_id) || '-' || COALESCE(
    NULLIF(upper(left(regexp_replace(COALESCE((SELECT company_city FROM public.companies WHERE id = _company_id), ''), '[^A-Za-z]', '', 'g'), 2)), ''),
    'CORP')
$$;

CREATE OR REPLACE FUNCTION public.set_employee_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.employee_code := public.employee_code_for(NEW.company_id);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_employee_code ON public.employees;
CREATE TRIGGER trg_set_employee_code BEFORE INSERT OR UPDATE OF company_id ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.set_employee_code();

CREATE OR REPLACE FUNCTION public.refresh_employee_codes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.company_initials IS DISTINCT FROM OLD.company_initials OR NEW.company_city IS DISTINCT FROM OLD.company_city THEN
    UPDATE public.employees SET employee_code = public.employee_code_for(company_id) WHERE company_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_refresh_employee_codes ON public.companies;
CREATE TRIGGER trg_refresh_employee_codes AFTER UPDATE OF company_initials, company_city ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.refresh_employee_codes();

UPDATE public.employees SET employee_code = public.employee_code_for(company_id);
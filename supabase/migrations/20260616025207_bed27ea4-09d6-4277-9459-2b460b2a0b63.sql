CREATE SEQUENCE IF NOT EXISTS public.appointment_number_seq START 1;

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS appointment_number text UNIQUE;

CREATE OR REPLACE FUNCTION public.generate_appointment_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
BEGIN
  IF NEW.appointment_number IS NULL THEN
    year_part := TO_CHAR(CURRENT_DATE, 'YY');
    seq_num := nextval('appointment_number_seq');
    NEW.appointment_number := 'APT' || year_part || LPAD(seq_num::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_appointment_number ON public.appointments;
CREATE TRIGGER trg_generate_appointment_number
BEFORE INSERT ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.generate_appointment_number();

-- Backfill existing rows
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.appointments WHERE appointment_number IS NULL ORDER BY created_at LOOP
    UPDATE public.appointments
       SET appointment_number = 'APT' || TO_CHAR(now(), 'YY') || LPAD(nextval('appointment_number_seq')::TEXT, 5, '0')
     WHERE id = r.id;
  END LOOP;
END $$;
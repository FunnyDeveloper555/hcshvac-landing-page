
-- Sequence for report number counter (per company/year)
CREATE TABLE IF NOT EXISTS public.site_profile_report_counters (
  company_key text NOT NULL,
  year_key text NOT NULL,
  next_num integer NOT NULL DEFAULT 1,
  PRIMARY KEY (company_key, year_key)
);
GRANT ALL ON public.site_profile_report_counters TO service_role;
ALTER TABLE public.site_profile_report_counters ENABLE ROW LEVEL SECURITY;

-- Add report_number column
ALTER TABLE public.site_profiles ADD COLUMN IF NOT EXISTS report_number text UNIQUE;

-- Function: derive initials from company name (first letter of each word, up to 3)
CREATE OR REPLACE FUNCTION public.company_initials(_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT UPPER(COALESCE(
    substring(
      regexp_replace(
        regexp_replace(COALESCE(_name,'GEN'), '[^A-Za-z ]', '', 'g'),
        '\y(of|the|and|inc|llc|co|corp|for|a|an)\y', '', 'gi'
      ),
      '(\y[A-Za-z])'
    ),
    'GEN'
  ));
$$;

-- Trigger to generate report_number on insert
CREATE OR REPLACE FUNCTION public.generate_site_profile_report_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cinit text;
  yr text;
  seq int;
  full_initials text;
BEGIN
  IF NEW.report_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Build company initials (up to 3 letters)
  IF NEW.assigned_company_id IS NOT NULL THEN
    SELECT string_agg(UPPER(substring(word FROM 1 FOR 1)), '')
      INTO full_initials
      FROM (
        SELECT unnest(regexp_split_to_array(
          regexp_replace(COALESCE(c.name,''), '[^A-Za-z ]', '', 'g'),
          '\s+'
        )) AS word
        FROM public.companies c
        WHERE c.id = NEW.assigned_company_id
      ) t
      WHERE length(word) > 0
        AND lower(word) NOT IN ('of','the','and','inc','llc','co','corp','for','a','an');
    cinit := COALESCE(substring(full_initials FROM 1 FOR 3), 'GEN');
  ELSE
    cinit := 'GEN';
  END IF;

  yr := TO_CHAR(CURRENT_DATE, 'YY');

  INSERT INTO public.site_profile_report_counters (company_key, year_key, next_num)
  VALUES (cinit, yr, 2)
  ON CONFLICT (company_key, year_key)
  DO UPDATE SET next_num = public.site_profile_report_counters.next_num + 1
  RETURNING next_num - 1 INTO seq;

  NEW.report_number := 'SPR-' || yr || '-' || cinit || '-' || LPAD(seq::text, 2, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_site_profile_report_number ON public.site_profiles;
CREATE TRIGGER trg_site_profile_report_number
  BEFORE INSERT ON public.site_profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_site_profile_report_number();

-- Backfill existing rows
DO $$
DECLARE r record; cinit text; yr text; seq int; full_initials text;
BEGIN
  FOR r IN SELECT id, assigned_company_id, created_at FROM public.site_profiles WHERE report_number IS NULL ORDER BY created_at LOOP
    IF r.assigned_company_id IS NOT NULL THEN
      SELECT string_agg(UPPER(substring(word FROM 1 FOR 1)), '')
        INTO full_initials
        FROM (
          SELECT unnest(regexp_split_to_array(
            regexp_replace(COALESCE(c.name,''), '[^A-Za-z ]', '', 'g'),
            '\s+'
          )) AS word
          FROM public.companies c WHERE c.id = r.assigned_company_id
        ) t
        WHERE length(word) > 0
          AND lower(word) NOT IN ('of','the','and','inc','llc','co','corp','for','a','an');
      cinit := COALESCE(substring(full_initials FROM 1 FOR 3), 'GEN');
    ELSE
      cinit := 'GEN';
    END IF;
    yr := TO_CHAR(r.created_at, 'YY');
    INSERT INTO public.site_profile_report_counters (company_key, year_key, next_num)
    VALUES (cinit, yr, 2)
    ON CONFLICT (company_key, year_key)
    DO UPDATE SET next_num = public.site_profile_report_counters.next_num + 1
    RETURNING next_num - 1 INTO seq;
    UPDATE public.site_profiles
       SET report_number = 'SPR-' || yr || '-' || cinit || '-' || LPAD(seq::text, 2, '0')
     WHERE id = r.id;
  END LOOP;
END $$;

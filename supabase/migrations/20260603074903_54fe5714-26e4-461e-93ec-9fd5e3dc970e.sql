
-- Normalize phone (last 10 digits)
CREATE OR REPLACE FUNCTION public.lookup_caller_by_phone(_phone text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  digits text;
  last10 text;
  cust record;
  emp record;
  appt_count int := 0;
  company_name text;
BEGIN
  IF _phone IS NULL OR length(_phone) = 0 THEN
    RETURN jsonb_build_object('match_type','unknown');
  END IF;

  digits := regexp_replace(_phone, '\D', '', 'g');
  IF length(digits) < 7 THEN
    RETURN jsonb_build_object('match_type','unknown','phone',_phone);
  END IF;
  last10 := right(digits, 10);

  -- Customer match
  SELECT cr.id,
         COALESCE(NULLIF(trim(cr.ship_to_first_name || ' ' || cr.ship_to_last_name), ''),
                  cr.point_of_contact_name) AS full_name,
         cr.ship_to_business_name,
         cr.company_id
    INTO cust
    FROM public.customer_registrations cr
   WHERE right(regexp_replace(COALESCE(cr.phone,''),           '\D','','g'), 10) = last10
      OR right(regexp_replace(COALESCE(cr.business_phone,''),  '\D','','g'), 10) = last10
      OR right(regexp_replace(COALESCE(cr.point_of_contact_phone,''),'\D','','g'), 10) = last10
   LIMIT 1;

  IF cust.id IS NOT NULL THEN
    SELECT count(*) INTO appt_count
      FROM public.appointments a
     WHERE a.status IN ('open','confirmed','pending','scheduled')
       AND right(regexp_replace(COALESCE(a.customer_phone,''), '\D','','g'), 10) = last10;

    IF cust.company_id IS NOT NULL THEN
      SELECT name INTO company_name FROM public.companies WHERE id = cust.company_id;
    END IF;

    RETURN jsonb_build_object(
      'match_type','customer',
      'phone', _phone,
      'customer', jsonb_build_object(
        'id', cust.id,
        'name', cust.full_name,
        'business_name', cust.ship_to_business_name,
        'company_name', company_name,
        'pending_appointments', appt_count
      )
    );
  END IF;

  -- Employee match
  SELECT e.id, e.first_name, e.last_name, e.phone_number
    INTO emp
    FROM public.employees e
   WHERE right(regexp_replace(COALESCE(e.phone_number,''),         '\D','','g'), 10) = last10
      OR right(regexp_replace(COALESCE(e.prev_work_phone_number,''),'\D','','g'), 10) = last10
   LIMIT 1;

  IF emp.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'match_type','employee',
      'phone', _phone,
      'employee', jsonb_build_object(
        'id', emp.id,
        'first_name', emp.first_name,
        'last_name', emp.last_name,
        'phone', emp.phone_number
      )
    );
  END IF;

  RETURN jsonb_build_object('match_type','unknown','phone',_phone);
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_caller_by_phone(text) TO authenticated;

-- Enable realtime for call_logs_3cx
ALTER TABLE public.call_logs_3cx REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='call_logs_3cx'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.call_logs_3cx';
  END IF;
END $$;

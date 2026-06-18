CREATE OR REPLACE FUNCTION public.lookup_caller_by_phone(_phone text, _to_number text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  digits text;
  last10 text;
  to_digits text;
  to_last10 text;
  to_last4 text;
  cust record;
  emp record;
  appt record;
  appt_count int := 0;
  client_company jsonb := NULL;
  calling_in_company jsonb := NULL;
BEGIN
  IF _phone IS NULL OR length(_phone) = 0 THEN
    RETURN jsonb_build_object('match_type','unknown');
  END IF;

  digits := regexp_replace(_phone, '\D', '', 'g');
  IF length(digits) < 7 THEN
    RETURN jsonb_build_object('match_type','unknown','phone',_phone);
  END IF;
  last10 := right(digits, 10);

  IF _to_number IS NOT NULL AND length(_to_number) > 0 THEN
    to_digits := regexp_replace(_to_number, '\D','','g');
    to_last10 := right(to_digits, 10);
    to_last4  := right(to_digits, 4);
    -- Full 10-digit DID match
    IF length(to_digits) >= 10 THEN
      SELECT jsonb_build_object('id', c.id, 'name', c.name)
        INTO calling_in_company
        FROM public.companies c
       WHERE right(regexp_replace(COALESCE(c.company_phone,''),  '\D','','g'), 10) = to_last10
          OR right(regexp_replace(COALESCE(c.poc_phone,''),       '\D','','g'), 10) = to_last10
          OR right(regexp_replace(COALESCE(c.secondary_poc_phone,''),'\D','','g'), 10) = to_last10
       LIMIT 1;
    END IF;
    -- Extension fallback: match last 4 of any company phone
    IF calling_in_company IS NULL AND length(to_digits) BETWEEN 3 AND 6 THEN
      SELECT jsonb_build_object('id', c.id, 'name', c.name)
        INTO calling_in_company
        FROM public.companies c
       WHERE right(regexp_replace(COALESCE(c.company_phone,''),  '\D','','g'), 4) = to_last4
          OR right(regexp_replace(COALESCE(c.poc_phone,''),       '\D','','g'), 4) = to_last4
          OR right(regexp_replace(COALESCE(c.secondary_poc_phone,''),'\D','','g'), 4) = to_last4
       LIMIT 1;
    END IF;
  END IF;

  SELECT cr.id,
         COALESCE(NULLIF(trim(cr.ship_to_first_name || ' ' || cr.ship_to_last_name), ''),
                  cr.point_of_contact_name) AS full_name,
         cr.ship_to_business_name,
         cr.company_id,
         cr.phone,
         cr.created_at::date AS created_date
    INTO cust
    FROM public.customer_registrations cr
   WHERE right(regexp_replace(COALESCE(cr.phone,''),           '\D','','g'), 10) = last10
      OR right(regexp_replace(COALESCE(cr.business_phone,''),  '\D','','g'), 10) = last10
      OR right(regexp_replace(COALESCE(cr.point_of_contact_phone,''),'\D','','g'), 10) = last10
   LIMIT 1;

  IF cust.id IS NOT NULL THEN
    SELECT count(*) INTO appt_count
      FROM public.appointments a
     WHERE a.status::text = 'open'
       AND right(regexp_replace(COALESCE(a.customer_phone,''), '\D','','g'), 10) = last10;

    SELECT a.id, a.appointment_type::text AS appt_type, a.visit_type,
           a.scheduled_date, a.scheduled_time, a.notes, a.status::text AS status
      INTO appt
      FROM public.appointments a
     WHERE right(regexp_replace(COALESCE(a.customer_phone,''), '\D','','g'), 10) = last10
     ORDER BY a.scheduled_date DESC NULLS LAST, a.created_at DESC
     LIMIT 1;

    IF cust.company_id IS NOT NULL THEN
      SELECT jsonb_build_object('id', c.id, 'name', c.name)
        INTO client_company
        FROM public.companies c WHERE c.id = cust.company_id;
    END IF;

    -- Fallback: if we still don't know which company was called, use the client's own company
    IF calling_in_company IS NULL AND client_company IS NOT NULL THEN
      calling_in_company := client_company;
    END IF;

    RETURN jsonb_build_object(
      'match_type','customer',
      'phone', _phone,
      'calling_in_company', calling_in_company,
      'client_company', client_company,
      'customer', jsonb_build_object(
        'id', cust.id,
        'name', cust.full_name,
        'business_name', cust.ship_to_business_name,
        'company_name', (client_company->>'name'),
        'registered_phone', cust.phone,
        'client_since', cust.created_date,
        'pending_appointments', appt_count,
        'latest_appointment', CASE WHEN appt.id IS NOT NULL THEN
          jsonb_build_object(
            'id', appt.id,
            'type', COALESCE(appt.visit_type, appt.appt_type),
            'date', appt.scheduled_date,
            'time', appt.scheduled_time,
            'status', appt.status,
            'notes', appt.notes
          ) ELSE NULL END
      )
    );
  END IF;

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
      'calling_in_company', calling_in_company,
      'employee', jsonb_build_object(
        'id', emp.id,
        'first_name', emp.first_name,
        'last_name', emp.last_name,
        'phone', emp.phone_number,
        'status', 'Active'
      )
    );
  END IF;

  -- Unknown caller fallback: if no calling_in_company resolved and only one company exists, use it
  IF calling_in_company IS NULL THEN
    SELECT jsonb_build_object('id', c.id, 'name', c.name)
      INTO calling_in_company
      FROM public.companies c
     ORDER BY c.created_at ASC
     LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'match_type','unknown',
    'phone',_phone,
    'calling_in_company', calling_in_company
  );
END;
$function$;
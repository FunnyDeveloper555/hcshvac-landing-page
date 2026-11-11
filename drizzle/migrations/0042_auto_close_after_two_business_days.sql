CREATE OR REPLACE FUNCTION public.auto_close_past_appointments()
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE affected integer;
BEGIN
  -- Past appointments wait for staff action; only close once 2 full business days (Mon-Fri) have passed after the visit date.
  UPDATE appointments a
  SET status = 'closed', closed_at = now()
  WHERE a.status = 'open' AND a.scheduled_date < CURRENT_DATE
    AND (SELECT count(*) FROM generate_series(a.scheduled_date + 1, CURRENT_DATE - 1, interval '1 day') d
         WHERE extract(isodow FROM d) < 6) >= 2
    AND NOT (coalesce(a.visit_type,'') ILIKE '%install%'
             AND NOT EXISTS (SELECT 1 FROM installation_records r WHERE r.appointment_id = a.id));
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$function$;
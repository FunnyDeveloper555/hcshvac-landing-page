ALTER TABLE public.installation_records
  ADD COLUMN IF NOT EXISTS maintenance_interval_months integer NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS last_maintenance_date date;

CREATE OR REPLACE FUNCTION public.auto_close_past_appointments()
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE affected integer;
BEGIN
  UPDATE appointments a
  SET status = 'closed', closed_at = now()
  WHERE a.status = 'open' AND a.scheduled_date < CURRENT_DATE
    AND NOT (coalesce(a.visit_type,'') ILIKE '%install%'
             AND NOT EXISTS (SELECT 1 FROM installation_records r WHERE r.appointment_id = a.id));
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$function$;
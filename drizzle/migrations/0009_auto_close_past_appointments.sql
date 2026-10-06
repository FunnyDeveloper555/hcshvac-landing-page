-- Auto-close open appointments whose scheduled date has passed.
-- Runs hourly via pg_cron so the Open list never shows past days.
CREATE OR REPLACE FUNCTION public.auto_close_past_appointments()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE appointments
  SET status = 'closed', closed_at = now()
  WHERE status = 'open' AND scheduled_date < CURRENT_DATE;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

SELECT cron.schedule(
  'auto-close-past-appointments',
  '0 * * * *',
  $$SELECT public.auto_close_past_appointments();$$
);
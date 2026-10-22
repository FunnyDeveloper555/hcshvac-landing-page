ALTER TABLE public.booking_invitations ADD COLUMN assigned_employee_id uuid;

COMMENT ON COLUMN public.booking_invitations.assigned_employee_id IS 'Optional employee whose calendar the booking should land on; chosen by staff when sending the invitation';

CREATE OR REPLACE FUNCTION public.submit_appointment_request(_token text, _customer_name text, _customer_phone text, _customer_email text, _customer_address text, _visit_type text, _scheduled_date date, _scheduled_time text, _notes text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  inv public.booking_invitations;
  appt_type public.appointment_type;
  new_id uuid;
BEGIN
  SELECT * INTO inv FROM public.booking_invitations WHERE token = _token;
  IF inv.id IS NULL THEN
    RAISE EXCEPTION 'Invalid invitation';
  END IF;
  IF inv.expires_at IS NOT NULL AND inv.expires_at < now() THEN
    RAISE EXCEPTION 'Invitation expired';
  END IF;

  BEGIN
    appt_type := lower(coalesce(inv.customer_type, inv.invitation_type, 'residential'))::public.appointment_type;
  EXCEPTION WHEN others THEN
    appt_type := 'residential'::public.appointment_type;
  END;

  INSERT INTO public.appointments (
    company_id, customer_name, customer_email, customer_phone, customer_address,
    appointment_type, status, scheduled_date, scheduled_time, visit_type, notes,
    assigned_employee_id
  ) VALUES (
    inv.company_id, _customer_name, nullif(_customer_email, ''), _customer_phone,
    nullif(_customer_address, ''), appt_type, 'open'::public.appointment_status,
    _scheduled_date, _scheduled_time, nullif(_visit_type, ''), nullif(_notes, ''),
    inv.assigned_employee_id
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$function$;
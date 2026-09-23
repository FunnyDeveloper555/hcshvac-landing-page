ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS assigned_team jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.appointments.assigned_team IS 'Crew assigned to this job: array of {id, name, phone, email}. assigned_employee_id remains the primary technician.';

UPDATE public.appointments a
SET assigned_team = jsonb_build_array(
      jsonb_build_object(
        'id', e.id,
        'name', trim(coalesce(e.first_name,'') || ' ' || coalesce(e.last_name,'')),
        'phone', coalesce(a.technician_phone, e.phone_number),
        'email', e.email_address
      )
    )
FROM public.employees e
WHERE e.id = a.assigned_employee_id
  AND (a.assigned_team IS NULL OR a.assigned_team = '[]'::jsonb);
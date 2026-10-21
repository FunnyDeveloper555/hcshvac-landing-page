ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS status_start_date date,
  ADD COLUMN IF NOT EXISTS status_end_date date,
  ADD COLUMN IF NOT EXISTS status_revisit_date date,
  ADD COLUMN IF NOT EXISTS status_final_day date,
  ADD COLUMN IF NOT EXISTS status_tbd boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.employees.employment_status IS 'Employment status key: active, medical_no_duty, medical_light_duty, fmla, pto, termination, voluntary_quit_notice, voluntary_quit_no_notice, retirement (legacy: on_leave, inactive)';
COMMENT ON COLUMN public.employees.status_tbd IS 'True when a medical leave end date is To Be Determined; revisit date is used instead of end date';
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS photo_path text,
  ADD COLUMN IF NOT EXISTS employee_id_number text,
  ADD COLUMN IF NOT EXISTS truck_number text,
  ADD COLUMN IF NOT EXISTS active_company_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS assigned_tools text;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS occupied TEXT,
  ADD COLUMN IF NOT EXISTS equipment_location TEXT;

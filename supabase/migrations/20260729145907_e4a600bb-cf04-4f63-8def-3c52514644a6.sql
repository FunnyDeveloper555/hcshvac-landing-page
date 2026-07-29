ALTER TABLE public.installation_jobs ADD COLUMN IF NOT EXISTS pickup_date date;
ALTER TABLE public.installation_records ADD COLUMN IF NOT EXISTS pickup_date date;
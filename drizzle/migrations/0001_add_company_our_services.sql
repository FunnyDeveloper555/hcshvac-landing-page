ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS our_services jsonb NOT NULL DEFAULT '{}'::jsonb;
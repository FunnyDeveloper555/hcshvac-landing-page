-- Customer status field (new dropdown from PDF)
ALTER TABLE public.customer_registrations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Backfill existing rows just in case
UPDATE public.customer_registrations SET status = 'active' WHERE status IS NULL;
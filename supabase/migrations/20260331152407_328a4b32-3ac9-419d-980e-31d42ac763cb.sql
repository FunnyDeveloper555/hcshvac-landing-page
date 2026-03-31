ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS poise text,
  ADD COLUMN IF NOT EXISTS afue text,
  ADD COLUMN IF NOT EXISTS width_size text,
  ADD COLUMN IF NOT EXISTS stages text,
  ADD COLUMN IF NOT EXISTS brand_name text;
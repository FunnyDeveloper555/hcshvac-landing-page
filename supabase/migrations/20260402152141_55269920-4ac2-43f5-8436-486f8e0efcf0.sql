ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS parts_warranty text DEFAULT '',
  ADD COLUMN IF NOT EXISTS labor_warranty text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bullet_points text[] DEFAULT '{}';
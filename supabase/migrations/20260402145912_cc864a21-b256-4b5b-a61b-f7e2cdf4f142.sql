ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_part boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS part_category text DEFAULT '',
  ADD COLUMN IF NOT EXISTS part_subcategory text DEFAULT '',
  ADD COLUMN IF NOT EXISTS part_location_type text DEFAULT '';
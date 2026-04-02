ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS installed_banner_text text DEFAULT '',
  ADD COLUMN IF NOT EXISTS installed_description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS discontinued_banner_text text DEFAULT '',
  ADD COLUMN IF NOT EXISTS discontinued_description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS alternative_product_statement text DEFAULT '',
  ADD COLUMN IF NOT EXISTS alternative_product_url text DEFAULT '';
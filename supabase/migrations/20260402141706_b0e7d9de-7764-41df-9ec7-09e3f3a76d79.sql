
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS promo_title text DEFAULT '',
  ADD COLUMN IF NOT EXISTS promo_description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS promo_image_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS promo_start_date timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS promo_end_date timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_promo_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_repair_eligible boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS repair_tags text[] NOT NULL DEFAULT '{}';

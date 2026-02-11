ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS banner_image_ids UUID[] NOT NULL DEFAULT '{}'::UUID[];

COMMENT ON COLUMN public.companies.banner_image_ids
IS 'Ordered list of selected banner image IDs from company_images for hero display.';
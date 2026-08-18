ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS site_template TEXT DEFAULT 'home-construction';
UPDATE public.companies SET site_template = 'home-construction' WHERE site_template IS NULL;
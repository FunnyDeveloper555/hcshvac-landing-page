-- Add slug column to companies for subdomain routing
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Create an index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);

-- Add website_title, website_description, tagline columns for landing page customization
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS website_title text,
ADD COLUMN IF NOT EXISTS website_tagline text,
ADD COLUMN IF NOT EXISTS website_description text,
ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#0ea5e9',
ADD COLUMN IF NOT EXISTS hero_image_url text;
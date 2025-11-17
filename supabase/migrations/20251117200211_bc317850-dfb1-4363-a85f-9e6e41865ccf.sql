-- Add missing fields to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS brands_serviced jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS affiliations jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS inventory_parts text,
ADD COLUMN IF NOT EXISTS inventory_equipment text,
ADD COLUMN IF NOT EXISTS inventory_locations text;
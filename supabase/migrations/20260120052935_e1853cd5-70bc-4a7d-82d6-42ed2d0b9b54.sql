-- Add new columns to companies table for enhanced company profile

-- Financing toggle
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS financing_enabled boolean DEFAULT false;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS financing_provider text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS financing_url text;

-- Home Page Coupons (3 slots)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS coupon_1_title text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS coupon_1_description text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS coupon_1_code text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS coupon_2_title text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS coupon_2_description text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS coupon_2_code text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS coupon_3_title text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS coupon_3_description text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS coupon_3_code text;

-- Partner Companies (stored as JSONB array for flexibility)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS partner_companies jsonb DEFAULT '[]'::jsonb;

-- Enhanced Brands Management for HVAC
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS hvac_brands_install jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS hvac_brands_service jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS hvac_brands_repair jsonb DEFAULT '[]'::jsonb;

-- Enhanced Equipment Types for HVAC
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS hvac_equipment_install jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS hvac_equipment_service jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS hvac_equipment_repair jsonb DEFAULT '[]'::jsonb;

-- Enhanced Equipment Types for Plumbing
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS plumbing_equipment_install jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS plumbing_equipment_service jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS plumbing_equipment_repair jsonb DEFAULT '[]'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN public.companies.partner_companies IS 'Array of partner company objects: [{name: string, url: string}]';
COMMENT ON COLUMN public.companies.hvac_brands_install IS 'Array of HVAC brand names for installation';
COMMENT ON COLUMN public.companies.hvac_equipment_install IS 'Array of HVAC equipment types for installation (e.g., Air Conditioner, Furnace)';
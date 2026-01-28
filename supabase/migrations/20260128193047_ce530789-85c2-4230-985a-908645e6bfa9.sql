-- Add coupons JSONB column to companies table for dynamic coupon management
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS coupons jsonb DEFAULT '[]'::jsonb;

-- Comment explaining the structure
COMMENT ON COLUMN public.companies.coupons IS 'Array of coupon objects with structure: [{title: string, description: string, code: string}]';
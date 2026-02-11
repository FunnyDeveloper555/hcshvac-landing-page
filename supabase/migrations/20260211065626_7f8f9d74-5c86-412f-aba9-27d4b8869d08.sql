
-- Add marquee_type column to company_marquees
ALTER TABLE public.company_marquees 
ADD COLUMN marquee_type TEXT NOT NULL DEFAULT 'text';

-- Add reference_id to link to brands/partners/services items
ALTER TABLE public.company_marquees 
ADD COLUMN reference_id UUID;

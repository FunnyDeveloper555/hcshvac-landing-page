-- Create partner_listings table for managing partner company micro-websites
CREATE TABLE public.partner_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Header section
  business_name TEXT NOT NULL,
  business_phone TEXT,
  logo_url TEXT,
  logo_custom_name TEXT,
  logo_alt_text TEXT DEFAULT '',
  bg_image_url TEXT,
  bg_custom_name TEXT,
  bg_alt_text TEXT DEFAULT '',
  
  -- Body section
  first_paragraph TEXT,
  first_bullets JSONB DEFAULT '[]'::jsonb,
  second_paragraph TEXT,
  second_bullets JSONB DEFAULT '[]'::jsonb,
  
  -- Affiliates section (array of {logo_url, business_name, custom_name, alt_text})
  affiliates JSONB DEFAULT '[]'::jsonb,
  
  -- Final section
  website_url TEXT,
  contact_email TEXT,
  best_if_used_for TEXT,
  
  -- Meta fields
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.partner_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all partner listings"
ON public.partner_listings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert partner listings"
ON public.partner_listings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update partner listings"
ON public.partner_listings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete partner listings"
ON public.partner_listings
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active partner listings"
ON public.partner_listings
FOR SELECT
USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_partner_listings_updated_at
  BEFORE UPDATE ON public.partner_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster company lookups
CREATE INDEX idx_partner_listings_company_id ON public.partner_listings(company_id);
CREATE INDEX idx_partner_listings_display_order ON public.partner_listings(company_id, display_order);
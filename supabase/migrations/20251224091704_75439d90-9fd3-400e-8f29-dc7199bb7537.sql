-- Add new columns to customer_registrations for enhanced functionality

-- Add account number (auto-generated unique identifier)
ALTER TABLE public.customer_registrations 
ADD COLUMN IF NOT EXISTS account_number TEXT UNIQUE;

-- Add company assignment
ALTER TABLE public.customer_registrations 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Add warranty status
ALTER TABLE public.customer_registrations 
ADD COLUMN IF NOT EXISTS warranty_status TEXT DEFAULT 'active';

-- Add formal title to ship to location
ALTER TABLE public.customer_registrations 
ADD COLUMN IF NOT EXISTS title_to_location TEXT;

-- Add "will be on location during visit" field
ALTER TABLE public.customer_registrations 
ADD COLUMN IF NOT EXISTS on_location_during_visit TEXT;

-- Add initial visit notes
ALTER TABLE public.customer_registrations 
ADD COLUMN IF NOT EXISTS initial_visit_notes TEXT;

-- Commercial-specific fields
ALTER TABLE public.customer_registrations 
ADD COLUMN IF NOT EXISTS security_gate_access BOOLEAN;

ALTER TABLE public.customer_registrations 
ADD COLUMN IF NOT EXISTS lock_boxes_codes TEXT;

ALTER TABLE public.customer_registrations 
ADD COLUMN IF NOT EXISTS ems_monitoring BOOLEAN;

ALTER TABLE public.customer_registrations 
ADD COLUMN IF NOT EXISTS ems_provider_info TEXT;

-- Location profile fields
ALTER TABLE public.customer_registrations 
ADD COLUMN IF NOT EXISTS build_year INTEGER;

ALTER TABLE public.customer_registrations 
ADD COLUMN IF NOT EXISTS housing_type TEXT;

ALTER TABLE public.customer_registrations 
ADD COLUMN IF NOT EXISTS occupied_by TEXT;

ALTER TABLE public.customer_registrations 
ADD COLUMN IF NOT EXISTS responsible_billing_party TEXT;

-- Business type for commercial
ALTER TABLE public.customer_registrations 
ADD COLUMN IF NOT EXISTS business_type TEXT;

-- Corporation name for commercial
ALTER TABLE public.customer_registrations 
ADD COLUMN IF NOT EXISTS corporation_name TEXT;

-- Business phone for commercial
ALTER TABLE public.customer_registrations 
ADD COLUMN IF NOT EXISTS business_phone TEXT;

-- Last date of visit tracking
ALTER TABLE public.customer_registrations 
ADD COLUMN IF NOT EXISTS last_visit_date TIMESTAMP WITH TIME ZONE;

-- Create a sequence for account numbers
CREATE SEQUENCE IF NOT EXISTS customer_account_seq START 1;

-- Create function to generate account number
CREATE OR REPLACE FUNCTION public.generate_customer_account_number()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  year_part TEXT;
  seq_num INTEGER;
BEGIN
  IF NEW.account_number IS NULL THEN
    -- Determine prefix based on location type
    IF NEW.location_type = 'residential' THEN
      prefix := 'RES';
    ELSE
      prefix := 'COM';
    END IF;
    
    -- Get current year (last 2 digits)
    year_part := TO_CHAR(CURRENT_DATE, 'YY');
    
    -- Get next sequence number
    seq_num := nextval('customer_account_seq');
    
    -- Format: RES250001 or COM250001
    NEW.account_number := prefix || year_part || LPAD(seq_num::TEXT, 4, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-generate account number
DROP TRIGGER IF EXISTS generate_account_number_trigger ON public.customer_registrations;
CREATE TRIGGER generate_account_number_trigger
BEFORE INSERT ON public.customer_registrations
FOR EACH ROW
EXECUTE FUNCTION public.generate_customer_account_number();

-- Create index on account_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_account_number ON public.customer_registrations(account_number);

-- Create index on company_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_company_id ON public.customer_registrations(company_id);
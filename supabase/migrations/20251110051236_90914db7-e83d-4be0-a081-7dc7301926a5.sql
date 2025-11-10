-- Drop existing customer_registrations table and create new one with updated schema
DROP TABLE IF EXISTS public.customer_registrations;

CREATE TABLE public.customer_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Ship To Information
  ship_to_first_name text NOT NULL,
  ship_to_last_name text NOT NULL,
  ship_to_business_name text,
  ship_to_address text NOT NULL,
  ship_to_suite_number text,
  ship_to_city text NOT NULL,
  ship_to_state text NOT NULL,
  ship_to_zip_code text NOT NULL,
  
  -- Bill To Information
  bill_to_same_as_ship_to boolean DEFAULT false,
  bill_to_first_name text,
  bill_to_last_name text,
  bill_to_business_name text,
  bill_to_address text,
  bill_to_suite_number text,
  bill_to_city text,
  bill_to_state text,
  bill_to_zip_code text,
  
  -- Location Profile
  location_age_years integer,
  location_type text NOT NULL, -- residential, commercial, industrial, educational
  
  -- Residential Details
  residential_type text, -- single_family, condo, townhome, multi_dwelling
  residential_occupancy text, -- owner_occupied, tenant_occupied, not_occupied
  
  -- Commercial/Industrial/Educational Details
  building_occupied boolean,
  point_of_contact_name text,
  point_of_contact_phone text,
  point_of_contact_email text,
  equipment_location text,
  type_of_use text,
  cautions_restrictions text,
  hours_of_operation text
);

-- Enable Row Level Security
ALTER TABLE public.customer_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can submit registration" 
ON public.customer_registrations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can view registrations" 
ON public.customer_registrations 
FOR SELECT 
USING (true);
-- Update customer_registrations table to match frontend schema
ALTER TABLE public.customer_registrations 
  ALTER COLUMN building_occupied TYPE text;
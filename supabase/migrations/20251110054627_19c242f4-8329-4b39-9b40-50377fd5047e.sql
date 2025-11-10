-- Add primary contact fields to customer_registrations table
ALTER TABLE public.customer_registrations
ADD COLUMN email text NOT NULL DEFAULT '',
ADD COLUMN phone text NOT NULL DEFAULT '';

-- Update existing records to have empty strings
UPDATE public.customer_registrations
SET email = COALESCE(point_of_contact_email, ''),
    phone = COALESCE(point_of_contact_phone, '')
WHERE email IS NULL OR phone IS NULL;

COMMENT ON COLUMN public.customer_registrations.email IS 'Primary contact email for the customer';
COMMENT ON COLUMN public.customer_registrations.phone IS 'Primary contact phone for the customer';
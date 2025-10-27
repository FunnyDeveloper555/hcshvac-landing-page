-- Create customer registrations table
CREATE TABLE public.customer_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  service_type TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customer_registrations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert registrations (public form)
CREATE POLICY "Anyone can submit registration" 
ON public.customer_registrations 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Create policy to allow authenticated users to view all registrations (for admin later)
CREATE POLICY "Authenticated users can view registrations" 
ON public.customer_registrations 
FOR SELECT 
TO authenticated
USING (true);

-- Create index for email lookups
CREATE INDEX idx_customer_registrations_email ON public.customer_registrations(email);

-- Create index for created_at for sorting
CREATE INDEX idx_customer_registrations_created_at ON public.customer_registrations(created_at DESC);
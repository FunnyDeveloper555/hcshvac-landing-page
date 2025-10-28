-- Create service_bookings table (if not exists)
CREATE TABLE IF NOT EXISTS public.service_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  preferred_date date NOT NULL,
  preferred_time text NOT NULL,
  address text,
  message text,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can submit booking" ON public.service_bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "Admins can update bookings" ON public.service_bookings;

-- RLS policies for bookings
CREATE POLICY "Anyone can submit booking"
ON public.service_bookings
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all bookings"
ON public.service_bookings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update bookings"
ON public.service_bookings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));
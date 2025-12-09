-- Create appointment types enum
CREATE TYPE public.appointment_type AS ENUM ('residential', 'commercial', 'non_profit', 'church', 'school', 'government', 'other');

-- Create appointment status enum
CREATE TYPE public.appointment_status AS ENUM ('open', 'closed', 'cancelled');

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  appointment_type appointment_type NOT NULL DEFAULT 'residential',
  status appointment_status NOT NULL DEFAULT 'open',
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all appointments"
ON public.appointments
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert appointments"
ON public.appointments
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update appointments"
ON public.appointments
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete appointments"
ON public.appointments
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
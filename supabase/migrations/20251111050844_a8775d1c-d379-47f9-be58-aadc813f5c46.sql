-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Employee Profile
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email_address TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  drivers_license_number TEXT,
  social_security_number TEXT,
  us_citizen BOOLEAN,
  city_of_birth TEXT,
  state_of_birth TEXT,
  birth_gender TEXT,
  
  -- Education
  high_school TEXT,
  trade_school TEXT,
  two_year_college TEXT,
  four_year_college TEXT,
  certificates_held TEXT,
  licenses_held TEXT,
  
  -- Previous Employer
  prev_business_name TEXT,
  prev_work_address TEXT,
  prev_work_city TEXT,
  prev_work_state TEXT,
  prev_work_zip_code TEXT,
  prev_work_phone_number TEXT,
  prev_work_contact_person TEXT,
  prev_corporate_address TEXT,
  prev_corporate_city TEXT,
  prev_corporate_state TEXT,
  prev_corporate_zip_code TEXT,
  prev_corporate_phone_number TEXT,
  prev_corporate_contact_person TEXT,
  prev_start_month TEXT,
  prev_start_year TEXT,
  prev_end_month TEXT,
  prev_end_year TEXT,
  prev_starting_position TEXT,
  prev_ending_position TEXT,
  prev_reason_for_leaving TEXT,
  prev_eligible_for_rehire BOOLEAN,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all employees" 
ON public.employees 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert employees" 
ON public.employees 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update employees" 
ON public.employees 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete employees" 
ON public.employees 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
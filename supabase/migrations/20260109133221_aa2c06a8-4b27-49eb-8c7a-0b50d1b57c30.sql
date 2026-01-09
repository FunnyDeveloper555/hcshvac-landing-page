-- Drop the existing service_terms table and recreate with proper structure
DROP TABLE IF EXISTS public.service_terms;

-- Create service_terms table with proper fields
CREATE TABLE public.service_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id TEXT NOT NULL,
  primary_keyword TEXT NOT NULL,
  applies_to TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id),
  equipment_type TEXT,
  location_type TEXT,
  industry_category TEXT,
  service_type TEXT,
  hours_of_service TEXT,
  page_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_terms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all service terms" ON public.service_terms
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert service terms" ON public.service_terms
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update service terms" ON public.service_terms
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete service terms" ON public.service_terms
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active service terms" ON public.service_terms
FOR SELECT USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_service_terms_updated_at
BEFORE UPDATE ON public.service_terms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
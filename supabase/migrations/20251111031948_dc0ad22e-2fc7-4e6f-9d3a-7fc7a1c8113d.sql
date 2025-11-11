-- Create vendors table
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_name TEXT NOT NULL,
  vendor_address TEXT NOT NULL,
  phone TEXT NOT NULL,
  website TEXT,
  hours_of_operation TEXT,
  representative_first_name TEXT NOT NULL,
  representative_last_name TEXT NOT NULL,
  representative_phone TEXT NOT NULL,
  representative_email TEXT NOT NULL,
  logo_url TEXT,
  our_account_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vendor_industries table for repeatable industry/product info
CREATE TABLE public.vendor_industries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  product_category TEXT NOT NULL,
  product_brand_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_industries ENABLE ROW LEVEL SECURITY;

-- RLS policies for vendors
CREATE POLICY "Anyone can submit vendor registration"
ON public.vendors
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all vendors"
ON public.vendors
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update vendors"
ON public.vendors
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete vendors"
ON public.vendors
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for vendor_industries
CREATE POLICY "Anyone can insert vendor industries"
ON public.vendor_industries
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all vendor industries"
ON public.vendor_industries
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update vendor industries"
ON public.vendor_industries
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete vendor industries"
ON public.vendor_industries
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_vendors_updated_at
BEFORE UPDATE ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for vendor logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-logos', 'vendor-logos', true);

-- Storage policies for vendor logos
CREATE POLICY "Anyone can upload vendor logos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'vendor-logos');

CREATE POLICY "Vendor logos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'vendor-logos');

CREATE POLICY "Admins can update vendor logos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'vendor-logos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete vendor logos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'vendor-logos' AND has_role(auth.uid(), 'admin'::app_role));
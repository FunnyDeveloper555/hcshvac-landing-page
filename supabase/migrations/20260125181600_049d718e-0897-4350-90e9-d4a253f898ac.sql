-- Create company_images table to store images per company
CREATE TABLE public.company_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT NOT NULL DEFAULT '',
    image_type TEXT NOT NULL DEFAULT 'general', -- logo, hero, banner, gallery, etc.
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.company_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can view all company images" 
ON public.company_images 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert company images" 
ON public.company_images 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update company images" 
ON public.company_images 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete company images" 
ON public.company_images 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active company images" 
ON public.company_images 
FOR SELECT 
USING (is_active = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_company_images_updated_at
BEFORE UPDATE ON public.company_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for company images
INSERT INTO storage.buckets (id, name, public) VALUES ('company-images', 'company-images', true);

-- Create storage policies
CREATE POLICY "Admin users can upload company images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin users can update company images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'company-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin users can delete company images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'company-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view company images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'company-images');
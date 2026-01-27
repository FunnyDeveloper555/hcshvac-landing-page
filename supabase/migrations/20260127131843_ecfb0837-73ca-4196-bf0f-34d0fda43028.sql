-- Create CTA Icons table
CREATE TABLE public.cta_icons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    alt_text TEXT NOT NULL DEFAULT '',
    custom_name TEXT NOT NULL DEFAULT '',
    unique_id_number TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_usable BOOLEAN DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (company_id, unique_id_number)
);

-- Create Page CTA Assignments table (links icons to pages with position)
CREATE TABLE public.page_cta_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cta_icon_id UUID REFERENCES public.cta_icons(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    page_name TEXT NOT NULL, -- about_us, financing, services, residential, commercial, air_quality
    use_on_page BOOLEAN DEFAULT false,
    position INTEGER CHECK (position >= 1 AND position <= 8),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (cta_icon_id, page_name)
);

-- Enable RLS
ALTER TABLE public.cta_icons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_cta_assignments ENABLE ROW LEVEL SECURITY;

-- CTA Icons RLS Policies
CREATE POLICY "Admins can view all CTA icons"
ON public.cta_icons FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active CTA icons"
ON public.cta_icons FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can insert CTA icons"
ON public.cta_icons FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update CTA icons"
ON public.cta_icons FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete CTA icons"
ON public.cta_icons FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Page CTA Assignments RLS Policies
CREATE POLICY "Admins can view all CTA assignments"
ON public.page_cta_assignments FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view CTA assignments"
ON public.page_cta_assignments FOR SELECT
USING (true);

CREATE POLICY "Admins can insert CTA assignments"
ON public.page_cta_assignments FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update CTA assignments"
ON public.page_cta_assignments FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete CTA assignments"
ON public.page_cta_assignments FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for CTA icons
INSERT INTO storage.buckets (id, name, public) VALUES ('cta-icons', 'cta-icons', true);

-- Storage policies for cta-icons bucket
CREATE POLICY "Anyone can view CTA icons"
ON storage.objects FOR SELECT
USING (bucket_id = 'cta-icons');

CREATE POLICY "Admins can upload CTA icons"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cta-icons' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update CTA icons"
ON storage.objects FOR UPDATE
USING (bucket_id = 'cta-icons' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete CTA icons"
ON storage.objects FOR DELETE
USING (bucket_id = 'cta-icons' AND has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_cta_icons_updated_at
BEFORE UPDATE ON public.cta_icons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_page_cta_assignments_updated_at
BEFORE UPDATE ON public.page_cta_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create sequence for unique ID generation
CREATE SEQUENCE IF NOT EXISTS cta_icon_seq START 1;
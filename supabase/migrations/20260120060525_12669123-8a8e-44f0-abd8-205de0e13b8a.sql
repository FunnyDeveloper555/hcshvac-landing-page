-- Create campaigns table for Mass Page Generator
CREATE TABLE public.page_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'deleted')),
  
  -- Filter configurations (stored as JSONB arrays)
  audience_types JSONB DEFAULT '[]'::jsonb,
  visit_types JSONB DEFAULT '[]'::jsonb,
  equipment_types JSONB DEFAULT '[]'::jsonb,
  location_states JSONB DEFAULT '[]'::jsonb,
  location_counties JSONB DEFAULT '[]'::jsonb,
  location_cities JSONB DEFAULT '[]'::jsonb,
  
  -- Template settings
  template_id TEXT DEFAULT 'default',
  naming_pattern TEXT DEFAULT '{audience}-{visit_type}-{equipment}-{location}',
  
  -- Metrics
  total_pages_generated INTEGER DEFAULT 0,
  pages_published INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create generated pages table
CREATE TABLE public.generated_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.page_campaigns(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Page identifiers
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  meta_description TEXT,
  
  -- Filter values used for this page
  audience_type TEXT,
  visit_type TEXT,
  equipment_type TEXT,
  location_state TEXT,
  location_county TEXT,
  location_city TEXT,
  location_zip TEXT,
  
  -- Page content sections (JSONB for flexibility)
  hero_content JSONB DEFAULT '{}'::jsonb,
  services_content JSONB DEFAULT '{}'::jsonb,
  brands_content JSONB DEFAULT '{}'::jsonb,
  areas_content JSONB DEFAULT '{}'::jsonb,
  coupons_content JSONB DEFAULT '{}'::jsonb,
  reviews_content JSONB DEFAULT '{}'::jsonb,
  
  -- Status and publishing
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lookup tables for filter options
CREATE TABLE public.page_filter_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL, -- 'audience', 'visit_type', 'equipment'
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category, value)
);

-- Insert default filter options
INSERT INTO public.page_filter_options (category, value, label, display_order) VALUES
-- Audience types
('audience', 'residential', 'Residential', 1),
('audience', 'commercial', 'Commercial', 2),
('audience', 'industrial', 'Industrial', 3),
('audience', 'educational', 'Educational', 4),
-- Visit types
('visit_type', 'service', 'Service', 1),
('visit_type', 'repair', 'Repair', 2),
('visit_type', 'install', 'Install', 3),
('visit_type', 'maintenance', 'Maintenance', 4),
('visit_type', 'emergency', 'Emergency', 5),
-- Equipment types (HVAC)
('equipment', 'air-conditioner', 'Air Conditioner', 1),
('equipment', 'furnace', 'Furnace', 2),
('equipment', 'heat-pump', 'Heat Pump', 3),
('equipment', 'boiler', 'Boiler', 4),
('equipment', 'ductless-mini-split', 'Ductless Mini Split', 5),
('equipment', 'thermostat', 'Thermostat', 6),
('equipment', 'water-heater', 'Water Heater', 7),
('equipment', 'air-handler', 'Air Handler', 8);

-- Enable RLS
ALTER TABLE public.page_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_filter_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for page_campaigns
CREATE POLICY "Admins can view all campaigns" ON public.page_campaigns FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert campaigns" ON public.page_campaigns FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update campaigns" ON public.page_campaigns FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete campaigns" ON public.page_campaigns FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for generated_pages
CREATE POLICY "Admins can view all generated pages" ON public.generated_pages FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert generated pages" ON public.generated_pages FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update generated pages" ON public.generated_pages FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete generated pages" ON public.generated_pages FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view published pages" ON public.generated_pages FOR SELECT USING (status = 'published');

-- RLS Policies for page_filter_options
CREATE POLICY "Anyone can view filter options" ON public.page_filter_options FOR SELECT USING (true);
CREATE POLICY "Admins can manage filter options" ON public.page_filter_options FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger for campaigns
CREATE TRIGGER update_page_campaigns_updated_at
  BEFORE UPDATE ON public.page_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for generated_pages
CREATE TRIGGER update_generated_pages_updated_at
  BEFORE UPDATE ON public.generated_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
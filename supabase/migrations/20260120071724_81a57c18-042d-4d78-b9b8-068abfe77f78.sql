-- Create page_templates table for storing template configurations
CREATE TABLE public.page_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  preview_image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage templates"
ON public.page_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active templates"
ON public.page_templates
FOR SELECT
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_page_templates_updated_at
BEFORE UPDATE ON public.page_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.page_templates (name, description, is_default, sections, settings) VALUES
(
  'Default Template',
  'Standard HVAC landing page with hero, services, brands, and contact sections',
  true,
  '[
    {"id": "hero", "type": "hero", "enabled": true, "order": 1, "settings": {"showBadge": true, "showStats": true, "showCTA": true}},
    {"id": "services", "type": "services", "enabled": true, "order": 2, "settings": {"columns": 3, "showPrices": true}},
    {"id": "brands", "type": "brands", "enabled": true, "order": 3, "settings": {"layout": "marquee"}},
    {"id": "service-areas", "type": "service-areas", "enabled": true, "order": 4, "settings": {"showMap": false}},
    {"id": "coupons", "type": "coupons", "enabled": true, "order": 5, "settings": {"layout": "cards"}},
    {"id": "contact", "type": "contact", "enabled": true, "order": 6, "settings": {"showForm": true, "showMap": false}},
    {"id": "footer", "type": "footer", "enabled": true, "order": 7, "settings": {"showSocial": true}}
  ]'::jsonb,
  '{"primaryColor": "#0ea5e9", "fontFamily": "Inter", "headerStyle": "sticky"}'::jsonb
),
(
  'Modern Template',
  'Clean, modern design with large images and minimal text',
  false,
  '[
    {"id": "hero-banner", "type": "hero", "enabled": true, "order": 1, "settings": {"showBadge": false, "showStats": false, "showCTA": true, "fullWidth": true}},
    {"id": "quick-stats", "type": "stats", "enabled": true, "order": 2, "settings": {"layout": "horizontal"}},
    {"id": "services-grid", "type": "services", "enabled": true, "order": 3, "settings": {"columns": 4, "showPrices": false}},
    {"id": "testimonials", "type": "reviews", "enabled": true, "order": 4, "settings": {"layout": "carousel"}},
    {"id": "cta", "type": "cta", "enabled": true, "order": 5, "settings": {"style": "gradient"}},
    {"id": "footer", "type": "footer", "enabled": true, "order": 6, "settings": {"showSocial": true}}
  ]'::jsonb,
  '{"primaryColor": "#8b5cf6", "fontFamily": "Poppins", "headerStyle": "transparent"}'::jsonb
),
(
  'Classic Template',
  'Traditional business layout with detailed information sections',
  false,
  '[
    {"id": "header", "type": "header", "enabled": true, "order": 1, "settings": {"showPhone": true}},
    {"id": "about", "type": "about", "enabled": true, "order": 2, "settings": {"showImage": true}},
    {"id": "services-list", "type": "services", "enabled": true, "order": 3, "settings": {"layout": "list", "showDescriptions": true}},
    {"id": "why-choose-us", "type": "features", "enabled": true, "order": 4, "settings": {"columns": 3}},
    {"id": "reviews", "type": "reviews", "enabled": true, "order": 5, "settings": {"layout": "grid"}},
    {"id": "contact-form", "type": "contact", "enabled": true, "order": 6, "settings": {"showForm": true, "showInfo": true}},
    {"id": "footer", "type": "footer", "enabled": true, "order": 7, "settings": {"showSocial": false}}
  ]'::jsonb,
  '{"primaryColor": "#16a34a", "fontFamily": "Roboto", "headerStyle": "fixed"}'::jsonb
),
(
  'Minimal Template',
  'Stripped-down design focusing on key information and call-to-action',
  false,
  '[
    {"id": "hero", "type": "hero", "enabled": true, "order": 1, "settings": {"showBadge": false, "showStats": false, "showCTA": true, "minimal": true}},
    {"id": "key-services", "type": "services", "enabled": true, "order": 2, "settings": {"columns": 2, "limit": 4}},
    {"id": "cta-banner", "type": "cta", "enabled": true, "order": 3, "settings": {"style": "simple"}},
    {"id": "contact", "type": "contact", "enabled": true, "order": 4, "settings": {"showForm": true, "compact": true}},
    {"id": "footer", "type": "footer", "enabled": true, "order": 5, "settings": {"minimal": true}}
  ]'::jsonb,
  '{"primaryColor": "#1f2937", "fontFamily": "System", "headerStyle": "minimal"}'::jsonb
);

-- Clear existing template_id values in page_campaigns
UPDATE public.page_campaigns SET template_id = NULL;

-- Drop default value 
ALTER TABLE public.page_campaigns 
ALTER COLUMN template_id DROP DEFAULT;

-- Change template_id column from TEXT to UUID
ALTER TABLE public.page_campaigns 
ALTER COLUMN template_id TYPE UUID USING template_id::uuid;

-- Add the foreign key constraint
ALTER TABLE public.page_campaigns 
ADD CONSTRAINT fk_page_campaigns_template 
FOREIGN KEY (template_id) REFERENCES public.page_templates(id) ON DELETE SET NULL;

-- Add template_id column to generated_pages for direct template reference
ALTER TABLE public.generated_pages 
ADD COLUMN template_id UUID REFERENCES public.page_templates(id);
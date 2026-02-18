
-- Create company_popups table for promotional and emergency alerts
CREATE TABLE public.company_popups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  popup_type TEXT NOT NULL DEFAULT 'promotional', -- 'promotional' or 'emergency'
  title TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  button_text TEXT DEFAULT 'Got it',
  button_url TEXT DEFAULT NULL,
  bg_color TEXT DEFAULT NULL,
  text_color TEXT DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_popups ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can view all popups" ON public.company_popups FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert popups" ON public.company_popups FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update popups" ON public.company_popups FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete popups" ON public.company_popups FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Public read for active popups
CREATE POLICY "Anyone can view active popups" ON public.company_popups FOR SELECT USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_company_popups_updated_at
  BEFORE UPDATE ON public.company_popups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

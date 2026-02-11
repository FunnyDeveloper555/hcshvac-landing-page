
CREATE TABLE public.company_marquees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  link_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.company_marquees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all company marquees" ON public.company_marquees FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert company marquees" ON public.company_marquees FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update company marquees" ON public.company_marquees FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete company marquees" ON public.company_marquees FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active company marquees" ON public.company_marquees FOR SELECT USING (is_active = true);

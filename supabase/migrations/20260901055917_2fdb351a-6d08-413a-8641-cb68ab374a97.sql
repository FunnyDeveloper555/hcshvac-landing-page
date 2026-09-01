CREATE TABLE public.mass_page_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, page_path)
);

GRANT SELECT ON public.mass_page_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mass_page_content TO authenticated;
GRANT ALL ON public.mass_page_content TO service_role;

ALTER TABLE public.mass_page_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mass page content is publicly readable"
  ON public.mass_page_content FOR SELECT USING (true);

CREATE POLICY "Admins manage mass page content"
  ON public.mass_page_content FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER update_mass_page_content_updated_at
  BEFORE UPDATE ON public.mass_page_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
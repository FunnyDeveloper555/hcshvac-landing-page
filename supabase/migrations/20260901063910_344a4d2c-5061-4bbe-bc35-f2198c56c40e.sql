GRANT SELECT ON public.mass_page_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mass_page_content TO authenticated;
GRANT ALL ON public.mass_page_content TO service_role;
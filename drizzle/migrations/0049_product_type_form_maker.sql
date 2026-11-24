CREATE TABLE public.product_form_elements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('text','textarea','select','multi','boolean','radio')),
  options jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(options) = 'array'),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT custom_element_key CHECK (key ~ '^custom_[a-z0-9_]+$'),
  CONSTRAINT element_label_not_blank CHECK (length(trim(label)) > 0)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_form_elements TO authenticated;
GRANT ALL ON public.product_form_elements TO service_role;
ALTER TABLE public.product_form_elements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage product form elements" ON public.product_form_elements FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TABLE public.product_type_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(fields) = 'array'),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT form_name_not_blank CHECK (length(trim(name)) > 0)
);
CREATE UNIQUE INDEX product_type_forms_name_unique ON public.product_type_forms (lower(trim(name)));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_type_forms TO authenticated;
GRANT ALL ON public.product_type_forms TO service_role;
ALTER TABLE public.product_type_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage product type forms" ON public.product_type_forms FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER product_type_forms_updated BEFORE UPDATE ON public.product_type_forms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TABLE public.product_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text,
  description text,
  image_url text,
  package text NOT NULL DEFAULT 'b3',
  items jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_our_cost numeric NOT NULL DEFAULT 0,
  total_listed numeric NOT NULL DEFAULT 0,
  price_override numeric,
  is_showing boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_bundles TO authenticated;
GRANT SELECT ON public.product_bundles TO anon;
GRANT ALL ON public.product_bundles TO service_role;
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage bundles" ON public.product_bundles FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Public sees showing bundles" ON public.product_bundles FOR SELECT TO anon, authenticated
  USING (is_showing = true);
CREATE TRIGGER product_bundles_updated BEFORE UPDATE ON public.product_bundles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.finance_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text,
  months integer NOT NULL,
  apr numeric NOT NULL DEFAULT 0,
  bdr numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_plans TO authenticated;
GRANT ALL ON public.finance_plans TO service_role;
ALTER TABLE public.finance_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in read finance plans" ON public.finance_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage finance plans" ON public.finance_plans FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER finance_plans_updated BEFORE UPDATE ON public.finance_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.finance_plans (months, apr, bdr, sort_order)
SELECT m, 9.99, 0, m FROM unnest(ARRAY[24,36,48,60,72,84,96,108,120]) AS m;
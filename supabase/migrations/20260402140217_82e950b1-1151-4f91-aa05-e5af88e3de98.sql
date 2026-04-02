
-- Product Suppliers: multiple vendors per product
CREATE TABLE public.product_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  vendor_id_code text NOT NULL DEFAULT '',
  supplier_name text NOT NULL DEFAULT '',
  supplier_location text DEFAULT '',
  our_price numeric(10,2) DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage product suppliers"
ON public.product_suppliers FOR ALL TO public
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active product suppliers"
ON public.product_suppliers FOR SELECT TO public
USING (is_active = true);

-- Price History: track supplier price changes over time
CREATE TABLE public.product_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_supplier_id uuid NOT NULL REFERENCES public.product_suppliers(id) ON DELETE CASCADE,
  price numeric(10,2) NOT NULL,
  previous_price numeric(10,2) DEFAULT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid DEFAULT NULL,
  change_reason text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage price history"
ON public.product_price_history FOR ALL TO public
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to auto-update updated_at on product_suppliers
CREATE TRIGGER update_product_suppliers_updated_at
  BEFORE UPDATE ON public.product_suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

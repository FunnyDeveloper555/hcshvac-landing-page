
-- 1. Add vendor pricing formula columns to product_suppliers
ALTER TABLE public.product_suppliers
  ADD COLUMN IF NOT EXISTS website_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS city text DEFAULT '',
  ADD COLUMN IF NOT EXISTS state text DEFAULT '',
  ADD COLUMN IF NOT EXISTS rep_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS rep_phone text DEFAULT '',
  ADD COLUMN IF NOT EXISTS rep_email text DEFAULT '',
  ADD COLUMN IF NOT EXISTS manufacture_product_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS supplier_product_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS vendor_cost numeric(10,2),
  ADD COLUMN IF NOT EXISTS tax_rate numeric(10,2),
  ADD COLUMN IF NOT EXISTS shipping_cost numeric(10,2),
  ADD COLUMN IF NOT EXISTS freight_cost numeric(10,2),
  ADD COLUMN IF NOT EXISTS has_shipping boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_freight boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_residential_suburbs numeric(10,2),
  ADD COLUMN IF NOT EXISTS price_residential_city numeric(10,2),
  ADD COLUMN IF NOT EXISTS price_commercial_suburbs numeric(10,2),
  ADD COLUMN IF NOT EXISTS price_commercial_city numeric(10,2),
  ADD COLUMN IF NOT EXISTS price_custom_formula text DEFAULT '';

-- 2. Create product_activity_history table
CREATE TABLE IF NOT EXISTS public.product_activity_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  page_visits integer NOT NULL DEFAULT 0,
  enquiries integer NOT NULL DEFAULT 0,
  downloads integer NOT NULL DEFAULT 0,
  other_page_views integer NOT NULL DEFAULT 0,
  sent_as_estimate integer NOT NULL DEFAULT 0,
  purchased_installed integer NOT NULL DEFAULT 0,
  warranty_visits integer NOT NULL DEFAULT 0,
  warranty_repaired integer NOT NULL DEFAULT 0,
  recalls_active text DEFAULT 'None',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

ALTER TABLE public.product_activity_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage product activity history"
  ON public.product_activity_history FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_product_activity_history_updated_at
  BEFORE UPDATE ON public.product_activity_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Create product_purchase_orders table  
CREATE TABLE IF NOT EXISTS public.product_purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  manufacture_part_number text DEFAULT '',
  purchase_date date,
  customer_id_info text DEFAULT '',
  purchase_type text DEFAULT 'purchased',
  vendor_id_number text DEFAULT '',
  po_number text DEFAULT '',
  receipt_scan_url text DEFAULT '',
  tech_id text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage product purchase orders"
  ON public.product_purchase_orders FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_product_purchase_orders_updated_at
  BEFORE UPDATE ON public.product_purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

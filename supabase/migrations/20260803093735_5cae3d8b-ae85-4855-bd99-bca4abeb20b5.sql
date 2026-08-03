CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  item_type text,
  brand_name text,
  tons_btu text,
  seer_rating text,
  model_number text,
  serial_number text,
  quantity integer NOT NULL DEFAULT 1,
  assign_type text NOT NULL DEFAULT 'company',
  customer_id uuid,
  company_id uuid,
  appointment_id uuid,
  supply_vendor_id uuid,
  received_date date DEFAULT CURRENT_DATE,
  po_number text,
  status text NOT NULL DEFAULT 'received',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage inventory items"
ON public.inventory_items FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE INDEX idx_inventory_items_status ON public.inventory_items(status);
CREATE INDEX idx_inventory_items_customer ON public.inventory_items(customer_id);
CREATE INDEX idx_inventory_items_company ON public.inventory_items(company_id);

CREATE TRIGGER update_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
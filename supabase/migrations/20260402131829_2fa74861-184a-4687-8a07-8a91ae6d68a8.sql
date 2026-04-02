
-- Create hierarchical product categories table
CREATE TABLE public.product_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id uuid REFERENCES public.product_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  level integer NOT NULL DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_product_categories_parent_slug 
  ON public.product_categories (COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

CREATE INDEX idx_product_categories_parent_id ON public.product_categories(parent_id);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage product categories"
  ON public.product_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active product categories"
  ON public.product_categories FOR SELECT
  USING (is_active = true);

CREATE TRIGGER update_product_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.products ADD COLUMN category_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL;
CREATE INDEX idx_products_category_id ON public.products(category_id);

-- Seed Level 0: Equipment Types
INSERT INTO public.product_categories (id, parent_id, name, slug, level, display_order) VALUES
  ('a0000001-0000-0000-0000-000000000001', NULL, 'HVAC Equipment', 'hvac-equipment', 0, 1),
  ('a0000001-0000-0000-0000-000000000002', NULL, 'Plumbing Equipment', 'plumbing-equipment', 0, 2),
  ('a0000001-0000-0000-0000-000000000003', NULL, 'Parts Replacement', 'parts-replacement', 0, 3);

-- Seed Level 1: Residential / Commercial under HVAC
INSERT INTO public.product_categories (id, parent_id, name, slug, level, display_order) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Residential', 'residential', 1, 1),
  ('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'Commercial', 'commercial', 1, 2);

-- Seed Level 1: Residential / Commercial under Plumbing
INSERT INTO public.product_categories (id, parent_id, name, slug, level, display_order) VALUES
  ('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000002', 'Residential', 'residential', 1, 1),
  ('b0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000002', 'Commercial', 'commercial', 1, 2);

-- Seed Level 1: Parts Replacement sub-categories
INSERT INTO public.product_categories (id, parent_id, name, slug, level, display_order) VALUES
  ('b0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000003', 'Condenser', 'condenser', 1, 1),
  ('b0000001-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000003', 'Coil', 'coil', 1, 2),
  ('b0000001-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000003', 'Furnace', 'furnace', 1, 3),
  ('b0000001-0000-0000-0000-000000000013', 'a0000001-0000-0000-0000-000000000003', 'Water Heater', 'water-heater', 1, 4),
  ('b0000001-0000-0000-0000-000000000014', 'a0000001-0000-0000-0000-000000000003', 'Boiler', 'boiler', 1, 5),
  ('b0000001-0000-0000-0000-000000000015', 'a0000001-0000-0000-0000-000000000003', 'Mini Split', 'mini-split', 1, 6),
  ('b0000001-0000-0000-0000-000000000016', 'a0000001-0000-0000-0000-000000000003', 'Tankless', 'tankless', 1, 7);

-- Seed Level 2: Equipment sub-types under HVAC Residential
INSERT INTO public.product_categories (parent_id, name, slug, level, display_order) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'AC Condenser Only', 'ac-condenser-only', 2, 1),
  ('b0000001-0000-0000-0000-000000000001', 'Furnace Only', 'furnace-only', 2, 2),
  ('b0000001-0000-0000-0000-000000000001', 'Furnace and Coil', 'furnace-and-coil', 2, 3),
  ('b0000001-0000-0000-0000-000000000001', 'Furnace, Coil, and Condenser', 'furnace-coil-condenser', 2, 4),
  ('b0000001-0000-0000-0000-000000000001', 'Coil Only', 'coil-only', 2, 5),
  ('b0000001-0000-0000-0000-000000000001', 'Water Heater', 'water-heater', 2, 6),
  ('b0000001-0000-0000-0000-000000000001', 'Tankless Water Heater', 'tankless-water-heater', 2, 7),
  ('b0000001-0000-0000-0000-000000000001', 'Boiler (Hot Water)', 'boiler-hot-water', 2, 8),
  ('b0000001-0000-0000-0000-000000000001', 'Boiler (Steam)', 'boiler-steam', 2, 9),
  ('b0000001-0000-0000-0000-000000000001', 'Boiler (Tankless)', 'boiler-tankless', 2, 10),
  ('b0000001-0000-0000-0000-000000000001', 'Mini Split', 'mini-split', 2, 11);

-- Seed Level 2: Equipment sub-types under HVAC Commercial
INSERT INTO public.product_categories (parent_id, name, slug, level, display_order) VALUES
  ('b0000001-0000-0000-0000-000000000002', 'AC Condenser Only', 'ac-condenser-only', 2, 1),
  ('b0000001-0000-0000-0000-000000000002', 'Furnace Only', 'furnace-only', 2, 2),
  ('b0000001-0000-0000-0000-000000000002', 'Furnace and Coil', 'furnace-and-coil', 2, 3),
  ('b0000001-0000-0000-0000-000000000002', 'Furnace, Coil, and Condenser', 'furnace-coil-condenser', 2, 4),
  ('b0000001-0000-0000-0000-000000000002', 'Coil Only', 'coil-only', 2, 5),
  ('b0000001-0000-0000-0000-000000000002', 'Water Heater', 'water-heater', 2, 6),
  ('b0000001-0000-0000-0000-000000000002', 'Boiler (Hot Water)', 'boiler-hot-water', 2, 7),
  ('b0000001-0000-0000-0000-000000000002', 'Boiler (Steam)', 'boiler-steam', 2, 8),
  ('b0000001-0000-0000-0000-000000000002', 'Mini Split', 'mini-split', 2, 9);

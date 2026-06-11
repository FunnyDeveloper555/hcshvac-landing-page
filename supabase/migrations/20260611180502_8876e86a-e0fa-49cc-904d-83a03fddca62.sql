
-- =========================================================
-- Phase 1: Diagnostic Fees + Appointment Cart
-- =========================================================

-- 1) diagnostic_fees: configurable matrix of company x visit_type -> fee
CREATE TABLE public.diagnostic_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  visit_type TEXT NOT NULL,
  fee_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_waivable BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX diagnostic_fees_company_visit_uniq
  ON public.diagnostic_fees (COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::uuid), visit_type)
  WHERE is_active = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostic_fees TO authenticated;
GRANT ALL ON public.diagnostic_fees TO service_role;
ALTER TABLE public.diagnostic_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage diagnostic fees"
  ON public.diagnostic_fees
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER diagnostic_fees_updated_at
  BEFORE UPDATE ON public.diagnostic_fees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) appointment_carts: one cart per appointment
CREATE TABLE public.appointment_carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE UNIQUE,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'unpaid', -- unpaid | pending | paid | refunded | failed
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_carts TO authenticated;
GRANT ALL ON public.appointment_carts TO service_role;
ALTER TABLE public.appointment_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage appointment carts"
  ON public.appointment_carts
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER appointment_carts_updated_at
  BEFORE UPDATE ON public.appointment_carts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) appointment_cart_items: line items
CREATE TABLE public.appointment_cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID NOT NULL REFERENCES public.appointment_carts(id) ON DELETE CASCADE,
  product_id UUID NULL REFERENCES public.products(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL DEFAULT 'product', -- diagnostic_fee | product | service | custom
  description TEXT NOT NULL,
  qty NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_waived BOOLEAN NOT NULL DEFAULT false,
  waiver_reason TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_cart_items TO authenticated;
GRANT ALL ON public.appointment_cart_items TO service_role;
ALTER TABLE public.appointment_cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage appointment cart items"
  ON public.appointment_cart_items
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER appointment_cart_items_updated_at
  BEFORE UPDATE ON public.appointment_cart_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Auto-recompute line_total + cart totals
CREATE OR REPLACE FUNCTION public.recalc_cart_totals(_cart_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.appointment_carts c
     SET subtotal = COALESCE((
           SELECT SUM(CASE WHEN is_waived THEN 0 ELSE line_total END)
             FROM public.appointment_cart_items
            WHERE cart_id = _cart_id
         ), 0),
         total = COALESCE((
           SELECT SUM(CASE WHEN is_waived THEN 0 ELSE line_total END)
             FROM public.appointment_cart_items
            WHERE cart_id = _cart_id
         ), 0) + COALESCE(c.tax, 0),
         updated_at = now()
   WHERE c.id = _cart_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cart_item_before_save()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.line_total := COALESCE(NEW.qty, 0) * COALESCE(NEW.unit_price, 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER cart_item_compute_line_total
  BEFORE INSERT OR UPDATE ON public.appointment_cart_items
  FOR EACH ROW EXECUTE FUNCTION public.cart_item_before_save();

CREATE OR REPLACE FUNCTION public.cart_item_after_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _cid UUID;
BEGIN
  _cid := COALESCE(NEW.cart_id, OLD.cart_id);
  PERFORM public.recalc_cart_totals(_cid);
  RETURN NULL;
END;
$$;

CREATE TRIGGER cart_item_recalc_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.appointment_cart_items
  FOR EACH ROW EXECUTE FUNCTION public.cart_item_after_change();

-- 5) Seed common preset diagnostic fees (global / company_id = NULL)
INSERT INTO public.diagnostic_fees (company_id, visit_type, fee_amount, is_waivable, notes) VALUES
  (NULL, 'Service Repair',     155.00, true,  'Standard diagnostic fee'),
  (NULL, 'Estimate',             0.00, true,  'Free estimate'),
  (NULL, 'Warranty',             0.00, true,  'No fee on warranty visits'),
  (NULL, 'Inspection Report',  135.00, false, 'Inspection report fee'),
  (NULL, 'Maintenance',         99.00, true,  'Maintenance visit fee'),
  (NULL, 'Installation',         0.00, true,  'Quoted separately'),
  (NULL, 'Other',              155.00, true,  'Default fee');

ALTER TABLE public.products
  ADD COLUMN invoice_line_description text DEFAULT '' NOT NULL,
  ADD COLUMN invoice_unit_price_text text DEFAULT '' NOT NULL,
  ADD COLUMN invoice_foot_notes text DEFAULT '' NOT NULL,
  ADD COLUMN invoice_payment_plan text DEFAULT '' NOT NULL,
  ADD COLUMN invoice_terms text DEFAULT '' NOT NULL,
  ADD COLUMN invoice_ship_via text DEFAULT '' NOT NULL,
  ADD COLUMN invoice_notes text DEFAULT '' NOT NULL;
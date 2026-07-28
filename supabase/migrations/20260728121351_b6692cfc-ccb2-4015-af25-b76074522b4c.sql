
CREATE TABLE public.installation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customer_registrations(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  completed_by_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  completed_by_name TEXT,
  category TEXT NOT NULL CHECK (category IN ('residential_hvac','commercial_hvac','plumbing')),
  item_type TEXT NOT NULL,
  install_date DATE,
  brand_name TEXT,
  model_number TEXT,
  serial_number TEXT,
  labor_warranty_years INTEGER CHECK (labor_warranty_years BETWEEN 0 AND 20),
  equipment_warranty_years INTEGER CHECK (equipment_warranty_years BETWEEN 0 AND 20),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_install_records_customer ON public.installation_records(customer_id);
CREATE INDEX idx_install_records_appointment ON public.installation_records(appointment_id);
CREATE INDEX idx_install_records_category ON public.installation_records(category);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.installation_records TO authenticated;
GRANT ALL ON public.installation_records TO service_role;

ALTER TABLE public.installation_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view installations"
  ON public.installation_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert installations"
  ON public.installation_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update installations"
  ON public.installation_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete installations"
  ON public.installation_records FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_installation_records_updated_at
  BEFORE UPDATE ON public.installation_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

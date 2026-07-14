
-- Site Profile Questionnaire (Residential) — completed on-site by technician
CREATE TABLE public.site_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customer_registrations(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  profile_type text NOT NULL DEFAULT 'residential', -- residential | commercial | industrial | educational
  -- Top summary fields
  session_id text,
  assigned_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  job_number text,
  booking_method text,
  location_type text,
  mdu boolean DEFAULT false,
  visit_type text,
  equipment_type text,
  equipment_location text,
  entered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  ticket_status text DEFAULT 'active',
  customer_deemed_status text DEFAULT 'active',
  -- Customer snapshot (bill-to / ship-to / contacts)
  bill_to jsonb DEFAULT '{}'::jsonb,
  ship_to jsonb DEFAULT '{}'::jsonb,
  primary_contact jsonb DEFAULT '{}'::jsonb,
  secondary_contact jsonb DEFAULT '{}'::jsonb,
  notes text,
  status text NOT NULL DEFAULT 'draft', -- draft | submitted
  submitted_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_profiles TO authenticated;
GRANT ALL ON public.site_profiles TO service_role;
ALTER TABLE public.site_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins & mods manage site_profiles" ON public.site_profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER update_site_profiles_updated_at
  BEFORE UPDATE ON public.site_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_site_profiles_customer ON public.site_profiles(customer_id);
CREATE INDEX idx_site_profiles_appointment ON public.site_profiles(appointment_id);

-- Each system on site (heating, cooling, sump, ejector, custom_item, thermostat, humidifier, uv_light, filter_assembly)
CREATE TABLE public.site_profile_systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.site_profiles(id) ON DELETE CASCADE,
  system_kind text NOT NULL, -- heating | cooling | sump_pump | ejector | custom
  sort_order int NOT NULL DEFAULT 0,
  -- Flexible data bag holds all questionnaire selections (type, brand, poise, width, AFUE, stage,
  -- energy_supply, voltage, btu_kw, age, thermostat, ac fields, sump fields, custom title/about, notes, etc.)
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_profile_systems TO authenticated;
GRANT ALL ON public.site_profile_systems TO service_role;
ALTER TABLE public.site_profile_systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins & mods manage site_profile_systems" ON public.site_profile_systems
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER update_site_profile_systems_updated_at
  BEFORE UPDATE ON public.site_profile_systems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_sp_systems_profile ON public.site_profile_systems(profile_id);

-- Photos attached to a profile (optionally to a system) — component slot identifies which picture (label_plate, upper_section, flue_at_unit, etc.)
CREATE TABLE public.site_profile_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.site_profiles(id) ON DELETE CASCADE,
  system_id uuid REFERENCES public.site_profile_systems(id) ON DELETE CASCADE,
  component_slot text NOT NULL, -- e.g. 'label_plate','upper_section','flue_at_unit','ac_disconnect','sump_pit','custom'
  slot_title text, -- for custom items
  slot_about text,
  storage_path text NOT NULL, -- path within site-profile-photos bucket
  public_url text,
  content_type text,
  size_bytes bigint,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_profile_photos TO authenticated;
GRANT ALL ON public.site_profile_photos TO service_role;
ALTER TABLE public.site_profile_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins & mods manage site_profile_photos" ON public.site_profile_photos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE INDEX idx_sp_photos_profile ON public.site_profile_photos(profile_id);
CREATE INDEX idx_sp_photos_system ON public.site_profile_photos(system_id);

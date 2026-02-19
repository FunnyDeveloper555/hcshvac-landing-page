
-- Table to define available admin console modules
CREATE TABLE public.admin_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  icon text DEFAULT 'Layout',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Junction table to assign modules to roles
CREATE TABLE public.role_module_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  module_id uuid REFERENCES public.admin_modules(id) ON DELETE CASCADE NOT NULL,
  can_view boolean DEFAULT true,
  can_edit boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, module_id)
);

-- Enable RLS
ALTER TABLE public.admin_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_module_assignments ENABLE ROW LEVEL SECURITY;

-- RLS for admin_modules
CREATE POLICY "Admins can manage modules" ON public.admin_modules
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view active modules" ON public.admin_modules
  FOR SELECT USING (is_active = true);

-- RLS for role_module_assignments
CREATE POLICY "Admins can manage role module assignments" ON public.role_module_assignments
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their role assignments" ON public.role_module_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = role_module_assignments.role
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_admin_modules_updated_at
  BEFORE UPDATE ON public.admin_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_role_module_assignments_updated_at
  BEFORE UPDATE ON public.role_module_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with current admin console modules
INSERT INTO public.admin_modules (name, label, description, icon, display_order) VALUES
  ('dashboard', 'Dashboard', 'Main admin dashboard overview', 'LayoutDashboard', 0),
  ('companies', 'Companies', 'Manage companies', 'Building2', 1),
  ('services', 'Services', 'Manage services', 'Wrench', 2),
  ('employees', 'Employees', 'Manage employees', 'Users', 3),
  ('vendors', 'Vendors', 'Manage vendors', 'Store', 4),
  ('customers', 'Customers', 'Manage customers', 'UserCheck', 5),
  ('appointments', 'Appointments', 'Manage appointments', 'Calendar', 6),
  ('hero_content', 'Hero Content', 'Manage hero sections', 'Image', 7),
  ('hero_images', 'Hero Images', 'Manage hero images', 'ImagePlus', 8),
  ('page_builder', 'Page Builder', 'Build and manage pages', 'FileText', 9),
  ('user_management', 'User Management', 'Manage users, roles & groups', 'Shield', 10),
  ('logs', 'Logs', 'View admin activity logs', 'ScrollText', 11),
  ('sms_links', 'SMS Links', 'Manage SMS booking links', 'MessageSquare', 12),
  ('calendar', 'Calendar', 'Calendar management', 'CalendarDays', 13),
  ('service_terms', 'Service Terms', 'Manage service terms', 'FileSearch', 14);


-- Drop existing tables from previous migration (in correct order due to FK dependencies)
DROP TABLE IF EXISTS public.email_list_unsubscribes CASCADE;
DROP TABLE IF EXISTS public.email_list_posts CASCADE;
DROP TABLE IF EXISTS public.email_list_groups CASCADE;
DROP TABLE IF EXISTS public.email_lists CASCADE;

-- Email List Groups
CREATE TABLE IF NOT EXISTS public.email_list_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_list_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email list groups" ON public.email_list_groups
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_email_list_groups_updated_at
  BEFORE UPDATE ON public.email_list_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Email Lists
CREATE TABLE IF NOT EXISTS public.email_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  email_list_group_id uuid REFERENCES public.email_list_groups(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email lists" ON public.email_lists
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_email_lists_updated_at
  BEFORE UPDATE ON public.email_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Email List Posts (subscribers/email entries)
CREATE TABLE IF NOT EXISTS public.email_list_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_list_id uuid NOT NULL REFERENCES public.email_lists(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  last_name text,
  company_name text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_list_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email list posts" ON public.email_list_posts
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_email_list_posts_updated_at
  BEFORE UPDATE ON public.email_list_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_email_list_posts_email_list_id ON public.email_list_posts(email_list_id);
CREATE INDEX idx_email_list_posts_email ON public.email_list_posts(email);

-- Email List Unsubscribes
CREATE TABLE IF NOT EXISTS public.email_list_unsubscribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_list_id uuid NOT NULL REFERENCES public.email_lists(id) ON DELETE CASCADE,
  email_list_post_id uuid REFERENCES public.email_list_posts(id) ON DELETE SET NULL,
  email text NOT NULL,
  reason text,
  unsubscribed_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_list_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email list unsubscribes" ON public.email_list_unsubscribes
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_email_list_unsubscribes_email_list_id ON public.email_list_unsubscribes(email_list_id);
CREATE INDEX idx_email_list_unsubscribes_email ON public.email_list_unsubscribes(email);

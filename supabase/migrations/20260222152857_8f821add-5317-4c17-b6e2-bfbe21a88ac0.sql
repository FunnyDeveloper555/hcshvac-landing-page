
-- Email Lists main table
CREATE TABLE public.email_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.email_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email lists" ON public.email_lists
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Junction: email_list <-> user_groups (auto subscriber groups)
CREATE TABLE public.email_list_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_list_id uuid NOT NULL REFERENCES public.email_lists(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email_list_id, group_id)
);

ALTER TABLE public.email_list_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email list groups" ON public.email_list_groups
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Posts (individual emails within a list)
CREATE TABLE public.email_list_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_list_id uuid NOT NULL REFERENCES public.email_lists(id) ON DELETE CASCADE,
  subject text NOT NULL,
  body text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_list_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email list posts" ON public.email_list_posts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Unsubscribes (track users removed from a list)
CREATE TABLE public.email_list_unsubscribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_list_id uuid NOT NULL REFERENCES public.email_lists(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unsubscribed_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(email_list_id, user_id)
);

ALTER TABLE public.email_list_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage unsubscribes" ON public.email_list_unsubscribes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Updated_at triggers
CREATE TRIGGER update_email_lists_updated_at BEFORE UPDATE ON public.email_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_list_posts_updated_at BEFORE UPDATE ON public.email_list_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

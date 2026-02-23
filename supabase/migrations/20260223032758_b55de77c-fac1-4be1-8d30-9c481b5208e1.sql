
-- Junction table: email_lists <-> user_groups (many-to-many)
CREATE TABLE IF NOT EXISTS public.email_list_user_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_list_id uuid NOT NULL REFERENCES public.email_lists(id) ON DELETE CASCADE,
  user_group_id uuid NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email_list_id, user_group_id)
);

ALTER TABLE public.email_list_user_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email list user groups" ON public.email_list_user_groups
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_email_list_user_groups_list ON public.email_list_user_groups(email_list_id);
CREATE INDEX idx_email_list_user_groups_group ON public.email_list_user_groups(user_group_id);

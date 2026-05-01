
-- Hire invitations (token-based links sent to candidates)
CREATE TABLE public.hire_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID,
  recipient_name TEXT,
  recipient_phone TEXT,
  recipient_email TEXT,
  send_method TEXT NOT NULL DEFAULT 'sms',
  token TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '14 days'),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX hire_invitations_token_idx ON public.hire_invitations(token);

ALTER TABLE public.hire_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage hire invitations" ON public.hire_invitations
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view invitation by token" ON public.hire_invitations
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update invitation status" ON public.hire_invitations
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE TRIGGER hire_invitations_updated_at
  BEFORE UPDATE ON public.hire_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Hire applications (submitted form data)
CREATE TABLE public.hire_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id UUID REFERENCES public.hire_invitations(id) ON DELETE SET NULL,
  company_id UUID,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hire_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage hire applications" ON public.hire_applications
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can submit hire application" ON public.hire_applications
  FOR INSERT WITH CHECK (true);

CREATE TRIGGER hire_applications_updated_at
  BEFORE UPDATE ON public.hire_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

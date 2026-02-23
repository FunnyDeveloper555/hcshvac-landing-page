
-- Table to store email content/templates for each email list
CREATE TABLE public.email_list_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_list_id uuid NOT NULL REFERENCES public.email_lists(id) ON DELETE CASCADE,
  subject text NOT NULL DEFAULT '',
  html_content text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.email_list_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email list emails"
  ON public.email_list_emails
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index
CREATE INDEX idx_email_list_emails_list_id ON public.email_list_emails(email_list_id);

-- Updated_at trigger
CREATE TRIGGER update_email_list_emails_updated_at
  BEFORE UPDATE ON public.email_list_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- Create company_domains table for managing custom domain connections
CREATE TABLE public.company_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  domain_name text NOT NULL,
  subdomain text, -- e.g. "www"
  record_type text NOT NULL DEFAULT 'A', -- A, CNAME, TXT
  target_ip text NOT NULL DEFAULT '185.158.133.1',
  txt_verify_value text, -- TXT verification value
  status text NOT NULL DEFAULT 'pending', -- pending, verifying, active, failed, offline
  ssl_status text NOT NULL DEFAULT 'pending', -- pending, provisioning, active, failed
  verified_at timestamptz,
  is_primary boolean DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(domain_name)
);

-- Enable RLS
ALTER TABLE public.company_domains ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can view all company domains"
ON public.company_domains FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert company domains"
ON public.company_domains FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update company domains"
ON public.company_domains FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete company domains"
ON public.company_domains FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Moderators can view
CREATE POLICY "Moderators can view company domains"
ON public.company_domains FOR SELECT
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_company_domains_updated_at
BEFORE UPDATE ON public.company_domains
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

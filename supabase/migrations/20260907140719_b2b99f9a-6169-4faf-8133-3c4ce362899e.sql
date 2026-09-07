CREATE TABLE public.mass_page_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  page_path TEXT NOT NULL,
  content_id UUID,
  action TEXT NOT NULL,
  status TEXT,
  previous_status TEXT,
  changed_by UUID,
  changed_by_email TEXT,
  changed_fields TEXT[] NOT NULL DEFAULT '{}',
  snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mass_page_history_company_path ON public.mass_page_history (company_id, page_path, created_at DESC);

GRANT SELECT ON public.mass_page_history TO authenticated;
GRANT ALL ON public.mass_page_history TO service_role;

ALTER TABLE public.mass_page_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read mass page history"
  ON public.mass_page_history FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE OR REPLACE FUNCTION public.log_mass_page_content_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _action TEXT;
  _fields TEXT[] := '{}';
  _email TEXT;
  _rec RECORD;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _rec := OLD;
    _action := 'delete';
  ELSIF TG_OP = 'INSERT' THEN
    _rec := NEW;
    _action := 'create';
  ELSE
    _rec := NEW;
    IF COALESCE(OLD.status,'') <> COALESCE(NEW.status,'') THEN
      _action := 'status_change';
      _fields := array_append(_fields, 'status');
    ELSE
      _action := 'update';
    END IF;
    IF OLD.blocks::text <> NEW.blocks::text THEN
      _fields := array_append(_fields, 'blocks');
    END IF;
    IF to_jsonb(OLD) ? 'overrides' AND to_jsonb(OLD)->>'overrides' IS DISTINCT FROM to_jsonb(NEW)->>'overrides' THEN
      _fields := array_append(_fields, 'content');
    END IF;
  END IF;

  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();

  INSERT INTO public.mass_page_history (
    company_id, page_path, content_id, action, status, previous_status,
    changed_by, changed_by_email, changed_fields, snapshot
  ) VALUES (
    _rec.company_id, _rec.page_path, _rec.id, _action,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW)->>'status' END,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD)->>'status' ELSE NULL END,
    auth.uid(), _email, _fields, to_jsonb(_rec)
  );

  RETURN _rec;
END;
$$;

CREATE TRIGGER trg_mass_page_content_history
AFTER INSERT OR UPDATE OR DELETE ON public.mass_page_content
FOR EACH ROW EXECUTE FUNCTION public.log_mass_page_content_change();
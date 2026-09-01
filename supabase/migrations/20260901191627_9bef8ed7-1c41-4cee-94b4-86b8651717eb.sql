ALTER TABLE public.mass_page_content
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';

ALTER TABLE public.mass_page_content
  DROP CONSTRAINT IF EXISTS mass_page_content_status_check;

ALTER TABLE public.mass_page_content
  ADD CONSTRAINT mass_page_content_status_check
  CHECK (status IN ('new','active','suspended','deleted'));

CREATE INDEX IF NOT EXISTS mass_page_content_status_idx
  ON public.mass_page_content (company_id, status);
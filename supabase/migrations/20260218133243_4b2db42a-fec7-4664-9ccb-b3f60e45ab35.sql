
-- Add new fields to company_popups
ALTER TABLE public.company_popups
  ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS publish_start_date timestamptz NULL,
  ADD COLUMN IF NOT EXISTS publish_end_date timestamptz NULL,
  ADD COLUMN IF NOT EXISTS file_url text NULL,
  ADD COLUMN IF NOT EXISTS redirect_url text NULL,
  ADD COLUMN IF NOT EXISTS destination_window text NOT NULL DEFAULT 'self';

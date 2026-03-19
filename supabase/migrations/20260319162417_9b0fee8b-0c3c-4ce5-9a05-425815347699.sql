
-- Add new boolean columns to contents
ALTER TABLE public.contents ADD COLUMN allow_comments boolean NOT NULL DEFAULT false;
ALTER TABLE public.contents ADD COLUMN show_author_name boolean NOT NULL DEFAULT true;

-- Create content_history table for version control
CREATE TABLE public.content_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  slug text,
  short_description text,
  html_content text NOT NULL DEFAULT '',
  spot_text text,
  spot_image_url text,
  tags text[] NOT NULL DEFAULT '{}',
  publish_status text NOT NULL DEFAULT 'draft',
  allow_comments boolean NOT NULL DEFAULT false,
  show_author_name boolean NOT NULL DEFAULT true,
  changed_by uuid NOT NULL,
  change_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_history ENABLE ROW LEVEL SECURITY;

-- Admins can manage content history
CREATE POLICY "Admins can manage content history"
ON public.content_history
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast lookups
CREATE INDEX idx_content_history_content_id ON public.content_history(content_id, version_number DESC);

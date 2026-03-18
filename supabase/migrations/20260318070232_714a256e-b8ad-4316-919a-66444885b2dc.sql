
-- Content module table
CREATE TABLE public.contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL,
  slug text,
  short_description text,
  html_content text NOT NULL DEFAULT '',
  publish_status text NOT NULL DEFAULT 'draft',
  publish_start_date timestamp with time zone,
  publish_end_date timestamp with time zone,
  tags text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(slug)
);

-- Enable RLS
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage contents"
  ON public.contents FOR ALL
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view published active contents"
  ON public.contents FOR SELECT
  TO public
  USING (
    is_active = true
    AND publish_status = 'published'
    AND (publish_start_date IS NULL OR publish_start_date <= now())
    AND (publish_end_date IS NULL OR publish_end_date >= now())
  );

-- Updated_at trigger
CREATE TRIGGER update_contents_updated_at
  BEFORE UPDATE ON public.contents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

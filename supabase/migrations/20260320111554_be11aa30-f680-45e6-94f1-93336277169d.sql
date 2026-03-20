
-- Create content_metadata table for flexible metadata entries
CREATE TABLE public.content_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  metadata_type TEXT NOT NULL DEFAULT 'plain_text',
  field_key TEXT NOT NULL DEFAULT '',
  field_value TEXT NOT NULL DEFAULT '',
  file_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_metadata ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage content metadata"
  ON public.content_metadata
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Public can view active metadata for published content
CREATE POLICY "Anyone can view active content metadata"
  ON public.content_metadata
  FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.contents c
      WHERE c.id = content_metadata.content_id
        AND c.is_active = true
        AND c.publish_status = 'published'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_content_metadata_updated_at
  BEFORE UPDATE ON public.content_metadata
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_content_metadata_content_id ON public.content_metadata(content_id);

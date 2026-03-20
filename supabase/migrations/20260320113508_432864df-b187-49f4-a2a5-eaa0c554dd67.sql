
-- Create content recommendations table (similar pattern to product_recommendations)
CREATE TABLE public.content_recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id uuid NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  recommended_content_id uuid NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT content_recommendations_no_self CHECK (content_id != recommended_content_id),
  UNIQUE (content_id, recommended_content_id)
);

-- Enable RLS
ALTER TABLE public.content_recommendations ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage content recommendations"
ON public.content_recommendations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public can view active recommendations for published content
CREATE POLICY "Anyone can view active content recommendations"
ON public.content_recommendations
FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.contents c
    WHERE c.id = content_recommendations.content_id
      AND c.is_active = true
      AND c.publish_status = 'published'
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_content_recommendations_updated_at
BEFORE UPDATE ON public.content_recommendations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

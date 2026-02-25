
-- Create product recommendations table
CREATE TABLE public.product_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  recommended_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, recommended_product_id),
  CHECK (product_id != recommended_product_id)
);

-- Enable RLS
ALTER TABLE public.product_recommendations ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage product recommendations"
ON public.product_recommendations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active recommendations
CREATE POLICY "Anyone can view active recommendations"
ON public.product_recommendations FOR SELECT
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_product_recommendations_updated_at
BEFORE UPDATE ON public.product_recommendations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

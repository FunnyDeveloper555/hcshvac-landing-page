
-- 1. Product Reviews and Ratings
CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL,
  reviewer_email text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  review_text text,
  is_verified_purchase boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage product reviews" ON public.product_reviews FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view approved reviews" ON public.product_reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Anyone can submit a review" ON public.product_reviews FOR INSERT WITH CHECK (true);

CREATE INDEX idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX idx_product_reviews_rating ON public.product_reviews(rating);

CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON public.product_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Product Documents/Attachments
CREATE TABLE public.product_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_type text NOT NULL DEFAULT 'specification_sheet',
  file_url text NOT NULL,
  file_size bigint,
  mime_type text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage product documents" ON public.product_documents FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active product documents" ON public.product_documents FOR SELECT USING (is_active = true);

CREATE INDEX idx_product_documents_product_id ON public.product_documents(product_id);

CREATE TRIGGER update_product_documents_updated_at BEFORE UPDATE ON public.product_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Galleries table
CREATE TABLE public.galleries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  activity_date date NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  author_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage galleries" ON public.galleries FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active galleries" ON public.galleries FOR SELECT USING (is_active = true);

CREATE TRIGGER update_galleries_updated_at BEFORE UPDATE ON public.galleries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Gallery items (images and videos)
CREATE TABLE public.gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id uuid NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  item_type text NOT NULL DEFAULT 'image',
  file_url text NOT NULL,
  thumbnail_url text NULL,
  title text DEFAULT '',
  alt_text text DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage gallery items" ON public.gallery_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active gallery items" ON public.gallery_items FOR SELECT USING (is_active = true AND EXISTS (SELECT 1 FROM public.galleries g WHERE g.id = gallery_items.gallery_id AND g.is_active = true));

CREATE TRIGGER update_gallery_items_updated_at BEFORE UPDATE ON public.gallery_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

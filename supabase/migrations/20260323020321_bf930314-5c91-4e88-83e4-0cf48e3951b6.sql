
-- Create content_comments table
CREATE TABLE public.content_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id uuid NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  parent_id uuid REFERENCES public.content_comments(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT '',
  author_email text,
  comment_text text NOT NULL,
  is_approved boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_comments ENABLE ROW LEVEL SECURITY;

-- Admins can manage all comments
CREATE POLICY "Admins can manage content comments"
ON public.content_comments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can insert comments on content that allows comments
CREATE POLICY "Authenticated users can submit comments"
ON public.content_comments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.contents c
    WHERE c.id = content_comments.content_id
      AND c.allow_comments = true
      AND c.is_active = true
      AND c.publish_status = 'published'
  )
);

-- Anyone can view approved active comments on published content
CREATE POLICY "Anyone can view approved comments"
ON public.content_comments
FOR SELECT
USING (
  is_approved = true
  AND is_active = true
  AND EXISTS (
    SELECT 1 FROM public.contents c
    WHERE c.id = content_comments.content_id
      AND c.is_active = true
      AND c.publish_status = 'published'
  )
);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
ON public.content_comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON public.content_comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_content_comments_updated_at
BEFORE UPDATE ON public.content_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create hero_content table
CREATE TABLE public.hero_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text NOT NULL,
  description text NOT NULL,
  badge_text text NOT NULL DEFAULT '24/7 Emergency Service Available',
  primary_button_text text NOT NULL DEFAULT 'Call Now',
  primary_button_link text NOT NULL DEFAULT 'tel:+1234567890',
  secondary_button_text text NOT NULL DEFAULT 'View Our Services',
  secondary_button_link text NOT NULL DEFAULT '#services',
  stat1_value text NOT NULL DEFAULT '25+',
  stat1_label text NOT NULL DEFAULT 'Years Experience',
  stat2_value text NOT NULL DEFAULT '10k+',
  stat2_label text NOT NULL DEFAULT 'Happy Customers',
  stat3_value text NOT NULL DEFAULT '24/7',
  stat3_label text NOT NULL DEFAULT 'Emergency Service',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on hero_content
ALTER TABLE public.hero_content ENABLE ROW LEVEL SECURITY;

-- RLS policies for hero_content
CREATE POLICY "Anyone can view active hero content"
  ON public.hero_content
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all hero content"
  ON public.hero_content
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert hero content"
  ON public.hero_content
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update hero content"
  ON public.hero_content
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete hero content"
  ON public.hero_content
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create hero_images table
CREATE TABLE public.hero_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  alt_text text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on hero_images
ALTER TABLE public.hero_images ENABLE ROW LEVEL SECURITY;

-- RLS policies for hero_images
CREATE POLICY "Anyone can view active hero images"
  ON public.hero_images
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all hero images"
  ON public.hero_images
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert hero images"
  ON public.hero_images
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update hero images"
  ON public.hero_images
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete hero images"
  ON public.hero_images
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default hero content
INSERT INTO public.hero_content (
  title,
  subtitle,
  description,
  badge_text,
  primary_button_text,
  primary_button_link,
  secondary_button_text,
  secondary_button_link,
  stat1_value,
  stat1_label,
  stat2_value,
  stat2_label,
  stat3_value,
  stat3_label,
  is_active
) VALUES (
  'Your Comfort Is Our Priority',
  'Professional HVAC Solutions',
  'Expert heating, cooling, and air quality services for residential and commercial properties. Available 24/7 for emergency repairs with certified technicians.',
  '24/7 Emergency Service Available',
  'Call Now',
  'tel:+1234567890',
  'View Our Services',
  '#services',
  '25+',
  'Years Experience',
  '10k+',
  'Happy Customers',
  '24/7',
  'Emergency Service',
  true
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hero_content_updated_at
  BEFORE UPDATE ON public.hero_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
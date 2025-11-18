-- Create cities table to store US city information
CREATE TABLE public.cities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city_id integer NOT NULL UNIQUE,
  name text NOT NULL,
  county text,
  state_code text NOT NULL,
  state text NOT NULL,
  zip_codes text,
  type text,
  latitude numeric,
  longitude numeric,
  area_code text,
  population integer,
  households integer,
  median_income numeric,
  land_area numeric,
  water_area numeric,
  time_zone text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_cities_state_code ON public.cities(state_code);
CREATE INDEX idx_cities_name ON public.cities(name);
CREATE INDEX idx_cities_city_id ON public.cities(city_id);

-- Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view cities
CREATE POLICY "Anyone can view cities"
  ON public.cities
  FOR SELECT
  USING (true);

-- Only admins can modify cities
CREATE POLICY "Admins can insert cities"
  ON public.cities
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update cities"
  ON public.cities
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete cities"
  ON public.cities
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
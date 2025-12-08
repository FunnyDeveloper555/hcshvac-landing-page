-- Create a function to count businesses by city and state
-- This runs as SECURITY DEFINER to bypass RLS for count-only operations
CREATE OR REPLACE FUNCTION public.get_business_counts_by_cities(
  city_names text[],
  state_codes text[]
)
RETURNS TABLE(city_name text, state_code text, business_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    b.city as city_name,
    b.state as state_code,
    COUNT(*) as business_count
  FROM public.business b
  WHERE b.city = ANY(city_names) 
    AND b.state = ANY(state_codes)
  GROUP BY b.city, b.state;
$$;
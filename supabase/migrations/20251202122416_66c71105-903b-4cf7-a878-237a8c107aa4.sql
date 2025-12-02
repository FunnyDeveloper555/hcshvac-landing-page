-- Fix search_path for security
DROP FUNCTION IF EXISTS get_distinct_states();
DROP FUNCTION IF EXISTS get_counties_by_states(text[]);

CREATE OR REPLACE FUNCTION get_distinct_states()
RETURNS TABLE (state text, state_code text) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT cities.state, cities.state_code
  FROM public.cities
  ORDER BY cities.state;
$$;

CREATE OR REPLACE FUNCTION get_counties_by_states(state_codes text[])
RETURNS TABLE (county text, state_code text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT cities.county, cities.state_code
  FROM public.cities
  WHERE cities.state_code = ANY(state_codes)
    AND cities.county IS NOT NULL
  ORDER BY cities.state_code, cities.county;
$$;
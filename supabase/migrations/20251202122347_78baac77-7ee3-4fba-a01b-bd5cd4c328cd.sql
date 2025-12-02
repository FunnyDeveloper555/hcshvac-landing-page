-- Create a function to get distinct states from cities table
CREATE OR REPLACE FUNCTION get_distinct_states()
RETURNS TABLE (state text, state_code text) 
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT cities.state, cities.state_code
  FROM cities
  ORDER BY cities.state;
$$;

-- Create a function to get distinct counties for given states
CREATE OR REPLACE FUNCTION get_counties_by_states(state_codes text[])
RETURNS TABLE (county text, state_code text)
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT cities.county, cities.state_code
  FROM cities
  WHERE cities.state_code = ANY(state_codes)
    AND cities.county IS NOT NULL
  ORDER BY cities.state_code, cities.county;
$$;
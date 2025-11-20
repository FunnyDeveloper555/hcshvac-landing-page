-- Allow public read access to cities table (reference data)
CREATE POLICY "Allow public read access to cities"
ON public.cities
FOR SELECT
TO public
USING (true);
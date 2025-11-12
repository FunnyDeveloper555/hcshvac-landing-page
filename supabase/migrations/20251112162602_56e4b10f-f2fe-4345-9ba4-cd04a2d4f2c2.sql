-- Allow anyone to view employees on the public website
CREATE POLICY "Anyone can view employees"
ON public.employees
FOR SELECT
TO public
USING (true);
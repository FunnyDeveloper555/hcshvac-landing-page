-- Add UPDATE policy for authenticated users
CREATE POLICY "Authenticated users can update registrations"
ON public.customer_registrations
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Add DELETE policy for authenticated users
CREATE POLICY "Authenticated users can delete registrations"
ON public.customer_registrations
FOR DELETE
USING (true);
-- Enable Row Level Security on business table (idempotent)
ALTER TABLE public.business ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all business records
CREATE POLICY "Admins can view all business" 
ON public.business
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert business records (for CSV import)
CREATE POLICY "Admins can insert business" 
ON public.business
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update business records
CREATE POLICY "Admins can update business" 
ON public.business
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete business records
CREATE POLICY "Admins can delete business" 
ON public.business
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

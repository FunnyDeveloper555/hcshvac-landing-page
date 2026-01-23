-- Add header_pages column to companies table for storing page content
ALTER TABLE public.companies 
ADD COLUMN header_pages JSONB DEFAULT '{}'::jsonb;
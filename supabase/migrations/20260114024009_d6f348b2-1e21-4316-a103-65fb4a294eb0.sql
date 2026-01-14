-- Add theme_style column to companies table
ALTER TABLE public.companies 
ADD COLUMN theme_style text DEFAULT 'modern' CHECK (theme_style IN ('modern', 'classic', 'bold', 'minimal', 'elegant'));
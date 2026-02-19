
-- Create folders table
CREATE TABLE public.file_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.file_folders(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create files table
CREATE TABLE public.file_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  folder_id UUID REFERENCES public.file_folders(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.file_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for file_folders
CREATE POLICY "Admins can manage folders" ON public.file_folders
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view folders" ON public.file_folders
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS policies for file_items
CREATE POLICY "Admins can manage files" ON public.file_items
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view files" ON public.file_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Triggers for updated_at
CREATE TRIGGER update_file_folders_updated_at
  BEFORE UPDATE ON public.file_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_file_items_updated_at
  BEFORE UPDATE ON public.file_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for file manager
INSERT INTO storage.buckets (id, name, public) VALUES ('file-manager', 'file-manager', true);

-- Storage policies
CREATE POLICY "Admins can upload files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'file-manager' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'file-manager' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete files" ON storage.objects
  FOR DELETE USING (bucket_id = 'file-manager' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view file-manager files" ON storage.objects
  FOR SELECT USING (bucket_id = 'file-manager');

-- Add indexes
CREATE INDEX idx_file_folders_parent ON public.file_folders(parent_id);
CREATE INDEX idx_file_items_folder ON public.file_items(folder_id);

CREATE TABLE public.fileserver_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  status text NOT NULL DEFAULT 'processing',
  progress integer NOT NULL DEFAULT 0,
  result jsonb,
  error text,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fileserver_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read their own jobs"
  ON public.fileserver_jobs FOR SELECT TO authenticated
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Service role can manage all jobs"
  ON public.fileserver_jobs FOR ALL TO service_role
  USING (true) WITH CHECK (true);
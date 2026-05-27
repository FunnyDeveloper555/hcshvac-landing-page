CREATE TABLE public.call_logs_3cx (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_call_id TEXT UNIQUE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound','internal','unknown')),
  from_number TEXT,
  to_number TEXT,
  caller_name TEXT,
  agent_extension TEXT,
  agent_name TEXT,
  queue_name TEXT,
  status TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  ring_seconds INTEGER,
  talk_seconds INTEGER,
  recording_url TEXT,
  cost NUMERIC,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  customer_id UUID REFERENCES public.customer_registrations(id) ON DELETE SET NULL,
  matched_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_logs_3cx TO authenticated;
GRANT ALL ON public.call_logs_3cx TO service_role;

CREATE INDEX idx_call_logs_3cx_started_at ON public.call_logs_3cx (started_at DESC);
CREATE INDEX idx_call_logs_3cx_from_number ON public.call_logs_3cx (from_number);
CREATE INDEX idx_call_logs_3cx_to_number ON public.call_logs_3cx (to_number);
CREATE INDEX idx_call_logs_3cx_customer_id ON public.call_logs_3cx (customer_id);
CREATE INDEX idx_call_logs_3cx_direction ON public.call_logs_3cx (direction);

ALTER TABLE public.call_logs_3cx ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all 3cx call logs"
  ON public.call_logs_3cx FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins insert 3cx call logs"
  ON public.call_logs_3cx FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins update 3cx call logs"
  ON public.call_logs_3cx FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins delete 3cx call logs"
  ON public.call_logs_3cx FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_call_logs_3cx_updated_at
  BEFORE UPDATE ON public.call_logs_3cx
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
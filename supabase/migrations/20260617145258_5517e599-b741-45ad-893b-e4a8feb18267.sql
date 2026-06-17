
CREATE TABLE public.blocked_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_last10 text NOT NULL UNIQUE,
  original_phone text,
  reason text DEFAULT 'telemarketer',
  blocked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_numbers TO authenticated;
GRANT ALL ON public.blocked_numbers TO service_role;

ALTER TABLE public.blocked_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage blocked numbers"
ON public.blocked_numbers FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE OR REPLACE FUNCTION public.is_phone_blocked(_phone text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.blocked_numbers
    WHERE phone_last10 = right(regexp_replace(COALESCE(_phone,''), '\D','','g'), 10)
      AND length(regexp_replace(COALESCE(_phone,''), '\D','','g')) >= 7
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_phone_blocked(text) TO authenticated, anon, service_role;

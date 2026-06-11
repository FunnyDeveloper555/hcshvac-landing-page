
-- 1. Tighten email_tracking_events INSERT: recipient_id must reference a real recipient
DROP POLICY IF EXISTS "Anyone can insert tracking events" ON public.email_tracking_events;
CREATE POLICY "Validated tracking event inserts"
ON public.email_tracking_events
FOR INSERT
TO anon, authenticated, service_role
WITH CHECK (
  recipient_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.email_send_recipients r WHERE r.id = recipient_id)
);

-- 2. Pin search_path on SECURITY DEFINER email-queue helpers
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;

-- 3. Revoke EXECUTE from anon/authenticated; only service_role (edge functions) should call these
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;

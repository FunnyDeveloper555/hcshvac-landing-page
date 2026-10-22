CREATE OR REPLACE FUNCTION public.chat_external_names()
RETURNS TABLE(conversation_id uuid, phone_number text, resolved_name text, match_type text)
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r record;
  digits text;
  last10 text;
  found_name text;
  found_type text;
BEGIN
  IF NOT coalesce(public.is_staff(auth.uid()), false) THEN
    RAISE EXCEPTION 'Staff access required' USING ERRCODE = '42501';
  END IF;

  FOR r IN
    SELECT c.id, c.external_phone, c.external_name, c.external_type
      FROM public.chat_conversations c
     WHERE c.kind = 'external' AND c.external_phone IS NOT NULL AND c.external_phone <> ''
  LOOP
    digits := regexp_replace(r.external_phone, '\D', '', 'g');
    found_name := NULL;
    found_type := NULL;

    IF length(digits) >= 7 THEN
      last10 := right(digits, 10);

      SELECT x.nm INTO found_name
        FROM (
          SELECT coalesce(
                   nullif(trim(concat_ws(' ', cr.ship_to_first_name, cr.ship_to_last_name)), ''),
                   nullif(trim(concat_ws(' ', cr.bill_to_first_name, cr.bill_to_last_name)), ''),
                   nullif(trim(cr.point_of_contact_name), ''),
                   nullif(trim(cr.ship_to_business_name), ''),
                   nullif(trim(cr.bill_to_business_name), ''),
                   nullif(trim(cr.corporation_name), '')
                 ) AS nm
            FROM public.customer_registrations cr
           WHERE right(regexp_replace(coalesce(cr.phone,''), '\D', '', 'g'), 10) = last10
              OR right(regexp_replace(coalesce(cr.business_phone,''), '\D', '', 'g'), 10) = last10
              OR right(regexp_replace(coalesce(cr.point_of_contact_phone,''), '\D', '', 'g'), 10) = last10
        ) x
       WHERE x.nm IS NOT NULL
       LIMIT 1;
      IF found THEN found_type := 'customer'; END IF;

      IF found_name IS NULL THEN
        SELECT x.nm INTO found_name
          FROM (
            SELECT coalesce(
                     nullif(trim(v.vendor_name), ''),
                     nullif(trim(concat_ws(' ', v.representative_first_name, v.representative_last_name)), '')
                   ) AS nm
              FROM public.vendors v
             WHERE right(regexp_replace(coalesce(v.phone,''), '\D', '', 'g'), 10) = last10
                OR right(regexp_replace(coalesce(v.representative_phone,''), '\D', '', 'g'), 10) = last10
          ) x
         WHERE x.nm IS NOT NULL
         LIMIT 1;
        IF found THEN found_type := 'vendor'; END IF;
      END IF;

      IF found_name IS NULL THEN
        SELECT x.nm INTO found_name
          FROM (
            SELECT nullif(trim(concat_ws(' ', e.first_name, e.last_name)), '') AS nm
              FROM public.employees e
             WHERE right(regexp_replace(coalesce(e.phone_number,''), '\D', '', 'g'), 10) = last10
                OR right(regexp_replace(coalesce(e.prev_work_phone_number,''), '\D', '', 'g'), 10) = last10
          ) x
         WHERE x.nm IS NOT NULL
         LIMIT 1;
        IF found THEN found_type := 'employee'; END IF;
      END IF;

      IF found_name IS NULL THEN
        SELECT x.nm INTO found_name
          FROM (
            SELECT nullif(trim(a.customer_name), '') AS nm
              FROM public.appointments a
             WHERE right(regexp_replace(coalesce(a.customer_phone,''), '\D', '', 'g'), 10) = last10
             ORDER BY a.created_at DESC
          ) x
         WHERE x.nm IS NOT NULL
         LIMIT 1;
        IF found THEN found_type := 'customer'; END IF;
      END IF;

      IF found_name IS NOT NULL AND (
           r.external_name IS NULL OR trim(r.external_name) = ''
           OR regexp_replace(r.external_name, '\D', '', 'g') = last10
         ) THEN
        UPDATE public.chat_conversations
           SET external_name = found_name,
               name = found_name,
               external_type = CASE WHEN r.external_type IS NULL OR r.external_type = 'other'
                                    THEN found_type ELSE r.external_type END
         WHERE id = r.id;
      END IF;
    END IF;

    conversation_id := r.id;
    phone_number := r.external_phone;
    resolved_name := found_name;
    match_type := found_type;
    RETURN NEXT;
  END LOOP;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.chat_external_names() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chat_external_names() TO authenticated;
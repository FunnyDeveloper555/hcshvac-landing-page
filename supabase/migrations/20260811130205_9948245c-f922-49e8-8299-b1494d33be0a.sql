DO $$
DECLARE
  src uuid := '956651f9-8ace-45c5-84ad-5d3700f8597b';
  new_id uuid := gen_random_uuid();
  s record;
  new_sys uuid;
BEGIN
  INSERT INTO public.site_profiles (
    id, customer_id, appointment_id, profile_type, session_id, assigned_company_id, job_number,
    booking_method, location_type, mdu, visit_type, equipment_type, equipment_location, entered_by,
    assigned_to, ticket_status, customer_deemed_status, bill_to, ship_to, primary_contact,
    secondary_contact, notes, status, created_by, report_number, unit_label
  )
  SELECT new_id, customer_id, appointment_id, profile_type, 'SP-COPY-' || upper(substr(md5(random()::text),1,8)),
    assigned_company_id, job_number, booking_method, location_type, mdu, visit_type, equipment_type,
    equipment_location, entered_by, assigned_to, ticket_status, customer_deemed_status,
    jsonb_set(coalesce(bill_to,'{}'::jsonb), '{email}', '"treydurden@gmail.com"'),
    jsonb_set(coalesce(ship_to,'{}'::jsonb), '{email}', '"treydurden@gmail.com"'),
    jsonb_set(coalesce(primary_contact,'{}'::jsonb), '{email}', '"treydurden@gmail.com"'),
    secondary_contact, notes, 'draft', created_by,
    coalesce(report_number,'SPR') || '-COPY', unit_label
  FROM public.site_profiles WHERE id = src;

  FOR s IN SELECT * FROM public.site_profile_systems WHERE profile_id = src ORDER BY sort_order LOOP
    new_sys := gen_random_uuid();
    INSERT INTO public.site_profile_systems (id, profile_id, system_kind, sort_order, data, notes)
    VALUES (new_sys, new_id, s.system_kind, s.sort_order, s.data, s.notes);

    INSERT INTO public.site_profile_photos (profile_id, system_id, component_slot, slot_title, slot_about, slot_note, storage_path, public_url, content_type, size_bytes, uploaded_by)
    SELECT new_id, new_sys, component_slot, slot_title, slot_about, slot_note, storage_path, public_url, content_type, size_bytes, uploaded_by
    FROM public.site_profile_photos WHERE profile_id = src AND system_id = s.id;
  END LOOP;

  INSERT INTO public.site_profile_photos (profile_id, system_id, component_slot, slot_title, slot_about, slot_note, storage_path, public_url, content_type, size_bytes, uploaded_by)
  SELECT new_id, NULL, component_slot, slot_title, slot_about, slot_note, storage_path, public_url, content_type, size_bytes, uploaded_by
  FROM public.site_profile_photos WHERE profile_id = src AND system_id IS NULL;
END $$;
ALTER TABLE public.customer_registrations ADD COLUMN IF NOT EXISTS staff_review_required boolean NOT NULL DEFAULT false;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS staff_review_required boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION public.track_submission_review() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF TG_OP = 'INSERT' THEN
  NEW.staff_review_required := NOT coalesce(public.is_staff(auth.uid()), false);
 ELSIF coalesce(public.is_staff(auth.uid()), false) THEN
  NEW.staff_review_required := false;
 ELSE
  NEW.staff_review_required := OLD.staff_review_required;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER customer_submission_review BEFORE INSERT OR UPDATE ON public.customer_registrations FOR EACH ROW EXECUTE FUNCTION public.track_submission_review();
CREATE TRIGGER appointment_submission_review BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.track_submission_review();
UPDATE public.customer_registrations c SET staff_review_required = true WHERE EXISTS (SELECT 1 FROM public.booking_invitations i WHERE i.company_id=c.company_id AND i.status='completed' AND coalesce(i.link_type,'both') IN ('registration','both') AND c.created_at BETWEEN i.created_at AND coalesce(i.completed_at,now()) + interval '5 minutes' AND (nullif(lower(i.recipient_email),'')=lower(c.email) OR (length(regexp_replace(coalesce(i.recipient_phone,''),'\D','','g'))>=10 AND right(regexp_replace(i.recipient_phone,'\D','','g'),10)=right(regexp_replace(c.phone,'\D','','g'),10))));
UPDATE public.appointments a SET staff_review_required = true WHERE a.confirmed_at IS NULL AND EXISTS (SELECT 1 FROM public.booking_invitations i WHERE i.company_id=a.company_id AND i.status='completed' AND coalesce(i.link_type,'both') IN ('booking','both') AND a.created_at BETWEEN i.created_at AND coalesce(i.completed_at,now()) + interval '5 minutes' AND (nullif(lower(i.recipient_email),'')=lower(a.customer_email) OR (length(regexp_replace(coalesce(i.recipient_phone,''),'\D','','g'))>=10 AND right(regexp_replace(i.recipient_phone,'\D','','g'),10)=right(regexp_replace(a.customer_phone,'\D','','g'),10))));
CREATE INDEX customer_pending_review_idx ON public.customer_registrations(created_at DESC) WHERE staff_review_required;
CREATE INDEX appointment_pending_review_idx ON public.appointments(created_at DESC) WHERE staff_review_required;
CREATE OR REPLACE FUNCTION public.crm_pending_submissions() RETURNS TABLE(id uuid,kind text,customer_name text,company_name text,submitted_at timestamptz,scheduled_date date,scheduled_time text) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT coalesce(public.is_staff(auth.uid()),false) THEN RAISE EXCEPTION 'Staff access required' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT c.id,'registration'::text,concat_ws(' ',c.ship_to_first_name,c.ship_to_last_name),co.name,c.created_at,NULL::date,NULL::text FROM public.customer_registrations c LEFT JOIN public.companies co ON co.id=c.company_id WHERE c.staff_review_required
 UNION ALL SELECT a.id,'appointment'::text,a.customer_name,co.name,a.created_at,a.scheduled_date,a.scheduled_time FROM public.appointments a LEFT JOIN public.companies co ON co.id=a.company_id WHERE a.staff_review_required;
END; $$;
REVOKE ALL ON FUNCTION public.crm_pending_submissions() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.crm_pending_submissions() TO authenticated;
REVOKE ALL ON FUNCTION public.track_submission_review() FROM PUBLIC,anon,authenticated;
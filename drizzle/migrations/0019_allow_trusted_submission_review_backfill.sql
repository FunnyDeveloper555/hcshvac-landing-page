CREATE OR REPLACE FUNCTION public.track_submission_review() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF TG_OP = 'INSERT' THEN NEW.staff_review_required := NOT coalesce(public.is_staff(auth.uid()),false);
 ELSIF coalesce(public.is_staff(auth.uid()),false) THEN NEW.staff_review_required := false;
 ELSIF auth.role() IS NOT NULL AND auth.role() <> 'service_role' THEN NEW.staff_review_required := OLD.staff_review_required;
 END IF;
 RETURN NEW;
END; $$;
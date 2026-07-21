DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_invitations;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
ALTER TABLE public.booking_invitations REPLICA IDENTITY FULL;
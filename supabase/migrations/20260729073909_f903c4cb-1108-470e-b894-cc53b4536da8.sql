
ALTER TABLE public.installation_records
  ADD COLUMN IF NOT EXISTS spec jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.installation_pickup_photos
  ADD COLUMN IF NOT EXISTS phase text NOT NULL DEFAULT 'pickup';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'installation_pickup_photos_phase_check'
  ) THEN
    ALTER TABLE public.installation_pickup_photos
      ADD CONSTRAINT installation_pickup_photos_phase_check
      CHECK (phase IN ('pickup','install'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_install_photos_item_phase
  ON public.installation_pickup_photos(item_id, phase);

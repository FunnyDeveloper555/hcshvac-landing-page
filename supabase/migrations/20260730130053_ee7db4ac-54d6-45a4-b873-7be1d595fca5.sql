ALTER TABLE public.installation_pickup_photos
  DROP CONSTRAINT IF EXISTS installation_pickup_photos_slot_check;

ALTER TABLE public.installation_pickup_photos
  ADD CONSTRAINT installation_pickup_photos_slot_check
  CHECK (slot IN (
    'front', 'left', 'right', 'back', 'top', 'bottom',
    'nameplate', 'installed_front', 'installed_side', 'connections',
    'electrical', 'venting', 'condensate', 'general', 'area_of_concern'
  ));
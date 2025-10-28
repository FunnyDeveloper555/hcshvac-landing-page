-- Remove duplicate services (keep the first set created at 02:42:44)
DELETE FROM public.services WHERE id IN (
  '746fb74d-39e6-4c4e-9ca0-f6611281d23f',
  '2ba8105d-67c5-468c-aa78-2c77a4e17a09',
  'b6c07942-700f-45a2-a243-a12835df720c',
  'bedff517-8a4c-449c-ac31-8f08708932b8'
);
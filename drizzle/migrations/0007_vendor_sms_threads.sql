ALTER TABLE public.work_item_replies
  ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS channel text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS vendor_id uuid,
  ADD COLUMN IF NOT EXISTS media jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS read_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_work_item_replies_inbound ON public.work_item_replies (direction, read_at);
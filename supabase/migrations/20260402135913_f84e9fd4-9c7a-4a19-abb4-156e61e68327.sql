
-- Drop old RLS policy that depends on is_published
DROP POLICY IF EXISTS "Anyone can view published products" ON public.products;

-- Create the product_status enum (may already exist from partial run)
DO $$ BEGIN
  CREATE TYPE public.product_status AS ENUM (
    'active_showing',
    'active_not_showing', 
    'discontinued_showing',
    'deactivated'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add new status column
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status public.product_status NOT NULL DEFAULT 'active_not_showing';

-- Migrate existing data
UPDATE public.products SET status = CASE WHEN is_published = true THEN 'active_showing'::public.product_status ELSE 'active_not_showing'::public.product_status END;

-- Drop the old column
ALTER TABLE public.products DROP COLUMN is_published;

-- Create new public visibility policy
CREATE POLICY "Anyone can view showing products"
ON public.products
FOR SELECT
TO public
USING (status IN ('active_showing', 'discontinued_showing'));

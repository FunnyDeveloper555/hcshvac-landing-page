ALTER TABLE public.finance_plans ADD COLUMN IF NOT EXISTS plan_type text NOT NULL DEFAULT 'standard';
ALTER TABLE public.finance_plans ADD COLUMN IF NOT EXISTS base_apr numeric;
ALTER TABLE public.finance_plans ADD COLUMN IF NOT EXISTS understanding text;
ALTER TABLE public.finance_plans ADD CONSTRAINT finance_plans_plan_type_check CHECK (plan_type IN ('standard','bdr','ccr'));
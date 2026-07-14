ALTER TABLE public.hire_invitations
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS qualifications text[] NOT NULL DEFAULT '{}';
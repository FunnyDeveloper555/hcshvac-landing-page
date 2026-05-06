ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS resume_certificates_achievements TEXT,
  ADD COLUMN IF NOT EXISTS resume_skills TEXT,
  ADD COLUMN IF NOT EXISTS resume_summary TEXT;
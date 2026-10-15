ALTER TABLE public.employees ALTER COLUMN date_of_birth DROP NOT NULL;
ALTER TABLE public.employees
 ADD COLUMN IF NOT EXISTS sms_text_pager text,
 ADD COLUMN IF NOT EXISTS sms_email_pager text,
 ADD COLUMN IF NOT EXISTS job_title text,
 ADD COLUMN IF NOT EXISTS department text,
 ADD COLUMN IF NOT EXISTS hire_date date,
 ADD COLUMN IF NOT EXISTS employment_status text DEFAULT 'active',
 ADD COLUMN IF NOT EXISTS emergency_contacts jsonb NOT NULL DEFAULT '[]'::jsonb,
 ADD COLUMN IF NOT EXISTS bio_notes text;
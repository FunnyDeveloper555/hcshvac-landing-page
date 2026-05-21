
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.applicant_document_type AS ENUM (
  'personal_photo',
  'drivers_license',
  'birth_certificate',
  'social_security_card',
  'irs_1099',
  'irs_w4',
  'work_authorization',
  'citizenship_affidavit',
  'address_proof_1',
  'address_proof_2',
  'other'
);

CREATE TYPE public.applicant_document_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

CREATE TYPE public.applicant_consent_type AS ENUM (
  'criminal_background_check',
  'drug_testing',
  'driving_history',
  'citizenship_affidavit',
  'general_terms'
);

CREATE TYPE public.applicant_interview_status AS ENUM (
  'scheduled',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TYPE public.applicant_account_status AS ENUM (
  'invited',
  'active',
  'suspended'
);

-- =========================================================
-- APPLICANT ACCOUNTS
-- =========================================================
CREATE TABLE public.applicant_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  application_id UUID REFERENCES public.hire_applications(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  status public.applicant_account_status NOT NULL DEFAULT 'invited',
  invited_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.applicant_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicant can view own account"
  ON public.applicant_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Applicant can update own account"
  ON public.applicant_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all applicant accounts"
  ON public.applicant_accounts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins manage applicant accounts"
  ON public.applicant_accounts FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER applicant_accounts_updated_at
  BEFORE UPDATE ON public.applicant_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- APPLICANT DOCUMENTS
-- =========================================================
CREATE TABLE public.applicant_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_account_id UUID NOT NULL REFERENCES public.applicant_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  document_type public.applicant_document_type NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT,
  mime_type TEXT,
  file_size BIGINT,
  status public.applicant_document_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_applicant_documents_account ON public.applicant_documents(applicant_account_id);
CREATE INDEX idx_applicant_documents_user ON public.applicant_documents(user_id);

ALTER TABLE public.applicant_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicant view own docs"
  ON public.applicant_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Applicant insert own docs"
  ON public.applicant_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Applicant update own docs"
  ON public.applicant_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Applicant delete own docs"
  ON public.applicant_documents FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all docs"
  ON public.applicant_documents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins manage all docs"
  ON public.applicant_documents FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER applicant_documents_updated_at
  BEFORE UPDATE ON public.applicant_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- APPLICANT CONSENTS
-- =========================================================
CREATE TABLE public.applicant_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_account_id UUID NOT NULL REFERENCES public.applicant_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  consent_type public.applicant_consent_type NOT NULL,
  agreed BOOLEAN NOT NULL DEFAULT false,
  signature_name TEXT,
  signed_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  document_version TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (applicant_account_id, consent_type)
);

CREATE INDEX idx_applicant_consents_user ON public.applicant_consents(user_id);

ALTER TABLE public.applicant_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicant view own consents"
  ON public.applicant_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Applicant insert own consents"
  ON public.applicant_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Applicant update own consents"
  ON public.applicant_consents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all consents"
  ON public.applicant_consents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins manage consents"
  ON public.applicant_consents FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER applicant_consents_updated_at
  BEFORE UPDATE ON public.applicant_consents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- APPLICANT INTERVIEWS
-- =========================================================
CREATE TABLE public.applicant_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_account_id UUID NOT NULL REFERENCES public.applicant_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  meeting_url TEXT,
  interviewer_name TEXT,
  interviewer_email TEXT,
  position_title TEXT,
  status public.applicant_interview_status NOT NULL DEFAULT 'scheduled',
  applicant_notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE INDEX idx_applicant_interviews_account ON public.applicant_interviews(applicant_account_id);

ALTER TABLE public.applicant_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicant view own interviews"
  ON public.applicant_interviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all interviews"
  ON public.applicant_interviews FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins manage interviews"
  ON public.applicant_interviews FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER applicant_interviews_updated_at
  BEFORE UPDATE ON public.applicant_interviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- INTERVIEW FORMS (internal, completed by staff)
-- =========================================================
CREATE TABLE public.applicant_interview_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.applicant_interviews(id) ON DELETE CASCADE,
  applicant_account_id UUID NOT NULL REFERENCES public.applicant_accounts(id) ON DELETE CASCADE,
  staff_user_id UUID NOT NULL,
  staff_name TEXT,
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  strengths TEXT,
  weaknesses TEXT,
  recommendation TEXT,
  notes TEXT,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.applicant_interview_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view interview forms"
  ON public.applicant_interview_forms FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins manage interview forms"
  ON public.applicant_interview_forms FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER applicant_interview_forms_updated_at
  BEFORE UPDATE ON public.applicant_interview_forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- HANDBOOK ACKNOWLEDGMENTS
-- =========================================================
CREATE TABLE public.applicant_handbook_acks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_account_id UUID NOT NULL REFERENCES public.applicant_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  handbook_version TEXT,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (applicant_account_id, handbook_version)
);

ALTER TABLE public.applicant_handbook_acks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicant view own ack"
  ON public.applicant_handbook_acks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Applicant insert own ack"
  ON public.applicant_handbook_acks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all acks"
  ON public.applicant_handbook_acks FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- =========================================================
-- PSYCHOLOGICAL EXAMS
-- =========================================================
CREATE TABLE public.applicant_psych_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_account_id UUID NOT NULL REFERENCES public.applicant_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  exam_version TEXT,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  score NUMERIC,
  result TEXT,
  admin_notes TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_psych_exams_account ON public.applicant_psych_exams(applicant_account_id);

ALTER TABLE public.applicant_psych_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicant view own exam"
  ON public.applicant_psych_exams FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Applicant insert own exam"
  ON public.applicant_psych_exams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Applicant update own exam"
  ON public.applicant_psych_exams FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all exams"
  ON public.applicant_psych_exams FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins manage exams"
  ON public.applicant_psych_exams FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER applicant_psych_exams_updated_at
  BEFORE UPDATE ON public.applicant_psych_exams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- STORAGE BUCKET: applicant-documents (private)
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('applicant-documents', 'applicant-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Applicants can read/write only their own folder (first folder = user id)
CREATE POLICY "Applicant read own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'applicant-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Applicant upload own files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'applicant-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Applicant update own files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'applicant-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Applicant delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'applicant-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins/moderators full access to applicant-documents
CREATE POLICY "Admins access applicant files"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'applicant-documents'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  )
  WITH CHECK (
    bucket_id = 'applicant-documents'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  );

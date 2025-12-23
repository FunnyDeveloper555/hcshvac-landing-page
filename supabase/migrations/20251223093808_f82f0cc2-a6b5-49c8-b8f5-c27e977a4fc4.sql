-- Create booking_invitations table to store SMS/Email booking links
CREATE TABLE public.booking_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  invitation_type TEXT NOT NULL CHECK (invitation_type IN ('residential', 'commercial')),
  customer_type TEXT NOT NULL CHECK (customer_type IN ('new', 'existing')),
  recipient_phone TEXT,
  recipient_email TEXT,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'completed', 'expired')),
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  notes TEXT,
  CONSTRAINT recipient_required CHECK (recipient_phone IS NOT NULL OR recipient_email IS NOT NULL)
);

-- Enable RLS
ALTER TABLE public.booking_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can view all booking invitations"
ON public.booking_invitations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert booking invitations"
ON public.booking_invitations
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update booking invitations"
ON public.booking_invitations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete booking invitations"
ON public.booking_invitations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public can view their invitation by token (for the booking form)
CREATE POLICY "Anyone can view invitation by token"
ON public.booking_invitations
FOR SELECT
USING (true);

-- Public can update invitation status when completing the form
CREATE POLICY "Anyone can update invitation status"
ON public.booking_invitations
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Add index for token lookup
CREATE INDEX idx_booking_invitations_token ON public.booking_invitations(token);
CREATE INDEX idx_booking_invitations_status ON public.booking_invitations(status);
CREATE INDEX idx_booking_invitations_company ON public.booking_invitations(company_id);
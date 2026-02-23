
-- Email Templates table for reusable HTML templates
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  html_content TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email templates" ON public.email_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Email Send Jobs table for scheduled/queued sends
CREATE TABLE public.email_send_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_list_id UUID NOT NULL REFERENCES public.email_lists(id) ON DELETE CASCADE,
  email_id UUID NOT NULL REFERENCES public.email_list_emails(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_send_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email send jobs" ON public.email_send_jobs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_email_send_jobs_updated_at
  BEFORE UPDATE ON public.email_send_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_email_send_jobs_status ON public.email_send_jobs(status);
CREATE INDEX idx_email_send_jobs_scheduled_at ON public.email_send_jobs(scheduled_at);

-- Email Send Recipients table for tracking per-recipient sends
CREATE TABLE public.email_send_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  send_job_id UUID NOT NULL REFERENCES public.email_send_jobs(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  tracking_id TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_send_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email send recipients" ON public.email_send_recipients
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_email_send_recipients_job ON public.email_send_recipients(send_job_id);
CREATE INDEX idx_email_send_recipients_tracking ON public.email_send_recipients(tracking_id);
CREATE INDEX idx_email_send_recipients_email ON public.email_send_recipients(email);

-- Email Tracking Events table for detailed event logging
CREATE TABLE public.email_tracking_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES public.email_send_recipients(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email tracking events" ON public.email_tracking_events
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow anonymous inserts for tracking pixel/click events
CREATE POLICY "Anyone can insert tracking events" ON public.email_tracking_events
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_email_tracking_events_recipient ON public.email_tracking_events(recipient_id);
CREATE INDEX idx_email_tracking_events_type ON public.email_tracking_events(event_type);

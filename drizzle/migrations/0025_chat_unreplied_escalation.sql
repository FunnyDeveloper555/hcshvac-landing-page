ALTER TABLE public.notification_targets ADD COLUMN IF NOT EXISTS notify_chat boolean NOT NULL DEFAULT false;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS escalation_sent_at timestamptz;
CREATE INDEX IF NOT EXISTS chat_messages_inbound_pending_idx ON public.chat_messages (created_at) WHERE direction = 'inbound' AND escalation_sent_at IS NULL;
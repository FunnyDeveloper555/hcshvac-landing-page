CREATE OR REPLACE FUNCTION public.is_staff(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_uid,'admin') OR public.has_role(_uid,'moderator')
$$;

CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('direct','channel','company','external')),
  name text,
  company_id uuid,
  external_phone text,
  external_name text,
  external_type text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX chat_conv_company_uniq ON public.chat_conversations(company_id) WHERE kind='company';
CREATE UNIQUE INDEX chat_conv_external_uniq ON public.chat_conversations(external_phone) WHERE kind='external';

CREATE TABLE public.chat_members (
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  last_alerted_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id uuid,
  sender_name text,
  body text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  direction text NOT NULL DEFAULT 'internal',
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_conv_idx ON public.chat_messages(conversation_id, created_at DESC);
CREATE INDEX chat_messages_out_phone_idx ON public.chat_messages(phone, created_at DESC) WHERE direction='outbound';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_conversations, public.chat_members, public.chat_messages TO authenticated;
GRANT ALL ON public.chat_conversations, public.chat_members, public.chat_messages TO service_role;

CREATE OR REPLACE FUNCTION public.can_access_chat(_conv uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_staff(_uid) AND EXISTS (
    SELECT 1 FROM public.chat_conversations c WHERE c.id = _conv AND (
      c.kind <> 'direct' OR EXISTS (SELECT 1 FROM public.chat_members m WHERE m.conversation_id = c.id AND m.user_id = _uid)))
$$;

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read chats" ON public.chat_conversations FOR SELECT TO authenticated USING (public.can_access_chat(id, auth.uid()));
CREATE POLICY "Staff create chats" ON public.chat_conversations FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Staff rename chats" ON public.chat_conversations FOR UPDATE TO authenticated USING (public.can_access_chat(id, auth.uid()));
CREATE POLICY "Admins delete chats" ON public.chat_conversations FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Staff read members" ON public.chat_members FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff add members" ON public.chat_members FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Own read marker" ON public.chat_members FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Leave chat" ON public.chat_members FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Staff read messages" ON public.chat_messages FOR SELECT TO authenticated USING (public.can_access_chat(conversation_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.chat_touch_conversation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.chat_conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_chat_touch AFTER INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.chat_touch_conversation();

CREATE OR REPLACE FUNCTION public.chat_unread_counts()
RETURNS TABLE(conversation_id uuid, unread bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, count(msg.id)
  FROM public.chat_conversations c
  LEFT JOIN public.chat_members m ON m.conversation_id = c.id AND m.user_id = auth.uid()
  JOIN public.chat_messages msg ON msg.conversation_id = c.id
   AND msg.created_at > COALESCE(m.last_read_at, now() - interval '7 days')
   AND msg.sender_id IS DISTINCT FROM auth.uid()
  WHERE public.can_access_chat(c.id, auth.uid())
  GROUP BY c.id
$$;
GRANT EXECUTE ON FUNCTION public.chat_unread_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_chat(uuid, uuid) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
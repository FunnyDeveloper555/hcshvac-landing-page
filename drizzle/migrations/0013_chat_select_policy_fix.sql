DROP POLICY "Staff read chats" ON public.chat_conversations;
CREATE POLICY "Staff read chats" ON public.chat_conversations FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid()) AND (kind <> 'direct' OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.chat_members m WHERE m.conversation_id = id AND m.user_id = auth.uid())));
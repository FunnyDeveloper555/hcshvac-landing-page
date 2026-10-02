GRANT UPDATE ON public.work_item_replies TO authenticated;
CREATE POLICY "Staff mark vendor texts read" ON public.work_item_replies FOR UPDATE TO authenticated
USING (direction = 'inbound' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)))
WITH CHECK (direction = 'inbound' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)));
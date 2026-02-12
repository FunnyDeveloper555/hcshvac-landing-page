
-- Tighten the profiles insert policy - only allow users to insert their own profile
DROP POLICY "System can insert profiles" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

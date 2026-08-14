-- Security fix: replace p_user_id parameter with auth.uid() so the function
-- always decrements the currently authenticated user's quota. This prevents
-- any authenticated client from directly calling the RPC with an arbitrary
-- user UUID (bypassing the /api/session/abandon route) to manipulate quotas.

CREATE OR REPLACE FUNCTION public.decrement_sessions_used()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE profiles
  SET sessions_used_this_month = GREATEST(0, sessions_used_this_month - 1)
  WHERE id = auth.uid();
$$;

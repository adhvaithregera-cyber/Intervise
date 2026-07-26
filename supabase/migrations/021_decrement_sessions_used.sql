-- Atomic session quota restore used by session/abandon.
-- Single UPDATE statement avoids TOCTOU race when two concurrent abandon
-- calls (or an abandon + complete) arrive simultaneously.
CREATE OR REPLACE FUNCTION public.decrement_sessions_used(p_user_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE profiles
  SET sessions_used_this_month = GREATEST(0, sessions_used_this_month - 1)
  WHERE id = p_user_id;
$$;

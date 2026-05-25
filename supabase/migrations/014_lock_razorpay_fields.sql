-- 014_lock_razorpay_fields.sql
-- Extend the profile field lock trigger to protect Razorpay subscription fields.
-- Authenticated users must not be able to write these fields directly via the REST API.
-- Only the service role (used by webhook and payment API routes) can modify them.

CREATE OR REPLACE FUNCTION public.lock_protected_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF current_role = 'authenticated' THEN
    -- Fields locked against direct authenticated-role writes:
    NEW.tier                      := OLD.tier;
    NEW.sessions_used_this_month  := OLD.sessions_used_this_month;
    NEW.sessions_limit            := OLD.sessions_limit;
    NEW.razorpay_subscription_id  := OLD.razorpay_subscription_id;
    NEW.tier_expires_at           := OLD.tier_expires_at;
    NEW.subscription_status       := OLD.subscription_status;
  END IF;
  RETURN NEW;
END;
$$;

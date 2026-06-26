-- 018_security_advisor_fixes.sql
-- Fix two Supabase Security Advisor warnings:
--
-- 1. lock_protected_profile_fields: migration 014 recreated the function
--    without SET search_path = '', leaving it vulnerable to search-path
--    injection. Re-add the hardened version with all Razorpay fields intact.
--
-- 2. create_session_atomic: PostgreSQL grants EXECUTE to PUBLIC by default,
--    so anon can call this SECURITY DEFINER RPC even though it immediately
--    raises 'unauthorized'. Revoke from anon to eliminate the surface entirely.

-- ── 1. Restore hardened lock_protected_profile_fields ────────────────────────

CREATE OR REPLACE FUNCTION public.lock_protected_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF current_role = 'authenticated' THEN
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

-- ── 2. Revoke anon EXECUTE on create_session_atomic ──────────────────────────
-- The function already rejects unauthenticated callers (auth.uid() = null →
-- raise 'unauthorized'), but revoking EXECUTE from anon removes the attack
-- surface entirely and clears the Security Advisor warning.

REVOKE EXECUTE ON FUNCTION public.create_session_atomic(text) FROM anon;

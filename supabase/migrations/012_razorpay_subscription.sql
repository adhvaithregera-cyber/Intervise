-- 012_razorpay_subscription.sql
-- Adds Razorpay subscription tracking columns to profiles.
-- subscription_status: active | cancelled | halted | pending
-- tier_expires_at: used by pg_cron daily downgrade job as safety net

alter table public.profiles
  add column if not exists razorpay_subscription_id text,
  add column if not exists subscription_status text
    check (subscription_status in ('active', 'cancelled', 'halted', 'pending')),
  add column if not exists tier_expires_at timestamptz;

-- Daily pg_cron job: downgrade profiles whose subscription has expired.
-- Run once in Supabase SQL editor after migration (pg_cron must be enabled):
--
-- SELECT cron.schedule(
--   'downgrade-expired-subscriptions',
--   '0 2 * * *',
--   $$
--     UPDATE public.profiles
--     SET tier = 'free',
--         razorpay_subscription_id = null,
--         subscription_status = null,
--         tier_expires_at = null
--     WHERE tier_expires_at < now()
--       AND tier != 'free';
--   $$
-- );

-- 013_razorpay_subscription_id_unique.sql
-- Prevent two profiles from sharing the same Razorpay subscription ID.
-- NULL values are allowed (free-tier users have no subscription).
-- PostgreSQL's UNIQUE constraint treats NULLs as distinct, so multiple
-- NULLs are permitted while duplicate non-NULL IDs are rejected.

alter table public.profiles
  add constraint if not exists profiles_razorpay_subscription_id_unique
  unique (razorpay_subscription_id);

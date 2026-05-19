-- =============================================================
-- 008_onboarding_fields_and_tier_sync.sql
-- =============================================================
-- 1. Add missing onboarding columns to profiles
--    (age, experience_level, interview_type, practice_frequency)
--
-- 2. Modify lock_protected_profile_fields to always compute
--    sessions_limit from tier, so the column stays in sync
--    whenever an admin changes a user's tier.
-- =============================================================


-- ── 1. Add missing onboarding columns ────────────────────────

alter table public.profiles
  add column if not exists age integer check (age >= 16 and age <= 100),
  add column if not exists experience_level text,
  add column if not exists interview_type text,
  add column if not exists practice_frequency text;


-- ── 2. Sync sessions_limit to tier automatically ─────────────
--
-- Update the existing trigger function so that every INSERT or
-- UPDATE on profiles keeps sessions_limit consistent with tier.
-- For authenticated users, tier is locked to old.tier first
-- (preventing self-upgrade), then sessions_limit is derived
-- from whatever tier ends up being.

create or replace function public.lock_protected_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_role = 'authenticated' then
    new.tier                     := old.tier;
    new.sessions_used_this_month := old.sessions_used_this_month;
  end if;

  -- Always compute sessions_limit from tier so it never goes stale
  new.sessions_limit := case new.tier
    when 'pro'     then 30
    when 'student' then 12
    else 2
  end;

  return new;
end;
$$;

-- Backfill existing rows to match current tier
update public.profiles
set sessions_limit = case tier
  when 'pro'     then 30
  when 'student' then 12
  else 2
end;

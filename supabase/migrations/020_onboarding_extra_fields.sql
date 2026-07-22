-- Add extra onboarding fields to profiles
-- experience_level, interview_type, practice_frequency were already in the API/schema
-- but the columns may not exist yet. job_challenge is new.

alter table public.profiles
  add column if not exists experience_level   text,
  add column if not exists interview_type     text,
  add column if not exists practice_frequency text,
  add column if not exists job_challenge      text;

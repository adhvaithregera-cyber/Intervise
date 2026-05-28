-- Add weakness summary caching columns to profiles
alter table profiles
  add column if not exists weakness_summary text,
  add column if not exists weakness_summary_at timestamptz,
  add column if not exists weakness_summary_session_count integer default 0;

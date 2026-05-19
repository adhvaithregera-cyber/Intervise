-- Add 'hard' to the difficulty check constraint on sessions.
-- Without this, Pro users selecting 'hard' get a 500 from a constraint violation.

alter table public.sessions
  drop constraint if exists sessions_difficulty_check;

alter table public.sessions
  add constraint sessions_difficulty_check
  check (difficulty in ('easy', 'medium', 'mixed', 'hard'));

-- 015: Ensure difficulty constraint includes 'hard' and RPC matches latest version.
-- This is idempotent — safe to run even if earlier migrations already applied it.

-- 1. Fix sessions difficulty constraint to include 'hard'
alter table public.sessions
  drop constraint if exists sessions_difficulty_check;

alter table public.sessions
  add constraint sessions_difficulty_check
  check (difficulty in ('easy', 'medium', 'mixed', 'hard'));

-- 2. Ensure questions table has difficulty column
alter table public.questions
  add column if not exists difficulty text not null default 'medium'
  check (difficulty in ('easy', 'medium', 'hard'));

-- 3. Replace create_session_atomic with the current canonical version.
-- Student: easy + medium only (no mixed, no hard).
-- Free: easy only.
-- Pro: all difficulties.
create or replace function public.create_session_atomic(
  p_difficulty text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_tier    text;
  v_used    integer;
  v_limit   integer;
  v_session uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'unauthorized' using errcode = 'P0401';
  end if;

  if p_difficulty not in ('easy', 'medium', 'mixed', 'hard') then
    raise exception 'invalid_difficulty' using errcode = 'P0004';
  end if;

  select sessions_used_this_month, tier
    into v_used, v_tier
    from public.profiles
   where id = v_user_id
     for update;

  if not found then
    raise exception 'profile_not_found' using errcode = 'P0005';
  end if;

  v_limit := case v_tier
    when 'student' then 12
    when 'pro'     then 30
    else 2
  end;

  if v_used >= v_limit then
    raise exception 'quota_exceeded' using errcode = 'P0002';
  end if;

  -- Free: easy only
  if v_tier = 'free' and p_difficulty != 'easy' then
    raise exception 'difficulty_not_allowed' using errcode = 'P0003';
  end if;

  -- Student: easy + medium only (no mixed, no hard)
  if v_tier = 'student' and p_difficulty in ('hard', 'mixed') then
    raise exception 'difficulty_not_allowed' using errcode = 'P0003';
  end if;

  update public.profiles
     set sessions_used_this_month = sessions_used_this_month + 1
   where id = v_user_id;

  insert into public.sessions (user_id, difficulty, status, tier_at_time)
  values (v_user_id, p_difficulty, 'in_progress', v_tier)
  returning id into v_session;

  return v_session;
end;
$$;

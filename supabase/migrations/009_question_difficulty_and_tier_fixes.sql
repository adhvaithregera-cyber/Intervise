-- M2: Add difficulty column to questions, fix Student tier difficulty enforcement
-- in create_session_atomic (Student should not access 'mixed' or 'hard').

-- 1. Add explicit difficulty column to questions
alter table public.questions
  add column if not exists difficulty text not null default 'medium'
  check (difficulty in ('easy', 'medium', 'hard'));

-- 2. Seed difficulty values based on existing category + frequency data
--    Categories 6 (Situational) and 7 (Curveball / Pressure) → hard
update public.questions set difficulty = 'hard'
  where category_id in (6, 7);

--    Universal frequency in non-hard categories → easy
update public.questions set difficulty = 'easy'
  where category_id not in (6, 7) and frequency = 'Universal';

--    Everything else (High / Very High / Medium / Low in cat 1–5, 8) stays 'medium'

-- 3. Tighten create_session_atomic: Student may not use 'mixed' or 'hard'
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

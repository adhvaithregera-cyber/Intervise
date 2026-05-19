-- =============================================================
-- 006_rls_and_function_hardening.sql
-- =============================================================
-- 1. Drop increment_sessions_used — it is superseded by
--    create_session_atomic (migration 005) and is callable by
--    any authenticated user with an arbitrary user_id, allowing
--    them to drain another user's monthly quota.
--
-- 2. Recreate UPDATE policies with WITH CHECK so Postgres
--    validates both the USING (read) and the new row (write).
--    Without WITH CHECK, a user can bypass the row filter on
--    the written side.
--
-- 3. Harden SECURITY DEFINER functions with SET search_path = ''
--    to prevent search-path-injection attacks where a malicious
--    schema on the search path could shadow built-in functions.
-- =============================================================


-- ── 1. Drop the old, unsafe quota-increment function ─────────

drop function if exists public.increment_sessions_used(uuid);


-- ── 2. Add WITH CHECK to UPDATE policies ─────────────────────
--
-- Drop and recreate — Postgres does not support ALTER POLICY
-- to add WITH CHECK to an existing policy.

-- profiles
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update
  using  (auth.uid() = id)
  with check (auth.uid() = id);

-- sessions
drop policy if exists "Users can update own sessions" on public.sessions;
create policy "Users can update own sessions" on public.sessions
  for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ── 3. Re-create all SECURITY DEFINER functions with
--       SET search_path = '' to block search-path injection ───

-- handle_new_user (auto-creates profile on signup)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- lock_protected_profile_fields (prevents tier/quota tampering)
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
    new.sessions_limit           := old.sessions_limit;
  end if;
  return new;
end;
$$;

-- lock_protected_session_fields (prevents session row tampering)
create or replace function public.lock_protected_session_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_role = 'authenticated' then
    new.user_id      := old.user_id;
    new.tier_at_time := old.tier_at_time;
    if old.status = 'complete' then
      new.status := old.status;
    end if;
    if old.overall_grade is distinct from new.overall_grade then
      new.overall_grade := old.overall_grade;
    end if;
  end if;
  return new;
end;
$$;

-- create_session_atomic (atomic quota check + session creation)
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

  if v_tier = 'free' and p_difficulty != 'easy' then
    raise exception 'difficulty_not_allowed' using errcode = 'P0003';
  end if;
  if v_tier = 'student' and p_difficulty = 'hard' then
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

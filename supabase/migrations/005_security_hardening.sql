-- =============================================================
-- 005_security_hardening.sql
-- =============================================================
-- 1. Explicit DELETE-deny policies on every user-owned table
-- 2. Trigger that prevents authenticated users from tampering
--    with protected columns (tier, quota, sessions_limit)
-- 3. Trigger that prevents session row tampering
-- 4. Atomic session-creation RPC (quota check + insert in one
--    locked transaction — eliminates the race condition)
-- 5. Remove direct INSERT on sessions (RPC is the only path)
-- =============================================================


-- ── 1. Explicit DELETE deny ──────────────────────────────────

create policy "Deny profile deletion"
  on public.profiles for delete using (false);

create policy "Deny session deletion"
  on public.sessions for delete using (false);

create policy "Deny answer deletion"
  on public.answers for delete using (false);

create policy "Deny question history deletion"
  on public.question_history for delete using (false);


-- ── 2. Protect tier / quota columns on profiles ──────────────
--
-- current_role = 'authenticated' → request came in via the anon
-- key (i.e. a regular browser user). We reset any attempt to
-- change the protected columns to the OLD values so the UPDATE
-- succeeds but those fields are silently preserved.
--
-- current_role = 'service_role' → server-side admin call from
-- our API routes — allowed to change everything, including tier.

create or replace function public.lock_protected_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_role = 'authenticated' then
    -- Users must never be able to self-promote their tier or
    -- manipulate quota/limit counters via the REST API.
    new.tier                     := old.tier;
    new.sessions_used_this_month := old.sessions_used_this_month;
    new.sessions_limit           := old.sessions_limit;
  end if;
  return new;
end;
$$;

create trigger enforce_protected_profile_fields
  before update on public.profiles
  for each row
  execute function public.lock_protected_profile_fields();


-- ── 3. Protect session rows from user tampering ──────────────
--
-- Users are allowed to update `name` (via /api/session/name).
-- Everything else (tier_at_time, status direction, grade) must
-- be immutable for authenticated users.

create or replace function public.lock_protected_session_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_role = 'authenticated' then
    -- Cannot change who owns the session
    new.user_id      := old.user_id;
    -- Cannot change what tier was active when the session started
    new.tier_at_time := old.tier_at_time;
    -- Cannot roll status backwards (in_progress → complete is OK,
    -- complete → in_progress is not)
    if old.status = 'complete' then
      new.status := old.status;
    end if;
    -- Cannot self-assign a grade
    if old.overall_grade is distinct from new.overall_grade then
      new.overall_grade := old.overall_grade;
    end if;
  end if;
  return new;
end;
$$;

create trigger enforce_protected_session_fields
  before update on public.sessions
  for each row
  execute function public.lock_protected_session_fields();


-- ── 4. Atomic session creation with quota enforcement ────────
--
-- Replaces the check-then-create pattern in the API route.
-- SELECT … FOR UPDATE locks the profile row so two concurrent
-- requests cannot both pass the quota check.
-- Derives the limit from the tier stored in the DB — the caller
-- cannot lie about their tier.

create or replace function public.create_session_atomic(
  p_difficulty text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_tier    text;
  v_used    integer;
  v_limit   integer;
  v_session uuid;
begin
  -- Identify the calling user from the JWT
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'unauthorized' using errcode = 'P0401';
  end if;

  -- Validate difficulty value
  if p_difficulty not in ('easy', 'medium', 'mixed', 'hard') then
    raise exception 'invalid_difficulty' using errcode = 'P0004';
  end if;

  -- Lock the profile row to prevent concurrent quota bypass
  select sessions_used_this_month, tier
    into v_used, v_tier
    from public.profiles
   where id = v_user_id
     for update;

  if not found then
    raise exception 'profile_not_found' using errcode = 'P0005';
  end if;

  -- Derive session limit from tier stored in DB (never trusts caller)
  v_limit := case v_tier
    when 'student' then 12
    when 'pro'     then 30
    else 2  -- free + any unknown tier
  end;

  if v_used >= v_limit then
    raise exception 'quota_exceeded' using errcode = 'P0002';
  end if;

  -- Enforce tier-based difficulty restrictions
  if v_tier = 'free' and p_difficulty != 'easy' then
    raise exception 'difficulty_not_allowed' using errcode = 'P0003';
  end if;
  if v_tier = 'student' and p_difficulty = 'hard' then
    raise exception 'difficulty_not_allowed' using errcode = 'P0003';
  end if;

  -- Atomically increment quota counter
  update public.profiles
     set sessions_used_this_month = sessions_used_this_month + 1
   where id = v_user_id;

  -- Create the session row
  insert into public.sessions (user_id, difficulty, status, tier_at_time)
  values (v_user_id, p_difficulty, 'in_progress', v_tier)
  returning id into v_session;

  return v_session;
end;
$$;


-- ── 5. Remove direct INSERT on sessions ──────────────────────
--
-- Sessions must only be created via create_session_atomic().
-- Direct REST API inserts bypass quota enforcement entirely.
-- Drop the INSERT policy; the SECURITY DEFINER RPC bypasses RLS.

drop policy if exists "Users can insert own sessions" on public.sessions;


-- ── 6. Add constraint: eye_contact_pct must be 0–100 ─────────

alter table public.answers
  add constraint answers_eye_contact_pct_range
  check (eye_contact_pct is null or (eye_contact_pct >= 0 and eye_contact_pct <= 100));


-- ── 7. Add constraint: duration_seconds must be positive ─────

alter table public.answers
  add constraint answers_duration_seconds_positive
  check (duration_seconds > 0);

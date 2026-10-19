-- Ensure `profiles` (and `sessions`) are replicated via Supabase Realtime.
-- Client code (TierRefresher, DashboardRefresher) subscribes to
-- postgres_changes on these tables to keep the navbar tier badge and
-- dashboard in sync without a hard reload. No prior migration added them
-- to the publication — if this was previously done manually via the
-- Supabase dashboard, these are no-ops.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sessions'
  ) then
    alter publication supabase_realtime add table public.sessions;
  end if;
end $$;

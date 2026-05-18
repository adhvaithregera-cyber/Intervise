-- Add custom name to sessions
alter table public.sessions add column if not exists name text;

-- Sync sessions_limit when tier changes
create or replace function public.sync_sessions_limit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.tier = 'pro' then
    new.sessions_limit := 50;
  elsif new.tier = 'student' then
    new.sessions_limit := 20;
  else
    new.sessions_limit := 2;
  end if;
  return new;
end;
$$;

create trigger on_profile_tier_changed
  before update of tier on public.profiles
  for each row execute procedure public.sync_sessions_limit();

-- Fix existing users' limits based on their current tier
update public.profiles set sessions_limit = 50 where tier = 'pro';
update public.profiles set sessions_limit = 20 where tier = 'student';
update public.profiles set sessions_limit = 2  where tier = 'free';

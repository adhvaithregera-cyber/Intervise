-- Update tier session limits: Student 20→12, Pro 50→30
create or replace function public.sync_sessions_limit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.tier = 'pro' then
    new.sessions_limit := 30;
  elsif new.tier = 'student' then
    new.sessions_limit := 12;
  else
    new.sessions_limit := 2;
  end if;
  return new;
end;
$$;

-- Fix existing users' limits based on their current tier
update public.profiles set sessions_limit = 30 where tier = 'pro';
update public.profiles set sessions_limit = 12 where tier = 'student';
update public.profiles set sessions_limit = 2  where tier = 'free';

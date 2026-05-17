-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- profiles table (auto-created on user signup via trigger)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  tier text not null default 'free' check (tier in ('free', 'student', 'pro')),
  sessions_limit integer not null default 2,
  sessions_used_this_month integer not null default 0,
  onboarding_complete boolean not null default false,
  role_type text,
  interview_date date,
  biggest_weakness text,
  created_at timestamptz not null default now()
);

-- Trigger: auto-create profile row on new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- questions table (seeded separately)
create table public.questions (
  id integer primary key,
  rank integer not null,
  category_id integer not null,
  category_name text not null,
  question_text text not null,
  frequency text not null,
  answer_format text not null,
  time_limit_seconds integer not null default 60,
  notes text not null default ''
);

-- sessions table
create table public.sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'mixed')),
  status text not null default 'in_progress' check (status in ('in_progress', 'complete', 'failed')),
  tier_at_time text not null,
  overall_grade text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- answers table
create table public.answers (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.sessions(id) on delete cascade not null,
  question_id integer references public.questions(id) not null,
  answer_index integer not null,
  transcript text,
  transcription_failed boolean not null default false,
  filler_count integer,
  filler_breakdown jsonb,
  wpm integer,
  eye_contact_pct integer,
  duration_seconds integer not null,
  created_at timestamptz not null default now()
);

-- question_history table (drives adaptive selection)
create table public.question_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  question_id integer references public.questions(id) not null,
  asked_at timestamptz not null default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.answers enable row level security;
alter table public.question_history enable row level security;

-- profiles: users can only read/update their own row
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- sessions
create policy "Users can view own sessions" on public.sessions
  for select using (auth.uid() = user_id);
create policy "Users can insert own sessions" on public.sessions
  for insert with check (auth.uid() = user_id);
create policy "Users can update own sessions" on public.sessions
  for update using (auth.uid() = user_id);

-- answers: scoped to user's own sessions
create policy "Users can view own answers" on public.answers
  for select using (
    exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid())
  );
create policy "Users can insert own answers" on public.answers
  for insert with check (
    exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid())
  );

-- question_history
create policy "Users can view own history" on public.question_history
  for select using (auth.uid() = user_id);
create policy "Users can insert own history" on public.question_history
  for insert with check (auth.uid() = user_id);

-- questions: public read (no auth required)
alter table public.questions enable row level security;
create policy "Questions are publicly readable" on public.questions
  for select using (true);

-- RPC: atomically increment sessions used (prevents race conditions)
create or replace function public.increment_sessions_used(user_id uuid)
returns void
language sql
security definer
as $$
  update public.profiles
  set sessions_used_this_month = sessions_used_this_month + 1
  where id = user_id;
$$;

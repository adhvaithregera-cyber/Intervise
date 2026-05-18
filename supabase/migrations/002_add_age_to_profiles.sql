alter table public.profiles add column if not exists age integer check (age > 0 and age < 120);

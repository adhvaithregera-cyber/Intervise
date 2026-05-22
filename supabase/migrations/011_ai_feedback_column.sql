alter table public.answers
  add column if not exists ai_feedback jsonb;

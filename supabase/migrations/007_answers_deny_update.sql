-- =============================================================
-- 007_answers_deny_update.sql
-- =============================================================
-- Deny UPDATE on the answers table for authenticated users.
--
-- Answers are immutable once written — a user submitting the
-- same answer_index twice is already blocked at the API layer,
-- but without this policy an authenticated user could directly
-- PATCH an answer row via the Supabase client to alter their
-- transcript, WPM, or filler count and skew their grade.
--
-- The INSERT policy (from 005) already controls who can write.
-- This policy closes the UPDATE vector entirely.
-- =============================================================

create policy "Deny update on answers"
  on public.answers
  for update
  using (false);

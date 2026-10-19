-- Follow-up relevance pass on the question bank (triggered by a user-reported
-- bad question: "How many petrol stations are there in India? You have two
-- minutes." — a pure Fermi/guesstimate prompt that doesn't map to any of the
-- app's 8 taught answer formats and has no personal narrative to coach on).
--
-- Scope: remove questions that are either (a) answerable by only one of the
-- 10 onboarding role types with no accessible rewrite, or (b) structurally
-- incompatible with every taught format (STAR / PACE / Pause-Reframe-Redirect
-- / etc. — i.e. puzzle or performative-task prompts, not questions about the
-- candidate). Rewrite the couple of cases a small wording change fixes.
-- Prioritises relevance over raw question count, per 2026-10-19 product call.
--
-- These are leftover gaps from the 2026-06-25 audit (docs/QUESTION_AUDIT.md)
-- that migration 019 did not act on, plus two new category-7/8 items found
-- in this pass.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Rewrite — small edits make these universally answerable
-- ─────────────────────────────────────────────────────────────────────────────

-- 247 (Weaknesses): "client... high-stakes pitch meeting" presumed a
-- client-facing sales/consulting role. Generalised to any audience you'd
-- want to impress (manager, professor, interview panel).
UPDATE public.questions
SET question_text = 'Tell me about a time you had to openly admit a gap in your knowledge or skills in front of people you wanted to impress — how did you handle that moment?'
WHERE id = 247;

-- 416 (Future & Ambition, hard): "multi-million dollar infrastructure...
-- executive CFO" assumed a senior CS/IT ops role. Generalised to any
-- high-risk idea pitched to a short-term-focused decision-maker.
UPDATE public.questions
SET question_text = 'How do you pitch a high-risk, resource-intensive idea to someone who only cares about near-term results?'
WHERE id = 416;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Remove — no accessible rewrite preserves the question's intent
-- ─────────────────────────────────────────────────────────────────────────────

-- Behavioural / Experience (cat 2) — pure Software Engineering/Data jargon,
-- flagged by the June audit as "remove or restrict to CS/IT" but never
-- actioned in migration 019:
--   164 - undocumented/corrupted schema data migration
--   167 - internal tooling framework vs. open-source security model
--   174 - legacy infra dependencies causing cascade collapse
--   301 - "engineering velocity" vs. "codebase's architectural integrity"
-- Motivation & Fit (cat 5):
--   346 - "enterprise deployment... costs the firm millions under your watch"
--         presumes senior on-call SRE ownership
-- Future & Ambition (cat 6):
--   421 - industry-trends essay question, CS/cloud-infra specific; same
--         issue as 411, which the June audit already removed for this reason
-- Curveball / Pressure (cat 8) — the reported question and its closest
-- sibling: both are puzzle/performative-task prompts with no personal
-- narrative, so neither fits the format taught in this category
-- (Pause → Reframe → Redirect) or any other taught answer format:
--   515 - "How many petrol stations are there in India?" (Fermi estimate)
--   516 - "Sell me this pen." (improv pitch task)

DELETE FROM public.question_history WHERE question_id IN (164, 167, 174, 301, 346, 421, 515, 516);
DELETE FROM public.questions WHERE id IN (164, 167, 174, 301, 346, 421, 515, 516);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: Verification
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_removed_left integer;
BEGIN
  SELECT COUNT(*) INTO v_removed_left
  FROM public.questions
  WHERE id IN (164, 167, 174, 301, 346, 421, 515, 516);

  IF v_removed_left > 0 THEN
    RAISE EXCEPTION 'ABORT: % of the 8 flagged questions still present', v_removed_left;
  END IF;

  RAISE NOTICE 'Relevance cleanup applied: 8 removed, 2 rewritten.';
END $$;

COMMIT;

-- Migration 024: Remove context-dependent words from stored filler_breakdown
--
-- When filler detection was first built, words like "like", "so", "basically",
-- "actually", and "just" were included in FILLER_PATTERNS. They were later
-- removed from detection because they have legitimate non-filler uses (e.g.
-- "I like planning", "so therefore", "actually correct").
--
-- However, answers recorded before that fix still have these words stored in
-- filler_breakdown JSON. This migration removes them from the stored JSON and
-- recalculates filler_count to match.
--
-- Only touches: answers.filler_breakdown, answers.filler_count
-- Only removes: like, so, basically, actually, just
-- Preserves:    um, uh, er, hmm, mm, you know, sort of, kind of

UPDATE answers
SET
  filler_breakdown = (
    filler_breakdown
      - 'like'
      - 'so'
      - 'basically'
      - 'actually'
      - 'just'
  ),
  filler_count = (
    SELECT COALESCE(SUM(value::int), 0)
    FROM jsonb_each_text(
      filler_breakdown
        - 'like'
        - 'so'
        - 'basically'
        - 'actually'
        - 'just'
    )
  )
WHERE
  filler_breakdown IS NOT NULL
  AND (
    filler_breakdown ? 'like'
    OR filler_breakdown ? 'so'
    OR filler_breakdown ? 'basically'
    OR filler_breakdown ? 'actually'
    OR filler_breakdown ? 'just'
  );

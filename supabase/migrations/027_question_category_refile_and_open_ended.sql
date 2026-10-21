-- 027: Re-file 165 questions into the category whose answer format they actually test,
-- and add category 10 "Open-ended / General" for the 62 that fit no taught format.
--
-- Why: the live bank had about 40 percent of questions scored against a rubric they could
-- not satisfy (e.g. "How do you prefer to receive feedback?" filed under Weaknesses scored
-- ~0 because it asks for no weakness). See docs/QUESTION_CATEGORY_AUDIT.md.
--
-- DEPLOY ORDER: deploy the app code that accepts category 10 BEFORE running this.
-- Until then the transcribe route rejects category-10 questions (403).
--
-- Rollback: restore from public.questions_category_backup_027 (see bottom of file).
-- Existing answers/sessions are untouched (their stored feedback keeps its old grade).

BEGIN;

-- Backup of the columns this migration changes, for rollback.
CREATE TABLE public.questions_category_backup_027 AS
SELECT id, category_id, category_name, answer_format, time_limit_seconds
FROM public.questions
WHERE id IN (21, 22, 24, 25, 31, 33, 34, 35, 37, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 52, 53, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 86, 180, 185, 192, 195, 199, 202, 204, 205, 207, 208, 210, 211, 213, 215, 216, 218, 219, 220, 221, 223, 225, 228, 231, 232, 234, 237, 239, 241, 242, 243, 244, 246, 248, 261, 263, 265, 267, 270, 273, 276, 280, 283, 284, 286, 288, 289, 291, 293, 295, 296, 298, 299, 300, 303, 305, 306, 308, 309, 311, 313, 315, 316, 318, 319, 320, 321, 323, 324, 325, 327, 328, 329, 331, 332, 333, 335, 336, 337, 338, 339, 340, 341, 343, 344, 345, 347, 349, 380, 384, 386, 387, 389, 392, 393, 394, 396, 397, 398, 399, 400, 402, 403, 404, 405, 406, 407, 408, 409, 410, 412, 413, 414, 415, 416, 417, 418, 419, 420, 422, 423, 424, 425);
ALTER TABLE public.questions_category_backup_027 ENABLE ROW LEVEL SECURITY;  -- no policies: service role only

-- → Behavioural / Experience (STAR): 53 questions. Name/format copied from an existing row of the target category.
UPDATE public.questions q
SET category_id   = 2,
    category_name = t.category_name,
    answer_format = t.answer_format
FROM (SELECT DISTINCT ON (category_id) category_id, category_name, answer_format
      FROM public.questions WHERE category_id = 2 AND id NOT IN (21, 22, 24, 25, 31, 33, 34, 35, 37, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 52, 53, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 86, 180, 185, 192, 195, 199, 202, 204, 205, 207, 208, 210, 211, 213, 215, 216, 218, 219, 220, 221, 223, 225, 228, 231, 232, 234, 237, 239, 241, 242, 243, 244, 246, 248, 261, 263, 265, 267, 270, 273, 276, 280, 283, 284, 286, 288, 289, 291, 293, 295, 296, 298, 299, 300, 303, 305, 306, 308, 309, 311, 313, 315, 316, 318, 319, 320, 321, 323, 324, 325, 327, 328, 329, 331, 332, 333, 335, 336, 337, 338, 339, 340, 341, 343, 344, 345, 347, 349, 380, 384, 386, 387, 389, 392, 393, 394, 396, 397, 398, 399, 400, 402, 403, 404, 405, 406, 407, 408, 409, 410, 412, 413, 414, 415, 416, 417, 418, 419, 420, 422, 423, 424, 425)
      ORDER BY category_id, id) t
WHERE q.id IN (21, 24, 25, 31, 34, 37, 40, 42, 43, 45, 46, 47, 48, 50, 53, 57, 58, 62, 63, 65, 70, 72, 74, 204, 205, 208, 219, 225, 242, 243, 284, 289, 295, 300, 305, 309, 315, 318, 323, 327, 331, 335, 339, 343, 347, 380, 389, 396, 403, 408, 413, 417, 422);

-- → Strengths: 2 questions. Name/format copied from an existing row of the target category.
UPDATE public.questions q
SET category_id   = 3,
    category_name = t.category_name,
    answer_format = t.answer_format
FROM (SELECT DISTINCT ON (category_id) category_id, category_name, answer_format
      FROM public.questions WHERE category_id = 3 AND id NOT IN (21, 22, 24, 25, 31, 33, 34, 35, 37, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 52, 53, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 86, 180, 185, 192, 195, 199, 202, 204, 205, 207, 208, 210, 211, 213, 215, 216, 218, 219, 220, 221, 223, 225, 228, 231, 232, 234, 237, 239, 241, 242, 243, 244, 246, 248, 261, 263, 265, 267, 270, 273, 276, 280, 283, 284, 286, 288, 289, 291, 293, 295, 296, 298, 299, 300, 303, 305, 306, 308, 309, 311, 313, 315, 316, 318, 319, 320, 321, 323, 324, 325, 327, 328, 329, 331, 332, 333, 335, 336, 337, 338, 339, 340, 341, 343, 344, 345, 347, 349, 380, 384, 386, 387, 389, 392, 393, 394, 396, 397, 398, 399, 400, 402, 403, 404, 405, 406, 407, 408, 409, 410, 412, 413, 414, 415, 416, 417, 418, 419, 420, 422, 423, 424, 425)
      ORDER BY category_id, id) t
WHERE q.id IN (35, 280);

-- → Future & Ambition: 6 questions. Name/format copied from an existing row of the target category.
UPDATE public.questions q
SET category_id   = 6,
    category_name = t.category_name,
    answer_format = t.answer_format
FROM (SELECT DISTINCT ON (category_id) category_id, category_name, answer_format
      FROM public.questions WHERE category_id = 6 AND id NOT IN (21, 22, 24, 25, 31, 33, 34, 35, 37, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 52, 53, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 86, 180, 185, 192, 195, 199, 202, 204, 205, 207, 208, 210, 211, 213, 215, 216, 218, 219, 220, 221, 223, 225, 228, 231, 232, 234, 237, 239, 241, 242, 243, 244, 246, 248, 261, 263, 265, 267, 270, 273, 276, 280, 283, 284, 286, 288, 289, 291, 293, 295, 296, 298, 299, 300, 303, 305, 306, 308, 309, 311, 313, 315, 316, 318, 319, 320, 321, 323, 324, 325, 327, 328, 329, 331, 332, 333, 335, 336, 337, 338, 339, 340, 341, 343, 344, 345, 347, 349, 380, 384, 386, 387, 389, 392, 393, 394, 396, 397, 398, 399, 400, 402, 403, 404, 405, 406, 407, 408, 409, 410, 412, 413, 414, 415, 416, 417, 418, 419, 420, 422, 423, 424, 425)
      ORDER BY category_id, id) t
WHERE q.id IN (33, 44, 73, 180, 261, 267);

-- → Situational / Hypothetical: 26 questions. Name/format copied from an existing row of the target category.
UPDATE public.questions q
SET category_id   = 7,
    category_name = t.category_name,
    answer_format = t.answer_format
FROM (SELECT DISTINCT ON (category_id) category_id, category_name, answer_format
      FROM public.questions WHERE category_id = 7 AND id NOT IN (21, 22, 24, 25, 31, 33, 34, 35, 37, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 52, 53, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 86, 180, 185, 192, 195, 199, 202, 204, 205, 207, 208, 210, 211, 213, 215, 216, 218, 219, 220, 221, 223, 225, 228, 231, 232, 234, 237, 239, 241, 242, 243, 244, 246, 248, 261, 263, 265, 267, 270, 273, 276, 280, 283, 284, 286, 288, 289, 291, 293, 295, 296, 298, 299, 300, 303, 305, 306, 308, 309, 311, 313, 315, 316, 318, 319, 320, 321, 323, 324, 325, 327, 328, 329, 331, 332, 333, 335, 336, 337, 338, 339, 340, 341, 343, 344, 345, 347, 349, 380, 384, 386, 387, 389, 392, 393, 394, 396, 397, 398, 399, 400, 402, 403, 404, 405, 406, 407, 408, 409, 410, 412, 413, 414, 415, 416, 417, 418, 419, 420, 422, 423, 424, 425)
      ORDER BY category_id, id) t
WHERE q.id IN (49, 216, 223, 316, 324, 328, 332, 336, 337, 340, 341, 345, 386, 387, 393, 394, 398, 399, 406, 410, 414, 416, 419, 420, 423, 425);

-- → Curveball / Pressure: 7 questions. Name/format copied from an existing row of the target category.
UPDATE public.questions q
SET category_id   = 8,
    category_name = t.category_name,
    answer_format = t.answer_format
FROM (SELECT DISTINCT ON (category_id) category_id, category_name, answer_format
      FROM public.questions WHERE category_id = 8 AND id NOT IN (21, 22, 24, 25, 31, 33, 34, 35, 37, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 52, 53, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 86, 180, 185, 192, 195, 199, 202, 204, 205, 207, 208, 210, 211, 213, 215, 216, 218, 219, 220, 221, 223, 225, 228, 231, 232, 234, 237, 239, 241, 242, 243, 244, 246, 248, 261, 263, 265, 267, 270, 273, 276, 280, 283, 284, 286, 288, 289, 291, 293, 295, 296, 298, 299, 300, 303, 305, 306, 308, 309, 311, 313, 315, 316, 318, 319, 320, 321, 323, 324, 325, 327, 328, 329, 331, 332, 333, 335, 336, 337, 338, 339, 340, 341, 343, 344, 345, 347, 349, 380, 384, 386, 387, 389, 392, 393, 394, 396, 397, 398, 399, 400, 402, 403, 404, 405, 406, 407, 408, 409, 410, 412, 413, 414, 415, 416, 417, 418, 419, 420, 422, 423, 424, 425)
      ORDER BY category_id, id) t
WHERE q.id IN (56, 61, 64, 68, 320, 338, 344);

-- → Weaknesses: 9 questions. Name/format copied from an existing row of the target category.
UPDATE public.questions q
SET category_id   = 9,
    category_name = t.category_name,
    answer_format = t.answer_format
FROM (SELECT DISTINCT ON (category_id) category_id, category_name, answer_format
      FROM public.questions WHERE category_id = 9 AND id NOT IN (21, 22, 24, 25, 31, 33, 34, 35, 37, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 52, 53, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 86, 180, 185, 192, 195, 199, 202, 204, 205, 207, 208, 210, 211, 213, 215, 216, 218, 219, 220, 221, 223, 225, 228, 231, 232, 234, 237, 239, 241, 242, 243, 244, 246, 248, 261, 263, 265, 267, 270, 273, 276, 280, 283, 284, 286, 288, 289, 291, 293, 295, 296, 298, 299, 300, 303, 305, 306, 308, 309, 311, 313, 315, 316, 318, 319, 320, 321, 323, 324, 325, 327, 328, 329, 331, 332, 333, 335, 336, 337, 338, 339, 340, 341, 343, 344, 345, 347, 349, 380, 384, 386, 387, 389, 392, 393, 394, 396, 397, 398, 399, 400, 402, 403, 404, 405, 406, 407, 408, 409, 410, 412, 413, 414, 415, 416, 417, 418, 419, 420, 422, 423, 424, 425)
      ORDER BY category_id, id) t
WHERE q.id IN (52, 55, 59, 60, 67, 69, 71, 202, 211);

-- → Open-ended / General (new category 10): 62 questions.
-- Time limit 60s for easy, 90s for medium/hard.
UPDATE public.questions
SET category_id        = 10,
    category_name      = 'Open-ended / General',
    answer_format      = 'Answer → Evidence → Insight',
    time_limit_seconds = CASE WHEN difficulty = 'easy' THEN 60 ELSE 90 END
WHERE id IN (22, 41, 66, 86, 185, 192, 195, 199, 207, 210, 213, 215, 218, 220, 221, 228, 231, 232, 234, 237, 239, 241, 244, 246, 248, 263, 265, 270, 273, 276, 283, 286, 288, 291, 293, 296, 298, 299, 303, 306, 308, 311, 313, 319, 321, 325, 329, 333, 349, 384, 392, 397, 400, 402, 404, 405, 407, 409, 412, 415, 418, 424);

-- Verification
DO $$
DECLARE
  v_moved integer;
  v_open  integer;
BEGIN
  SELECT COUNT(*) INTO v_moved FROM public.questions q
  JOIN public.questions_category_backup_027 b USING (id)
  WHERE q.category_id <> b.category_id;
  IF v_moved <> 165 THEN
    RAISE EXCEPTION 'ABORT: expected 165 questions to change category, got %', v_moved;
  END IF;

  SELECT COUNT(*) INTO v_open FROM public.questions WHERE category_id = 10;
  IF v_open <> 62 THEN
    RAISE EXCEPTION 'ABORT: expected 62 open-ended questions, got %', v_open;
  END IF;

  RAISE NOTICE 'Re-filed 165 questions; category 10 has % questions.', v_open;
END $$;

COMMIT;

-- ROLLBACK (run manually if needed):
--   UPDATE public.questions q
--   SET category_id = b.category_id, category_name = b.category_name,
--       answer_format = b.answer_format, time_limit_seconds = b.time_limit_seconds
--   FROM public.questions_category_backup_027 b WHERE q.id = b.id;
--   DROP TABLE public.questions_category_backup_027;

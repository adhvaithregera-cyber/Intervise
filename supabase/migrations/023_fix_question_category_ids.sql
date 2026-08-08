-- Fix category_id values that were offset from the RUBRICS mapping in lib/aifeedback.ts.
-- The question seed and early migrations assigned IDs that no longer matched the
-- CATEGORIES/RUBRICS objects (1–9), causing four category types to receive the wrong rubric.
--
-- Safe execution order prevents collision (F&A must move to 6 before M&F takes 5):
--   Future & Ambition:       old 5  → new 6
--   Motivation & Fit:        old 4  → new 5
--   Situational/Hypothetical: old 10 → new 7
--   Curveball / Pressure:    old 11 → new 8
--
-- Uses category_name as source of truth (correct in DB, IDs were wrong).

UPDATE public.questions SET category_id = 6 WHERE category_name = 'Future & Ambition';
UPDATE public.questions SET category_id = 5 WHERE category_name = 'Motivation & Fit';
UPDATE public.questions SET category_id = 7 WHERE category_name = 'Situational / Hypothetical';
UPDATE public.questions SET category_id = 8 WHERE category_name = 'Curveball / Pressure';

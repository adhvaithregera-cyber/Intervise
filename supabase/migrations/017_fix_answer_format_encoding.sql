-- Fix encoding corruption in answer_format column.
-- The → character (U+2192) was stored as three garbled characters
-- Γ (U+0393), å (U+00E5), Æ (U+00C6) due to a Windows-1252 encoding
-- mismatch when the migration was originally applied.

UPDATE public.questions
SET answer_format = replace(
  answer_format,
  chr(915) || chr(229) || chr(198),  -- garbled: ΓåÆ
  chr(8594)                           -- correct: →
)
WHERE answer_format LIKE '%' || chr(915) || chr(229) || chr(198) || '%';

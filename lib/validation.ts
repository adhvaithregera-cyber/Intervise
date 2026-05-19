/**
 * Server-side Zod validation schemas for all API routes.
 * These are the authoritative allowlists — never rely on frontend validation alone.
 */
import { z } from 'zod'

// ─── Session ────────────────────────────────────────────────────────────────

export const sessionStartSchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'mixed', 'hard']),
})

export const sessionCompleteSchema = z.object({
  session_id: z.string().uuid('session_id must be a valid UUID'),
})

export const sessionNameSchema = z.object({
  session_id: z.string().uuid('session_id must be a valid UUID'),
  name: z.string().max(100, 'Name must be 100 characters or fewer').nullable().optional(),
})

// ─── Onboarding ─────────────────────────────────────────────────────────────

/**
 * Allowlist for role types — must stay in sync with the onboarding UI dropdown.
 * Rejects arbitrary strings so users cannot inject unexpected values into the DB.
 */
export const ALLOWED_ROLE_TYPES = [
  'Software Engineering',
  'Product Management',
  'Data Science / ML',
  'Design (UX/UI)',
  'Business / Strategy',
  'Finance / Consulting',
  'Marketing',
  'Sales',
  'Operations',
  'Other',
] as const

export const ALLOWED_EXPERIENCE_LEVELS = [
  'Fresher (0–1 year)',
  'Early career (1–3 years)',
  'Mid-level (3–7 years)',
  'Senior (7+ years)',
] as const

export const ALLOWED_INTERVIEW_TYPES = [
  'Behavioural only',
  'Technical only',
  'Both behavioural & technical',
] as const

export const ALLOWED_PRACTICE_FREQUENCIES = [
  'Every day',
  'A few times a week',
  'Once a week',
  'Just exploring',
] as const

export type AllowedRoleType = (typeof ALLOWED_ROLE_TYPES)[number]

export const onboardingSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or fewer')
    .trim(),
  age: z.number().int().min(16).max(100),
  role_type: z.enum(ALLOWED_ROLE_TYPES, 'Invalid role type'),
  interview_date: z
    .string()
    .datetime({ offset: true, message: 'interview_date must be a valid ISO 8601 date-time' })
    .nullable()
    .optional(),
  biggest_weakness: z
    .string()
    .min(1, 'Biggest weakness is required')
    .max(500, 'Biggest weakness must be 500 characters or fewer')
    .trim(),
  experience_level: z.enum(ALLOWED_EXPERIENCE_LEVELS, 'Invalid experience level'),
  interview_type: z.enum(ALLOWED_INTERVIEW_TYPES, 'Invalid interview type'),
  practice_frequency: z.enum(ALLOWED_PRACTICE_FREQUENCIES, 'Invalid practice frequency'),
})

// ─── Profile update ──────────────────────────────────────────────────────────

export const profileUpdateSchema = z
  .object({
    // Same allowlist as onboarding
    role_type: z.enum(ALLOWED_ROLE_TYPES, 'Invalid role type').optional(),
    interview_date: z
      .string()
      .datetime({ offset: true })
      .nullable()
      .optional(),
    biggest_weakness: z
      .string()
      .min(1)
      .max(500)
      .trim()
      .optional(),
  })
  .strict() // reject unknown keys — prevents mass-assignment of any other profile field

// ─── Audio upload (transcribe) ───────────────────────────────────────────────

/**
 * Allowed audio MIME types for transcription uploads.
 * audio/mp3 is intentionally excluded — the correct MIME type for MP3 is audio/mpeg.
 */
export const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/ogg',
  'audio/ogg;codecs=opus',
  'audio/wav',
  'audio/mp4',
  'audio/mpeg',
])

/** 15 MB max upload size */
export const MAX_AUDIO_SIZE_BYTES = 15 * 1024 * 1024

export const transcribeFormSchema = z.object({
  session_id: z.string().uuid('session_id must be a valid UUID'),
  question_id: z
    .string()
    .regex(/^[1-9]\d*$/, 'question_id must be a positive integer')
    .transform(Number),
  answer_index: z
    .string()
    .regex(/^[1-9]\d*$/, 'answer_index must be a positive integer')
    .transform(Number),
  // Must be at least 1 second — a 0-second answer is meaningless and would
  // cause a division-by-zero in WPM calculation if the guard were ever removed
  duration_seconds: z
    .string()
    .regex(/^[1-9]\d*$/, 'duration_seconds must be a positive integer greater than 0')
    .transform(Number),
  // Percentage: 0–100 inclusive
  eye_contact_pct: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(0).max(100))
    .nullable()
    .optional(),
})

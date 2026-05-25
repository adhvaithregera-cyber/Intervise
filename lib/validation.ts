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

export type AllowedRoleType = (typeof ALLOWED_ROLE_TYPES)[number]

// Free-form string validator for fields that support "Other" with custom text
const freeTextField = (label: string) =>
  z.string().min(1, `${label} is required`).max(200, `${label} must be 200 characters or fewer`).trim()

export const onboardingSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or fewer')
    .trim(),
  age: z.number().int().min(16).max(100),
  role_type: freeTextField('Role type'),
  interview_date: z
    .string()
    .datetime({ offset: true, message: 'interview_date must be a valid ISO 8601 date-time' })
    .nullable()
    .optional(),
  biggest_weakness: freeTextField('Biggest weakness'),
  experience_level: freeTextField('Experience level'),
  interview_type: freeTextField('Interview type'),
  practice_frequency: freeTextField('Practice frequency'),
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
    full_name: z
      .string()
      .min(1)
      .max(100)
      .trim()
      .optional(),
    age: z.number().int().min(16).max(100).optional(),
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
    .transform(Number)
    .pipe(z.number().int().min(1).max(10)),
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

// ─── Text transcription (Free tier — Web Speech API path) ───────────────────

/**
 * JSON body schema for the free-tier transcription path.
 * Accepts the transcript text produced by the browser's SpeechRecognition API
 * instead of an audio file. Fields are numbers (not strings) since this comes
 * as JSON, not multipart form data.
 */
export const transcribeTextSchema = z.object({
  session_id: z.string().uuid('session_id must be a valid UUID'),
  question_id: z.number().int().positive('question_id must be a positive integer'),
  answer_index: z.number().int().positive('answer_index must be a positive integer'),
  duration_seconds: z.number().int().positive('duration_seconds must be a positive integer greater than 0'),
  transcript: z.string().min(1, 'transcript must not be empty').max(3000),
})

// ─── Payments ────────────────────────────────────────────────────────────────

export const createSubscriptionSchema = z.object({
  plan: z.enum(['student', 'pro']),
  period: z.enum(['monthly', 'quarterly']).default('monthly'),
})

export const cancelSubscriptionSchema = z.object({
  /** If true, cancel immediately. If false (default), cancel at end of billing period. */
  immediately: z.boolean().optional(),
})

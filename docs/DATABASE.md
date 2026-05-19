# Intervise — Database Reference

> Single source of truth for schema, RLS policies, tier rules, and feature→column mapping.
> Update this file whenever a migration is added.

---

## Tables

### `profiles`
Auto-created on signup via `handle_new_user()` trigger.

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid PK | — | References `auth.users(id)` |
| `full_name` | text | null | Set during onboarding |
| `avatar_url` | text | null | From OAuth provider |
| `tier` | text | `'free'` | `'free' \| 'student' \| 'pro'` — ONLY changed by admins |
| `sessions_limit` | int | 2 | Auto-synced from tier by trigger (never set manually) |
| `sessions_used_this_month` | int | 0 | Incremented via `increment_sessions_used()` RPC |
| `onboarding_complete` | bool | false | Set to true by `/api/onboarding` |
| `role_type` | text | null | e.g. "Software Engineer" |
| `interview_date` | date | null | Target interview date |
| `biggest_weakness` | text | null | Used for AI question personalisation |
| `age` | int | null | 16–100 |
| `experience_level` | text | null | e.g. "Fresher", "2-5 years" |
| `interview_type` | text | null | e.g. "Technical", "HR" |
| `practice_frequency` | text | null | e.g. "Daily", "Weekly" |
| `created_at` | timestamptz | now() | — |

**Planned columns (future migrations):**
- `personalisation_tokens_used` int — resets monthly (Pro)
- `personalisation_tokens_reset_at` timestamptz
- `weakness_summary` text — AI-generated, updated on session complete (Pro)
- `weekly_plan` text — AI-generated weekly improvement plan (Pro)
- `weekly_plan_generated_at` timestamptz
- `jd_text` text — saved job description for resume-based Qs (Pro)
- `cv_text` text — saved CV/resume text (Pro)

---

### `questions`
Seeded with 75 questions across 8 categories. Read-only to users.

| Column | Type | Notes |
|---|---|---|
| `id` | int PK | — |
| `rank` | int | Sort order within category |
| `category_id` | int | 1–8, see Category Pools below |
| `category_name` | text | e.g. "Behavioural" |
| `question_text` | text | The question shown to the user |
| `frequency` | text | "High" / "Medium" / "Low" |
| `answer_format` | text | e.g. "STAR Method — ..." |
| `time_limit_seconds` | int | Default 60 |
| `notes` | text | Internal notes, not shown to user |

---

### `sessions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | — |
| `user_id` | uuid FK | References `profiles(id)` |
| `difficulty` | text | `'easy' \| 'medium' \| 'hard' \| 'mixed'` |
| `status` | text | `'in_progress' \| 'complete' \| 'failed'` |
| `tier_at_time` | text | Tier when session was created (audit trail) |
| `overall_grade` | text | `'A' \| 'B' \| 'C' \| 'D' \| 'F'` — set on complete |
| `name` | text | Optional session name |
| `created_at` | timestamptz | — |
| `completed_at` | timestamptz | Set by `/api/session/complete` |

**Planned columns:**
- `summary` text — 2-sentence AI session summary (all tiers)

---

### `answers`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | — |
| `session_id` | uuid FK | References `sessions(id)` |
| `question_id` | int FK | References `questions(id)` |
| `answer_index` | int | 1-based position in session |
| `transcript` | text | From AssemblyAI |
| `transcription_failed` | bool | true if AssemblyAI failed |
| `filler_count` | int | Total filler words |
| `filler_breakdown` | jsonb | `{ "um": 3, "uh": 1 }` |
| `wpm` | int | Words per minute |
| `eye_contact_pct` | int | MediaPipe (future) |
| `duration_seconds` | int | Recording length |
| `created_at` | timestamptz | — |

**Planned columns (migration 009):**
- `grammar_issues` int — basic count, shown to all tiers
- `star_s` int (0–3) — Situation score (Free = blurred)
- `star_t` int (0–3) — Task score (Free = blurred)
- `star_a` int (0–3) — Action score (Free = blurred)
- `star_r` int (0–3) — Result score (Free = blurred)
- `format_compliance_score` float (0–1) — (Free = blurred)
- `line_by_line_feedback` jsonb — Student+ only
- `ideal_answer` text — (Free = blurred)
- `detailed_grammar` jsonb — Student+ only

---

### `question_history`
Drives adaptive question selection (unasked-first logic).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | — |
| `user_id` | uuid FK | References `profiles(id)` |
| `question_id` | int FK | References `questions(id)` |
| `asked_at` | timestamptz | When the question was asked |

---

### `email_log` (planned — migration 013)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | — |
| `user_id` | uuid FK | References `profiles(id)` |
| `email_type` | text | `'welcome' \| 'day2' \| 'day5' \| 'day14'` |
| `sent_at` | timestamptz | When the email was sent |

---

## RLS Policies Summary

| Table | Policy | Rule |
|---|---|---|
| `profiles` | Select | `auth.uid() = id` |
| `profiles` | Update | `auth.uid() = id` (tier + sessions_used locked by trigger) |
| `sessions` | Select | `auth.uid() = user_id` |
| `sessions` | Insert | `auth.uid() = user_id` |
| `sessions` | Update | `auth.uid() = user_id` |
| `answers` | Select | Session belongs to `auth.uid()` |
| `answers` | Insert | Session belongs to `auth.uid()` |
| `answers` | Update | **DENIED** (migration 007) |
| `question_history` | Select | `auth.uid() = user_id` |
| `question_history` | Insert | `auth.uid() = user_id` |
| `questions` | Select | Public (no auth required) |

---

## Trigger Functions

### `handle_new_user()`
- Fires: AFTER INSERT on `auth.users`
- Creates a `profiles` row from OAuth metadata (`full_name`, `avatar_url`)

### `lock_protected_profile_fields()`
- Fires: BEFORE UPDATE on `profiles`
- If `current_role = 'authenticated'`: locks `tier` and `sessions_used_this_month` to old values (prevents self-upgrade)
- Always: recomputes `sessions_limit` from `tier` (Free=2, Student=12, Pro=30)

### `increment_sessions_used(user_id uuid)` — RPC
- Atomically increments `sessions_used_this_month` by 1
- Called by `/api/session/start` after quota check passes

---

## Tier Gating Rules

```
Free (₹0):
  sessions_limit        = 2 / month
  questions_per_session = 5 (DB only)
  categories            = Cat 1 + Cat 2
  difficulty            = easy
  history_days          = 7
  ai_questions          = 0
  personalisation_tokens= 0

Student (₹199):
  sessions_limit        = 12 / month
  questions_per_session = 5 DB + 2 AI = 7 total
  categories            = all 8
  difficulty            = easy | medium
  history_days          = 30
  ai_questions          = 2
  personalisation_tokens= 0

Pro (₹499):
  sessions_limit        = 30 / month
  questions_per_session = 5 DB + 3 AI = 8 total
  categories            = all 8
  difficulty            = easy | medium | hard | mixed
  history_days          = unlimited
  ai_questions          = 3
  personalisation_tokens= 8 / month (all 5 questions AI-generated)
```

---

## Feature → DB Column Mapping

| Feature | Table | Column(s) | Tier |
|---|---|---|---|
| Session quota | `profiles` | `sessions_limit`, `sessions_used_this_month` | All |
| Filler count | `answers` | `filler_count` | All |
| Filler breakdown | `answers` | `filler_breakdown` (jsonb) | All |
| WPM | `answers` | `wpm` | All |
| WPM gauge label | — | Computed in UI from `wpm` | All |
| Eye contact % | `answers` | `eye_contact_pct` | Student+ (future) |
| Overall grade | `sessions` | `overall_grade` | All |
| Session summary | `sessions` | `summary` | All (planned) |
| Grammar issues (count) | `answers` | `grammar_issues` | All (planned) |
| STAR scores | `answers` | `star_s`, `star_t`, `star_a`, `star_r` | Free=blurred, Student+ full (planned) |
| Format compliance | `answers` | `format_compliance_score` | Free=blurred, Student+ full (planned) |
| Detailed grammar | `answers` | `detailed_grammar` (jsonb) | Student+ (planned) |
| Line-by-line feedback | `answers` | `line_by_line_feedback` (jsonb) | Student+ (planned) |
| Ideal answer | `answers` | `ideal_answer` | Free=blurred, Student+ full (planned) |
| Adaptive questions | `question_history` | `asked_at` | All |
| Personalisation tokens | `profiles` | `personalisation_tokens_used`, `personalisation_tokens_reset_at` | Pro (planned) |
| Weakness summary | `profiles` | `weakness_summary` | Pro (planned) |
| Weekly AI plan | `profiles` | `weekly_plan`, `weekly_plan_generated_at` | Pro (planned) |
| JD + CV | `profiles` | `jd_text`, `cv_text` | Pro (planned) |
| Email tracking | `email_log` | `email_type`, `sent_at` | All (planned) |

---

## Migration Index

| File | What it does |
|---|---|
| `001_initial_schema.sql` | Core tables, RLS, handle_new_user trigger, increment_sessions_used RPC |
| `002_add_age_to_profiles.sql` | Adds `age` column |
| `002_session_names_tier_limits.sql` | Adds `sessions.name`, sync_sessions_limit trigger |
| `003_update_tier_limits.sql` | Updates tier limit values |
| `004_fix_difficulty_constraint.sql` | Adds `'hard'` to difficulty check constraint |
| `005_security_hardening.sql` | Security improvements |
| `006_rls_and_function_hardening.sql` | Additional RLS + function hardening |
| `007_answers_deny_update.sql` | Denies UPDATE on answers for authenticated users |
| `008_onboarding_fields_and_tier_sync.sql` | Adds age, experience_level, interview_type, practice_frequency; rewrites lock_protected_profile_fields to always sync sessions_limit |

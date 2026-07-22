export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Tier = 'free' | 'student' | 'pro'
export type Difficulty = 'easy' | 'medium' | 'mixed' | 'hard'
export type SessionStatus = 'in_progress' | 'complete' | 'failed'

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  tier: Tier
  sessions_limit: number
  sessions_used_this_month: number
  onboarding_complete: boolean
  age: number | null
  role_type: string | null
  interview_date: string | null
  biggest_weakness: string | null
  razorpay_subscription_id: string | null
  subscription_status: 'active' | 'cancelled' | 'halted' | 'pending' | null
  tier_expires_at: string | null
  weakness_summary: string | null
  weakness_summary_at: string | null
  weakness_summary_session_count: number | null
  experience_level: string | null
  interview_type: string | null
  practice_frequency: string | null
  job_challenge: string | null
  created_at: string
}

export type Question = {
  id: number
  rank: number
  category_id: number
  category_name: string
  question_text: string
  frequency: string
  difficulty: 'easy' | 'medium' | 'hard'
  answer_format: string
  time_limit_seconds: number
  notes: string
}

export type Session = {
  id: string
  user_id: string
  name: string | null
  difficulty: Difficulty
  status: SessionStatus
  tier_at_time: string
  overall_grade: string | null
  created_at: string
  completed_at: string | null
}

export type AiFeedbackComponentScore = {
  score: number
  max: number
  feedback: string
}

export type AiFeedback = {
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  score: number
  component_scores: Record<string, AiFeedbackComponentScore>
  delivery_scores: {
    filler_words: { score: number; max: number; count: number }
    wpm: { score: number; max: number; wpm: number; label: string }
    duration: { score: number; max: number; seconds: number; label: string }
  }
  automatic_caps_applied: string[]
  biggest_gap: string
  ideal_answer_opening: string
  ideal_answer_pointers?: string[]
  grammar_feedback?: { score: number; max: number; issues: string[]; overall: string }
  coaching_tip: string
}

export type Answer = {
  id: string
  session_id: string
  question_id: number
  answer_index: number
  transcript: string | null
  transcription_failed: boolean
  filler_count: number | null
  filler_breakdown: Record<string, number> | null
  wpm: number | null
  eye_contact_pct: number | null
  duration_seconds: number
  ai_feedback: AiFeedback | null
  created_at: string
}

export type QuestionHistory = {
  id: string
  user_id: string
  question_id: number
  asked_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
        Relationships: []
      }
      questions: {
        Row: Question
        Insert: Question
        Update: Partial<Question>
        Relationships: []
      }
      sessions: {
        Row: Session
        Insert: Omit<Session, 'id' | 'created_at' | 'name' | 'overall_grade' | 'completed_at'> & {
          name?: string | null
          overall_grade?: string | null
          completed_at?: string | null
        }
        Update: Partial<Omit<Session, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      answers: {
        Row: Answer
        Insert: Omit<Answer, 'id' | 'created_at'>
        Update: Partial<Omit<Answer, 'id' | 'session_id' | 'created_at'>>
        Relationships: []
      }
      question_history: {
        Row: QuestionHistory
        Insert: Omit<QuestionHistory, 'id' | 'asked_at'>
        Update: Partial<Omit<QuestionHistory, 'id' | 'user_id' | 'asked_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      increment_sessions_used: {
        Args: { user_id: string }
        Returns: void
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

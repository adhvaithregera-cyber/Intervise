import { describe, it, expect } from 'vitest'
import { transcribeTextSchema } from '../validation'

describe('transcribeTextSchema', () => {
  it('accepts valid text payload', () => {
    const result = transcribeTextSchema.safeParse({
      session_id: '123e4567-e89b-12d3-a456-426614174000',
      question_id: 5,
      answer_index: 2,
      duration_seconds: 45,
      transcript: 'I think the situation was...',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.question_id).toBe(5)
      expect(result.data.duration_seconds).toBe(45)
    }
  })

  it('rejects invalid UUID', () => {
    const result = transcribeTextSchema.safeParse({
      session_id: 'not-a-uuid',
      question_id: 1,
      answer_index: 1,
      duration_seconds: 10,
      transcript: 'hello',
    })
    expect(result.success).toBe(false)
  })

  it('rejects zero duration', () => {
    const result = transcribeTextSchema.safeParse({
      session_id: '123e4567-e89b-12d3-a456-426614174000',
      question_id: 1,
      answer_index: 1,
      duration_seconds: 0,
      transcript: 'hello',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty transcript', () => {
    const result = transcribeTextSchema.safeParse({
      session_id: '123e4567-e89b-12d3-a456-426614174000',
      question_id: 1,
      answer_index: 1,
      duration_seconds: 10,
      transcript: '',
    })
    expect(result.success).toBe(false)
  })
})

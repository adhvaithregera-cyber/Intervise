import { describe, it, expect } from 'vitest'
import { analyzeAnswer } from '@/lib/analysis'
import type { AnalysisInput, AnalysisResult } from '@/lib/analysis'

describe('analyzeAnswer', () => {
  // --- Empty transcript ---
  it('returns null wpm and zero fillers for empty transcript', () => {
    const result = analyzeAnswer({ transcript: '', durationSeconds: 60 })
    expect(result.fillerCount).toBe(0)
    expect(result.fillerBreakdown).toEqual({})
    expect(result.wpm).toBeNull()
  })

  // --- WPM math ---
  it('calculates wpm correctly: 130 words at 60s → 130', () => {
    const words = Array(130).fill('hello').join(' ')
    const result = analyzeAnswer({ transcript: words, durationSeconds: 60 })
    expect(result.wpm).toBe(130)
  })

  it('returns null wpm when durationSeconds is 0 (no divide-by-zero)', () => {
    const result = analyzeAnswer({ transcript: 'hello world', durationSeconds: 0 })
    expect(result.wpm).toBeNull()
  })

  it('returns null wpm when word count is below minimum threshold', () => {
    // 4 words < MIN_WORDS_FOR_WPM (5) — not a meaningful reading
    const result = analyzeAnswer({ transcript: 'one two three four', durationSeconds: 10 })
    expect(result.wpm).toBeNull()
  })

  it('wpm result is always an integer when computed', () => {
    // 10 words over 7 seconds → Math.round(10 / (7/60)) = Math.round(85.71) = 86
    const words = Array(10).fill('hello').join(' ')
    const result = analyzeAnswer({ transcript: words, durationSeconds: 7 })
    expect(result.wpm).not.toBeNull()
    expect(Number.isInteger(result.wpm)).toBe(true)
  })

  // --- Case-insensitive filler matching ---
  it('counts "Um" and "UM" both as "um" (case-insensitive)', () => {
    const result = analyzeAnswer({ transcript: 'Um yeah UM sure', durationSeconds: 10 })
    expect(result.fillerBreakdown['um']).toBe(2)
  })

  // --- Word boundary: umbrella should NOT match um ---
  it('does not count "umbrella" as filler "um"', () => {
    const result = analyzeAnswer({ transcript: 'umbrella is a word', durationSeconds: 10 })
    expect(result.fillerBreakdown['um']).toBeUndefined()
    expect(result.fillerCount).toBe(0)
  })

  // --- "you know" as two-word phrase ---
  it('counts "you know" as a single filler phrase, not two separate words', () => {
    const result = analyzeAnswer({ transcript: 'you know what I mean', durationSeconds: 10 })
    expect(result.fillerBreakdown['you know']).toBe(1)
    expect(result.fillerBreakdown['you']).toBeUndefined()
    expect(result.fillerBreakdown['know']).toBeUndefined()
  })

  it('counts multiple occurrences of "you know"', () => {
    const result = analyzeAnswer({
      transcript: 'you know this and you know that',
      durationSeconds: 10,
    })
    expect(result.fillerBreakdown['you know']).toBe(2)
  })

  // --- Individual filler tests ---
  it('detects filler: um (matches "um")', () => {
    const result = analyzeAnswer({ transcript: 'I um said um it', durationSeconds: 10 })
    expect(result.fillerBreakdown['um']).toBe(2)
  })

  it('detects filler: um (also matches "umm")', () => {
    const result = analyzeAnswer({ transcript: 'I umm said umm it', durationSeconds: 10 })
    expect(result.fillerBreakdown['um']).toBe(2)
  })

  it('detects filler: uh (matches "uh")', () => {
    const result = analyzeAnswer({ transcript: 'uh I think uh yes', durationSeconds: 10 })
    expect(result.fillerBreakdown['uh']).toBe(2)
  })

  it('detects filler: uh (also matches "uhh")', () => {
    const result = analyzeAnswer({ transcript: 'uhh I think uhh yes', durationSeconds: 10 })
    expect(result.fillerBreakdown['uh']).toBe(2)
  })

  it('detects filler: er (matches "er")', () => {
    const result = analyzeAnswer({ transcript: 'I er think er yes', durationSeconds: 10 })
    expect(result.fillerBreakdown['er']).toBe(2)
  })

  it('detects filler: er (also matches "erm")', () => {
    const result = analyzeAnswer({ transcript: 'I erm think erm yes', durationSeconds: 10 })
    expect(result.fillerBreakdown['er']).toBe(2)
  })

  it('detects filler: hmm', () => {
    const result = analyzeAnswer({ transcript: 'hmm I think hmm yes', durationSeconds: 10 })
    expect(result.fillerBreakdown['hmm']).toBe(2)
  })

  it('detects filler: mm', () => {
    const result = analyzeAnswer({ transcript: 'mm I think mm yes', durationSeconds: 10 })
    expect(result.fillerBreakdown['mm']).toBe(2)
  })

  it('detects filler: you know', () => {
    const result = analyzeAnswer({ transcript: 'you know it was great', durationSeconds: 10 })
    expect(result.fillerBreakdown['you know']).toBe(1)
  })

  it('detects filler: sort of', () => {
    const result = analyzeAnswer({ transcript: 'it was sort of good sort of bad', durationSeconds: 10 })
    expect(result.fillerBreakdown['sort of']).toBe(2)
  })

  it('detects filler: kind of', () => {
    const result = analyzeAnswer({ transcript: 'it was kind of good kind of bad', durationSeconds: 10 })
    expect(result.fillerBreakdown['kind of']).toBe(2)
  })

  // --- Words removed from filler list should NOT be detected ---
  it('does not count "like" as a filler', () => {
    const result = analyzeAnswer({ transcript: 'it was like totally like fine', durationSeconds: 10 })
    expect(result.fillerBreakdown['like']).toBeUndefined()
  })

  it('does not count "basically" as a filler', () => {
    const result = analyzeAnswer({ transcript: 'basically I basically did it', durationSeconds: 10 })
    expect(result.fillerBreakdown['basically']).toBeUndefined()
  })

  it('does not count "actually" as a filler', () => {
    const result = analyzeAnswer({ transcript: 'actually I actually think so', durationSeconds: 10 })
    expect(result.fillerBreakdown['actually']).toBeUndefined()
  })

  it('does not count "so" as a filler', () => {
    const result = analyzeAnswer({ transcript: 'so I went so far', durationSeconds: 10 })
    expect(result.fillerBreakdown['so']).toBeUndefined()
  })

  // --- Mixed sentence test ---
  it('correctly counts fillers in mixed sentence', () => {
    const transcript = 'Um you know I erm kind of think uhh mm hmm sort of yes'
    const result = analyzeAnswer({ transcript, durationSeconds: 30 })
    expect(result.fillerBreakdown['um']).toBe(1)
    expect(result.fillerBreakdown['you know']).toBe(1)
    expect(result.fillerBreakdown['er']).toBe(1)
    expect(result.fillerBreakdown['kind of']).toBe(1)
    expect(result.fillerBreakdown['uh']).toBe(1)
    expect(result.fillerBreakdown['mm']).toBe(1)
    expect(result.fillerBreakdown['hmm']).toBe(1)
    expect(result.fillerBreakdown['sort of']).toBe(1)
    expect(result.fillerCount).toBe(8)
  })

  // --- fillerBreakdown is sparse (no zero-count entries) ---
  it('fillerBreakdown only includes fillers that appeared (sparse)', () => {
    const result = analyzeAnswer({ transcript: 'um um um', durationSeconds: 10 })
    expect(Object.keys(result.fillerBreakdown)).toEqual(['um'])
    expect(result.fillerBreakdown['uh']).toBeUndefined()
    expect(result.fillerBreakdown['er']).toBeUndefined()
  })

  // --- fillerCount is sum of all breakdown values ---
  it('fillerCount equals sum of all fillerBreakdown values', () => {
    const transcript = 'um uh er hmm'
    const result = analyzeAnswer({ transcript, durationSeconds: 10 })
    const sum = Object.values(result.fillerBreakdown).reduce((a, b) => a + b, 0)
    expect(result.fillerCount).toBe(sum)
  })
})

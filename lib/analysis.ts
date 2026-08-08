export interface AnalysisInput {
  transcript: string
  durationSeconds: number
}

export interface AnalysisResult {
  fillerCount: number
  fillerBreakdown: Record<string, number>
  wpm: number | null
}

// Minimum words needed before WPM is a meaningful measurement.
// Fewer words = single ambient noise hit can produce wildly wrong values.
const MIN_WORDS_FOR_WPM = 5

// Order matters: multi-word phrases must be listed before their component words
// so that "you know" is matched as a phrase before individual word patterns.
export const FILLER_PATTERNS: Array<{ key: string; regex: RegExp }> = [
  { key: 'you know', regex: /\byou\s+know\b/gi },
  { key: 'um', regex: /\bum\b/gi },
  { key: 'uh', regex: /\buh\b/gi },
  { key: 'like', regex: /\blike\b/gi },
  { key: 'basically', regex: /\bbasically\b/gi },
  { key: 'literally', regex: /\bliterally\b/gi },
  { key: 'actually', regex: /\bactually\b/gi },
  { key: 'right', regex: /\bright\b/gi },
  { key: 'so', regex: /\bso\b/gi },
  { key: 'well', regex: /\bwell\b/gi },
]

export function analyzeAnswer(input: AnalysisInput): AnalysisResult {
  const { transcript, durationSeconds } = input

  // WPM — null when there aren't enough words for a meaningful reading
  const words = transcript.trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const wpm: number | null =
    durationSeconds === 0 || wordCount < MIN_WORDS_FOR_WPM
      ? null
      : Math.round(wordCount / (durationSeconds / 60))

  // Filler detection — sparse: only include keys with at least one match
  const fillerBreakdown: Record<string, number> = {}

  for (const { key, regex } of FILLER_PATTERNS) {
    // Reset lastIndex in case the regex is stateful (gi flag)
    regex.lastIndex = 0
    const matches = transcript.match(regex)
    if (matches && matches.length > 0) {
      fillerBreakdown[key] = matches.length
    }
  }

  const fillerCount = Object.values(fillerBreakdown).reduce((sum, n) => sum + n, 0)

  return { fillerCount, fillerBreakdown, wpm }
}

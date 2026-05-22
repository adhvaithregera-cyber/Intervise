import Anthropic from '@anthropic-ai/sdk'
import type { AiFeedback, AiFeedbackItem } from '@/types/database'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are an expert interview coach evaluating a candidate's spoken answer.
Assess the answer strictly and return ONLY a valid JSON object — no markdown, no explanation outside the JSON.`

function buildUserPrompt(questionText: string, answerFormat: string, transcript: string): string {
  return `Question: ${questionText}

Expected answer format: ${answerFormat}

Candidate's answer (transcribed from speech):
"${transcript}"

Return this exact JSON structure:
{
  "star": {
    "situation": { "score": <0-3>, "max": 3, "comment": "<one sentence>" },
    "task":      { "score": <0-3>, "max": 3, "comment": "<one sentence>" },
    "action":    { "score": <0-3>, "max": 3, "comment": "<one sentence>" },
    "result":    { "score": <0-3>, "max": 3, "comment": "<one sentence>" }
  },
  "grammar_score": <0-100>,
  "ideal_answer": "<2-3 sentence model answer>",
  "overall_comment": "<one sentence coaching tip>"
}`
}

function isValidFeedbackItem(x: unknown): x is AiFeedbackItem {
  if (typeof x !== 'object' || x === null) return false
  const obj = x as Record<string, unknown>
  return (
    typeof obj.score === 'number' &&
    typeof obj.max === 'number' &&
    typeof obj.comment === 'string'
  )
}

function parseAndValidate(raw: string): AiFeedback | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const star = parsed.star as Record<string, unknown> | undefined
    if (!star) return null
    if (
      !isValidFeedbackItem(star.situation) ||
      !isValidFeedbackItem(star.task) ||
      !isValidFeedbackItem(star.action) ||
      !isValidFeedbackItem(star.result)
    ) return null
    if (
      typeof parsed.grammar_score !== 'number' ||
      typeof parsed.ideal_answer !== 'string' ||
      typeof parsed.overall_comment !== 'string'
    ) return null
    return {
      star: {
        situation: star.situation,
        task:      star.task,
        action:    star.action,
        result:    star.result,
      },
      grammar_score:   parsed.grammar_score,
      ideal_answer:    parsed.ideal_answer,
      overall_comment: parsed.overall_comment,
    }
  } catch {
    return null
  }
}

export async function generateAnswerFeedback(
  questionText: string,
  answerFormat: string,
  transcript: string,
): Promise<AiFeedback | null> {
  try {
    const message = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 600,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildUserPrompt(questionText, answerFormat, transcript) },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') return null

    return parseAndValidate(content.text.trim())
  } catch (err) {
    console.error('[aifeedback] Claude call failed:', err)
    return null
  }
}

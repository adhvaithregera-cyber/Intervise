import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AiFeedback } from '@/types/database'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

type AnswerInput = {
  question_text: string
  category_name: string
  ai_feedback: AiFeedback
}

export async function generateWeaknessSummary(answers: AnswerInput[]): Promise<string> {
  if (answers.length === 0) throw new Error('No answers to analyse')

  const answerSummaries = answers.map((a, i) => {
    const compScores = Object.entries(a.ai_feedback.component_scores)
      .map(([k, v]) => `${k}: ${v.score}/${v.max}`)
      .join(', ')
    return `Answer ${i + 1} [${a.category_name}]:
  Question: ${a.question_text}
  Grade: ${a.ai_feedback.grade} (${a.ai_feedback.score}/100)
  Biggest gap: ${a.ai_feedback.biggest_gap}
  Caps applied: ${a.ai_feedback.automatic_caps_applied.length > 0 ? a.ai_feedback.automatic_caps_applied.join('; ') : 'none'}
  Component scores: ${compScores}
  Coaching tip: ${a.ai_feedback.coaching_tip}`
  }).join('\n\n')

  const prompt = `You are a professional interview coach. Analyse this candidate's recent interview answers and identify their top weaknesses.

${answerSummaries}

Write a weakness summary for the candidate in exactly 3 sentences:
1. The most recurring structural weakness across their answers (name the component and pattern specifically)
2. A concrete example of what this looks like in their answers
3. One specific thing to practise before the next session

Write directly to the candidate ("you", "your"). Be blunt, not encouraging. No bullet points — flowing prose only. Always complete every sentence before stopping.`

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
  })

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()
  if (!text) throw new Error('Empty response from Gemini')
  return text
}

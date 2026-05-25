import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AiFeedback, AiFeedbackComponentScore } from '@/types/database'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// ── Category metadata ─────────────────────────────────────────────────────────

const CATEGORIES: Record<number, { name: string; format: string }> = {
  1: { name: 'Identity & Background',       format: 'Present → Past → Future' },
  2: { name: 'Behavioural / Experience',     format: 'STAR — Situation · Task · Action · Result' },
  3: { name: 'Strengths',                    format: 'Name it → Prove it → Connect it' },
  4: { name: 'Weaknesses',                   format: 'Name it → Show awareness → Show action → Show progress' },
  5: { name: 'Motivation & Fit',             format: 'Them → You → Together' },
  6: { name: 'Future & Ambition',            format: 'Near-term → Long-term → Bridge to this role' },
  7: { name: 'Situational / Hypothetical',   format: 'PACE — Prioritise · Act · Communicate · Evaluate' },
  8: { name: 'Curveball / Pressure',         format: 'Pause → Reframe → Redirect' },
}

// ── Ideal duration per category (seconds) ────────────────────────────────────

const IDEAL_DURATION: Record<number, { min: number; max: number; tooShort: number; tooLong: number }> = {
  1: { min: 60,  max: 90,  tooShort: 30, tooLong: 150 },
  2: { min: 90,  max: 120, tooShort: 45, tooLong: 180 },
  3: { min: 45,  max: 75,  tooShort: 20, tooLong: 120 },
  4: { min: 60,  max: 90,  tooShort: 30, tooLong: 150 },
  5: { min: 45,  max: 75,  tooShort: 20, tooLong: 120 },
  6: { min: 45,  max: 60,  tooShort: 20, tooLong: 120 },
  7: { min: 75,  max: 120, tooShort: 40, tooLong: 180 },
  8: { min: 45,  max: 75,  tooShort: 15, tooLong: 120 },
}

// ── Rubrics per category ──────────────────────────────────────────────────────
// Each component key must match the keys returned in component_scores JSON.

const RUBRICS: Record<number, object> = {
  1: {
    components: {
      present:  { max: 20, scoring: "Names current role/status + one specific skill or achievement. Vague ('I am a student') = -10pts. Missing = 0pts." },
      past:     { max: 25, scoring: "One specific experience: what they did AND what resulted. No example = -15pts. CV walkthrough = 0pts." },
      future:   { max: 25, scoring: "Connects to THIS role specifically. Generic ('I want to grow') = -15pts. Missing or 'that's all about me' = 0pts." },
    },
    automatic_caps: [
      "Started with place of birth or school marks → cap at D (max total 54)",
      "Read CV chronologically → cap at D (max total 54)",
      "Ended with 'that's basically it' → deduct 10 points from final score",
      "No connection to the role → cap at C (max total 74)",
    ],
  },
  2: {
    components: {
      situation: { max: 10, scoring: "Specific time, place, AND project/team named — all three required for full marks. Missing any one = -4pts. Vague context ('once at work', 'in a project') = 0pts. Situation longer than 2 sentences = -5pts." },
      task:      { max: 15, scoring: "THEIR specific individual responsibility, stated with 'I'. Must distinguish their role from the team's role. 'We were responsible' or team framing = 0pts. 'I had to' without specifying what = -8pts. Missing = 0pts." },
      action:    { max: 25, scoring: "Most important component. Must use 'I' throughout. Requires at least 3 distinct, specific personal steps. Each 'we' costs -6pts. Fewer than 3 steps = -15pts. Generic steps ('I communicated', 'I worked hard') without specifics = -10pts. One sentence or less = 0pts." },
      result:    { max: 20, scoring: "Quantified outcome required for more than 10pts (%, time saved, money, ranking, or concrete metric). Vague positive outcome ('it went well', 'the team was happy', 'it was successful') = max 5pts. No quantification at all = max 10pts. Missing result or 'we got through it' = 0pts." },
    },
    automatic_caps: [
      "'We' used more than 3 times in Action → cap at D (max total 54)",
      "No Result stated → cap at D (max total 54)",
      "No quantified result (no numbers, %, or concrete metric) → cap at C (max total 74)",
      "Situation takes more than 30% of total answer → cap at C (max total 74)",
      "Answer under 60 seconds → cap at F (max total 34)",
    ],
  },
  3: {
    components: {
      name_it:    { max: 15, scoring: "Specific, uncommon strength. 'Hardworking/dedicated/passionate/team player' = 0pts." },
      prove_it:   { max: 35, scoring: "One real example with specific outcome. Must be a story, not a statement. No example = -20pts. 'For example I always work hard' = 0pts." },
      connect_it: { max: 20, scoring: "Ties strength to THIS specific role. 'This will help me everywhere' or missing = 0pts." },
    },
    automatic_caps: [
      "Strength is hardworking/dedicated/passionate/perfectionist → cap at D (max total 54)",
      "No example given → cap at D (max total 54)",
      "'We' used in proof section → deduct 10 points",
    ],
  },
  4: {
    components: {
      name_it:        { max: 15, scoring: "A real weakness. 'Perfectionist/I work too hard/I care too much' = automatic F. No exceptions." },
      show_awareness: { max: 20, scoring: "Specific example of when this weakness caused a real problem. Not hypothetical. Missing = 0pts." },
      show_action:    { max: 25, scoring: "What they are actively doing RIGHT NOW. Must be specific (named course, habit, practice). Vague ('I am working on it') = -15pts. Missing = 0pts." },
      show_progress:  { max: 10, scoring: "Evidence it is improving. A recent positive signal. Missing or claiming fully fixed = 0pts." },
    },
    automatic_caps: [
      "'I'm a perfectionist' or any variant → automatic F (final score 0)",
      "'I work too hard' or 'I care too much' → automatic F (final score 0)",
      "No action plan → cap at D (max total 54)",
      "Reframed weakness as strength immediately → deduct 20 points",
    ],
  },
  5: {
    components: {
      them:     { max: 25, scoring: "One specific researched fact about the company. Must name something real (product decision, recent move, specific value). Generic praise = 0pts." },
      you:      { max: 25, scoring: "Specific skill or experience matching what they said about the company. Vague = -15pts. Missing = 0pts." },
      together: { max: 20, scoring: "Why THIS role connects their goals to the company's direction. Generic = 0pts." },
    },
    automatic_caps: [
      "'Your company is very reputed' or similar → cap at F (max total 34)",
      "Salary or job-seeking mentioned as motivation → cap at F (max total 34)",
      "No company research evident → cap at D (max total 54)",
      "Answer could apply to any company without changing a word → cap at D (max total 54)",
    ],
  },
  6: {
    components: {
      near_term: { max: 25, scoring: "What they want to achieve in 1–2 years in THIS specific role. Not 'I want to learn a lot'. Specific skill or milestone. Generic = -15pts. Missing = 0pts." },
      long_term: { max: 20, scoring: "Directional ambition, not a rigid title. 'Lead a product area' is fine. 'Be CEO' = -10pts. 'I don't know' = 0pts." },
      bridge:    { max: 25, scoring: "Why THIS role is the necessary step toward that goal. Specific, not generic. Does not connect back to the role = 0pts." },
    },
    automatic_caps: [
      "'I want to be CEO in 5 years' → cap at D (max total 54)",
      "'I don't know where I'll be' → cap at F (max total 34)",
      "Mentions MBA as near-term plan → deduct 15 points",
      "Generic answer that applies to any role → cap at C (max total 74)",
    ],
  },
  7: {
    components: {
      prioritise:  { max: 20, scoring: "First action is concrete and shows judgment. Not 'I would think about it'. Missing or vague = 0pts." },
      act:         { max: 25, scoring: "Step-by-step concrete actions. At least 2 specific steps. Only one step = -15pts. Answer is only principles ('I believe in communication') = 0pts." },
      communicate: { max: 15, scoring: "Who they would involve or notify and when. Shows professional collaboration. Nobody else mentioned = 0pts." },
      evaluate:    { max: 10, scoring: "How they would know the situation is resolved. Accountability signal. Can be brief. Missing = 0pts." },
    },
    automatic_caps: [
      "Only vague principles with no concrete steps → cap at D (max total 54)",
      "No mention of involving or communicating with anyone else → deduct 15 points",
      "Apology before action plan → deduct 10 points",
    ],
  },
  8: {
    components: {
      pause:    { max: 10, scoring: "Evidence of composure before answering. Scored by absence of panic indicators: immediate deflection, 'um um um', or 'I don't know' as full answer. Full score if composed. 0pts if immediate panic." },
      reframe:  { max: 35, scoring: "Honest answer framed in their favour. For failure: real failure + real consequence + real ownership required. No deflection, no blaming others. Complete deflection or denial = 0pts." },
      redirect: { max: 25, scoring: "Connects back to why they are still right for the role. Growth demonstrated. Answer just ends at the failure/weakness with no redirect = 0pts." },
    },
    automatic_caps: [
      "'I don't really have any failures' → automatic F (final score 0)",
      "'I can't think of anything' → automatic F (final score 0)",
      "Blames other people for the failure → cap at D (max total 54)",
      "Answer under 20 seconds → cap at D (max total 54)",
    ],
  },
}

// ── Prompt builders ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a strict professional interview coach evaluating a candidate's answer.
You do not give encouragement. You do not soften feedback. You tell the truth.
Your job is to score the answer and give specific, actionable feedback that references exact lines from the transcript.
Default assumption: a typical unpractised candidate starts at D (45). Most real interview answers score D or F. Only award B or above when the answer is genuinely strong with specific examples, quantified results, and correct structure. When in doubt, score lower.
Return ONLY valid JSON — no markdown, no text outside the JSON object.`

function buildUserPrompt(params: {
  questionText: string
  categoryId: number
  categoryName: string
  format: string
  rubric: object
  transcript: string
  fillerCount: number
  wpm: number | null
  durationSeconds: number
  durationRange: { min: number; max: number; tooShort: number; tooLong: number }
}): string {
  const {
    questionText, categoryId, categoryName, format, rubric,
    transcript, fillerCount, wpm, durationSeconds, durationRange,
  } = params

  const componentKeys = Object.keys((rubric as Record<string, Record<string, unknown>>).components ?? {})
  const exampleComponents = Object.fromEntries(
    componentKeys.map(k => [k, { score: 0, max: 0, feedback: 'specific feedback here' }])
  )

  return `You are evaluating a Category ${categoryId} — ${categoryName} question.
The format for this category is: ${format}
The scoring rubric is: ${JSON.stringify(rubric, null, 2)}

Question asked: "${questionText}"

CANDIDATE METRICS (pre-computed — use these exactly, do not recalculate):
- WPM: ${wpm ?? 'unavailable'}
- Filler word count: ${fillerCount}
- Answer duration: ${durationSeconds} seconds

DELIVERY SCORING TABLES (apply to the metrics above):

Filler words (10 pts max):
0 fillers=10 | 1–2=8 | 3–4=6 | 5–7=3 | 8–10=1 | 11+=0

WPM (10 pts max):
120–160=10 (Ideal) | 110–119 or 161–175=7 (Slightly off) | 95–109 or 176–195=4 | 80–94 or 196–220=2 | <80 or >220=0
If WPM is unavailable, award 5 pts and label "Unavailable".

Duration (10 pts max):
Ideal range is ${durationRange.min}–${durationRange.max}s.
Within ideal=10 | within 15s either side=7 | within 30s=4 | <${durationRange.tooShort}s=0 | >${durationRange.tooLong}s=2

Transcript:
"${transcript}"

SCORING INSTRUCTIONS:
1. Score each content component 0 to its max using the rubric.
2. Apply all automatic caps if triggered — list each that fired.
3. Score all three delivery metrics using the tables above.
4. Final score = sum of content component scores + sum of delivery scores (max 100).
5. Grade: 90–100=A | 75–89=B | 55–74=C | 35–54=D | 0–34=F
6. For each component below maximum: quote the exact phrase from the transcript, explain what was wrong, give one concrete replacement sentence.

Return ONLY this JSON (no other text):
{
  "grade": "C",
  "score": 62,
  "component_scores": ${JSON.stringify(exampleComponents, null, 2)},
  "delivery_scores": {
    "filler_words": {"score": 8, "max": 10, "count": ${fillerCount}},
    "wpm": {"score": 10, "max": 10, "wpm": ${wpm ?? 0}, "label": "Ideal"},
    "duration": {"score": 7, "max": 10, "seconds": ${durationSeconds}, "label": "Slightly short"}
  },
  "automatic_caps_applied": [],
  "biggest_gap": "Your [component] section [specific issue from transcript].",
  "ideal_answer_opening": "First sentence of what a strong answer would look like",
  "coaching_tip": "One specific thing to practise before the next session"
}`
}

// ── Validation ────────────────────────────────────────────────────────────────

function isComponentScore(x: unknown): x is AiFeedbackComponentScore {
  if (typeof x !== 'object' || x === null) return false
  const o = x as Record<string, unknown>
  return typeof o.score === 'number' && typeof o.max === 'number' && typeof o.feedback === 'string'
}

function parseAndValidate(raw: string): AiFeedback | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>

    if (
      (parsed.grade !== 'A' && parsed.grade !== 'B' && parsed.grade !== 'C' &&
       parsed.grade !== 'D' && parsed.grade !== 'F') ||
      typeof parsed.score !== 'number' ||
      typeof parsed.component_scores !== 'object' || parsed.component_scores === null ||
      typeof parsed.delivery_scores !== 'object' || parsed.delivery_scores === null ||
      typeof parsed.biggest_gap !== 'string' ||
      typeof parsed.ideal_answer_opening !== 'string' ||
      typeof parsed.coaching_tip !== 'string'
    ) return null

    const cs = parsed.component_scores as Record<string, unknown>
    for (const v of Object.values(cs)) {
      if (!isComponentScore(v)) return null
    }

    const ds = parsed.delivery_scores as Record<string, unknown>
    const fw = ds.filler_words as Record<string, unknown>
    const wpmDs = ds.wpm as Record<string, unknown>
    const dur = ds.duration as Record<string, unknown>
    if (
      typeof fw?.score !== 'number' || typeof fw?.max !== 'number' || typeof fw?.count !== 'number' ||
      typeof wpmDs?.score !== 'number' || typeof wpmDs?.max !== 'number' || typeof wpmDs?.wpm !== 'number' || typeof wpmDs?.label !== 'string' ||
      typeof dur?.score !== 'number' || typeof dur?.max !== 'number' || typeof dur?.seconds !== 'number' || typeof dur?.label !== 'string'
    ) return null

    return {
      grade:                parsed.grade as AiFeedback['grade'],
      score:                parsed.score,
      component_scores:     cs as Record<string, AiFeedbackComponentScore>,
      delivery_scores: {
        filler_words: { score: fw.score as number, max: fw.max as number, count: fw.count as number },
        wpm:          { score: wpmDs.score as number, max: wpmDs.max as number, wpm: wpmDs.wpm as number, label: wpmDs.label as string },
        duration:     { score: dur.score as number, max: dur.max as number, seconds: dur.seconds as number, label: dur.label as string },
      },
      automatic_caps_applied: Array.isArray(parsed.automatic_caps_applied)
        ? (parsed.automatic_caps_applied as string[]).filter(s => typeof s === 'string')
        : [],
      biggest_gap:          parsed.biggest_gap,
      ideal_answer_opening: parsed.ideal_answer_opening,
      coaching_tip:         parsed.coaching_tip,
    }
  } catch {
    return null
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function generateAnswerFeedback(params: {
  questionText: string
  categoryId: number
  categoryName: string
  answerFormat: string
  transcript: string
  fillerCount: number
  wpm: number | null
  durationSeconds: number
}): Promise<AiFeedback | null> {
  const { questionText, categoryId, categoryName, transcript, fillerCount, wpm, durationSeconds } = params

  const category = CATEGORIES[categoryId] ?? { name: categoryName, format: params.answerFormat }
  const rubric   = RUBRICS[categoryId] ?? { components: {}, automatic_caps: [] }
  const dur      = IDEAL_DURATION[categoryId] ?? { min: 60, max: 120, tooShort: 30, tooLong: 180 }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: { temperature: 0, maxOutputTokens: 1200 },
    })

    const result = await model.generateContent(buildUserPrompt({
      questionText,
      categoryId,
      categoryName: category.name,
      format:       category.format,
      rubric,
      transcript,
      fillerCount,
      wpm,
      durationSeconds,
      durationRange: dur,
    }))

    const text = result.response.text().trim()
    // Strip markdown code fences if present
    const json = text.startsWith('```') ? text.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim() : text

    return parseAndValidate(json)
  } catch (err) {
    console.error('[aifeedback] Gemini call failed:', err)
    return null
  }
}

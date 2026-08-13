import OpenAI from 'openai'
import type { AiFeedback, AiFeedbackComponentScore } from '@/types/database'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

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
  9: { name: 'Weaknesses',                   format: 'Name it → Show awareness → Show action → Show progress' },
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
  9: { min: 60,  max: 90,  tooShort: 30, tooLong: 150 },
}

// ── Rubrics per category ──────────────────────────────────────────────────────

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
      action:    { max: 25, scoring: "Most important component. Must use 'I' throughout. Requires at least 3 distinct, specific personal steps. Each 'we' costs -3pts; total 'we' penalty capped at -9pts. Fewer than 3 steps = -15pts. Generic steps ('I communicated', 'I worked hard') without specifics = -10pts. One sentence or less = 0pts." },
      result:    { max: 20, scoring: "Quantified outcome (%, time saved, money, ranking, or concrete metric) = 15+/20. Clear qualitative outcome — a specific described result without numbers (e.g. 'the client stayed and expanded the contract', 'retention improved significantly', 'the conflict was resolved and the team shipped on time') = up to 10/20. Throwaway positive with no real content ('it went well', 'the team was happy', 'it was successful', 'it went fine', 'it was a success') = max 3pts. Missing result or 'we got through it' = 0pts." },
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
      them:     { max: 25, scoring: "For 'Why this company?' questions: one specific researched fact (product, decision, value). For other Motivation & Fit questions: genuine understanding of the environment, culture, or context that shows real thought about fit — not just generic statements. Generic or content-free = 0pts." },
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
  9: {
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
}

// ── WPM ranges per difficulty ─────────────────────────────────────────────────
// Hard/mixed: slower speech is expected — more thinking time needed.
// Easy: slightly faster speech is acceptable.

const WPM_RANGES: Record<string, { ideal: [number, number]; slightlyOff: [[number,number],[number,number]]; tooFarOff: [[number,number],[number,number]]; significantlyOff: [[number,number],[number,number]] }> = {
  easy:   { ideal: [130,170], slightlyOff:  [[120,129],[171,185]], tooFarOff:  [[105,119],[186,205]], significantlyOff: [[90,104],[206,230]] },
  medium: { ideal: [120,160], slightlyOff:  [[110,119],[161,175]], tooFarOff:  [[95,109], [176,195]], significantlyOff: [[80,94], [196,220]] },
  hard:   { ideal: [100,140], slightlyOff:  [[90,99],  [141,155]], tooFarOff:  [[75,89],  [156,175]], significantlyOff: [[60,74], [176,200]] },
  mixed:  { ideal: [120,160], slightlyOff:  [[110,119],[161,175]], tooFarOff:  [[95,109], [176,195]], significantlyOff: [[80,94], [196,220]] },
}

// ── Grade thresholds per difficulty ───────────────────────────────────────────
// Harder difficulty = stricter thresholds to earn the same grade.

const GRADE_THRESHOLDS: Record<string, { A: number; B: number; C: number; D: number }> = {
  easy:   { A: 90, B: 75, C: 55, D: 35 },
  medium: { A: 90, B: 77, C: 58, D: 37 },
  hard:   { A: 90, B: 80, C: 62, D: 40 },
  mixed:  { A: 90, B: 77, C: 58, D: 37 },
}

// ── Delivery score computation (no AI needed) ────────────────────────────────

function computeDeliveryScores(
  fillerCount: number,
  wpm: number | null,
  durationSeconds: number,
  dur: { min: number; max: number; tooShort: number; tooLong: number },
  difficulty = 'medium',
): AiFeedback['delivery_scores'] {
  let fillerScore: number
  if      (fillerCount === 0)  fillerScore = 10
  else if (fillerCount <= 2)   fillerScore = 8
  else if (fillerCount <= 4)   fillerScore = 6
  else if (fillerCount <= 7)   fillerScore = 3
  else if (fillerCount <= 10)  fillerScore = 1
  else                         fillerScore = 0

  const ranges = WPM_RANGES[difficulty] ?? WPM_RANGES.medium
  let wpmScore: number
  let wpmLabel: string
  if (wpm === null) {
    wpmScore = 5; wpmLabel = 'Unavailable'
  } else if (wpm >= ranges.ideal[0] && wpm <= ranges.ideal[1]) {
    wpmScore = 10; wpmLabel = 'Ideal'
  } else if (
    (wpm >= ranges.slightlyOff[0][0] && wpm <= ranges.slightlyOff[0][1]) ||
    (wpm >= ranges.slightlyOff[1][0] && wpm <= ranges.slightlyOff[1][1])
  ) {
    wpmScore = 7; wpmLabel = 'Slightly off'
  } else if (wpm >= ranges.tooFarOff[0][0] && wpm <= ranges.tooFarOff[0][1]) {
    wpmScore = 4; wpmLabel = 'Too slow'
  } else if (wpm >= ranges.tooFarOff[1][0] && wpm <= ranges.tooFarOff[1][1]) {
    wpmScore = 4; wpmLabel = 'Too fast'
  } else if (
    (wpm >= ranges.significantlyOff[0][0] && wpm <= ranges.significantlyOff[0][1]) ||
    (wpm >= ranges.significantlyOff[1][0] && wpm <= ranges.significantlyOff[1][1])
  ) {
    wpmScore = 2; wpmLabel = 'Significantly off'
  } else {
    wpmScore = 0; wpmLabel = 'Significantly off'
  }

  let durScore: number
  let durLabel: string
  if (durationSeconds < dur.tooShort) {
    durScore = 0; durLabel = 'Too short'
  } else if (durationSeconds >= dur.min && durationSeconds <= dur.max) {
    durScore = 10; durLabel = 'Ideal'
  } else if (
    (durationSeconds >= dur.min - 15 && durationSeconds < dur.min) ||
    (durationSeconds > dur.max && durationSeconds <= dur.max + 15)
  ) {
    // "Slightly short/long" check must come before tooLong so that the
    // [max+1, max+15] window scores 7 rather than being swallowed by the
    // tooLong catch-all below.
    durScore = 7; durLabel = 'Slightly short/long'
  } else if (durationSeconds > dur.tooLong) {
    durScore = 2; durLabel = 'Too long'
  } else {
    durScore = 4; durLabel = 'Off pace'
  }

  return {
    filler_words: { score: fillerScore, max: 10, count: fillerCount },
    wpm:          { score: wpmScore,    max: 10, wpm: wpm ?? 0, label: wpmLabel },
    duration:     { score: durScore,    max: 10, seconds: durationSeconds, label: durLabel },
  }
}

// ── Step 1: Grade + score computation (no AI needed) ─────────────────────────

function computeGradeAndScore(
  componentScores: Record<string, AiFeedbackComponentScore>,
  deliveryTotal: number,
  appliedCaps: string[],
  difficulty = 'medium',
): { grade: AiFeedback['grade']; score: number } {
  const contentTotal = Object.values(componentScores).reduce((sum, c) => sum + c.score, 0)
  let score = contentTotal + deliveryTotal

  for (const cap of appliedCaps) {
    if (/automatic\s+F|final score 0/i.test(cap)) {
      score = 0
      break
    }
    const maxMatch = cap.match(/max total (\d+)/i)
    if (maxMatch) score = Math.min(score, Number(maxMatch[1]))
    const deductMatch = cap.match(/deduct (\d+) points/i)
    if (deductMatch) score = Math.max(0, score - Number(deductMatch[1]))
  }

  const t = GRADE_THRESHOLDS[difficulty] ?? GRADE_THRESHOLDS.medium
  const grade: AiFeedback['grade'] =
    score >= t.A ? 'A' : score >= t.B ? 'B' : score >= t.C ? 'C' : score >= t.D ? 'D' : 'F'

  return { grade, score }
}

// ── Step 2: Rule-based automatic caps detection ───────────────────────────────

function detectAutomaticCaps(
  transcript: string,
  durationSeconds: number,
  categoryId: number,
): string[] {
  const caps = (RUBRICS as Record<number, { automatic_caps?: string[] }>)[categoryId]?.automatic_caps ?? []
  const fired: string[] = []
  const words = transcript.split(/\s+/)
  const first40 = words.slice(0, 40).join(' ')
  const last30  = words.slice(-30).join(' ')
  const first80chars = transcript.slice(0, 80)

  if (categoryId === 1) {
    if (/\b(born\s+in|school|marks|percentage|scored|10th|12th|cgpa|gpa|hsc|ssc)\b/i.test(first40))
      fired.push(caps[0])
    if (/that'?s?\s+(basically\s+it|all\s+about\s+me)/i.test(last30))
      fired.push(caps[2])
  }

  if (categoryId === 2) {
    if (!/\b\d+(\.\d+)?(%|percent|per\s+cent|rupees?|lakhs?|crores?|times?|hours?|days?|weeks?|months?|years?|rank(ing)?|position)\b/i.test(transcript))
      fired.push(caps[2])
    if (durationSeconds < 60)
      fired.push(caps[4])
  }

  if (categoryId === 3) {
    if (/\b(hardworking|hard-working|dedicated|passionate|perfectionist|team\s*player|people\s*pleaser)\b/i.test(first40))
      fired.push(caps[0])
  }

  if (categoryId === 4 || categoryId === 9) {
    if (/\bperfectionist\b/i.test(transcript))
      fired.push(caps[0])
    if (/\b(i\s+work\s+too\s+hard|i\s+care\s+too\s+much)\b/i.test(transcript))
      fired.push(caps[1])
  }

  if (categoryId === 5) {
    if (/\b(very\s+reputed|great\s+company|well[\s-]known\s+company|good\s+reputation)\b/i.test(transcript))
      fired.push(caps[0])
    if (/\b(salary|pay|compensation|package|ctc|job\s+security|better\s+pay|higher\s+pay)\b/i.test(transcript))
      fired.push(caps[1])
  }

  if (categoryId === 6) {
    if (/\b(ceo|chief\s+executive|start\s+(my\s+)?own\s+(company|startup))\b/i.test(transcript))
      fired.push(caps[0])
    const first50words = words.slice(0, 50).join(' ')
    if (/\b(don'?t\s+know|not\s+sure|hard\s+to\s+say|difficult\s+to\s+predict)\b/i.test(first50words))
      fired.push(caps[1])
    if (/\b(mba|master\s+of\s+business|b-?school)\b/i.test(transcript))
      fired.push(caps[2])
  }

  if (categoryId === 7) {
    if (!/\b(colleague|team|manager|stakeholder|involve|notify|inform|communicate|tell)\b/i.test(transcript))
      fired.push(caps[1])
    if (/^.{0,80}(sorry|apologize|apology|my\s+fault|i\s+apologise)/i.test(first80chars))
      fired.push(caps[2])
  }

  if (categoryId === 8) {
    if (/\b(don'?t\s+(really\s+)?have\s+any\s+failure|can'?t\s+think\s+of\s+any\s+failure|no\s+(real\s+)?failures?)\b/i.test(transcript))
      fired.push(caps[0])
    if (/\b(can'?t\s+think\s+of\s+(anything|any\s+example)|nothing\s+comes\s+to\s+mind|i\s+don'?t\s+have\s+any)\b/i.test(transcript))
      fired.push(caps[1])
    if (durationSeconds < 20)
      fired.push(caps[3])
  }

  return fired.filter(Boolean)
}

// ── Step 3: Grammar pre-scan ──────────────────────────────────────────────────

const GRAMMAR_PATTERNS: RegExp[] = [
  /\bthey\s+was\b/i,
  /\bwe\s+was\b/i,
  /\bi\s+are\b/i,
  /\bhe\s+have\b/i,
  /\bshe\s+have\b/i,
  /\bit\s+have\b/i,
  /\byou\s+was\b/i,
  /\byesterday\s+i\s+(go|come|do|make|take|give|have|am|is)\b/i,
  /\bwill\s+went\b/i,
  /\bhad\s+went\b/i,
  /\bhave\s+went\b/i,
  /\bhas\s+went\b/i,
  /\b(\w{3,})\s+\1\b/i,
  /\bis\s+is\b/i,
]

function preCheckGrammar(transcript: string): boolean {
  return !GRAMMAR_PATTERNS.some(p => p.test(transcript))
}

// ── Step 4: Coaching tip templates ────────────────────────────────────────────

const COACHING_TEMPLATES: Record<number, Record<string, string>> = {
  1: {
    present:  "Write your current-role sentence as: '[Title] at [company], where I [specific skill] and [one achievement].' Rehearse it cold — it should take under 15 seconds.",
    past:     "Pick one past experience and practise: what you did + what resulted in under 25 seconds. Time yourself until it is automatic.",
    future:   "Research the exact role you are applying for and write one sentence connecting your goal directly to that job description's language. Generic future statements score zero.",
  },
  2: {
    situation: "Drill this opening: 'In [month/year], at [company], on [project name], the situation was...' — practice until it comes out in under 10 seconds.",
    task:      "Rewrite your task sentence to start with 'My specific responsibility was...' — never use 'we' in this sentence.",
    action:    "Record yourself delivering 3 numbered personal steps in under 40 seconds: 'First I did X. Then I did Y. Finally I did Z.' Count every 'we' — each one costs points.",
    result:    "Before each session, pick 3 past experiences and write the measurable outcome — a %, time saved, ranking, or revenue figure. If you cannot find a number, the story is not ready.",
  },
  3: {
    name_it:    "Replace generic strength words. List 5 things a past manager or teacher said specifically to praise you — pick the most unusual one.",
    prove_it:   "Your proof must be a mini STAR — situation, your action, measurable result — delivered in under 45 seconds.",
    connect_it: "Write one sentence that names the job title and explains why this strength is critical for that specific role. Generic connections score zero.",
  },
  4: {
    name_it:        "Choose a real weakness that has caused a documented problem — not perfectionism, not 'I work too hard'. Write down the last time it cost you something specific.",
    show_awareness: "Your awareness section must name when, where, and what the concrete consequence was. Hypotheticals score zero.",
    show_action:    "Name the exact course, book, habit, or system you have adopted. 'I am working on it' scores zero — 'I completed X / I now use Y system' scores full marks.",
    show_progress:  "Prepare a recent positive signal — a situation where the weakness showed up and you handled it better than before.",
  },
  5: {
    them:     "Research one specific decision the company made in the past 12 months — a product launch, pivot, or public statement — and name it by its exact title or date.",
    you:      "Use the word 'because' to force the connection: 'I want to join because my [X] maps to your [Y].'",
    together: "Write your closing as: 'This role specifically allows me to [your goal] while contributing to [their stated direction].' Generic closings score zero.",
  },
  6: {
    near_term: "Write your near-term goal as: 'In this role, within 18 months, I want to [specific skill or ownership] by [specific activity].' Avoid 'I want to learn a lot.'",
    long_term: "State a direction, not a title: 'I want to lead [type of work] in [domain]' — not 'I want to be X.'",
    bridge:    "Your bridge sentence must name this exact role: 'This role gives me [specific exposure] that I cannot get elsewhere because [reason].'",
  },
  7: {
    prioritise:  "Open every situational answer with your first concrete action, not a principle: 'I would first...' followed by a specific step — not 'I believe it is important to...'",
    act:         "List your actions as numbered steps — at least two: 'First I would... then I would...' is the minimum structure.",
    communicate: "Every situational answer must name at least one other person: 'I would notify my manager of...' is the minimum — no one mentioned scores zero.",
    evaluate:    "End with a resolution signal: 'I would know it was handled when...' — one sentence is enough.",
  },
  8: {
    pause:    "Practise a composure opener: 'That is a great question — let me think for a second.' This buys 3 seconds and signals confidence, not panic.",
    reframe:  "Your failure must include: what happened (no softening), your specific role in it, and the real consequence. Deliver this in under 30 seconds without deflection.",
    redirect: "Prepare a redirect for each past failure: 'What this taught me was [lesson] which I now apply by [specific behaviour].' End on the redirect, not the failure.",
  },
  9: {
    name_it:        "Choose a real weakness that has caused a documented problem — not perfectionism, not 'I work too hard'. Write down the last time it cost you something specific.",
    show_awareness: "Your awareness section must name when, where, and what the concrete consequence was. Hypotheticals score zero.",
    show_action:    "Name the exact course, book, habit, or system you have adopted. 'I am working on it' scores zero — 'I completed X / I now use Y system' scores full marks.",
    show_progress:  "Prepare a recent positive signal — a situation where the weakness showed up and you handled it better than before.",
  },
}

function selectCoachingTemplate(
  categoryId: number,
  componentScores: Record<string, AiFeedbackComponentScore>,
): string | null {
  const templates = COACHING_TEMPLATES[categoryId]
  if (!templates) return null

  const entries = Object.entries(componentScores)
    .filter(([, c]) => c.max > 0)
    .map(([key, c]) => ({ key, pct: c.score / c.max }))
    .sort((a, b) => a.pct - b.pct)

  if (entries.length < 1) return null

  const lowest = entries[0]
  if (lowest.pct >= 0.60) return null

  // Only use template if lowest is clearly the weakest (gap > 5% to next)
  if (entries.length > 1 && entries[1].pct - lowest.pct <= 0.05) return null

  return templates[lowest.key] ?? null
}

// ── Prompt builder ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a strict professional interview coach evaluating a candidate's answer.
You do not give encouragement. You do not soften feedback. You tell the truth.
Your job is to score the answer and give specific, actionable feedback that references exact lines from the transcript.
Default assumption: a typical unpractised candidate starts at D (45). Most real interview answers score D or F. Only award B or above when the answer is genuinely strong with specific examples, quantified results, and correct structure. When in doubt, score lower.
Evaluate the spirit of each component, not keyword presence. Award points proportionally when the candidate demonstrates equivalent substance through different phrasing or approach. Only penalise for things the specific question actually called for — if the question does not require a component (e.g. company research for a behavioural question), score that component on the closest relevant substance the candidate provided.
Return ONLY valid JSON — no markdown, no text outside the JSON object.`

function buildUserPrompt(params: {
  questionText: string
  categoryId: number
  categoryName: string
  format: string
  rubric: object
  transcript: string
  deliveryTotal: number
  preFiredCaps: string[]
  skipGrammar: boolean
}): string {
  const {
    questionText, categoryId, categoryName, format, rubric,
    transcript, deliveryTotal, preFiredCaps, skipGrammar,
  } = params

  const componentKeys = Object.keys((rubric as Record<string, Record<string, unknown>>).components ?? {})
  const exampleComponents = Object.fromEntries(
    componentKeys.map(k => [k, { score: 0, max: 0, feedback: 'specific feedback here' }])
  )
  const contentMax = 100 - 30

  const preFiredBlock = preFiredCaps.length > 0
    ? `\nThe following caps are already confirmed fired — return them verbatim in automatic_caps_applied plus any additional caps you detect:\n${preFiredCaps.map(c => `- ${c}`).join('\n')}\n`
    : ''

  const grammarInstruction = skipGrammar ? '' :
    '\n6. Grammar: identify specific grammar/vocabulary errors (wrong tense, subject-verb disagreement, run-on sentences, awkward phrasing). Quote the error and explain it. If no errors, return empty issues array and score 10.'

  const grammarJsonBlock = skipGrammar ? '' : `,
  "grammar_feedback": {
    "score": 8,
    "max": 10,
    "issues": ["Quote error from transcript — explain what is wrong and the correct form"],
    "overall": "One sentence summary of grammar quality"
  }`

  return `You are evaluating a Category ${categoryId} — ${categoryName} question.
The format for this category is: ${format}
Apply each component to what THIS specific question actually tests. If a component is not naturally required by this question, score on the closest relevant substance the candidate provided rather than awarding zero for its absence.
The scoring rubric is: ${JSON.stringify(rubric, null, 2)}

Question asked: "${questionText}"

NOTE: Delivery scores (filler words, WPM, duration) have already been computed = ${deliveryTotal}/30.
Grade and final score are computed server-side — do NOT return "grade" or "score" fields.
You are scoring CONTENT ONLY. Content components sum to ${contentMax} pts max.
${preFiredBlock}
Transcript:
"${transcript}"

SCORING INSTRUCTIONS:
1. Score each content component 0 to its max using the rubric.
2. Apply all automatic caps if triggered — list each that fired.
3. For each component: one sentence only — state exactly what was missing or wrong (quote one word or phrase from the transcript if it helps). No explanations, no replacements.
4. Ideal answer opening: one sentence showing how a strong answer to THIS specific question would open. Be specific, not generic.${grammarInstruction}

Return ONLY this JSON (no other text):
{
  "component_scores": ${JSON.stringify(exampleComponents, null, 2)},
  "automatic_caps_applied": [],
  "biggest_gap": "Your [component] section [specific issue from transcript].",
  "ideal_answer_opening": "First sentence of what a strong answer would look like"${grammarJsonBlock},
  "coaching_tip": "One specific thing to practise before the next session"
}`
}

// ── Validation ────────────────────────────────────────────────────────────────

function isComponentScore(x: unknown): x is AiFeedbackComponentScore {
  if (typeof x !== 'object' || x === null) return false
  const o = x as Record<string, unknown>
  return typeof o.score === 'number' && typeof o.max === 'number' && typeof o.feedback === 'string'
}

function parseAndValidate(
  raw: string,
  deliveryScores: AiFeedback['delivery_scores'],
  difficulty: string,
  overrides?: {
    automatic_caps_applied?: string[]
    grammar_feedback?: AiFeedback['grammar_feedback']
  }
): AiFeedback | null {
  try {
    // Sanitize unescaped newlines/tabs inside JSON strings (model artifact)
    const sanitized = raw.replace(/[\r\n\t]/g, ' ')
    const parsed = JSON.parse(sanitized) as Record<string, unknown>

    if (
      typeof parsed.component_scores !== 'object' || parsed.component_scores === null ||
      typeof parsed.biggest_gap !== 'string' ||
      typeof parsed.ideal_answer_opening !== 'string' ||
      typeof parsed.coaching_tip !== 'string'
    ) {
      console.error('[aifeedback] parseAndValidate: top-level field missing or wrong type', {
        component_scores: typeof parsed.component_scores,
        biggest_gap: typeof parsed.biggest_gap,
        ideal_answer_opening: typeof parsed.ideal_answer_opening,
        coaching_tip: typeof parsed.coaching_tip,
      })
      return null
    }

    const cs = parsed.component_scores as Record<string, unknown>
    for (const [k, v] of Object.entries(cs)) {
      if (!isComponentScore(v)) {
        console.error('[aifeedback] parseAndValidate: invalid component_score for key', k, v)
        return null
      }
    }

    const componentScores = cs as Record<string, AiFeedbackComponentScore>

    // Merge pre-fired caps with any AI-detected additional caps
    const aiCaps: string[] = Array.isArray(parsed.automatic_caps_applied)
      ? (parsed.automatic_caps_applied as string[]).filter(s => typeof s === 'string')
      : []
    const allCaps = overrides?.automatic_caps_applied
      ? [...new Set([...overrides.automatic_caps_applied, ...aiCaps])]
      : aiCaps

    // Compute grade and score server-side
    const { grade, score } = computeGradeAndScore(componentScores, deliveryScores.filler_words.score + deliveryScores.wpm.score + deliveryScores.duration.score, allCaps, difficulty)

    // Grammar: use override if pre-scanned clean, otherwise parse AI response
    let grammarFeedback = overrides?.grammar_feedback
    if (!grammarFeedback) {
      const gf = parsed.grammar_feedback as Record<string, unknown> | undefined
      if (gf && typeof gf.score === 'number' && typeof gf.max === 'number' && typeof gf.overall === 'string') {
        grammarFeedback = {
          score:   gf.score as number,
          max:     gf.max as number,
          issues:  Array.isArray(gf.issues) ? (gf.issues as unknown[]).filter((s): s is string => typeof s === 'string') : [],
          overall: gf.overall as string,
        }
      }
    }

    return {
      grade,
      score,
      component_scores:  componentScores,
      delivery_scores:   deliveryScores,
      automatic_caps_applied: allCaps,
      biggest_gap:          parsed.biggest_gap,
      ideal_answer_opening: parsed.ideal_answer_opening,
      ideal_answer_pointers: Array.isArray(parsed.ideal_answer_pointers)
        ? (parsed.ideal_answer_pointers as unknown[]).filter((s): s is string => typeof s === 'string')
        : undefined,
      grammar_feedback: grammarFeedback,
      coaching_tip: parsed.coaching_tip,
    }
  } catch (err) {
    console.error('[aifeedback] parseAndValidate JSON.parse failed:', err, '\nraw:', raw.slice(0, 500))
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
  difficulty?: string
}): Promise<AiFeedback | null> {
  const { questionText, categoryId, categoryName, transcript, fillerCount, wpm, durationSeconds, difficulty = 'medium' } = params

  const category = CATEGORIES[categoryId] ?? { name: categoryName, format: params.answerFormat }
  const rubric   = RUBRICS[categoryId] ?? { components: {}, automatic_caps: [] }
  const dur      = IDEAL_DURATION[categoryId] ?? { min: 60, max: 120, tooShort: 30, tooLong: 180 }

  // Delivery scores — no AI needed
  const deliveryScores = computeDeliveryScores(fillerCount, wpm, durationSeconds, dur, difficulty)

  // Step 2: Detect rule-based caps server-side
  const preFiredCaps = detectAutomaticCaps(transcript, durationSeconds, categoryId)

  // Step 3: Grammar pre-scan — skip AI grammar for clean transcripts
  const grammarIsClean = preCheckGrammar(transcript)
  const preGrammarFeedback: AiFeedback['grammar_feedback'] | undefined = grammarIsClean
    ? { score: 10, max: 10, issues: [], overall: 'No grammar issues detected.' }
    : undefined

  // Cap transcript at 2000 words — sufficient for structure scoring, prevents prompt overflow
  const transcriptWords = transcript.split(/\s+/)
  const cappedTranscript = transcriptWords.length > 2000
    ? transcriptWords.slice(0, 2000).join(' ') + ' [transcript truncated for length]'
    : transcript

  const prompt = buildUserPrompt({
    questionText,
    categoryId,
    categoryName: category.name,
    format:       category.format,
    rubric,
    transcript:   cappedTranscript,
    deliveryTotal: deliveryScores.filler_words.score + deliveryScores.wpm.score + deliveryScores.duration.score,
    preFiredCaps,
    skipGrammar: grammarIsClean,
  })

  const parseOverrides = {
    automatic_caps_applied: preFiredCaps.length > 0 ? preFiredCaps : undefined,
    grammar_feedback:       preGrammarFeedback,
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: prompt },
        ],
        temperature: 0,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      })

      const text = response.choices[0].message.content?.trim() ?? ''

      const feedback = parseAndValidate(text, deliveryScores, difficulty, parseOverrides)
      if (!feedback) {
        if (attempt === 0) continue
        return null
      }

      // Step 4: Override coaching tip with deterministic template if high-confidence
      const templateTip = selectCoachingTemplate(categoryId, feedback.component_scores)
      return templateTip ? { ...feedback, coaching_tip: templateTip } : feedback

    } catch (err) {
      console.error(`[aifeedback] OpenAI call failed (attempt ${attempt + 1}):`, err)
      if (attempt === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        continue
      }
      return null
    }
  }

  return null
}

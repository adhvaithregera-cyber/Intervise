# Shareable Scorecard PNG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a 1200×630 PNG scorecard per session, shareable via copy-link or download, available to all tiers.

**Architecture:** A public `GET /api/og/scorecard/[id]` route uses `next/og`'s `ImageResponse` to render a grade-coloured canvas from session data fetched via Supabase service role. A `ShareScorecard` client component on the report page provides copy-link and download-PNG actions.

**Tech Stack:** `next/og` (ImageResponse, built into Next.js 16), `@supabase/supabase-js` (service role), Vitest + React Testing Library (tests)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `lib/scorecard.ts` | Create | Pure helpers: grade metadata, stat computation |
| `tests/lib/scorecard.test.ts` | Create | Unit tests for scorecard helpers |
| `app/api/og/scorecard/[id]/route.tsx` | Create | OG image route — fetches data, returns ImageResponse |
| `components/session/share-scorecard.tsx` | Create | Client component — copy link + download PNG |
| `tests/components/session/share-scorecard.test.tsx` | Create | Component tests |
| `app/(protected)/session/report/[id]/page.tsx` | Modify | Add `<ShareScorecard sessionId={sessionId} />` to header |

---

## Task 1: Scorecard helpers + unit tests

**Files:**
- Create: `lib/scorecard.ts`
- Create: `tests/lib/scorecard.test.ts`

These are pure functions — no Supabase, no Next.js, fully testable.

- [ ] **Step 1.1: Write the failing tests**

Create `tests/lib/scorecard.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  GRADE_STYLE,
  computeScorecardStats,
} from '@/lib/scorecard'

describe('GRADE_STYLE', () => {
  it('returns correct colour for each grade', () => {
    expect(GRADE_STYLE['A'].color).toBe('#4ade80')
    expect(GRADE_STYLE['B'].color).toBe('#F9C125')
    expect(GRADE_STYLE['C'].color).toBe('#fb923c')
    expect(GRADE_STYLE['D'].color).toBe('#f97316')
    expect(GRADE_STYLE['F'].color).toBe('#ef4444')
  })

  it('returns correct label for each grade', () => {
    expect(GRADE_STYLE['A'].label).toBe('Exceptional')
    expect(GRADE_STYLE['B'].label).toBe('Good')
    expect(GRADE_STYLE['C'].label).toBe('Average')
    expect(GRADE_STYLE['D'].label).toBe('Poor')
    expect(GRADE_STYLE['F'].label).toBe('Failed')
  })
})

describe('computeScorecardStats', () => {
  const baseAnswers = [
    { wpm: 120, filler_count: 2, ai_feedback: null },
    { wpm: 140, filler_count: 3, ai_feedback: null },
  ]

  it('computes avgWpm as rounded average', () => {
    const stats = computeScorecardStats('medium', baseAnswers)
    expect(stats.avgWpm).toBe(130)
  })

  it('computes totalFillers as sum', () => {
    const stats = computeScorecardStats('medium', baseAnswers)
    expect(stats.totalFillers).toBe(5)
  })

  it('computes questionCount as number of answers', () => {
    const stats = computeScorecardStats('medium', baseAnswers)
    expect(stats.questionCount).toBe(2)
  })

  it('capitalises difficulty correctly', () => {
    expect(computeScorecardStats('easy', baseAnswers).difficulty).toBe('Easy')
    expect(computeScorecardStats('mixed', baseAnswers).difficulty).toBe('Mixed')
  })

  it('returns avgScore null when no ai_feedback', () => {
    const stats = computeScorecardStats('medium', baseAnswers)
    expect(stats.avgScore).toBeNull()
  })

  it('returns averaged ai score when feedback present', () => {
    const answers = [
      { wpm: 120, filler_count: 2, ai_feedback: { score: 80 } },
      { wpm: 140, filler_count: 3, ai_feedback: { score: 60 } },
    ]
    const stats = computeScorecardStats('medium', answers)
    expect(stats.avgScore).toBe(70)
  })

  it('handles null wpm values gracefully', () => {
    const answers = [
      { wpm: null, filler_count: 1, ai_feedback: null },
      { wpm: 130, filler_count: 2, ai_feedback: null },
    ]
    const stats = computeScorecardStats('easy', answers)
    expect(stats.avgWpm).toBe(130)
  })

  it('returns avgWpm null when all wpm values are null', () => {
    const answers = [
      { wpm: null, filler_count: 1, ai_feedback: null },
    ]
    const stats = computeScorecardStats('easy', answers)
    expect(stats.avgWpm).toBeNull()
  })
})
```

- [ ] **Step 1.2: Run tests to confirm they fail**

```bash
npx vitest run tests/lib/scorecard.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/scorecard'`

- [ ] **Step 1.3: Implement `lib/scorecard.ts`**

```typescript
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F'

export type GradeStyle = {
  color: string
  bg: string
  glowColor: string
  label: string
}

export const GRADE_STYLE: Record<Grade, GradeStyle> = {
  A: { color: '#4ade80', bg: '#0d1f0d', glowColor: 'rgba(74,222,128,0.15)',  label: 'Exceptional' },
  B: { color: '#F9C125', bg: '#1C0A00', glowColor: 'rgba(249,193,37,0.12)',  label: 'Good'        },
  C: { color: '#fb923c', bg: '#1a1000', glowColor: 'rgba(251,146,60,0.12)',  label: 'Average'     },
  D: { color: '#f97316', bg: '#140800', glowColor: 'rgba(249,115,22,0.12)',  label: 'Poor'        },
  F: { color: '#ef4444', bg: '#1a0000', glowColor: 'rgba(239,68,68,0.15)',   label: 'Failed'      },
}

export type ScorecardStats = {
  avgWpm: number | null
  totalFillers: number
  questionCount: number
  difficulty: string
  avgScore: number | null
}

export function computeScorecardStats(
  difficulty: string,
  answers: { wpm: number | null; filler_count: number | null; ai_feedback: unknown }[],
): ScorecardStats {
  const wpms = answers.map(a => a.wpm).filter((v): v is number => v !== null)
  const avgWpm = wpms.length > 0
    ? Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length)
    : null

  const totalFillers = answers.reduce((sum, a) => sum + (a.filler_count ?? 0), 0)

  const aiScores = answers
    .map(a => (a.ai_feedback as { score?: number } | null)?.score)
    .filter((v): v is number => typeof v === 'number')
  const avgScore = aiScores.length > 0
    ? Math.round(aiScores.reduce((a, b) => a + b, 0) / aiScores.length)
    : null

  const capitalised = difficulty.charAt(0).toUpperCase() + difficulty.slice(1)

  return {
    avgWpm,
    totalFillers,
    questionCount: answers.length,
    difficulty: capitalised,
    avgScore,
  }
}
```

- [ ] **Step 1.4: Run tests to confirm they pass**

```bash
npx vitest run tests/lib/scorecard.test.ts
```

Expected: all 8 tests PASS

- [ ] **Step 1.5: Commit**

```bash
git add lib/scorecard.ts tests/lib/scorecard.test.ts
git commit -m "feat: add scorecard grade metadata and stat helpers"
```

---

## Task 2: OG image route

**Files:**
- Create: `app/api/og/scorecard/[id]/route.tsx`

This route is public, runs on Edge runtime, and cannot be unit tested without a live Supabase connection — testing is done manually in Step 2.4.

- [ ] **Step 2.1: Create the route file**

Create `app/api/og/scorecard/[id]/route.tsx`:

```tsx
import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'
import { GRADE_STYLE, computeScorecardStats } from '@/lib/scorecard'
import type { Grade } from '@/lib/scorecard'

export const runtime = 'edge'

// Load Inter at 700 and 900 weight from jsDelivr (stable CDN, no auth required)
async function loadFonts(): Promise<{ bold: ArrayBuffer; black: ArrayBuffer }> {
  const [bold, black] = await Promise.all([
    fetch('https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.0/files/inter-latin-700-normal.woff').then(r => r.arrayBuffer()),
    fetch('https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.0/files/inter-latin-900-normal.woff').then(r => r.arrayBuffer()),
  ])
  return { bold, black }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Service-role client — bypasses RLS, server-side only
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const [{ data: session }, { data: answers }, fonts] = await Promise.all([
    supabase.from('sessions').select('overall_grade, difficulty, created_at').eq('id', id).single(),
    supabase.from('answers').select('wpm, filler_count, ai_feedback').eq('session_id', id),
    loadFonts(),
  ])

  if (!session) {
    return new Response('Not found', { status: 404 })
  }

  const grade = (session.overall_grade ?? 'C') as Grade
  const style = GRADE_STYLE[grade] ?? GRADE_STYLE['C']
  const stats = computeScorecardStats(session.difficulty, answers ?? [])

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          backgroundColor: style.bg,
          position: 'relative',
          fontFamily: 'Inter',
        }}
      >
        {/* Radial glow at top-centre — blurred circle simulates gradient */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            left: '30%',
            width: '40%',
            height: 420,
            backgroundColor: style.color,
            borderRadius: '50%',
            filter: 'blur(130px)',
            opacity: 0.18,
            display: 'flex',
          }}
        />

        {/* INTERVISE wordmark — top-left */}
        <div
          style={{
            position: 'absolute',
            top: 52,
            left: 64,
            color: style.color,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 8,
            opacity: 0.8,
            display: 'flex',
          }}
        >
          INTERVISE
        </div>

        {/* Centre content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Grade letter with glow simulation */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Glow blob behind grade */}
            <div
              style={{
                position: 'absolute',
                width: 240,
                height: 240,
                backgroundColor: style.color,
                borderRadius: '50%',
                filter: 'blur(70px)',
                opacity: 0.22,
                display: 'flex',
              }}
            />
            <div
              style={{
                fontSize: 220,
                fontWeight: 900,
                color: style.color,
                lineHeight: 1,
                display: 'flex',
                position: 'relative',
              }}
            >
              {grade}
            </div>
          </div>

          {/* Score line — only when AI feedback exists */}
          {stats.avgScore !== null && (
            <div
              style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: 4,
                marginTop: 12,
                display: 'flex',
              }}
            >
              {stats.avgScore} / 100 · {style.label.toUpperCase()}
            </div>
          )}

          {/* Divider */}
          <div
            style={{
              width: 480,
              height: 1,
              backgroundColor: 'rgba(255,255,255,0.1)',
              marginTop: stats.avgScore !== null ? 36 : 28,
              marginBottom: 28,
              display: 'flex',
            }}
          />

          {/* Stats row */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <StatItem label="WPM"        value={stats.avgWpm !== null ? String(stats.avgWpm) : '—'} color={style.color} />
            <Pipe />
            <StatItem label="FILLERS"    value={String(stats.totalFillers)} color={style.color} />
            <Pipe />
            <StatItem label="QUESTIONS"  value={String(stats.questionCount)} color={style.color} />
            <Pipe />
            <StatItem label="DIFFICULTY" value={stats.difficulty.toUpperCase()} color={style.color} />
          </div>
        </div>

        {/* @intervisehq — bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: 52,
            right: 64,
            color: style.color,
            opacity: 0.45,
            fontSize: 24,
            fontWeight: 600,
            display: 'flex',
          }}
        >
          @intervisehq
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Inter', data: fonts.bold,  weight: 700, style: 'normal' },
        { name: 'Inter', data: fonts.black, weight: 900, style: 'normal' },
      ],
    },
  )
}

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 200 }}>
      <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 38, fontWeight: 700, display: 'flex' }}>
        {value}
      </span>
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18, letterSpacing: 3, display: 'flex' }}>
        {label}
      </span>
    </div>
  )
}

function Pipe() {
  return (
    <div
      style={{
        width: 1,
        height: 48,
        backgroundColor: 'rgba(255,255,255,0.12)',
        display: 'flex',
        flexShrink: 0,
      }}
    />
  )
}
```

- [ ] **Step 2.2: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2.3: Get a real completed session ID**

In Supabase dashboard or via:
```sql
SELECT id FROM sessions WHERE status = 'complete' LIMIT 5;
```

- [ ] **Step 2.4: Test the route manually**

Open in browser:
```
http://localhost:3000/api/og/scorecard/<session-id>
```

Expected: 1200×630 PNG renders with the correct grade colour, INTERVISE wordmark top-left, @intervisehq bottom-right, stat row with WPM/fillers/questions/difficulty.

Test with a session that has `overall_grade = 'A'` and one with `overall_grade = 'F'` to verify the full colour range.

Test with a nonexistent UUID — expected: 404 plain text response.

- [ ] **Step 2.5: Commit**

```bash
git add app/api/og/scorecard/[id]/route.tsx
git commit -m "feat: add OG scorecard image route (next/og, all tiers)"
```

---

## Task 3: ShareScorecard component + tests

**Files:**
- Create: `components/session/share-scorecard.tsx`
- Create: `tests/components/session/share-scorecard.test.tsx`

- [ ] **Step 3.1: Write the failing tests**

Create `tests/components/session/share-scorecard.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ShareScorecard } from '@/components/session/share-scorecard'

// Mock clipboard API
const writeTextMock = vi.fn().mockResolvedValue(undefined)
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: writeTextMock },
  writable: true,
})

// Mock fetch for download path
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  blob: () => Promise.resolve(new Blob(['fake-png'], { type: 'image/png' })),
})

// Mock URL.createObjectURL / revokeObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock')
global.URL.revokeObjectURL = vi.fn()

describe('ShareScorecard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a Share button initially', () => {
    render(<ShareScorecard sessionId="test-session-id" />)
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument()
  })

  it('does not show Copy Link or Download before clicking Share', () => {
    render(<ShareScorecard sessionId="test-session-id" />)
    expect(screen.queryByRole('button', { name: /copy link/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument()
  })

  it('reveals Copy Link and Download PNG buttons after clicking Share', () => {
    render(<ShareScorecard sessionId="test-session-id" />)
    fireEvent.click(screen.getByRole('button', { name: /share/i }))
    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument()
  })

  it('calls clipboard.writeText with the correct OG URL on Copy Link click', async () => {
    render(<ShareScorecard sessionId="abc-123" />)
    fireEvent.click(screen.getByRole('button', { name: /share/i }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy link/i }))
    })
    expect(writeTextMock).toHaveBeenCalledWith(
      'https://intervise-ashen.vercel.app/api/og/scorecard/abc-123'
    )
  })

  it('shows Copied! feedback after copying', async () => {
    render(<ShareScorecard sessionId="abc-123" />)
    fireEvent.click(screen.getByRole('button', { name: /share/i }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy link/i }))
    })
    expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 3.2: Run tests to confirm they fail**

```bash
npx vitest run tests/components/session/share-scorecard.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/session/share-scorecard'`

- [ ] **Step 3.3: Create the component**

Create `components/session/share-scorecard.tsx`:

```tsx
'use client'

import { useState } from 'react'

const OG_BASE = 'https://intervise-ashen.vercel.app/api/og/scorecard'

interface ShareScorecardProps {
  sessionId: string
}

export function ShareScorecard({ sessionId }: ShareScorecardProps) {
  const [open, setOpen]           = useState(false)
  const [copied, setCopied]       = useState(false)
  const [downloading, setDownloading] = useState(false)

  const url = `${OG_BASE}/${sessionId}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Fallback for browsers that block clipboard API
      window.prompt('Copy this link:', url)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDownload() {
    if (downloading) return
    setDownloading(true)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error('fetch failed')
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = 'intervise-scorecard.png'
      a.click()
      URL.revokeObjectURL(objectUrl)
    } catch {
      // Silent fail — no error shown to user
    } finally {
      setDownloading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors"
      >
        Share
      </button>
    )
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleCopy}
        className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors"
      >
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors disabled:opacity-40"
      >
        {downloading ? 'Downloading…' : 'Download PNG'}
      </button>
      <button
        onClick={() => setOpen(false)}
        className="rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white/40 hover:bg-white/10 transition-colors"
        aria-label="close share panel"
      >
        ✕
      </button>
    </div>
  )
}
```

- [ ] **Step 3.4: Run tests to confirm they pass**

```bash
npx vitest run tests/components/session/share-scorecard.test.tsx
```

Expected: all 5 tests PASS

- [ ] **Step 3.5: Commit**

```bash
git add components/session/share-scorecard.tsx tests/components/session/share-scorecard.test.tsx
git commit -m "feat: add ShareScorecard component with copy-link and download-PNG"
```

---

## Task 4: Wire ShareScorecard into the report page

**Files:**
- Modify: `app/(protected)/session/report/[id]/page.tsx`

The report page is a Server Component. `ShareScorecard` is a Client Component — importing it is fine, Next.js handles the boundary automatically.

- [ ] **Step 4.1: Add the import**

At the top of `app/(protected)/session/report/[id]/page.tsx`, add:

```tsx
import { ShareScorecard } from '@/components/session/share-scorecard'
```

- [ ] **Step 4.2: Add ShareScorecard to the header button row**

Find the existing header button row (around line 132–142 in the current file):

```tsx
            <div className="flex gap-3">
              <Link href="/session/setup" className="flex-1 sm:flex-none">
                <button className="w-full sm:w-auto rounded-xl bg-[#F9C125] px-5 py-2.5 text-sm font-bold text-[#1C0A00] hover:brightness-110 transition-all shadow-lg shadow-[#F9C125]/20">
                  New Session
                </button>
              </Link>
              <Link href="/dashboard" className="flex-1 sm:flex-none">
                <button className="w-full sm:w-auto rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors">
                  Dashboard
                </button>
              </Link>
            </div>
```

Replace with:

```tsx
            <div className="flex gap-3">
              <Link href="/session/setup" className="flex-1 sm:flex-none">
                <button className="w-full sm:w-auto rounded-xl bg-[#F9C125] px-5 py-2.5 text-sm font-bold text-[#1C0A00] hover:brightness-110 transition-all shadow-lg shadow-[#F9C125]/20">
                  New Session
                </button>
              </Link>
              <Link href="/dashboard" className="flex-1 sm:flex-none">
                <button className="w-full sm:w-auto rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors">
                  Dashboard
                </button>
              </Link>
              <ShareScorecard sessionId={sessionId} />
            </div>
```

- [ ] **Step 4.3: Run the full test suite**

```bash
npx vitest run
```

Expected: all 30+ tests PASS (no regressions)

- [ ] **Step 4.4: Manual smoke test**

1. Run `npm run dev`
2. Complete a session (or navigate to an existing report page)
3. Confirm **Share** button appears in the header for all tiers
4. Click Share — confirm Copy Link and Download PNG buttons expand inline
5. Click Copy Link — confirm the URL is copied and "Copied!" flashes for ~2s
6. Click Download PNG — confirm `intervise-scorecard.png` downloads
7. Open the downloaded PNG — confirm it shows the correct grade, colours, stats, and `@intervisehq`

- [ ] **Step 4.5: Commit**

```bash
git add "app/(protected)/session/report/[id]/page.tsx"
git commit -m "feat: add Share Scorecard button to session report (all tiers)"
```

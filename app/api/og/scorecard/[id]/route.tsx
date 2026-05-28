import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'
import { GRADE_STYLE, computeScorecardStats } from '@/lib/scorecard'
import type { Grade } from '@/lib/scorecard'
import type { Difficulty } from '@/types/database'

export const runtime = 'edge'

// Load Inter at 700 and 900 weight from jsDelivr (stable CDN, no auth required)
async function loadFonts(): Promise<{ bold: ArrayBuffer; black: ArrayBuffer }> {
  const [bold, black] = await Promise.all([
    fetch('https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.0/files/inter-latin-700-normal.woff', { cache: 'force-cache' as RequestCache }).then(r => r.arrayBuffer()),
    fetch('https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.0/files/inter-latin-900-normal.woff', { cache: 'force-cache' as RequestCache }).then(r => r.arrayBuffer()),
  ])
  return { bold, black }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const [sessionResult, answersResult] = await Promise.all([
    supabase.from('sessions').select('overall_grade, difficulty, created_at').eq('id', id).single(),
    supabase.from('answers').select('wpm, filler_count, ai_feedback').eq('session_id', id),
  ])
  const { data: session, error: sessionError } = sessionResult

  if (sessionError) {
    if (sessionError.code === 'PGRST116') return new Response('Not found', { status: 404 })
    return new Response(null, { status: 500 })
  }
  if (!session || !session.overall_grade) return new Response('Not found', { status: 404 })
  if (answersResult.error) return new Response(null, { status: 500 })

  const fonts = await loadFonts().catch(() => null)
  if (!fonts) return new Response(null, { status: 503 })

  const VALID_GRADES = new Set(['A', 'B', 'C', 'D', 'F'])
  const grade = VALID_GRADES.has(session.overall_grade)
    ? (session.overall_grade as Grade)
    : ('C' as Grade)
  const style = GRADE_STYLE[grade]

  const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard', 'mixed'])
  const difficulty = VALID_DIFFICULTIES.has(String(session.difficulty).toLowerCase())
    ? (session.difficulty as Difficulty)
    : ('medium' as Difficulty)
  const stats = computeScorecardStats(difficulty, answersResult.data ?? [])

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          backgroundColor: '#080d1a',
          position: 'relative',
          fontFamily: 'Inter',
          overflow: 'hidden',
        }}
      >
        {/* Dot grid — simulated with repeating background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1.5px, transparent 1.5px)',
            backgroundSize: '28px 28px',
            display: 'flex',
          }}
        />

        {/* Ambient glow — grade colour at top-centre */}
        <div
          style={{
            position: 'absolute',
            top: -160,
            left: '20%',
            width: '60%',
            height: 480,
            backgroundColor: style.color,
            borderRadius: '50%',
            filter: 'blur(140px)',
            opacity: 0.14,
            display: 'flex',
          }}
        />

        {/* Gold border frame */}
        <div
          style={{
            position: 'absolute',
            inset: 32,
            border: '1px solid rgba(249,193,37,0.18)',
            borderRadius: 24,
            display: 'flex',
          }}
        />

        {/* INTERVISE wordmark — top-left */}
        <div
          style={{
            position: 'absolute',
            top: 56,
            left: 72,
            color: '#F9C125',
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 4,
            opacity: 0.7,
            display: 'flex',
          }}
        >
          INTERVISE
        </div>

        {/* Grade label — top-right */}
        <div
          style={{
            position: 'absolute',
            top: 56,
            right: 72,
            color: 'rgba(255,255,255,0.25)',
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 3,
            display: 'flex',
          }}
        >
          {style.label.toUpperCase()}
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
            gap: 0,
          }}
        >
          {/* Grade letter */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Soft glow behind letter */}
            <div
              style={{
                position: 'absolute',
                width: 200,
                height: 200,
                backgroundColor: style.color,
                borderRadius: '50%',
                filter: 'blur(60px)',
                opacity: 0.28,
                display: 'flex',
              }}
            />
            <div
              style={{
                fontSize: 200,
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

          {/* Score below grade */}
          {stats.avgScore !== null && (
            <div
              style={{
                color: 'rgba(255,255,255,0.35)',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 5,
                marginTop: 8,
                display: 'flex',
              }}
            >
              {stats.avgScore} / 100
            </div>
          )}

          {/* Gold divider */}
          <div
            style={{
              width: 520,
              height: 1,
              backgroundColor: 'rgba(249,193,37,0.2)',
              marginTop: stats.avgScore !== null ? 40 : 32,
              marginBottom: 36,
              display: 'flex',
            }}
          />

          {/* Stats row — WPM · FILLERS · DIFFICULTY */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <StatItem label="WPM"        value={stats.avgWpm !== null ? String(stats.avgWpm) : '—'} accent={style.color} />
            <Pipe />
            <StatItem label="FILLERS"    value={String(stats.totalFillers)} accent={style.color} />
            <Pipe />
            <StatItem label="DIFFICULTY" value={stats.difficulty.toUpperCase()} accent={style.color} />
          </div>
        </div>

        {/* @intervisehq — bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: 56,
            right: 72,
            color: 'rgba(255,255,255,0.2)',
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 1,
            display: 'flex',
          }}
        >
          intervise.in
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
      headers: {
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    },
  )
}

function StatItem({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 220, gap: 8 }}>
      <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 40, fontWeight: 700, display: 'flex', lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ color: accent, fontSize: 13, fontWeight: 700, letterSpacing: 3, opacity: 0.6, display: 'flex' }}>
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
        height: 52,
        backgroundColor: 'rgba(249,193,37,0.15)',
        display: 'flex',
        flexShrink: 0,
      }}
    />
  )
}

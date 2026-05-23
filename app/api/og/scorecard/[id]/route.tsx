import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'
import { GRADE_STYLE, computeScorecardStats } from '@/lib/scorecard'
import type { Grade } from '@/lib/scorecard'
import type { Difficulty } from '@/types/database'

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

  const [sessionResult, { data: answers }] = await Promise.all([
    supabase.from('sessions').select('overall_grade, difficulty, created_at').eq('id', id).single(),
    supabase.from('answers').select('wpm, filler_count, ai_feedback').eq('session_id', id),
  ])
  const { data: session, error: sessionError } = sessionResult

  if (sessionError) {
    if (sessionError.code === 'PGRST116') {
      return new Response('Not found', { status: 404 })
    }
    return new Response(null, { status: 500 })
  }
  if (!session) {
    return new Response('Not found', { status: 404 })
  }

  if (!session.overall_grade) {
    return new Response('Not found', { status: 404 })
  }

  let fonts: { bold: ArrayBuffer; black: ArrayBuffer }
  try {
    fonts = await loadFonts()
  } catch {
    return new Response(null, { status: 503 })
  }

  const grade = session.overall_grade as Grade
  const style = GRADE_STYLE[grade] ?? GRADE_STYLE['C']
  const stats = computeScorecardStats(session.difficulty as Difficulty, answers ?? [])

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
            fontWeight: 700,
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
            <StatItem label="WPM"        value={stats.avgWpm !== null ? String(stats.avgWpm) : '—'} />
            <Pipe />
            <StatItem label="FILLERS"    value={String(stats.totalFillers)} />
            <Pipe />
            <StatItem label="QUESTIONS"  value={String(stats.questionCount)} />
            <Pipe />
            <StatItem label="DIFFICULTY" value={stats.difficulty.toUpperCase()} />
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
      headers: {
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    },
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
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

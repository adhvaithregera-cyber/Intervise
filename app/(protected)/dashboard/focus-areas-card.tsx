import Link from 'next/link'
import type { FocusAreasResult, FocusArea, WeaknessKey } from '@/lib/focusareas'

/** Guide URLs for each weakness key. Only keys with a published guide get a link. */
const GUIDE_HREF: Partial<Record<WeaknessKey, string>> = {
  skill: '/resources/star-method',
  weak_category: '/resources/star-method',
  fillers: '/resources/filler-words',
}

const OUTER_CARD = {
  backgroundColor: 'rgba(8,13,26,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,193,37,0.20)',
  borderRadius: '1rem',
}

// Primary card — gold accent, elevated border
const PRIMARY_CARD = {
  backgroundColor: 'rgba(12,18,32,0.90)',
  border: '1px solid rgba(249,193,37,0.45)',
  borderRadius: '0.75rem',
  boxShadow: '0 0 28px rgba(249,193,37,0.06)',
}

// Secondary cards — subdued inner style
const SECONDARY_CARD = {
  backgroundColor: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(249,193,37,0.10)',
  borderRadius: '0.75rem',
}

function PriorityBadge({ priority }: { priority: 'high' | 'medium' }) {
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
      style={
        priority === 'high'
          ? { background: 'rgba(239,68,68,0.12)', color: 'rgba(248,113,113,0.9)', border: '1px solid rgba(239,68,68,0.2)' }
          : { background: 'rgba(249,193,37,0.10)', color: 'rgba(249,193,37,0.7)', border: '1px solid rgba(249,193,37,0.2)' }
      }
    >
      {priority === 'high' ? 'High impact' : 'Medium impact'}
    </span>
  )
}

function ResourcesTag({ weaknessKey }: { weaknessKey: WeaknessKey }) {
  const href = GUIDE_HREF[weaknessKey]
  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-[9px] font-medium tracking-wide text-[#F9C125]/50 hover:text-[#F9C125] transition-colors"
      >
        Resources &amp; guides
        <span className="text-white/20">·</span>
        <span>Read guide →</span>
      </Link>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[9px] text-white/18 font-medium tracking-wide">
      Resources &amp; guides
      <span className="text-white/12">·</span>
      <span className="text-white/18">coming soon</span>
    </span>
  )
}

function PrimaryCard({ area }: { area: FocusArea }) {
  return (
    <div className="p-5 sm:p-6" style={PRIMARY_CARD}>
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#F9C125]">
          #1 Priority Focus
        </span>
        <PriorityBadge priority={area.priority} />
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-white mb-1 leading-snug">{area.title}</h3>

      {/* User's actual number */}
      <p className="text-xs text-white/45 mb-3">{area.stat}</p>

      {/* Advice */}
      <p className="text-sm text-white/80 leading-relaxed mb-5">{area.advice}</p>

      <ResourcesTag weaknessKey={area.key} />
    </div>
  )
}

function SecondaryCard({ area }: { area: FocusArea }) {
  return (
    <div className="p-4" style={SECONDARY_CARD}>
      {/* Title + badge */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold text-white/80">{area.title}</h3>
        <PriorityBadge priority={area.priority} />
      </div>

      {/* User's actual number */}
      <p className="text-[11px] text-white/38 mb-2">{area.stat}</p>

      {/* Advice */}
      <p className="text-xs text-white/60 leading-relaxed mb-3">{area.advice}</p>

      <ResourcesTag weaknessKey={area.key} />
    </div>
  )
}

export function FocusAreasCard({
  result,
  sessionCount,
}: {
  result: FocusAreasResult
  sessionCount: number
}) {
  return (
    <div className="p-5 sm:p-6" style={OUTER_CARD}>
      {/* Section header */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-[#F9C125]">Your Focus Areas</h2>
        <p className="text-xs text-white/50 mt-0.5">
          {result.type === 'areas'
            ? `Based on your last ${sessionCount} session${sessionCount === 1 ? '' : 's'} — personalised for you`
            : 'Personalised improvement areas based on your sessions'}
        </p>
      </div>

      {/* ── Not enough data ────────────────────────────────────── */}
      {result.type === 'not_enough_data' && (
        <div className="py-8 text-center">
          <p className="text-white/65 text-sm font-medium leading-snug">
            Complete a couple of sessions to see your personalised focus areas.
          </p>
          <p className="text-white/28 text-xs mt-2">
            We need at least 2 sessions to spot patterns in your answers.
          </p>
        </div>
      )}

      {/* ── All good ───────────────────────────────────────────── */}
      {result.type === 'all_good' && (
        <div className="py-8 text-center">
          <p className="text-white/80 text-sm font-medium leading-snug">
            You&apos;re performing well across the board — keep practising to stay sharp.
          </p>
          <p className="text-white/30 text-xs mt-2">
            No significant weaknesses detected in recent sessions.
          </p>
        </div>
      )}

      {/* ── Focus areas ────────────────────────────────────────── */}
      {result.type === 'areas' && (
        <div className="space-y-3">
          {/* #1 — visually prominent primary card */}
          <PrimaryCard area={result.items[0]} />

          {/* #2 and #3 — smaller, side-by-side on wider screens */}
          {result.items.length > 1 && (
            <div
              className={
                result.items.length === 3
                  ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
                  : 'grid grid-cols-1 gap-3'
              }
            >
              {result.items.slice(1).map(area => (
                <SecondaryCard key={area.key} area={area} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

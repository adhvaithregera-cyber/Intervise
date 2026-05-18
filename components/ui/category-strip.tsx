'use client'

const categories = [
  { num: '01', label: 'Identity' },
  { num: '02', label: 'Behavioural' },
  { num: '03', label: 'Strengths' },
  { num: '04', label: 'Weaknesses' },
  { num: '05', label: 'Motivation' },
  { num: '06', label: 'Future' },
  { num: '07', label: 'Situational' },
  { num: '08', label: 'Curveball' },
  { num: '09', label: 'Closing' },
]

const items = [...categories, ...categories]

function Pill({ num, label }: { num: string; label: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(249,193,37,0.22)',
      }}
    >
      <span className="text-[11px] font-bold text-[#F9C125]">Cat {num}</span>
      <span className="h-3 w-px bg-white/20" />
      <span className="text-[13px] font-semibold text-white/85">{label}</span>
    </span>
  )
}

export function CategoryStrip() {
  return (
    <div className="relative w-full overflow-hidden py-3" style={{ backgroundColor: '#1C0A00' }}>
      {/* Left fade */}
      <div
        className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20"
        style={{ background: 'linear-gradient(to right, #1C0A00, transparent)' }}
      />
      {/* Right fade */}
      <div
        className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20"
        style={{ background: 'linear-gradient(to left, #1C0A00, transparent)' }}
      />

      <div
        className="flex gap-3"
        style={{ animation: 'marquee 28s linear infinite', width: 'max-content' }}
      >
        {items.map((cat, i) => (
          <Pill key={i} num={cat.num} label={cat.label} />
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

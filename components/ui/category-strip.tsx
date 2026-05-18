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

// Duplicate for seamless loop
const items = [...categories, ...categories]

function Pill({ num, label }: { num: string; label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#A0622A] bg-white px-4 py-2 shadow-sm">
      <span className="text-[11px] font-bold text-[#F9C125]">Cat {num}</span>
      <span className="h-3 w-px bg-[#A0622A]" />
      <span className="text-[13px] font-semibold text-[#E07A2F]">{label}</span>
    </span>
  )
}

export function CategoryStrip() {
  return (
    <div className="relative w-full overflow-hidden bg-white/80 py-3 backdrop-blur-sm">
      {/* Left fade */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-white to-transparent" />
      {/* Right fade */}
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-white to-transparent" />

      <div
        className="flex gap-3"
        style={{
          animation: 'marquee 28s linear infinite',
          width: 'max-content',
        }}
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

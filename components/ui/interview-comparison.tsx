const beforeFlaws = [
  'Starts with where they were born — irrelevant',
  'Lists grades instead of a narrative',
  '"basically" used twice — filler word',
  'No connection to this specific role',
  'Ends weakly — "That\'s basically it"',
  '7 filler words detected',
]

const afterStrengths = [
  'Opens with current context — specific and relevant',
  'Past section shows initiative with a real example',
  'Future section connects to this specific company',
  'Zero filler words',
  'Under 90 seconds — ideal length',
]

export function InterviewComparison() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

      {/* ── Before ── */}
      <div className="flex flex-col rounded-2xl border border-white/10 bg-[rgba(8,13,26,0.6)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Before</p>
            <p className="mt-0.5 text-sm font-semibold text-white/70">No format used</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-0.5 text-xs font-semibold text-white/50 line-through">
              STAR
            </span>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl font-black text-white/50">
              D
            </span>
          </div>
        </div>

        {/* Answer */}
        <div className="px-6 py-5">
          <blockquote className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm italic leading-relaxed text-white/70">
            "Um, so I'm Aditya. I was born in Chennai and I studied at VIT. I did my 10th with 91% and my 12th with 87%. I have done some projects in Python and I also know Java a little bit. I did an internship at a startup last year where I basically helped them with their app. I like coding and I want to work at a good company where I can grow. That's basically it about me."
          </blockquote>
        </div>

        {/* Flaws */}
        <div className="mt-auto border-t border-white/10 px-6 py-5">
          <ul className="space-y-2.5">
            {beforeFlaws.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                <span className="mt-0.5 shrink-0 text-red-400/70">✕</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── After ── */}
      <div className="flex flex-col rounded-2xl border-2 border-[#F9C125] overflow-hidden" style={{ backgroundColor: '#080d1a' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F9C125]/30 bg-[#F9C125]/10 px-6 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#F9C125]">After</p>
            <p className="mt-0.5 text-sm font-semibold text-white">STAR format applied</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-[#F9C125] bg-[#F9C125]/20 px-3 py-0.5 text-xs font-semibold text-[#F9C125]">
              STAR
            </span>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F9C125] text-xl font-black text-[#080d1a]">
              A
            </span>
          </div>
        </div>

        {/* Answer */}
        <div className="px-6 py-5">
          <blockquote className="rounded-xl border border-[#F9C125]/20 bg-white/5 p-4 text-sm leading-relaxed text-white/85">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#F9C125]">
              S — Situation (Present)
            </span>
            "I'm a final-year Computer Science student at VIT, specialising in AI and full-stack development. I've built two production web apps — one of which has 200 active users."
            <span className="mt-3 mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#F9C125]">
              T — Task (Past)
            </span>
            "My interest in product development started in second year when I built a ride-sharing app for our campus — 300 students used it daily. That taught me how to ship fast and take feedback seriously."
            <span className="mt-3 mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#F9C125]">
              A — Action &amp; R — Result (Future)
            </span>
            "I'm looking for a role where I can contribute to real product decisions from day one, which is exactly why this position caught my attention."
          </blockquote>
        </div>

        {/* Strengths */}
        <div className="mt-auto border-t border-[#F9C125]/20 px-6 py-5">
          <ul className="space-y-2.5">
            {afterStrengths.map((s) => (
              <li key={s} className="flex items-start gap-2.5 text-sm text-white/75">
                <span className="mt-0.5 shrink-0 text-[#F9C125]">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  )
}

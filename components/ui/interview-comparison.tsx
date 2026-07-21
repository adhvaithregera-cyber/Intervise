import { motion } from 'framer-motion'

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
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div
          className="glass-card flex flex-col rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(239,68,68,0.20)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Before</p>
              <p className="mt-0.5 text-sm font-semibold text-white/70">No format used</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300 line-through">
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
      </motion.div>

      {/* ── After ── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
      >
        <div
          className="glass-card flex flex-col rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(249,193,37,0.30)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#F9C125]/30 bg-[#F9C125]/10 px-6 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#F9C125]">After</p>
              <p className="mt-0.5 text-sm font-semibold text-white">STAR format applied</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-[#F9C125]/25 bg-[#F9C125]/10 px-3 py-1 text-xs font-semibold text-[#F9C125]">
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
      </motion.div>

    </div>
  )
}

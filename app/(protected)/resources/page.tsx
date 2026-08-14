import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Resources & Guides',
}

// Add new guides here — they appear automatically on the hub page.
const GUIDES = [
  {
    href: '/resources/star-method',
    title: 'The STAR Method',
    description:
      'Structure any behavioural answer in four clear steps: Situation, Task, Action, Result. The single highest-impact skill for raising your score.',
    tag: 'Answer structure',
    tagColor: 'text-[#F9C125] bg-[#F9C125]/10 border-[#F9C125]/20',
    readTime: '5 min read',
  },
  {
    href: '/resources/filler-words',
    title: 'Cutting Filler Words',
    description:
      'Sound confident and clear by mastering the pause instead of filling silence. Learn which fillers to cut entirely and how to train the habit out.',
    tag: 'Filler words',
    tagColor: 'text-[#F9C125] bg-[#F9C125]/10 border-[#F9C125]/20',
    readTime: '4 min read',
  },
  {
    href: '/resources/speaking-pace',
    title: 'Mastering Your Speaking Pace',
    description:
      'Find the confident middle — not too fast, not too slow. Learn why pace signals confidence, and how to hit the 140–150 wpm sweet spot.',
    tag: 'Speaking pace',
    tagColor: 'text-[#F9C125] bg-[#F9C125]/10 border-[#F9C125]/20',
    readTime: '4 min read',
  },
  {
    href: '/resources/fluency',
    title: 'Improving Your Delivery Fluency',
    description:
      'Sound smooth and sure by speaking in complete thoughts. Fix the habits behind choppy delivery — incomplete sentences, uneven pace, and hesitation.',
    tag: 'Fluency',
    tagColor: 'text-[#F9C125] bg-[#F9C125]/10 border-[#F9C125]/20',
    readTime: '4 min read',
  },
]

const OUTER_CARD = {
  backgroundColor: 'rgba(8,13,26,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,193,37,0.20)',
  borderRadius: '1rem',
}

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Resources &amp; Guides</h1>
        <p className="mt-1 text-sm text-white/50">
          Practical guides for the skills Intervise tracks — read once, apply every session.
        </p>
      </div>

      {/* Guide cards */}
      <div className="space-y-4">
        {GUIDES.map((guide) => (
          <Link
            key={guide.href}
            href={guide.href}
            className="block group"
          >
            <div
              className="p-5 sm:p-6 transition-all duration-200 group-hover:border-[rgba(249,193,37,0.45)]"
              style={OUTER_CARD}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Tag + read time */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded border ${guide.tagColor}`}>
                      {guide.tag}
                    </span>
                    <span className="text-[10px] text-white/35">{guide.readTime}</span>
                  </div>

                  <h2 className="text-base font-semibold text-white group-hover:text-[#F9C125] transition-colors">
                    {guide.title}
                  </h2>
                  <p className="mt-1 text-sm text-white/55 leading-relaxed">
                    {guide.description}
                  </p>
                </div>

                {/* Arrow */}
                <span className="text-white/25 group-hover:text-[#F9C125] group-hover:translate-x-1 transition-all text-lg mt-0.5 shrink-0">
                  →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Coming soon footer */}
      <p className="text-xs text-white/25 text-center pb-4">
        More guides coming soon.
      </p>
    </div>
  )
}

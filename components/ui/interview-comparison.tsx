'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

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

function BeforePanel() {
  return (
    <div className="h-full bg-red-50 p-6 sm:p-8 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-red-400">Before</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-lg font-black text-red-500">D</span>
      </div>
      <blockquote className="rounded-xl border border-red-200 bg-white/70 p-4 text-sm leading-relaxed text-[#3D52A0] italic">
        "Um, so I'm Aditya. I was born in Chennai and I studied at VIT. I did my 10th with 91% and my 12th with 87%. I have done some projects in Python and I also know Java a little bit. I did an internship at a startup last year where I basically helped them with their app. I like coding and I want to work at a good company where I can grow. That's basically it about me."
      </blockquote>
      <ul className="space-y-2">
        {beforeFlaws.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-red-600">
            <span className="mt-0.5 shrink-0">✕</span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}

function AfterPanel() {
  return (
    <div className="h-full bg-emerald-50 p-6 sm:p-8 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">After — Present → Past → Future</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-lg font-black text-emerald-600">A</span>
      </div>
      <blockquote className="rounded-xl border border-emerald-200 bg-white/70 p-4 text-sm leading-relaxed text-[#3D52A0]">
        <span className="mb-1 block font-semibold text-emerald-600 text-xs uppercase tracking-wider">Present</span>
        "I'm a final-year Computer Science student at VIT, specialising in AI and full-stack development. I've built two production web apps — one of which has 200 active users."
        <span className="mt-3 mb-1 block font-semibold text-emerald-600 text-xs uppercase tracking-wider">Past</span>
        "My interest in product development started in second year when I built a ride-sharing app for our campus that solved a real problem — 300 students used it daily. That experience taught me how to ship fast and take feedback seriously."
        <span className="mt-3 mb-1 block font-semibold text-emerald-600 text-xs uppercase tracking-wider">Future</span>
        "I'm looking for a role where I can contribute to real product decisions from day one, which is exactly why this position at your company caught my attention."
      </blockquote>
      <ul className="space-y-2">
        {afterStrengths.map((s) => (
          <li key={s} className="flex items-start gap-2.5 text-sm text-emerald-700">
            <span className="mt-0.5 shrink-0">✓</span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function InterviewComparison() {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = useCallback(
    (clientX: number) => {
      if (!isDragging || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pos = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100))
      setSliderPosition(pos)
    },
    [isDragging]
  )

  const stopDrag = useCallback(() => setIsDragging(false), [])

  useEffect(() => {
    window.addEventListener('mouseup', stopDrag)
    return () => window.removeEventListener('mouseup', stopDrag)
  }, [stopDrag])

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none overflow-hidden rounded-2xl border border-[#ADBBDA] shadow-xl cursor-ew-resize"
      style={{ minHeight: 540 }}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseLeave={stopDrag}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={stopDrag}
    >
      {/* Before — left panel, clipped on the right */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
        <BeforePanel />
      </div>

      {/* After — right panel, clipped on the left */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}>
        <AfterPanel />
      </div>

      {/* Drag handle */}
      <div
        className="absolute top-0 bottom-0 z-10 flex items-center justify-center"
        style={{ left: `calc(${sliderPosition}% - 1px)` }}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
      >
        <div className="h-full w-0.5 bg-white/60" />
        <div
          className={`absolute flex h-11 w-11 items-center justify-center rounded-full border border-[#ADBBDA] bg-white shadow-lg transition-transform ${isDragging ? 'scale-110' : ''}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8697C4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </div>
      </div>

      {/* Corner labels — always visible */}
      <div className="pointer-events-none absolute top-3 left-4 z-20 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-red-400">
        Before
      </div>
      <div className="pointer-events-none absolute top-3 right-4 z-20 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-500">
        After
      </div>

      {/* Drag hint */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-20 rounded-full bg-white/80 px-3 py-1 text-[10px] font-medium text-[#8697C4] shadow-sm backdrop-blur-sm">
        drag to compare
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  GUIDE_CARD,
  SectionHeading,
  SubHeading,
  Prose,
  Callout,
  GuideHeader,
  GuideFooter,
} from '../_components/guide'

export const metadata: Metadata = {
  title: 'Improving Your Delivery Fluency — Resources',
}

export default function FluencyPage() {
  return (
    <div className="mx-auto max-w-2xl pb-12">
      <GuideHeader
        tag="Fluency"
        readTime="4 min read"
        title="Improving Your Delivery Fluency: Sound Smooth and Sure"
      >
        <Prose>
          Fluency is how smoothly your words flow. It&apos;s not about vocabulary or accent —
          it&apos;s about whether your answer comes out as a steady, connected stream of
          thought, or as a choppy, hesitant series of stops and starts. High fluency makes you
          sound confident and prepared. Low fluency makes you sound uncertain, even when your
          content is strong.
        </Prose>
        <Prose>
          The good news: fluency is really a combination of a few smaller habits, and once you
          fix those, smoothness follows naturally.
        </Prose>
      </GuideHeader>

      <div className="p-7 sm:p-10 space-y-0" style={GUIDE_CARD}>

        {/* What low fluency is */}
        <SectionHeading>What low fluency actually is</SectionHeading>
        <Prose>
          Fluency isn&apos;t one single thing — it&apos;s the overall smoothness that results
          from several habits working together. Low fluency usually comes from a mix of:
        </Prose>

        <ul className="mt-8 space-y-5">
          {[
            { label: 'Filler words', desc: 'breaking up your flow ("um," "like," "you know")' },
            { label: 'Uneven pace', desc: 'rushing, then stalling, then rushing again' },
            { label: 'Incomplete sentences', desc: 'starting a thought, abandoning it, restarting' },
            { label: 'Hesitation', desc: 'long, uncertain pauses in the middle of sentences while you search for words' },
          ].map(({ label, desc }) => (
            <li key={label} className="flex gap-3 items-start">
              <span className="shrink-0 mt-[9px] h-1.5 w-1.5 rounded-full bg-[#F9C125]/50" />
              <p className="text-sm text-white/65 leading-[1.9]">
                <span className="font-semibold text-white/85">{label}</span> — {desc}
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-sm text-white/55 leading-[1.9]">
          So improving fluency isn&apos;t about one trick. It&apos;s about smoothing out these
          underlying habits so your delivery flows.
        </p>

        {/* Core fix */}
        <SectionHeading>The core fix: speak in complete thoughts</SectionHeading>
        <Prose>
          The biggest cause of choppy delivery is starting to speak before you know where the
          sentence is going. You begin a thought, realise mid-way you&apos;re not sure how to
          finish it, and either trail off or restart. That start-stop pattern is what kills
          fluency.
        </Prose>
        <p className="mt-6 text-sm text-white/65 leading-[1.9]">
          The fix: take a brief beat to know your thought, then deliver it as one complete
          sentence.
        </p>
        <p className="mt-6 text-sm text-white/65 leading-[1.9]">
          It&apos;s better to pause for a second, gather the full thought, and say it cleanly,
          than to start talking immediately and stumble through it. A short silence before a
          smooth sentence sounds far more fluent than rushing into a tangled one.
        </p>

        <Callout>
          <div className="space-y-5">
            <div className="flex gap-3 items-start">
              <span className="shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-red-400 bg-red-400/10 border border-red-400/20 rounded px-1.5 py-0.5">
                Choppy
              </span>
              <p className="text-sm text-white/50 italic leading-[1.9]">
                &ldquo;So I, um, when I was working on, like, the project, we, I mean I, kind of
                handled the, the client side of it...&rdquo;
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded px-1.5 py-0.5">
                Fluent
              </span>
              <p className="text-sm text-white/80 leading-[1.9]">
                &ldquo;When I was working on that project, I handled the client side of it.&rdquo;
              </p>
            </div>
            <p className="text-xs text-white/40 leading-[1.9] mt-4">
              Same content. The fluent version just knows where it&apos;s going before it starts.
            </p>
          </div>
        </Callout>

        {/* Habits */}
        <SectionHeading>The habits that build fluency</SectionHeading>

        <SubHeading>1. Pause between thoughts, not within them.</SubHeading>
        <Prose>
          Pause at the natural breaks — between sentences and ideas — not in the middle of a
          sentence. A pause between thoughts sounds composed. A pause mid-sentence sounds like
          you&apos;re lost. This single shift makes a huge difference.
        </Prose>

        <SubHeading>2. Cut the fillers.</SubHeading>
        <Prose>
          Fillers are the most obvious fluency-breaker. Replace them with brief silent pauses.
        </Prose>
        <p className="mt-4 text-sm text-white/50 leading-[1.9]">
          If fillers are a big issue for you,{' '}
          <Link
            href="/resources/filler-words"
            className="text-[#F9C125]/80 hover:text-[#F9C125] underline underline-offset-2 transition-colors"
          >
            the filler words guide
          </Link>
          {' '}goes deep on this.
        </p>

        <SubHeading>3. Steady your pace.</SubHeading>
        <Prose>
          Uneven speed — fast then slow then fast — sounds choppy. A calm, consistent rhythm
          sounds fluent. Aim for a steady 140–150 words per minute.
        </Prose>
        <p className="mt-4 text-sm text-white/50 leading-[1.9]">
          See the{' '}
          <Link
            href="/resources/speaking-pace"
            className="text-[#F9C125]/80 hover:text-[#F9C125] underline underline-offset-2 transition-colors"
          >
            speaking pace guide
          </Link>
          {' '}for more.
        </p>

        <SubHeading>4. Finish what you start.</SubHeading>
        <Prose>
          Don&apos;t abandon sentences halfway. If you begin a thought, carry it through to
          the end before moving on. Complete sentences are the backbone of fluent speech.
        </Prose>

        <SubHeading>5. Prepare your key stories.</SubHeading>
        <Prose>
          A lot of hesitation comes from figuring out what to say in real time. If you&apos;ve
          practised your main examples using STAR, the words flow because you already know the
          story. Preparation is the quiet secret behind fluent delivery.
        </Prose>

        {/* Practice */}
        <SectionHeading>Practice makes fluent</SectionHeading>
        <Prose>
          Fluency improves faster than almost any other speaking skill, because it&apos;s
          mostly about familiarity. The more you practise answering out loud, the more your
          delivery smooths out — the stumbles disappear, the pace steadies, and you stop
          searching for words mid-sentence.
        </Prose>
        <p className="mt-6 text-sm text-white/65 leading-[1.9]">
          Record yourself and listen back. You&apos;ll hear exactly where the choppiness is —
          the fillers, the restarts, the awkward pauses — and each practice session smooths a
          little more. Intervise scores your fluency every session, so watch that number climb
          as your delivery gets steadier.
        </p>

        {/* Closing */}
        <SectionHeading>The one thing to remember</SectionHeading>
        <Prose>
          Fluency comes from knowing your thought before you speak it. Pause briefly, gather
          the complete sentence, then deliver it cleanly — and pause between thoughts, not
          inside them. Combine that with fewer fillers, a steady pace, and some practice, and
          your delivery will sound smooth, confident, and sure.
        </Prose>

      </div>

      <GuideFooter />
    </div>
  )
}

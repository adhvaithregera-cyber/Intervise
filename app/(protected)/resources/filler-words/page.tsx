import type { Metadata } from 'next'
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
  title: 'Cutting Filler Words — Resources',
}

export default function FillerWordsPage() {
  return (
    <div className="mx-auto max-w-2xl pb-12">
      <GuideHeader
        tag="Filler words"
        readTime="4 min read"
        title="Cutting Filler Words: How to Sound Confident and Clear"
      >
        <Prose>
          &ldquo;Um.&rdquo; &ldquo;Like.&rdquo; &ldquo;You know.&rdquo; &ldquo;So.&rdquo; These
          are filler words — the little sounds and phrases we drop into speech to fill silence
          while our brain catches up. Everyone uses them. But in an interview, they quietly work
          against you: they make you sound unsure, unprepared, and less in control, even when you
          know exactly what you&apos;re talking about.
        </Prose>
        <Prose>
          The good news: fillers are one of the most fixable interview habits. You don&apos;t need
          to change what you say, just how you handle the gaps between your thoughts.
        </Prose>
      </GuideHeader>

      <div className="p-7 sm:p-10 space-y-0" style={GUIDE_CARD}>

        {/* Why fillers happen */}
        <SectionHeading>Why fillers happen</SectionHeading>
        <Prose>Fillers aren&apos;t a vocabulary problem. They&apos;re a timing problem.</Prose>
        <p className="mt-4 text-sm text-white/65 leading-[1.75]">
          When you speak faster than you can think, your mouth runs ahead of your brain. To avoid
          a moment of silence, you fill the gap with &ldquo;um&rdquo; or &ldquo;like&rdquo; while
          you figure out your next word. The filler is a placeholder — it buys you a split second
          of thinking time.
        </p>
        <p className="mt-4 text-sm text-white/65 leading-[1.75]">
          That&apos;s the key insight: you don&apos;t use fillers because you lack words. You use
          them because you&apos;re afraid of silence.
        </p>

        {/* The fix */}
        <SectionHeading>The fix isn&apos;t replacing them, it&apos;s pausing</SectionHeading>
        <Prose>
          Most people try to swap one filler for another — replacing &ldquo;um&rdquo; with
          &ldquo;so&rdquo; or &ldquo;basically.&rdquo; That doesn&apos;t work, because the habit
          underneath is the same: filling silence.
        </Prose>
        <p className="mt-4 text-sm text-white/65 leading-[1.75]">
          The real fix is to get comfortable with the pause.
        </p>
        <p className="mt-4 text-sm text-white/65 leading-[1.75]">
          When you feel a filler coming, stop. Say nothing. Let there be a beat of silence while
          you gather your next thought, then continue.
        </p>
        <p className="mt-4 text-sm text-white/65 leading-[1.75]">
          Here&apos;s why this works: a pause feels much longer to{' '}
          <em className="text-white/80 not-italic font-medium">you</em> (the speaker) than it does
          to the listener. A one-second silence feels like an eternity when you&apos;re talking,
          but to the interviewer, it just sounds like you&apos;re thinking carefully. In fact, a
          well-placed pause makes you sound{' '}
          <em className="text-white/80 not-italic font-medium">more</em> thoughtful and confident,
          not less.
        </p>

        {/* Filler vs pause contrast callout */}
        <Callout>
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <span className="shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-red-400 bg-red-400/10 border border-red-400/20 rounded px-1.5 py-0.5">
                Filler says
              </span>
              <p className="text-sm text-white/60 leading-[1.75] italic">
                &ldquo;I&apos;m not sure what to say next.&rdquo;
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded px-1.5 py-0.5">
                Pause says
              </span>
              <p className="text-sm text-white/80 leading-[1.75]">
                &ldquo;I&apos;m choosing my words carefully.&rdquo;
              </p>
            </div>
            <p className="text-xs text-white/40 leading-[1.75] mt-2">
              Same gap. Completely different impression.
            </p>
          </div>
        </Callout>

        {/* Always-fillers */}
        <SectionHeading>The always-fillers (cut these completely)</SectionHeading>
        <Prose>
          Some words are pure filler — they have no real meaning and only fill silence. These are
          the ones to eliminate entirely:
        </Prose>
        <ul className="mt-5 space-y-3">
          {[
            'um, uh, er, erm',
            'hmm, mm',
            '"you know" (as a verbal tic)',
            '"like" (when used as filler: "it was like really hard")',
          ].map((item) => (
            <li key={item} className="flex gap-3 items-start">
              <span className="shrink-0 mt-[9px] h-1.5 w-1.5 rounded-full bg-[#F9C125]/50" />
              <p className="text-sm text-white/65 leading-[1.75]">{item}</p>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-white/50 leading-[1.75]">
          These add nothing. Every one you cut makes you sound sharper.
        </p>

        {/* Context-dependent */}
        <SectionHeading>The context-dependent ones (use with care)</SectionHeading>
        <Prose>
          Some words are fine in moderation but become filler when overused:
        </Prose>
        <ul className="mt-5 space-y-4">
          {[
            { word: 'so', fine: 'as a genuine transition ("So, here\'s what I did")', filler: 'when it opens every single sentence' },
            { word: 'actually', fine: 'when you\'re correcting something', filler: 'as reflexive padding' },
            { word: 'basically', fine: 'when you\'re genuinely simplifying', filler: 'when it\'s a habit' },
            { word: 'just', fine: 'meaning "only"', filler: 'when it\'s minimizing padding' },
          ].map(({ word, fine, filler }) => (
            <li key={word} className="flex gap-3 items-start">
              <span className="shrink-0 mt-[9px] h-1.5 w-1.5 rounded-full bg-[#F9C125]/50" />
              <p className="text-sm text-white/65 leading-[1.75]">
                <span className="font-semibold text-white/85">{word}</span>{' '}
                — fine {fine}; filler {filler}.
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-white/50 leading-[1.75]">
          You don&apos;t need to eliminate these completely — that would sound robotic. Just notice
          if you&apos;re leaning on them out of habit.
        </p>

        {/* Quick test */}
        <SectionHeading>A quick test: is it actually filler?</SectionHeading>
        <Prose>
          Not sure whether a word is filler or doing real work? Try the sentence without it and
          see if the meaning changes.
        </Prose>

        <Callout>
          <p className="text-xs font-bold uppercase tracking-widest text-[#F9C125]/70 mb-7">
            The removal test
          </p>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-white/50 leading-[1.75] mb-2">
                <span className="italic">&ldquo;Could you just send me the file?&rdquo;</span>
                {' → '}
                <span className="italic">&ldquo;Could you send me the file?&rdquo;</span>
              </p>
              <div className="flex gap-2 items-start">
                <span className="shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-red-400 bg-red-400/10 border border-red-400/20 rounded px-1.5 py-0.5">
                  Cut it
                </span>
                <p className="text-sm text-white/60 leading-[1.75]">
                  Meaning is identical — &ldquo;just&rdquo; is filler here.
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-white/50 leading-[1.75] mb-2">
                <span className="italic">&ldquo;I just got out of the shower.&rdquo;</span>
                {' → '}
                <span className="italic">&ldquo;I got out of the shower.&rdquo;</span>
              </p>
              <div className="flex gap-2 items-start">
                <span className="shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded px-1.5 py-0.5">
                  Keep it
                </span>
                <p className="text-sm text-white/60 leading-[1.75]">
                  You&apos;ve lost the &ldquo;a moment ago&rdquo; meaning — &ldquo;just&rdquo; is
                  doing real work here.
                </p>
              </div>
            </div>
          </div>
          <p className="mt-5 text-xs text-white/40 leading-[1.75]">
            The rule: if removing the word changes nothing, it&apos;s filler. If it changes the
            meaning, it stays.
          </p>
        </Callout>

        {/* How to reduce */}
        <SectionHeading>How to actually reduce them</SectionHeading>
        <Prose>
          Knowing the fix isn&apos;t enough — you have to train the habit. Here&apos;s how:
        </Prose>

        <SubHeading>1. Slow down.</SubHeading>
        <Prose>
          Fillers explode when you rush. If you speak at a calm, measured pace, you give your
          brain time to keep up — and the gaps that used to get filled with &ldquo;um&rdquo;
          disappear on their own. Slowing your pace is the single most effective thing you can do.
        </Prose>

        <SubHeading>2. Practise the pause on purpose.</SubHeading>
        <Prose>
          In your next practice session, consciously replace every filler with a silent beat. It
          will feel painfully slow and awkward to you. Do it anyway. Record yourself and listen
          back — you&apos;ll almost always sound more confident than you felt.
        </Prose>

        <SubHeading>3. Breathe at transitions.</SubHeading>
        <Prose>
          Instead of &ldquo;um&rdquo; or &ldquo;so&rdquo; between thoughts, take a small breath.
          It resets you, buys the same thinking time a filler would, and does it silently.
        </Prose>

        <SubHeading>4. Track your count.</SubHeading>
        <Prose>
          Intervise counts your fillers every session. Watch that number over time. Awareness alone
          reduces fillers — once you know you say &ldquo;you know&rdquo; ten times a session, you
          start catching yourself. Aim to bring the number down session by session.
        </Prose>

        {/* Closing */}
        <SectionHeading>The one thing to remember</SectionHeading>
        <Prose>
          Silence is not your enemy. The urge to fill every gap is what creates fillers in the
          first place. Slow down, get comfortable pausing, and let the quiet moments do the work.
          A calm, unhurried speaker with a few seconds of silence always sounds more confident than
          a fast one saying &ldquo;um&rdquo; every sentence.
        </Prose>

      </div>

      <GuideFooter />
    </div>
  )
}

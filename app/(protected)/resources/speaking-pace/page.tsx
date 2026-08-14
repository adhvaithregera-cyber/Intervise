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
  title: 'Mastering Your Speaking Pace — Resources',
}

export default function SpeakingPacePage() {
  return (
    <div className="mx-auto max-w-2xl pb-12">
      <GuideHeader
        tag="Speaking pace"
        readTime="4 min read"
        title="Mastering Your Speaking Pace: Not Too Fast, Not Too Slow"
      >
        <Prose>
          How fast you speak matters more than you&apos;d think. Talk too fast and you sound
          nervous, and the interviewer struggles to follow you. Talk too slow and you sound
          hesitant or unsure, and you risk losing their attention. The sweet spot — roughly
          140 to 150 words per minute — is where you sound calm, clear, and in control.
        </Prose>
        <Prose>
          The good news: pace is one of the easiest things to fix once you&apos;re aware of
          it. Here&apos;s how to find your rhythm.
        </Prose>
      </GuideHeader>

      <div className="p-7 sm:p-10 space-y-0" style={GUIDE_CARD}>

        {/* Why pace matters */}
        <SectionHeading>Why pace matters so much</SectionHeading>
        <Prose>
          Your speaking pace sends a signal before the interviewer even processes your words.
        </Prose>

        <ul className="mt-8 space-y-5">
          {[
            {
              label: 'Too fast',
              desc: 'signals nervousness. It suggests you\'re rushing to get through it, or that you\'re anxious. It also makes you harder to understand, and it\'s the biggest cause of filler words — when your mouth outruns your brain, you fill the gaps with "um" and "like".',
              color: 'text-red-400 bg-red-400/10 border-red-400/20',
            },
            {
              label: 'Too slow',
              desc: "signals hesitation. It can make you seem unsure of your answer, low on energy, or like you're struggling to find words. The interviewer's attention drifts.",
              color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
            },
            {
              label: 'Just right (140–150 wpm)',
              desc: "signals confidence. You sound composed, deliberate, and easy to follow. The interviewer relaxes because you sound like you know what you're saying.",
              color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
            },
          ].map(({ label, desc, color }) => (
            <li key={label} className="flex gap-3 items-start">
              <span className={`shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-widest border rounded px-1.5 py-0.5 ${color}`}>
                {label}
              </span>
              <p className="text-sm text-white/65 leading-[1.9]">{desc}</p>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-sm text-white/55 leading-[1.9]">
          The target isn&apos;t robotic, steady speech. It&apos;s a natural, controlled rhythm
          that lands in that comfortable middle range.
        </p>

        {/* Too fast */}
        <SectionHeading>If you speak too fast (over 165 wpm)</SectionHeading>
        <Prose>
          Fast talking almost always comes from nerves. Here&apos;s how to slow down:
        </Prose>

        <SubHeading>Pause between thoughts.</SubHeading>
        <Prose>
          The single best fix. Instead of rushing from one sentence to the next, let there be
          a small beat of silence between ideas. It feels slow to you, but to the listener it
          sounds thoughtful and controlled — and it naturally brings your pace down.
        </Prose>

        <SubHeading>Breathe.</SubHeading>
        <Prose>
          Fast talkers often forget to breathe, which makes them speed up even more. Take a
          breath at the end of each point. It paces you automatically and gives you a second
          to think.
        </Prose>

        <SubHeading>Finish your sentences fully.</SubHeading>
        <Prose>
          Rushers tend to trail off and jump to the next thought. Complete each sentence with
          a clear end, then move on. This forces a steadier rhythm.
        </Prose>

        <Callout>
          <p className="text-xs font-bold uppercase tracking-widest text-[#F9C125]/70 mb-5">
            Remember
          </p>
          <p className="text-sm text-white/75 leading-[1.9]">
            Silence is fine. The urge to fill every gap is what makes you rush. Get comfortable
            with short pauses and your pace will settle on its own.
          </p>
          <p className="mt-5 text-sm text-white/55 leading-[1.9]">
            Fixing your pace also fixes your fillers — they&apos;re the same problem. Slow
            down, and both improve at once.
          </p>
        </Callout>

        {/* Too slow */}
        <SectionHeading>If you speak too slow (under 110 wpm)</SectionHeading>
        <Prose>
          Slow speech usually comes from over-thinking, low energy, or too many long pauses.
          Here&apos;s how to pick it up:
        </Prose>

        <SubHeading>Add energy and intention.</SubHeading>
        <Prose>
          Speak like you mean it. A little more enthusiasm and vocal energy naturally quickens
          your pace and makes you sound more engaged and confident.
        </Prose>

        <SubHeading>Cut the long pauses.</SubHeading>
        <Prose>
          Some pausing is good, but too much silence between words drags. Aim for a steadier
          flow — pause between full thoughts, not in the middle of them.
        </Prose>

        <SubHeading>Prepare your key stories.</SubHeading>
        <Prose>
          A lot of slowness comes from searching for what to say next. If you&apos;ve
          practised your main examples using STAR, the words come faster and you don&apos;t
          stall mid-sentence.
        </Prose>

        <SubHeading>Practise out loud.</SubHeading>
        <Prose>
          Slow speakers are often just under-rehearsed. The more you practise answering out
          loud, the more fluent and naturally paced you become.
        </Prose>

        {/* Finding your pace */}
        <SectionHeading>How to find your natural pace</SectionHeading>
        <Prose>
          The goal isn&apos;t to count words in your head while you talk — that&apos;s
          impossible. Instead:
        </Prose>

        <SubHeading>Record yourself and listen back.</SubHeading>
        <Prose>
          This is the most powerful tool. You often can&apos;t feel your own pace in the
          moment, but you&apos;ll hear it instantly on playback. Intervise measures your
          words-per-minute every session, so watch that number and aim for the 140–150 range.
        </Prose>

        <SubHeading>Get a feel for the target range.</SubHeading>
        <Prose>
          Read something aloud for a minute at what feels like a calm, clear pace. Check your
          WPM. Do it a few times until 140–150 wpm feels natural — calm but not sluggish,
          energetic but not rushed. Once your body knows the rhythm, you&apos;ll fall into it
          naturally.
        </Prose>

        <SubHeading>Use pauses as your reset.</SubHeading>
        <Prose>
          Whether you&apos;re too fast or too slow, a deliberate pause between thoughts helps.
          For fast talkers it slows you down. For slow talkers it stops the mid-sentence
          stalling that drags your average down. The pause is your rhythm tool — use it
          consciously.
        </Prose>

        {/* Closing */}
        <SectionHeading>The one thing to remember</SectionHeading>
        <Prose>
          Aim for calm and controlled — around 140 to 150 words per minute. If you tend to
          rush, slow down and pause between thoughts. If you tend to drag, add energy and keep
          your flow steady. Record yourself, watch your words-per-minute, and adjust. Pace is
          a habit, and habits change fast once you&apos;re paying attention.
        </Prose>

      </div>

      <GuideFooter />
    </div>
  )
}

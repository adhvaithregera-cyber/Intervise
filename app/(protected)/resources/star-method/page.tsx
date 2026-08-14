import type { Metadata } from 'next'
import {
  GUIDE_CARD,
  SectionHeading,
  SubHeading,
  Prose,
  Callout,
  Comparison,
  WorkedExample,
  GuideHeader,
  GuideFooter,
} from '../_components/guide'

export const metadata: Metadata = {
  title: 'The STAR Method — Resources',
}

export default function StarMethodPage() {
  return (
    <div className="mx-auto max-w-2xl pb-12">
      <GuideHeader
        tag="Answer structure"
        readTime="5 min read"
        title="The STAR Method: How to Structure Any Behavioural Answer"
      >
        <Prose>
          Most interview answers fail for one reason: they ramble. The person knows their story,
          but it comes out as a tangled mess of half-finished thoughts, and the interviewer loses
          the thread. STAR fixes that. It gives your answer a clear beginning, middle, and end,
          so the interviewer can follow what you did and see why it matters.
        </Prose>
        <Prose>
          If your skill score is low, this is almost always why. Your content might be good, but
          without structure, it doesn&apos;t land. Master STAR and you&apos;ll immediately sound
          more competent, more prepared, and more hireable.
        </Prose>
      </GuideHeader>

      <div className="p-7 sm:p-10 space-y-0" style={GUIDE_CARD}>

        {/* What STAR stands for */}
        <SectionHeading>What STAR stands for</SectionHeading>
        <Prose>STAR is four parts, in order:</Prose>
        <ul className="mt-4 space-y-3">
          {[
            { letter: 'S', label: 'Situation', desc: 'the context. Where were you, what was happening?' },
            { letter: 'T', label: 'Task', desc: 'your responsibility. What did you need to do?' },
            { letter: 'A', label: 'Action', desc: 'what you specifically did. The heart of the answer.' },
            { letter: 'R', label: 'Result', desc: 'what happened because of your actions.' },
          ].map(({ letter, label, desc }) => (
            <li key={letter} className="flex items-start gap-3">
              <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-[#F9C125]/15 text-[#F9C125] text-xs font-bold border border-[#F9C125]/25">
                {letter}
              </span>
              <span className="text-sm text-white/65 leading-[1.75] pt-0.5">
                <span className="font-semibold text-white/85">{label}:</span> {desc}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-white/55 leading-[1.9]">
          That&apos;s the whole framework. Every strong behavioural answer moves through these
          four stages in order.
        </p>

        {/* Time split */}
        <SectionHeading>The golden rule: where to spend your time</SectionHeading>
        <Prose>
          Not all four parts are equal. This is the mistake most people make — they spend forever
          setting up the situation and rush the action.
        </Prose>
        <Callout>
          <p className="text-xs font-bold uppercase tracking-widest text-[#F9C125]/70 mb-6">
            Time split
          </p>
          <div className="space-y-4">
            {[
              { label: 'Situation', pct: 15, note: 'keep it short' },
              { label: 'Task', pct: 10, note: 'even shorter' },
              { label: 'Action', pct: 60, note: 'this is where you live', highlight: true },
              { label: 'Result', pct: 15, note: 'end strong' },
            ].map(({ label, pct, note, highlight }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`w-20 shrink-0 text-xs font-semibold ${highlight ? 'text-[#F9C125]' : 'text-white/60'}`}>
                  {label}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: highlight ? '#F9C125' : 'rgba(249,193,37,0.35)',
                    }}
                  />
                </div>
                <span className="text-xs text-white/40 shrink-0 w-6 text-right">{pct}%</span>
                <span className="text-xs text-white/35 hidden sm:inline">{note}</span>
              </div>
            ))}
          </div>
        </Callout>
        <Prose>
          The interviewer cares most about what{' '}
          <em className="text-white/80 not-italic font-medium">you</em> did and what came of it.
          The backstory is just there to make sense of the action. Set the scene fast, then get
          to what matters.
        </Prose>

        {/* Breaking down each part */}
        <SectionHeading>Breaking down each part</SectionHeading>

        <SubHeading>Situation — set the scene, briefly</SubHeading>
        <Prose>
          Give just enough context for the story to make sense. One or two sentences. What was the
          setting, and what was the challenge or moment?
        </Prose>
        <Comparison
          weak="So this was back when I was working at a company, and there were a lot of things going on, and it was a busy time, and we had this project..."
          strong="In my last role, our team's biggest project was two weeks behind deadline and the client was losing confidence."
        />
        <p className="mt-6 text-sm text-white/50 leading-[1.9]">
          The strong version sets up the whole story in one sentence. Don&apos;t over-explain.
        </p>

        <SubHeading>Task — your responsibility</SubHeading>
        <Prose>
          What was your role in this? What needed to happen, and what were{' '}
          <em className="text-white/80 not-italic font-medium">you</em> on the hook for? One or
          two sentences.
        </Prose>
        <div className="mt-8 flex gap-2.5 items-start">
          <span className="shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded px-1.5 py-0.5">
            Strong
          </span>
          <p className="text-sm text-white/80 leading-[1.9]">
            &ldquo;I was responsible for getting us back on track without cutting quality.&rdquo;
          </p>
        </div>
        <p className="mt-6 text-sm text-white/50 leading-[1.9]">
          This tells the interviewer exactly what you were trying to achieve, so your actions have
          a clear purpose.
        </p>

        <SubHeading>Action — what YOU did (the heart of it)</SubHeading>
        <Prose>
          This is 60% of your answer. Spend the most time here. Two rules matter most:
        </Prose>

        <p className="mt-12 text-base font-semibold text-white/85">1. Say &ldquo;I,&rdquo; not &ldquo;we.&rdquo;</p>
        <p className="mt-4 text-sm text-white/60 leading-[1.9]">
          The interviewer is evaluating{' '}
          <em className="text-white/80 not-italic font-medium">you</em>, not your team. If
          everything is &ldquo;we did this, we did that,&rdquo; they can&apos;t tell what you
          actually contributed. Even if it was a team effort, describe your specific part with
          &ldquo;I.&rdquo;
        </p>
        <Comparison
          weak="We figured out the problem and we fixed it."
          strong="I identified the bottleneck, then I reassigned the tasks, and I built a tracking sheet to catch delays early."
        />

        <p className="mt-14 text-base font-semibold text-white/85">
          2. Give at least three concrete, specific steps.
        </p>
        <p className="mt-4 text-sm text-white/60 leading-[1.9]">
          Vague actions (&ldquo;I worked hard,&rdquo; &ldquo;I communicated well&rdquo;) tell
          the interviewer nothing. Specific steps prove you actually did something.
        </p>
        <div className="mt-8 flex gap-2.5 items-start">
          <span className="shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded px-1.5 py-0.5">
            Strong
          </span>
          <p className="text-sm text-white/80 leading-[1.9]">
            &ldquo;I broke the remaining work into daily targets, reassigned tasks based on each
            person&apos;s strengths, set up a short daily check-in to catch blockers early, and
            personally took on the most technical piece myself.&rdquo;
          </p>
        </div>
        <p className="mt-6 text-sm text-white/45 leading-[1.9]">
          Four specific &ldquo;I&rdquo; actions. That&apos;s what a strong Action section looks like.
        </p>

        <SubHeading>Result — what happened</SubHeading>
        <Prose>End with the outcome. This is what makes your story land. Two levels:</Prose>

        <p className="mt-12 text-base font-semibold text-white/85">Best: quantify it.</p>
        <p className="mt-4 text-sm text-white/60 leading-[1.9]">
          A number, a percentage, time saved, money made, a ranking. Numbers are concrete and
          memorable.
        </p>
        <div className="mt-6 flex gap-2.5 items-start">
          <span className="shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded px-1.5 py-0.5">
            Strong
          </span>
          <p className="text-sm text-white/80 leading-[1.9]">
            &ldquo;We delivered on time, and the client signed a second project worth 30% more
            than the first.&rdquo;
          </p>
        </div>

        <p className="mt-14 text-base font-semibold text-white/85">
          Good: a clear, specific outcome.
        </p>
        <p className="mt-4 text-sm text-white/60 leading-[1.9]">
          If you genuinely can&apos;t put a number on it, describe a real, specific result — not
          a throwaway phrase.
        </p>
        <Comparison
          weak="It went well and everyone was happy."
          strong="The client renewed the contract and specifically asked to work with me again."
        />
        <p className="mt-6 text-sm text-white/45 leading-[1.9]">
          &ldquo;It went well&rdquo; tells the interviewer nothing. Always reach for something
          specific, and quantify whenever you can.
        </p>

        {/* Worked examples */}
        <SectionHeading>A full worked example</SectionHeading>
        <WorkedExample
          question="Tell me about a time you solved a difficult problem."
          situation="In my last role, our team's biggest project was two weeks behind deadline and the client was starting to lose confidence in us."
          task="I was responsible for getting us back on track without sacrificing the quality of the work."
          action="I broke the remaining work into clear daily targets so progress was visible. I reassigned tasks based on each person's strengths instead of how they'd been split before. I set up a five-minute daily check-in to catch blockers early. And I took on the most technical piece myself, since I was best placed to move it fast."
          result="We delivered the project on time, and the client was impressed enough to sign a second contract worth 30% more than the original."
        />
        <p className="mt-8 text-sm text-white/45 leading-[1.9]">
          Notice how it moves: quick setup, clear responsibility, four specific &ldquo;I&rdquo;
          actions, and a quantified result. The interviewer can follow every step and see exactly
          what this person brought.
        </p>

        <SectionHeading>A second example (with a mistake)</SectionHeading>
        <WorkedExample
          question="Tell me about a time you made a mistake."
          situation="As an intern at an events company, I was responsible for ordering the flowers for a high-profile client's event."
          task="I mixed up the details with another event, and the flowers were sent to the wrong venue across town. With only hours before the event, I had to fix it fast."
          action="I immediately told my manager rather than hiding it. I called both venues to confirm where the flowers were. I used my lunch break to drive across town, collect them, and deliver them to the correct venue myself."
          result="The flowers were in place an hour before guests arrived. The client never knew anything had gone wrong, and my manager trusted me with bigger responsibilities afterwards because I'd owned the mistake instead of covering it."
        />
        <p className="mt-8 text-sm text-white/45 leading-[1.9]">
          Even a story about failure becomes a strength with STAR — it shows honesty, quick
          thinking, and ownership.
        </p>

        {/* Common mistakes */}
        <SectionHeading>Common mistakes to avoid</SectionHeading>
        <ul className="space-y-6 mt-8">
          {[
            { mistake: 'Living in the Situation.', detail: 'Spending half your answer on backstory. Set the scene fast and move on.' },
            { mistake: 'Saying "we" instead of "I."', detail: 'The single most common thing that hides your real contribution. Catch yourself.' },
            { mistake: 'Vague actions.', detail: '"I handled it," "I worked hard." Say exactly what you did, step by step.' },
            { mistake: 'No result, or a throwaway result.', detail: 'Ending with "and it went well." Always finish with a specific, ideally quantified, outcome.' },
            { mistake: 'Fewer than three actions.', detail: 'One or two steps makes the answer feel thin. Aim for three or more concrete actions.' },
          ].map(({ mistake, detail }) => (
            <li key={mistake} className="flex gap-3 items-start">
              <span className="shrink-0 mt-[9px] h-1.5 w-1.5 rounded-full bg-[#F9C125]/50" />
              <p className="text-sm text-white/65 leading-[1.9]">
                <span className="font-semibold text-white/80">{mistake}</span>{' '}
                {detail}
              </p>
            </li>
          ))}
        </ul>

        {/* Checklist */}
        <SectionHeading>Your quick checklist</SectionHeading>
        <Prose>Before any behavioural answer, run through this:</Prose>
        <ul className="mt-8 space-y-5">
          {[
            'Did I set the scene in one or two sentences?',
            'Did I state clearly what I was responsible for?',
            'Did I give at least three specific steps I took?',
            'Did I use "I," not "we"?',
            'Did I end with a real result, quantified if possible?',
          ].map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span
                className="shrink-0 mt-0.5 h-4 w-4 rounded border flex items-center justify-center"
                style={{ borderColor: 'rgba(249,193,37,0.35)', backgroundColor: 'rgba(249,193,37,0.06)' }}
              >
                <span className="text-[#F9C125]/40 text-[10px]">☐</span>
              </span>
              <span className="text-sm text-white/70 leading-[1.9]">{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-white/45 leading-[1.9]">
          If you can tick all five, you have a strong answer.
        </p>

        {/* Closing */}
        <SectionHeading>The one thing to remember</SectionHeading>
        <Prose>
          Be specific, use &ldquo;I,&rdquo; and end with a real result. That structure alone will
          put you ahead of most candidates, because most people never learn it. Practise it until
          it feels natural, and it will show in every answer you give.
        </Prose>

      </div>

      <GuideFooter />
    </div>
  )
}

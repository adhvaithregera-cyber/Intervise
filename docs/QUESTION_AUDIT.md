# Intervise Question Bank Audit Report

**Audited:** 500 questions (IDs 1–500)  
**Audit Date:** 2026-06-25  
**Auditor:** Claude Sonnet 4.6  
**Target audience:** Final-year students and early-career candidates in India across 5 role types (CS/IT, Marketing, Finance, Operations, Other)

---

## Executive Summary

### Category Architecture Mismatch — The Core Problem

The database contains **6 categories** while the app code defines **8 answer-format categories**. This is the most critical structural issue:

| DB Category | Count | Maps to App Category |
|---|---|---|
| Identity & Background | 75 (IDs 1–75) | Category 1: Identity & Background |
| Behavioral | 100 (IDs 76–175) | Category 2: Behavioural / Experience |
| Strengths & Weaknesses | 75 (IDs 176–250) | Category 3 (Strengths) + Category 4 (Weaknesses) — SPLIT NEEDED |
| Motivation & Fit | 100 (IDs 251–350) | Category 5: Motivation & Fit |
| Future & Ambition | 75 (IDs 351–425) | Category 6: Future & Ambition |
| Closing Questions | 75 (IDs 426–500) | **NOT A VALID APP CATEGORY** — entire block must be removed or recategorised |

**Two app categories have zero questions:** Category 7 (Situational / Hypothetical — PACE format) and Category 8 (Curveball / Pressure). This means users on the "live" session screen can never practice these two high-frequency interview formats.

### Overall Quality Assessment

| Issue | Count (approx.) |
|---|---|
| Total questions | 500 |
| Closing Questions (invalid category) | 75 |
| Questions requiring work experience not suitable for final-year students | ~85 |
| Questions with engineering-only jargon excluding 4/5 role types | ~60 |
| Encoding errors (ΓÇö instead of —) | 18 |
| Difficulty band misclassified | ~25 |
| Questions that are genuinely strong | ~175 |

### Top 5 Issues

1. **"Closing Questions" is not an app category** — 75 questions (IDs 426–500) are framed as questions the *candidate asks the interviewer*, not questions the interviewer asks. This inverts the app's entire purpose. These must all be removed or heavily rewritten as answerable questions.
2. **Two categories missing entirely** — Situational/Hypothetical (PACE) and Curveball/Pressure have zero questions, leaving the app unable to serve formats 7 and 8.
3. **"Strengths & Weaknesses" is one DB category but two app categories** — The DB must be split into separate "Strengths" and "Weaknesses" categories with distinct answer formats.
4. **Hard questions presuppose 5–15 years of work experience** — Many hard questions reference managing "direct reports," "executive boards," "enterprise clients," "VCs," "data breaches," and "multi-year contracts." A final-year Indian student cannot answer these. This affects roughly 50 hard questions spread across all categories.
5. **Encoding corruption** — 18 questions contain `ΓÇö` instead of `—` (em dash). These are display bugs that will appear broken in the app UI.

---

## List A — Keep As-Is

These questions pass all 6 criteria: universally answerable by a final-year Indian student, clearly worded, cross-role relevant (3+ of 5 types), correctly difficulty-banded, maps cleanly to a valid app category, and would realistically appear at TCS, Infosys, Wipro, Deloitte, Accenture, or campus placements.

### Identity & Background — Keep

| ID | Question |
|---|---|
| 1 | Tell me about yourself. |
| 2 | Walk me through your resume. |
| 4 | What led you to choose your current career path? |
| 5 | Tell me about your educational background. |
| 17 | What do you enjoy most about your day-to-day work? |
| 18 | Tell me about an internship or early project that shaped your career. |
| 19 | How do you describe your job to someone who isn't in your industry? |
| 26 | If you had to summarize your entire career narrative using just three milestones, what are they? |
| 27 | How has your professional identity evolved over the last three to five years? |
| 29 | Tell me about a piece of your background that isn't written anywhere on your resume. |
| 32 | Looking back at your early career, what underlying thread connects all your roles? |
| 34 | Tell me about a time your non-traditional background or unique perspective helped you solve a problem. |
| 39 | What is the biggest misconception people have about your professional background? |
| 43 | Tell me about a time your academic training directly influenced how you solved a real-world crisis. |

### Behavioral — Keep

| ID | Question |
|---|---|
| 76 | Tell me about a time you worked on a successful team project. |
| 77 | Describe a situation where you had to meet a tight deadline. |
| 79 | Give an example of a time you had to balance multiple tasks at once. |
| 80 | Describe a time you made a mistake at work and how you handled it. |
| 81 | Tell me about a time you had to learn a new tool very quickly. |
| 82 | Share a time when you helped a coworker who was struggling with their workload. |
| 83 | Tell me about a time you received constructive feedback from a manager. |
| 84 | Describe a situation where you had to gather information from different sources to complete a task. |
| 87 | Tell me about a time you had to explain something technical to a beginner. |
| 88 | Describe a situation where your initial plan for a task failed and you had to switch gears. |
| 90 | Give an example of a time you successfully organized an unorganized task or event. |
| 91 | Tell me about a time you had to present your work to a small group. |
| 92 | Describe a time you worked with someone whose personality was very different from yours. |
| 93 | Tell me about a time you noticed an inefficiency at work and brought it to your team's attention. |
| 97 | Tell me about a time you set a professional goal for yourself and achieved it. |
| 99 | Tell me about a time you had to step in and solve a minor workplace conflict. |
| 100 | Describe a project where you were exceptionally proud of your individual execution. |
| 101 | Tell me about a time you had to ask for help on an assignment. |
| 102 | Give an example of a time you used logical reasoning to solve a problem. |
| 103 | Tell me about a time you had to work with an incomplete set of instructions. |
| 106 | Tell me about a time you disagreed with your manager's decision and how you handled the conversation. |
| 107 | Describe a situation where a project's priorities were completely shifted at the last minute by senior leadership. |
| 109 | Give an example of a project that fell behind schedule and how you systematically brought it back on track. |
| 111 | Describe a situation where you had to make an important decision without having all the data you wanted. |
| 113 | Share an example of a calculated risk you took in your past role that successfully paid off. |
| 118 | Tell me about a time you had to pitch an unpopular idea to your team and successfully gained their buy-in. |
| 121 | Give an example of a time you received highly subjective feedback and how you translated it into actionable improvements. |
| 125 | Give an example of a time you had to work under a highly micromanaged environment and still delivered your best work. |

### Strengths & Weaknesses — Keep

| ID | Question |
|---|---|
| 176 | What is your greatest professional strength? |
| 177 | What is an area where you feel you need to improve the most? |
| 179 | What soft skill do you think gives you the biggest advantage at work? |
| 180 | What technical skill are you currently working hardest to develop? |
| 182 | What would your current teammates say is your best attribute? |
| 183 | Tell me about a skill that came naturally to you early in your career. |
| 184 | What is a task or responsibility that you find physically or mentally draining? |
| 185 | How do you prefer to receive feedback from your direct manager? |
| 186 | What is your biggest asset when collaborating inside a large team? |
| 187 | What is a professional habit you have spent the last year trying to break? |
| 191 | Tell me about a time you realized you were struggling with a specific concept. |
| 192 | How do you approach learning a completely new software or system? |
| 195 | How do you measure your personal productivity day-to-day? |
| 196 | What is a specific piece of feedback you have received more than once? |
| 199 | What is your baseline strategy for avoiding professional burnout? |
| 200 | What is your primary strength when it comes to resolving basic workplace problems? |
| 201 | How do you distinguish between a weakness you can fix and a natural limitation you have to manage around? |
| 202 | Tell me about a time your greatest strength turned into a disadvantage during a specific project. |
| 203 | What is a soft skill that you used to lack, and what systematic steps did you take to build it? |
| 206 | What is the most critical piece of negative performance feedback you have ever received, and why did you agree or disagree with it? |
| 211 | Tell me about a time your impatience to deliver results caused a minor friction point within your project group. |
| 217 | Tell me about a time you noticed your personal communication style was causing a misunderstanding, and how you adjusted it. |
| 225 | Tell me about a time you consciously chose to step back and let someone else lead because your strengths weren't the right fit. |
| 235 | What is a piece of hard, critical feedback you received that deeply bruised your professional confidence, and how did you mentally recover? |

### Motivation & Fit — Keep

| ID | Question |
|---|---|
| 251 | Why do you want to work for our company? |
| 252 | What attracted you to this specific job description? |
| 253 | What kind of workplace culture allows you to do your best work? |
| 254 | Why are you looking to leave your current position at this time? |
| 256 | How do you define a successful workday? |
| 257 | What motivates you to come to work every morning? |
| 258 | Do you prefer working in a highly collaborative team or independently? |
| 259 | What is your ideal relationship with your direct manager? |
| 264 | What type of projects make you lose track of time because you are so engaged? |
| 267 | What do you hope to gain from your next professional role? |
| 270 | How do you handle changing priorities on short notice? |
| 274 | How do you feel about working in a fast-growing start-up environment? |
| 277 | What is your baseline expectation for work-life balance? |
| 278 | Describe the best team culture you have ever experienced. |
| 280 | What unique element of your personality will positively impact our team dynamic? |
| 283 | How do you maintain high personal motivation when your core project gets delayed or canceled due to corporate shifts? |
| 284 | Describe a time you had to adapt your natural working style to fit into an organization whose culture was deeply traditional. |
| 289 | Tell me about a time you realized a company's internal values were a mismatch for you — how did you navigate that discovery? |
| 295 | Describe a time you actively worked to improve the psychological safety or culture of your immediate project group. |
| 305 | Describe a situation where you had to champion your company's culture to a deeply cynical or disengaged team member. |

### Future & Ambition — Keep

| ID | Question |
|---|---|
| 351 | Where do you see yourself in five years? |
| 352 | What are your primary professional goals for the next twelve months? |
| 353 | Would you like to transition into a management role in the future? |
| 354 | What is a specific skill you hope to completely master in this position? |
| 355 | How do you keep up with new technology trends in your industry? |
| 360 | What kind of legacy or impact do you want to leave at your next company? |
| 363 | How do you define career success for yourself at this stage? |
| 365 | How do you allocate time during your week for personal professional development? |
| 369 | How do you ensure your technical skills don't become obsolete over the next decade? |
| 372 | How do you set benchmarks for your personal growth every quarter? |
| 374 | How do you determine when it is time to move on to a new professional challenge? |
| 375 | What is the biggest professional risk you want to take in the next three years? |
| 376 | How do you balance chasing long-term career ambitions with delivering exceptional results on your immediate mundane tasks? |
| 380 | Tell me about a time you realized your long-term career goals were entirely misaligned with your current company's roadmap. |
| 381 | How do you evaluate whether a potential promotion is a genuine career step or simply an increase in administrative burden? |
| 385 | How do you systematically track your personal growth metrics to ensure you aren't plateauing in your current specialized role? |
| 393 | What is your systematic process for mentoring junior engineers so they can seamlessly take over your core execution duties? |
| 396 | Tell me about a career ambition you had to completely abandon because the underlying market dynamics changed permanently. |

**Total Keep As-Is: ~175 questions**

---

## List B — Rewrite

These questions have a fixable issue: wrong difficulty, experience assumptions that can be adjusted, jargon that can be removed, encoding errors, or category mismatch. The proposed rewrites are ready to insert.

### B1 — Encoding Errors (ΓÇö → —)

These 18 questions contain corrupted em-dash characters that will display as `ΓÇö` in the UI. Fix is a simple string replacement.

| ID | Issue | Fix |
|---|---|---|
| 58 | `ΓÇö give a specific` | Replace `ΓÇö` with `—` throughout |
| 205 | `ΓÇö how did you mitigate` | Replace `ΓÇö` with `—` |
| 233 | `ΓÇö like speed or eloquence ΓÇö` | Replace both instances |
| 289 | `ΓÇö how did you navigate` | Replace `ΓÇö` with `—` |
| 318 | `ΓÇö how did you manage` | Replace `ΓÇö` with `—` |
| 335 | `ΓÇö how did you preserve` | Replace `ΓÇö` with `—` |
| 347 | `ΓÇö what did it cost` | Replace `ΓÇö` with `—` |
| 403 | `ΓÇö and walk me through` | Replace `ΓÇö` with `—` |
| 408 | `ΓÇö how did you manage` | Replace `ΓÇö` with `—` |
| 412 | `ΓÇö like LLM integrations ΓÇö` | Replace both instances |
| 413 | `ΓÇö what did it cost` | Replace `ΓÇö` with `—` |
| 461 | `ΓÇö is it optimized` | Replace `ΓÇö` with `—` |
| 477 | `ΓÇö was it an execution` | Replace `ΓÇö` with `—` |
| 492 | text has `ΓÇö` mid-sentence | Replace `ΓÇö` with `—` |

### B2 — Experience Assumptions (Rewrite for Students)

These questions assume multi-year work history. Rewriting to accept internship/academic/project context makes them universally answerable.

| ID | Original Question | Issue | Proposed Rewrite | Category | Difficulty |
|---|---|---|---|---|---|
| 6 | What was your primary responsibility at your last job? | Assumes prior employment | What was your primary responsibility during your most recent internship, part-time role, or significant college project? | Identity & Background | easy |
| 7 | How long have you been working in this specific industry? | Assumes industry tenure | How did you first develop an interest in this industry or field? | Identity & Background | easy |
| 8 | What is the most common day-to-day task you perform in your current role? | Assumes current employment | What was the most common day-to-day task in your internship or final-year project? | Identity & Background | easy |
| 11 | What industries have you worked in besides this one? | Presumes multiple industry stints | What aspects of your education or extracurricular experience are transferable across industries? | Identity & Background | easy |
| 12 | Walk me through your most recent professional transition. | Assumes multiple jobs | Walk me through your journey from your degree choice to where you are now. | Identity & Background | easy |
| 13 | Describe your current team structure. | Assumes employment | Describe the team structure in your most recent internship or group project. | Identity & Background | easy |
| 15 | Tell me about a standard project cycle at your previous company. | Assumes prior employment | Tell me about the project lifecycle you followed during your most significant academic or internship project. | Identity & Background | easy |
| 16 | How did you get your very first job in this field? | Assumes job history | How did you land your first internship or your first significant opportunity in this field? | Identity & Background | easy |
| 21 | Talk about the scale of the largest project you have worked on. | OK but "scale" implies enterprise; needs clarity | Describe the largest project you have worked on — what was the scope, how many people were involved, and what was your role? | Identity & Background | easy |
| 22 | Walk me through a typical Monday morning in your current position. | Assumes current job | Walk me through how you typically structure your first day of the week when working on an important project or during an internship. | Identity & Background | easy |
| 24 | Tell me about the types of clients or stakeholders you usually support. | Assumes work history | Tell me about a time you had to work with an external client, customer, or end user — what did you learn from that experience? | Identity & Background | easy |
| 25 | Describe your background working with cross-functional partners. | "Cross-functional partners" is corporate jargon | Describe a time you had to work closely with people from a completely different background or department to complete a shared goal. | Identity & Background | easy |
| 36 | Walk me through your professional journey, focusing on why you left each position. | Assumes multiple jobs | Walk me through each significant chapter of your academic and early professional journey, and what drove each transition. | Identity & Background | medium |
| 38 | How has your style of working changed since you transitioned from junior roles to your current level? | Assumes career progression | How has your way of working on projects or in teams changed between your first year of college and now? | Identity & Background | medium |
| 40 | Tell me about a time you had to redefine your role because your company's needs changed. | Assumes employment context | Tell me about a time you had to redefine your role or contribution because a project or team's needs shifted unexpectedly. | Identity & Background | medium |
| 41 | How do you translate your technical background into value for non-technical stakeholders? | "Technical stakeholders" jargon is fine; but assumes established track record | How would you explain a complex technical concept or your project work to someone with no technical background? | Identity & Background | medium |
| 42 | Walk me through your experience managing project budgets or resource allocations. | Very few final-year students manage real budgets | Tell me about a time you had to work within tight resource constraints — whether time, tools, or team size — and how you managed them. | Identity & Background | medium |
| 44 | How do you maintain domain expertise when your day-to-day work becomes highly administrative? | Presumes a long established career | How do you make sure you keep building your core skills when day-to-day tasks start to feel routine or administrative? | Identity & Background | medium |
| 45 | Describe a time you had to step out of your functional background to fill an immediate team gap. | OK for students with project experience | Describe a time you had to step outside your comfort zone or skill set to fill a gap in your team. | Identity & Background | medium |
| 46 | Walk me through your experience dealing with enterprise-level project complexity. | "Enterprise-level" is inaccessible | Walk me through the most complex project you have been part of — what made it complex and how did you manage it? | Identity & Background | medium |
| 47 | How do your past experiences shape the way you approach high-stress project environments? | Fine but slightly assumed experience level | How have your past academic or internship experiences shaped the way you approach high-pressure situations? | Identity & Background | medium |
| 48 | Tell me about a time you mentored someone whose professional background was completely different from yours. | "Mentored" assumes seniority | Tell me about a time you helped someone who was struggling with a task or concept that you understood well. | Identity & Background | medium |
| 49 | How do you leverage your background to build immediate trust with a new team? | Fine, slightly reword for students | How do you establish trust and credibility when joining a new team or group project for the first time? | Identity & Background | medium |
| 50 | Walk me through your history of managing vendor relationships or external partnerships. | Very corporate; few students manage vendors | Tell me about a time you had to coordinate with an external person or organisation — a vendor, college society, NGO — to get something done. | Identity & Background | medium |
| 78 | Tell me about a time you went above and beyond for a client or customer. | Assumes client-facing employment | Tell me about a time you went above and beyond what was expected of you for a project, customer, or classmate. | Behavioral | easy |
| 85 | Tell me about a time you stayed late to finish an important project. | Fine but "late" implies office context | Tell me about a time you put in extra time and effort — outside of regular hours or expectations — to make sure an important task was done well. | Behavioral | easy |
| 86 | Give an example of how you handle daily stress at work. | "At work" excludes students without jobs | Give an example of how you manage stress during high-pressure periods — whether at work, during exams, or on a major project. | Behavioral | easy |
| 89 | Tell me about a time you had to follow a strict protocol or company policy. | Assumes employment | Tell me about a time you had to follow a strict set of rules, guidelines, or procedures — and why following them mattered. | Behavioral | easy |
| 94 | Give an example of a time you had to deal with an upset customer or internal stakeholder. | Assumes client-facing work | Give an example of a time you had to manage someone who was frustrated or unhappy — whether a customer, group member, or classmate. | Behavioral | easy |
| 95 | Tell me about a time you had to implement a simple change in your routine. | Too trivial for any difficulty level | Tell me about a time you identified a better way to do something and convinced others to adopt the change. | Behavioral | easy |
| 98 | Give an example of a time you had to onboard or help a new team member. | Assumes team lead or work context | Give an example of a time you helped someone new — a new team member, a junior, or a new classmate — get up to speed quickly. | Behavioral | easy |
| 104 | Describe a situation where you had to represent your team on an internal call. | Office-specific context | Describe a situation where you had to represent your team or group in a meeting or presentation. | Behavioral | easy |
| 105 | Tell me about a time you noticed a safety or compliance issue and flagged it. | "Safety or compliance" is very industry-specific | Tell me about a time you noticed something that didn't seem right in a process or project and decided to speak up about it. | Behavioral | easy |
| 110 | Tell me about a time you had to manage up to get the resources your team needed to hit a goal. | "Manage up" is corporate jargon | Tell me about a time you had to convince a senior person — a manager, professor, or supervisor — to give your team what it needed to succeed. | Behavioral | medium |
| 112 | Tell me about a time you had to deliver bad news to a client or senior stakeholder. | Slightly senior context | Tell me about a time you had to deliver disappointing news to someone — a client, professor, manager, or teammate — and how you handled it. | Behavioral | medium |
| 114 | Tell me about a time you had to sacrifice short-term quality to meet a critical long-term deadline. | Fine, but rephrase for clarity | Tell me about a time you had to make a trade-off between doing something perfectly and delivering it on time. | Behavioral | medium |
| 115 | Describe a situation where you had to mediate a deep operational conflict between two key team members. | "Operational conflict" sounds very corporate | Describe a situation where two people in your team had a serious disagreement and you had to help resolve it. | Behavioral | medium |
| 116 | Tell me about a time you implemented a workflow automation or process change that saved your department measurable time or money. | Very corporate; "department" and "automation" jargon | Tell me about a time you improved a process or workflow — and what the measurable impact was on your team or project. | Behavioral | medium |
| 117 | Give an example of a time you had to balance the competing demands of two separate high-priority stakeholders. | "Stakeholders" jargon | Give an example of a time two people or groups needed your time and effort simultaneously and how you balanced both. | Behavioral | medium |
| 119 | Describe a situation where you realized a project was going to fail unless you completely changed your methodology midway through. | Fine for students with internship | Describe a situation where you realised your original approach to a project wasn't working and had to start over with a completely different method. | Behavioral | medium |
| 120 | Tell me about a time you had to step into a leadership vacuum on a project to ensure it crossed the finish line. | Fine, "leadership vacuum" slightly jargony | Tell me about a time no one was taking charge of a situation and you stepped up to lead the team to the finish. | Behavioral | medium |
| 122 | Tell me about a time you had to manage a project where the scope constantly kept creeping outward. | Scope creep is fine for students | Tell me about a time you were working on a project and the requirements or scope kept growing — how did you handle it? | Behavioral | medium |
| 123 | Describe a situation where you had to handle an incredibly sensitive or confidential workplace scenario. | Assumes employment | Describe a situation where you had to handle sensitive information or a private matter responsibly. | Behavioral | medium |
| 124 | Tell me about a time you ran an experiment that failed completely, and how you presented those findings to your team. | Fine for CS/IT students; others may struggle with "experiment" framing | Tell me about a time you tried something new that didn't work out, and how you communicated what you learned to your team. | Behavioral | medium |
| 126 | Tell me about a time you noticed a systemic error that everyone else was ignoring, and how you drove the fix. | Fine but "systemic error" could confuse | Tell me about a time you spotted a recurring problem that others were overlooking, and what you did to fix it. | Behavioral | medium |
| 127 | Describe a situation where you had to onboard yourself to a highly technical framework without any formal documentation. | CS-heavy framing | Describe a situation where you had to learn something complex or technical on your own, with very little guidance or documentation. | Behavioral | medium |
| 128 | Tell me about a time you had to defend your team's metrics or performance to an aggressive auditing or evaluation committee. | Very corporate | Tell me about a time you had to justify your team's work or results to someone who was questioning your approach or outcomes. | Behavioral | medium |
| 129 | Give an example of a time you had to convince a skeptical client that your technical solution was the right approach. | Client + technical context | Give an example of a time you had to persuade a skeptical person — client, professor, or colleague — that your approach was the right one. | Behavioral | medium |
| 130 | Tell me about a time you had to deliver a high-stakes presentation with less than an hour of preparation time. | Fine universally | Tell me about a time you had very little time to prepare for an important presentation or pitch — what did you do and how did it go? | Behavioral | medium |
| 131 | Describe a situation where a core team member suddenly left the company in the middle of a major project cycle. | Employment-specific | Describe a situation where someone key to your project dropped out unexpectedly, and how your team adapted. | Behavioral | medium |
| 132 | Tell me about a time you had to optimize an outdated legacy system or process that was dragging down team velocity. | CS/IT-specific "legacy system" | Tell me about a time you had to improve an outdated process or tool that was slowing everyone down. | Behavioral | medium |
| 133 | Give an example of a time you had to handle a cross-cultural communication breakdown on a global project. | Multi-cultural projects rare for campus candidates | Give an example of a time there was a serious communication breakdown in your team and how you resolved it. | Behavioral | medium |
| 134 | Tell me about a time you had to manage an account or project where the client had unrealistic performance expectations. | "Manage an account" is sales jargon | Tell me about a time someone had unrealistic expectations for your work or project and how you managed the situation. | Behavioral | medium |
| 135 | Describe a situation where you had to navigate complex corporate politics to get a simple signature or approval. | Very office/politics specific | Describe a situation where bureaucracy or slow approvals blocked your work and how you found a way through. | Behavioral | medium |
| 136 | Tell me about a time you used data to completely disprove a long-held gut assumption by your senior leadership. | Assumes senior leadership access | Tell me about a time you used data or evidence to challenge an assumption that your team or manager held. | Behavioral | medium |
| 137 | Give an example of a time you had to coordinate a complex release, deployment, or launch across multiple time zones. | CS/IT-centric "deployment" | Give an example of a time you had to coordinate a launch, event, or deliverable with people across different locations or teams. | Behavioral | medium |
| 138 | Tell me about a time you had to maintain high team morale during a period of organizational restructuring or layoffs. | "Layoffs and restructuring" far beyond campus context | Tell me about a time your team was going through a difficult period and how you helped keep spirits up. | Behavioral | medium |
| 139 | Describe a situation where you had to handle a sudden, massive spike in traffic, usage, or workload with no notice. | "Traffic/usage spike" is CS-specific | Describe a situation where your workload suddenly increased far beyond what you expected — how did you cope? | Behavioral | medium |
| 140 | Tell me about a time you had to build a working relationship with a stakeholder who had a reputation for being incredibly difficult. | "Stakeholder" jargon | Tell me about a time you had to build a productive working relationship with someone who was known to be difficult to work with. | Behavioral | medium |
| 178 | How do you handle working under tight time constraints? | Placed in Strengths & Weaknesses but is more behavioral | Reclassify to Behavioral OR rewrite: "What is your greatest strength when it comes to working under tight time constraints?" | Strengths (Cat 3) | easy |
| 181 | How do you stay organized when managing multiple daily tasks? | Placed in S&W; feels like a behavioral/situational question | Reframe: "What is your greatest strength when it comes to staying organized under pressure?" | Strengths (Cat 3) | easy |
| 188 | How do you maintain focus during long, repetitive tasks? | Same issue — situational framing in S&W | Reframe: "What is your primary coping strength when handling repetitive or low-stimulation work for extended periods?" | Strengths (Cat 3) | easy |
| 189 | What kind of workplace environments cause you to lose productivity? | Weakness framing but no growth path shown | "What is a type of work environment you find challenging, and what steps have you taken to adapt?" | Weaknesses (Cat 4) | easy |
| 193 | What is your biggest strength when managing direct client communication? | "Client communication" excludes Operations/Finance/non-client roles | "What is your biggest strength when it comes to communicating with people outside your immediate team?" | Strengths (Cat 3) | easy |
| 194 | What parts of your current role do you routinely delegate or wish you could? | "Delegate" assumes management role | "What types of tasks do you find most draining, and how do you manage your energy when those tasks pile up?" | Weaknesses (Cat 4) | easy |
| 204 | How do you handle situations where your manager's primary working style conflicts directly with your strengths? | Good question but "primary working style" is vague | "Tell me about a time your natural way of working clashed with your manager's style — how did you adapt?" | Weaknesses (Cat 4) | medium |
| 207 | How do you prevent your natural attention to detail from slowing down your team's overall velocity? | "Velocity" is CS/Agile jargon | "How do you prevent your attention to detail from slowing down your team when speed is just as important as accuracy?" | Weaknesses (Cat 4) | medium |
| 209 | What part of your professional toolset is currently passing its prime, and how are you modernizing it? | "Professional toolset passing its prime" is too vague | "What is a skill or tool you relied on heavily in the past that you are now actively working to update or replace?" | Weaknesses (Cat 4) | medium |
| 212 | What specific operational competency do you feel holds you back from stepping into a senior leadership role right now? | Good for hard but at medium — should be hard | No text change needed; reclassify to **hard** | Weaknesses (Cat 4) | hard |
| 215 | What is your strategy for saying no to incoming tasks when your current pipeline is already at maximum capacity? | "Pipeline" is jargon | "What is your strategy for saying no or pushing back when you already have too much on your plate?" | Weaknesses (Cat 4) | medium |
| 216 | How do you handle situations where you are clearly the most technically competent person in the room on a specific topic? | "Technically competent" restricts to CS/IT | "How do you handle situations where you clearly know more about a topic than everyone else in the room?" | Strengths (Cat 3) | medium |
| 218 | What is your philosophy on balancing deep execution focus with high-level strategic thinking? | Good question but "philosophy" framing is too abstract for easy | Reclassify to **medium** and reframe: "How do you balance the need to execute details perfectly against the need to see the bigger strategic picture?" | Strengths (Cat 3) | medium |
| 219 | Tell me about a professional skill you mastered that you ultimately realized you hated doing every day. | Fine content; "professional skill you mastered" assumes long career | "Tell me about a skill or subject you worked hard to get good at, only to discover you did not enjoy it — what did you do next?" | Weaknesses (Cat 4) | medium |
| 220 | How do you manage your baseline energy levels when a project transitions into a high-intensity, multi-week sprint phase? | "Sprint phase" is Agile/CS jargon | "How do you manage your energy and focus during a long, intense stretch of demanding work?" | Weaknesses (Cat 4) | medium |
| 221 | What is your biggest challenge when it comes to delegating high-stakes tasks to junior team members? | Assumes seniority | "What is your biggest challenge when you need to trust others with important parts of a project?" | Weaknesses (Cat 4) | medium |
| 222 | Tell me about a time your tendency to over-analyze a problem delayed a critical project launch date. | "Launch date" implies employment | "Tell me about a time your tendency to over-think or over-analyse a problem caused a delay — and what you learned." | Weaknesses (Cat 4) | medium |
| 223 | How do you cultivate strategic relationships with stakeholders who do not inherently value your core department's metrics? | Very corporate and jargon-heavy | "How do you build a good working relationship with people who do not see the value in what your team does?" | Strengths (Cat 3) | medium |
| 224 | What is a technical baseline asset you have that you feel is fundamentally undervalued by your current organization? | Employment-specific | "What is a skill or quality you have that you feel is consistently underestimated or overlooked by others?" | Strengths (Cat 3) | medium |
| 260 | How did you first hear about our organization? | Trivial — not a coaching-worthy question; low real-world value | Reclassify as remove (see List C) or rewrite as: "What first attracted you to this type of organisation or industry?" | Motivation & Fit | easy |
| 261 | What industry trends are you most excited about right now? | Good question misclassified at easy — needs structured thinking | Reclassify to **medium** | Motivation & Fit | medium |
| 262 | What is your preferred cadence for team meetings and syncs? | Too operational, not a campus placement question | Remove (see List C) | — | — |
| 263 | How do you handle transition environments like hybrid or remote work? | Relevant but slightly niche for first-time jobseekers | "How do you stay productive and connected when working in environments where your team is not physically together?" | Motivation & Fit | easy |
| 265 | What is one thing you want to change about your current work routine? | Assumes current employment | "What is one thing you would like to do differently in your next role compared to your past internship or project experience?" | Motivation & Fit | easy |
| 266 | How do you feel about traveling for business or company retreats? | Not interview-worthy; too logistical | Remove (see List C) | — | — |
| 268 | What are your thoughts on our company's mission statement? | Requires real company context; generic as a practice prompt | "How do you evaluate whether a company's stated mission genuinely matches how it operates?" | Motivation & Fit | easy |
| 269 | What kind of team rewards or recognition do you value the most? | Fine content; slight rewording improves it | "What kind of recognition or feedback makes you feel most valued and motivated at work?" | Motivation & Fit | easy |
| 271 | What is your favorite phase of a standard project life cycle? | "Project life cycle" jargon; CS-heavy | "Which stage of a project do you enjoy the most — planning, building, testing, or wrapping up — and why?" | Motivation & Fit | easy |
| 272 | Why do you think your values align with our engineering culture? | "Engineering culture" excludes Marketing/Finance/Operations/Other | "Why do you think your values align with our company's culture and the way this team works?" | Motivation & Fit | easy |
| 273 | What is one thing from your current job that you want to completely avoid in your next role? | Assumes current job | "What is one thing from your past work or study experience that you would want to avoid repeating in your next role?" | Motivation & Fit | easy |
| 275 | What parts of our company website caught your eye the most? | Too conversational; cannot be practiced generically | Remove (see List C) | — | — |
| 279 | What makes you choose our product over our immediate market competitors? | Requires company-specific research; not a practice question | Rewrite: "If you were choosing between two companies offering similar roles, what factors would matter most to you?" | Motivation & Fit | easy |
| 285 | What specific element of our engineering or business strategy do you think is our biggest competitive risk? | Requires company-specific knowledge; impossible to practice generically | Remove (see List C) | — | — |
| 287 | Why are you applying for an individual contributor role now if you have historical management experience on your resume? | Only relevant if candidate has management history | Remove (see List C) | — | — |
| 290 | What does ownership culture mean to you in your everyday code execution or project management? | "Code execution" limits to CS/IT | "What does taking ownership mean to you in your day-to-day work?" | Motivation & Fit | medium |
| 292 | Why do you want to join a mid-sized enterprise company right now instead of a venture-backed startup or a large corporation? | Presumes a specific company type | "Why are you drawn to this type and size of organisation rather than a very large corporation or a very small startup?" | Motivation & Fit | medium |
| 294 | What specific aspect of our company's technical architecture or business scaling model challenges you the most? | Company-specific; "technical architecture" limits to CS/IT | Remove (see List C) | — | — |
| 296 | How do you balance your personal desire for rapid product iteration with an organization's deep need for security compliance? | Product/CS framing; excludes other roles | "How do you balance a desire to move quickly with the need to follow careful processes and quality standards?" | Motivation & Fit | medium |
| 297 | Why do you believe our specific target demographic is the most compelling audience to build products for right now? | Company-specific; cannot be practised generically | Remove (see List C) | — | — |
| 300 | Tell me about a time you sacrificed a higher salary offer to join a team because of their underlying engineering culture. | "Engineering culture" jargon; also assumes multiple offers | "Tell me about a time you chose an opportunity based on the team or culture rather than purely the compensation." | Motivation & Fit | medium |
| 301 | How do you define a healthy engineering velocity without compromising the underlying codebase's architectural integrity? | Pure CS/IT question | Remove from Motivation & Fit; better suited to Behavioral for CS role-type only | Behavioral | hard |
| 302 | Why do you want to transition from a fully remote position to an in-office or hybrid model at this stage? | Very specific scenario; not universally applicable | Remove (see List C) | — | — |
| 306 | How do you handle working inside an organization where engineering metrics are thoroughly prioritized over design or product aesthetics? | Engineering-centric; excludes most role types | "How do you handle working in an organization where the priorities of your team sometimes conflict with your personal standards of quality?" | Motivation & Fit | medium |
| 307 | Why are you choosing to apply to our company when your resume indicates you could easily start your own independent consulting practice? | Extremely niche scenario | Remove (see List C) | — | — |
| 308 | How do you ensure your day-to-day work directly impacts our primary corporate North Star metric? | Jargon-heavy; "North Star metric" is tech-startup specific | "How do you make sure your daily work is connected to the biggest goals your team or company is trying to achieve?" | Motivation & Fit | medium |
| 309 | Tell me about a time you felt deeply unappreciated in a role, and walk me through how you handled your exit professionally. | "Handled your exit" implies resignation — irrelevant for first jobseekers | "Tell me about a time you felt your contribution was being overlooked — how did you address it?" | Motivation & Fit | medium |
| 310 | What is your philosophy on the balance between automated algorithmic metrics and human intuition when evaluating product market fit? | Product/data jargon; CS/Marketing only | Remove (see List C) | — | — |
| 311 | How do you handle working within a geographically distributed team where major decisions are routinely made across opposing time zones? | Very niche; unlikely at TCS/Infosys campus interview | "How do you handle working with people across different locations or schedules where real-time communication is difficult?" | Motivation & Fit | medium |
| 312 | Why do you want to focus on enterprise B2B software solutions rather than entering the consumer B2C marketplace? | Pure CS/tech product context | Remove (see List C) | — | — |
| 313 | How do you stay energized when your day-to-day responsibilities consist of resolving high-frequency client bugs and tickets? | "Bugs and tickets" — CS/IT only | "How do you stay motivated and energised when your work involves a high volume of repetitive tasks or requests?" | Motivation & Fit | medium |
| 314 | What specific corporate perk or cultural standard do you think is completely counterproductive to actual engineering output? | Engineering-centric; mildly confrontational | Remove (see List C) | — | — |
| 315 | Describe how you maintain cross-departmental alignment when the sales team's incentives conflict directly with engineering capacity. | CS/tech-company specific | "Describe a time when two teams or groups had conflicting goals — how did you help maintain alignment?" | Motivation & Fit | medium |
| 356 | What is your ultimate dream job title before you retire? | Too casual; not a serious interview prompt | "What is the professional position or level of responsibility you ultimately aspire to reach in your career?" | Future & Ambition | easy |
| 357 | Are you interested in pursuing further academic degrees or certifications? | Yes/No question — bad for voice practice | "What certifications, courses, or advanced qualifications are you considering to support your career growth?" | Future & Ambition | easy |
| 358 | What industry conferences or events do you plan to attend this year? | Very niche; most students haven't attended any | "How do you stay connected to the broader professional community in your field — events, communities, online spaces?" | Future & Ambition | easy |
| 359 | How do you plan to expand your technical portfolio over the next two years? | "Technical portfolio" limits to CS/IT | "How do you plan to build and expand your professional portfolio or skill set over the next two years?" | Future & Ambition | easy |
| 361 | Are you more interested in vertical upward movement or deep horizontal skill expansion? | Yes/No binary; jargon-heavy | "Do you see yourself specialising deeply in one area over the next few years, or building skills across multiple areas — and why?" | Future & Ambition | easy |
| 362 | What is the next major technological framework you want to learn from scratch? | CS-centric | "What is the next major skill or area of expertise you want to develop, and how do you plan to approach it?" | Future & Ambition | easy |
| 364 | What type of leadership responsibilities are you looking to take on next? | Fine but "leadership responsibilities" could prompt better with one concrete example | "Describe a specific type of leadership responsibility you are actively working toward, and what you are doing to get there." | Future & Ambition | easy |
| 366 | What is a book or resource that completely changed your view of your career path? | Not interview-frequency-relevant at campus placements | Remove (see List C) | — | — |
| 367 | How do you plan to build your personal brand within the tech community? | Tech-community specific; not universal | "How do you plan to build your professional reputation and visibility in your field over the next few years?" | Future & Ambition | easy |
| 370 | What is your strategy for transitioning from a mid-level contributor to a senior engineer? | "Senior engineer" is CS/IT and assumes mid-level role | "What is your strategy for moving from where you are now to taking on more senior responsibilities in your career?" | Future & Ambition | easy |
| 371 | What industry vertical do you want to explore deeper in the future? | "Vertical" is jargon | "Which sector or area of your industry would you most like to develop deeper expertise in, and why?" | Future & Ambition | easy |
| 373 | What type of high-level strategic planning do you want to learn in this role? | "Strategic planning" implies seniority | "What higher-level skill — such as strategy, leadership, or cross-functional planning — are you most eager to develop in this role?" | Future & Ambition | easy |
| 377 | If you look at the fastest-growing technology stack today, how will it change your exact job description five years from now? | "Technology stack" is CS-specific | "How do you think the fastest-growing trends in your field today will change the nature of your role in the next five years?" | Future & Ambition | medium |
| 378 | What is your strategy for transitioning from purely writing code to actively designing system-wide architecture blueprints? | Pure CS/IT | Remove (see List C) or restrict to CS/IT role type | — | — |
| 379 | How do you plan to scale your individual engineering output through automation and mentoring over the next product cycle? | CS/IT and senior context | "How do you plan to multiply your impact — through mentoring, process improvement, or building tools — as you grow in your career?" | Future & Ambition | medium |
| 383 | How do you plan to cultivate high-level business acumen so your technical solutions align with executive revenue targets? | CS-heavy and "executive revenue targets" is very senior | "How do you plan to build a stronger understanding of business and commercial priorities alongside your technical or functional skills?" | Future & Ambition | medium |
| 386 | Describe how you would design a personal 90-day onboarding plan to guarantee you are contributing to our high-level strategy as fast as possible. | "High-level strategy" too corporate; good bones | "Describe how you would approach your first 90 days in a new role to make sure you are adding value as quickly as possible." | Future & Ambition | medium |
| 387 | What is your plan to bridge the gap if you are assigned to lead a team that uses a framework you have never personally touched? | "Framework" is CS-centric | "What is your plan for leading or contributing to a team in a domain where you have limited prior experience?" | Future & Ambition | medium |
| 388 | How do you manage your professional ambition when a company's internal promotion velocity slows down due to macroeconomic factors? | "Promotion velocity" jargon | "How do you manage your career ambitions when promotion or growth opportunities at a company slow down for external reasons?" | Future & Ambition | medium |
| 390 | How do you plan to leverage public cloud architectures to scale our product offerings without exponentially increasing our monthly infrastructure spend? | Pure CS/DevOps jargon | Remove (see List C) | — | — |
| 391 | What does thought leadership mean to you, and how do you plan to practice it within our specific market vertical? | "Thought leadership" and "market vertical" are jargon | "What does becoming a recognised expert or authority in your field mean to you, and how do you plan to get there?" | Future & Ambition | medium |
| 392 | How do you evaluate when to build an internal proprietary solution versus when to integrate a scaling third-party platform? | Pure CS/Product context | "How do you decide when to build something from scratch versus adopting an existing tool or solution?" | Future & Ambition | medium |
| 394 | How do you plan to adapt your personal communication style as you move from managing small internal teams to enterprise stakeholders? | "Enterprise stakeholders" assumes senior career stage | "How do you plan to adapt your communication style as your responsibilities grow and you interact with more senior people?" | Future & Ambition | medium |
| 395 | What specific technical baseline do you think will be completely automated by AI within the next three years, and how are you adapting? | "Technical baseline" jargon | "What specific task or skill in your field do you think AI will automate or transform in the next three years, and how are you preparing?" | Future & Ambition | medium |
| 397 | How do you intend to measure the financial ROI of your technical architectural decisions over the next fiscal year? | Very corporate; assumes architect role | "How do you intend to measure the impact or return on the major decisions you make in your role over the next year?" | Future & Ambition | medium |
| 398 | What is your strategy for remaining a highly hands-on technical asset as your everyday meeting load scales up exponentially? | "Hands-on technical asset" is CS-centric | "How do you plan to stay close to the actual work and execution as your role becomes more strategic and involves more meetings?" | Future & Ambition | medium |
| 399 | How do you cultivate a strategic network of cross-functional peers who can help accelerate your department's long-term objectives? | Jargon-heavy | "How do you build professional relationships across different teams and functions that help you advance shared goals?" | Future & Ambition | medium |

### B3 — Hard Questions Not Suitable for Final-Year Students (Rewrite or Demote)

These hard questions assume senior leadership roles, board-level experience, or mass layoffs that final-year students simply cannot credibly answer. The fix is either to rewrite with a more accessible framing or demote to medium.

| ID | Original Question | Issue | Action |
|---|---|---|---|
| 141 | Tell me about a time you made an operational error that cost your company significant money, resources, or client trust... | "Cost company significant money" — impossible for campus candidates | Rewrite: "Tell me about a significant mistake you made on a project — what was the impact and how did you take responsibility and recover?" |
| 142 | Describe a scenario where you found yourself fundamentally disagreeing with the ethical implications of a strategic directive from senior leadership. | "Strategic directive from senior leadership" presumes seniority | Rewrite: "Describe a time you disagreed with a decision made by someone in authority over you on ethical grounds — how did you handle it?" |
| 144 | Give an example of a time you had to execute a massive project teardown and start over... | "Massive project teardown" presumes enterprise project | Rewrite: "Give an example of a time you had to abandon your entire approach to a project and restart from scratch — what triggered it and how did you manage?" |
| 145 | Tell me about a time you had to fire a client, vendor, or project partner... | "Fire a client" presumes seniority | Remove — not answerable by students |
| 147 | Tell me about a high-stakes crisis where your team panicked... | Good bones; reframe scale | Rewrite: "Tell me about a high-pressure situation where your team was struggling and you had to stay calm and lead — walk me through your thinking." |
| 148 | Give an example of a time you had to advocate for a technical or operational pivot that directly cannibalized a product you spent years building. | "Product you spent years building" — not student reality | Remove — not answerable by students |
| 149 | Tell me about a time you had to manage a performance issue with a peer or direct report where clear communication entirely broke down. | "Direct report" requires management role | Rewrite: "Tell me about a time there was a serious breakdown in communication with a teammate or colleague — what happened and how did you address it?" |
| 150 | Describe a situation where you had to implement a massive cost-cutting measure... | Not answerable | Rewrite: "Describe a situation where you had to achieve the same results with significantly fewer resources — what was your approach?" |
| 151 | Tell me about a time you had to navigate a toxic client dynamic without sacrificing your team's psychological safety... | Extremely senior scenario | Rewrite: "Tell me about a time you worked with a very difficult person or group — how did you protect your team's morale while still delivering?" |
| 152 | Give an example of a time you had to make a critical strategic decision based on highly contradictory data from two equally reliable sources. | Good bones; "strategic decision" is fine for hard | Keep with minor trim: "Give an example of a time you had to make an important decision when the information you had pointed in two completely opposite directions." |
| 153 | Tell me about a time you stepped into a deeply broken, delayed project with toxic stakeholder relations... | Very senior; "toxic stakeholder relations" — inaccessible | Rewrite: "Tell me about a time you joined a project or team that was already in trouble — what did you do to help turn it around?" |
| 155 | Tell me about a time you discovered a major security vulnerability or financial loophole... | Too senior and legally specific | Remove — not answerable by students |
| 156 | Give an example of a time you had to pitch a disruptive business model shift to executive board members... | "Executive board" presumes seniority | Rewrite: "Give an example of a time you had to persuade a senior or resistant audience to accept a major change you were proposing." |
| 157 | Tell me about a time you had to manage a critical product failure in the public eye... | "Public eye" product crisis — senior only | Rewrite: "Tell me about a time one of your team's significant failures became visible beyond your immediate group — how did you manage the aftermath?" |
| 158 | Describe a scenario where you had to choose between protecting a close professional colleague or preserving absolute project integrity. | Good ethical dilemma; acceptable for students | Keep; demote to **medium** |
| 159 | Tell me about a time you had to manage an architectural migration where zero downtime was permitted... | Pure CS/DevOps jargon | Rewrite: "Tell me about a time you had to make a major change to a system or process without being able to pause normal operations — how did you manage it?" |
| 160 | Give an example of a time you had to negotiate a multi-party resource allocation dispute where every department had veto power... | Very corporate politics | Rewrite: "Give an example of a time multiple people or groups each needed the same limited resource and you had to negotiate a solution." |
| 161 | Tell me about a time you engineered an operational recovery after your primary cloud infrastructure... | CS/SRE-specific | Rewrite: "Tell me about a time a core system or tool your team depended on completely failed — how did you manage the crisis and the recovery?" |
| 162 | Describe a situation where you had to lead a strategic pivot based entirely on an unannounced regulatory change... | Assumes senior strategy role | Rewrite: "Describe a situation where a sudden external change — a rule, policy, or decision outside your control — forced you to completely rethink your plan." |
| 163 | Tell me about a time you had to absorb the blame for a major team failure to protect junior engineers... | "Absorb the blame" for "junior engineers" assumes management | Rewrite: "Tell me about a time you took responsibility for a team's failure even when the blame was shared or unclear — what drove that decision?" |
| 164 | Give an example of a time you had to execute a highly complex data migration where source schemas were undocumented and corrupted. | Pure CS/data engineering | Remove if cross-role; keep with CS/IT role-type restriction |
| 165 | Tell me about a time you had to design a long-term business continuity plan under the direct threat of an impending macroeconomic collapse... | Extremely senior; not student-answerable | Remove |
| 167 | Tell me about a time you had to build an internal tooling framework from scratch because open-source market solutions fundamentally compromised your security model. | Pure CS/security engineering | Remove or restrict to CS/IT |
| 168 | Give an example of a time you had to navigate an intellectual property or copyright dispute during active development... | Legal matter; not student-answerable | Remove |
| 170 | Describe a situation where you had to completely restructure your technical architecture overnight to accommodate a massive, unexpected enterprise client contract. | Enterprise/CS senior scenario | Rewrite: "Describe a situation where you had to completely rethink your plan at the last minute because of a major new requirement." |
| 171 | Tell me about a time you had to scale a system's capacity by 10x with an operating budget cut in half. | CS/infrastructure specific; "10x" is SRE jargon | Rewrite: "Tell me about a time you were asked to deliver significantly more with significantly fewer resources — what was your approach?" |
| 172 | Give an example of a time you had to manage a high-value vendor who systematically underdelivered while your project was locked into an unbreakable multi-year contract. | Very senior procurement scenario | Rewrite: "Give an example of a time a person or service your team depended on repeatedly underdelivered — how did you handle it?" |
| 173 | Tell me about a time you had to build an enterprise-level automation workflow while handling massive pushback from staff who feared the automation would replace their jobs. | Enterprise + seniority required | Rewrite: "Tell me about a time you tried to improve or automate a process and faced strong resistance from people affected by the change." |
| 174 | Describe a situation where you had to manage an infrastructure project where the legacy dependencies were so deep that any minor code change threatened a cascade collapse. | Pure CS/DevOps | Remove or restrict to CS/IT |
| 175 | Tell me about a time you had to present data-driven proof of a product's declining market viability to an executive founder emotionally attached to the concept. | Very senior; founder relationship | Rewrite: "Tell me about a time you had to present data that contradicted what someone important was emotionally invested in — how did you handle the conversation?" |

---

## List C — Remove

These questions should be deleted. They either cannot be answered by a final-year Indian student under any rewrite, invert the app's purpose (candidate asks interviewer), are too company-specific to practice generically, or are trivially bad interview prompts.

### All "Closing Questions" (IDs 426–500) — Remove Entire Block

**Reason:** Every single one of these 75 questions is framed as a question the *candidate asks the interviewer* ("Do you have any questions for me?", "Can you walk me through...?", "What is your company's policy on...?"). The Intervise app records the user answering questions — not asking them. There is no valid recategorisation for questions phrased from the interviewer's perspective. The entire block must be dropped. A handful could theoretically be reframed as answerable questions (e.g., ID 427 "What does a typical day look like for someone in this role?" could be twisted into a motivation question), but the effort is not worth it — new purpose-built questions are better.

**IDs to remove: 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 495, 496, 497, 498, 499, 500**

### Individual Questions — Remove

| ID | Question | Reason |
|---|---|---|
| 51 | If I deleted your entire resume history and asked you to pitch your professional worth from scratch, what is your value proposition? | Hypothetical framing breaks the Present→Past→Future format; confuses students |
| 54 | If your career story was a book, what would the current chapter be titled...? | Overly abstract creative metaphor; not used in real campus interviews |
| 75 | If your entire career trajectory was an investment portfolio, what has been your highest-risk asset...? | Abstract finance metaphor; confusing for most students |
| 145 | Tell me about a time you had to fire a client, vendor, or project partner... | No final-year student has ever done this |
| 148 | Give an example of a time you had to advocate for a technical or operational pivot that directly cannibalized a product you spent years building. | Requires years of product ownership — not student-relevant |
| 155 | Tell me about a time you discovered a major security vulnerability or financial loophole in your company's systems... | Legal/security matter; not student-appropriate |
| 165 | Tell me about a time you had to design a long-term business continuity plan under the direct threat of an impending macroeconomic collapse... | C-suite level; completely inaccessible |
| 168 | Give an example of a time you had to navigate an intellectual property or copyright dispute during active development... | Legal specialist scenario; not answerable |
| 233 | Tell me about a time you weaponized a strength — like speed or eloquence — to push through a decision that you secretly knew was under-researched. | "Weaponized" framing is leading and adversarial; invites dishonesty |
| 250 | If your professional mind was an operating system, what is its single biggest architectural bottleneck when processing extreme scale and chaos? | Abstract metaphor, CS-centric jargon, not used in actual interviews |
| 260 | How did you first hear about our organization? | Not a practice-worthy prompt; trivially answered; zero coaching value |
| 262 | What is your preferred cadence for team meetings and syncs? | Logistical HR question, not a coaching-worthy interview prompt |
| 266 | How do you feel about traveling for business or company retreats? | Not a real interview-coaching question; preference question only |
| 275 | What parts of our company website caught your eye the most? | Cannot be generically practised; company-specific |
| 285 | What specific element of our engineering or business strategy do you think is our biggest competitive risk? | Company-specific; cannot be practised generically |
| 287 | Why are you applying for an individual contributor role now if you have historical management experience? | Irrelevant for first-time jobseekers |
| 294 | What specific aspect of our company's technical architecture or business scaling model challenges you the most? | Company-specific; cannot be practised |
| 297 | Why do you believe our specific target demographic is the most compelling audience to build products for right now? | Company-specific; cannot be practised |
| 302 | Why do you want to transition from a fully remote position to an in-office or hybrid model? | Assumes a specific prior arrangement; not universally applicable |
| 307 | Why are you choosing to apply to our company when your resume indicates you could easily start your own independent consulting practice? | Extremely niche scenario |
| 310 | What is your philosophy on the balance between automated algorithmic metrics and human intuition when evaluating product market fit? | Product/data science jargon; not campus-relevant |
| 312 | Why do you want to focus on enterprise B2B software solutions rather than entering the consumer B2C marketplace? | Only relevant for CS/product roles at specific company types |
| 314 | What specific corporate perk or cultural standard do you think is completely counterproductive to actual engineering output? | Mildly confrontational; engineering-specific; low campus interview frequency |
| 348 | If you could completely redesign our primary product's onboarding flow from scratch tonight, what major cultural or technical assumptions of ours would you challenge? | Company-specific product knowledge required; cannot be practised |
| 366 | What is a book or resource that completely changed your view of your career path? | Not a coaching-worthy question; pure small talk |
| 378 | What is your strategy for transitioning from purely writing code to actively designing system-wide architecture blueprints? | CS/IT only; not a general-practice question |
| 390 | How do you plan to leverage public cloud architectures to scale our product offerings without exponentially increasing our monthly infrastructure spend? | CS/DevOps jargon; company-specific product context |
| 401 | If your long-term five-year ambition is to start your own company, why should we invest our senior engineering resources into training you today? | Presumes entrepreneurial intent; adversarial framing |
| 411 | What is your philosophical view on the long-term survival of traditional cloud databases in a market pivoting toward edge computing? | Highly technical CS infrastructure debate; not campus-relevant |

**Total Remove: 75 (Closing Questions) + 29 individual = 104 questions removed**

---

## List D — New Questions Needed

### Category 7: Situational / Hypothetical (PACE format) — 0 questions currently

These are among the most-asked question types at TCS, Infosys, and Accenture campus drives. The PACE format (Prioritise → Act → Communicate → Evaluate) is a key differentiator of Intervise. All new questions below work across all 5 role types.

**Easy (answerable in <60s with basic prep):**

| question_text | category_name | difficulty | answer_format |
|---|---|---|---|
| Your team is given three tasks due on the same day and you can only fully complete two of them. How do you decide which two to prioritise and what do you tell your manager? | Situational / Hypothetical | easy | PACE: Prioritise · Act · Communicate · Evaluate |
| You are in the middle of an important task when your manager asks you to stop and help a colleague with something urgent. How do you handle it? | Situational / Hypothetical | easy | PACE: Prioritise · Act · Communicate · Evaluate |
| A teammate tells you privately that they made a mistake on a report that has already been sent to the client. What do you do? | Situational / Hypothetical | easy | PACE: Prioritise · Act · Communicate · Evaluate |
| You are assigned to a group project and quickly realise that one member is not contributing. How do you handle the situation? | Situational / Hypothetical | easy | PACE: Prioritise · Act · Communicate · Evaluate |
| You have just joined a new team and your first task is unclear. Your manager is in back-to-back meetings all day. What do you do? | Situational / Hypothetical | easy | PACE: Prioritise · Act · Communicate · Evaluate |

**Medium (~90s, structured thinking needed):**

| question_text | category_name | difficulty | answer_format |
|---|---|---|---|
| You discover a small but real error in a report that has already been presented to senior leadership. Fixing it now will require admitting the mistake publicly. What steps do you take? | Situational / Hypothetical | medium | PACE: Prioritise · Act · Communicate · Evaluate |
| You are leading a project and two of your team members have a disagreement that is starting to affect the whole group's productivity. Neither person wants to back down. What do you do? | Situational / Hypothetical | medium | PACE: Prioritise · Act · Communicate · Evaluate |
| Midway through a project, a key tool or system your team depends on goes down and there is no ETA for it coming back. The deadline is tomorrow. How do you respond? | Situational / Hypothetical | medium | PACE: Prioritise · Act · Communicate · Evaluate |
| You are asked to take over a task from a colleague who has left the team, but there is no handover documentation and the deadline is in 48 hours. Walk me through what you do. | Situational / Hypothetical | medium | PACE: Prioritise · Act · Communicate · Evaluate |
| Your manager approves a plan you are not fully confident in. When you start executing, your concerns prove correct and the plan is failing. What do you do next? | Situational / Hypothetical | medium | PACE: Prioritise · Act · Communicate · Evaluate |

**Hard (2+ min, genuine framework required):**

| question_text | category_name | difficulty | answer_format |
|---|---|---|---|
| You are managing a project that is two weeks behind schedule. Your manager is pushing for the deadline to stay fixed, but your team tells you cutting corners will produce a poor-quality result. How do you navigate this? | Situational / Hypothetical | hard | PACE: Prioritise · Act · Communicate · Evaluate |
| A client contacts you directly, bypassing your manager, to ask you to change the project scope significantly. You know your manager would say no, but the client's request seems reasonable. What do you do? | Situational / Hypothetical | hard | PACE: Prioritise · Act · Communicate · Evaluate |
| You notice that a process your team uses every day is inefficient and costing significant time. You have a solution but implementing it will require buy-in from three teams, all of whom resist change. How do you drive this improvement? | Situational / Hypothetical | hard | PACE: Prioritise · Act · Communicate · Evaluate |

---

### Category 8: Curveball / Pressure (Pause → Reframe → Redirect format) — 0 questions currently

These questions test composure, critical thinking, and the ability to recover under unexpected pressure — a core Intervise format. High frequency in FAANG-style and consulting interviews. All role-agnostic.

**Easy:**

| question_text | category_name | difficulty | answer_format |
|---|---|---|---|
| If you could remove one day of the week from the calendar permanently, which day would it be and why? | Curveball / Pressure | easy | Pause → Reframe → Redirect |
| How many petrol stations are there in India? You have two minutes. | Curveball / Pressure | easy | Pause → Reframe → Redirect |
| Sell me this pen. | Curveball / Pressure | easy | Pause → Reframe → Redirect |

**Medium:**

| question_text | category_name | difficulty | answer_format |
|---|---|---|---|
| Your interviewer says: "I have read your resume and honestly, I am not convinced you are qualified for this role." How do you respond? | Curveball / Pressure | medium | Pause → Reframe → Redirect |
| You are asked: "What would you do if you found out your direct colleague was lying about their progress to the manager?" Respond as if you are in a real interview right now. | Curveball / Pressure | medium | Pause → Reframe → Redirect |
| If you had to teach a completely new subject to a class of 50 people starting tomorrow, what subject would you choose and how would you prepare? | Curveball / Pressure | medium | Pause → Reframe → Redirect |
| Your interviewer asks: "Why should I hire you over someone with five years more experience?" | Curveball / Pressure | medium | Pause → Reframe → Redirect |

**Hard:**

| question_text | category_name | difficulty | answer_format |
|---|---|---|---|
| Describe yourself using only three words. Then justify why each word was the right choice given your career so far. | Curveball / Pressure | hard | Pause → Reframe → Redirect |
| If everything on your resume was wiped clean tomorrow, what single story from your life would you use to convince someone to hire you? | Curveball / Pressure | hard | Pause → Reframe → Redirect |
| You have 60 seconds to explain why you deserve this job more than every other candidate the interviewer will meet today. Go. | Curveball / Pressure | hard | Pause → Reframe → Redirect |

---

### Category 3 (Strengths) — Additional Easy Questions Needed

Current easy questions conflate strengths and weaknesses. After the split, Strengths needs more pure, directly-asked questions.

| question_text | category_name | difficulty | answer_format |
|---|---|---|---|
| What is one strength that has consistently helped you succeed in group work or team projects? | Strengths | easy | Name it → Prove it → Connect it |
| What do friends or classmates usually come to you for help with? | Strengths | easy | Name it → Prove it → Connect it |
| What is one thing you can do better than most people you have worked or studied with? | Strengths | easy | Name it → Prove it → Connect it |

### Category 4 (Weaknesses) — Additional Easy Questions Needed

After the S&W split, Weaknesses needs clear, standalone prompts with the 4-step format.

| question_text | category_name | difficulty | answer_format |
|---|---|---|---|
| What is one area you know you need to improve before you are ready to take on more responsibility? | Weaknesses | easy | Name it → Show awareness → Show action → Show progress |
| What is something you have received feedback on more than once that you are actively working to change? | Weaknesses | easy | Name it → Show awareness → Show action → Show progress |
| What is a task or type of work that you consistently find harder than your peers seem to? | Weaknesses | easy | Name it → Show awareness → Show action → Show progress |

---

## SQL Migration Plan

The following operations are needed. A developer should implement these as a numbered migration (e.g., `016_question_bank_overhaul.sql`).

### Step 1: Fix Encoding Errors
Run a `UPDATE questions SET question_text = REPLACE(question_text, 'ΓÇö', '—')` on the 18 affected rows (IDs: 58, 205, 233, 289, 318, 335, 347, 403, 408, 412, 413, 461, 477, 492 and any remaining). Apply a REPLACE for the double-encoded sequence in all rows as a safety sweep.

### Step 2: Add the Two Missing Categories
Insert two new rows into the `categories` table (or equivalent lookup):
- `Situational / Hypothetical` with `answer_format = 'PACE: Prioritise · Act · Communicate · Evaluate'`
- `Curveball / Pressure` with `answer_format = 'Pause → Reframe → Redirect'`

### Step 3: Split "Strengths & Weaknesses" Into Two Separate Categories
- Rename `Strengths & Weaknesses` to `Strengths` in the categories table.
- Insert a new `Weaknesses` category.
- Update all questions currently in `Strengths & Weaknesses` to be classified into the correct child category:
  - Questions where the prompt is about a positive attribute → `Strengths` (IDs: 176, 179, 180, 182, 183, 186, 190, 193, 197, 200, 202, 214, 216, 218, 223, 224)
  - Questions where the prompt is about a gap, limitation, or improvement area → `Weaknesses` (IDs: 177, 184, 187, 189, 191, 194, 196, 198, 199, 201, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 215, 217, 219, 220, 221, 222 and the hard IDs 226–250)
  - A handful are genuinely both — keep them in Strengths unless the weakness-growth arc is the clear focus

### Step 4: Delete Invalid Questions
Delete all 104 questions identified in List C. Use `DELETE FROM questions WHERE id IN (...)` with the full list of IDs. Wrap in a transaction with a safety count check.

### Step 5: Update Difficulty Misclassifications
Run targeted `UPDATE` statements for the individual questions whose difficulty was reclassified:
- ID 158: medium → hard was wrong in original; revert to medium
- ID 212: medium → hard
- ID 218: easy → medium
- ID 261: easy → medium

### Step 6: Apply Rewrites from List B
For each question in List B with a proposed rewrite, run `UPDATE questions SET question_text = '...' WHERE id = ...`. Do this in a single transaction block per category batch to keep the migration atomic.

### Step 7: Insert New Questions from List D
Insert all 26 new questions from List D into the `questions` table with the appropriate `category_name`, `difficulty`, and `answer_format` values. Ensure `id` values continue sequentially from the current max (500) or use the DB sequence.

### Step 8: Update answer_format Field Consistency
The current `answer_format` column contains long descriptive strings that vary by difficulty band within the same category (e.g., "STAR: Situation, Task, Action, Result." vs "STAR with quantified results and lessons learned." vs "STAR with systemic analysis and organizational impact."). The app code defines one canonical format per category. Normalise all Behavioral rows to `STAR: Situation · Task · Action · Result`, all Identity & Background rows to `Present → Past → Future`, etc., to match the app's 8 canonical formats exactly.

### Step 9: Verify Final State
After migration, run a verification query to confirm:
- Categories count = 8 (matching app code)
- No questions with `category_name = 'Closing Questions'`
- No questions with `ΓÇö` in `question_text`
- Counts per category, difficulty band are balanced (flag if any category has fewer than 10 easy questions)

---

*End of Audit Report*

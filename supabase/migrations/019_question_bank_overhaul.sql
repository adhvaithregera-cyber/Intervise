-- 019_question_bank_overhaul.sql
-- Full question bank overhaul based on 2026-06-25 audit.
--   1. Fix encoding errors (ΓÇö → —)
--   2. Rename "Behavioral" → "Behavioural / Experience"
--   3. Split "Strengths & Weaknesses" → "Strengths" (cat 3) + "Weaknesses" (cat 9)
--   4. Delete 104 invalid questions (75 Closing Questions + 29 individual)
--   5. Fix 3 difficulty misclassifications
--   6. Apply ~220 rewrites from audit List B
--   7. Normalize answer_format + time_limit_seconds per category
--   8. Insert 26 new questions (Cat 7 + Cat 8 + 3 Strengths + 3 Weaknesses)
--   9. Verification

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Fix encoding errors
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.questions
SET question_text = REPLACE(question_text, 'ΓÇö', '—')
WHERE question_text LIKE '%ΓÇö%';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Rename "Behavioral" → "Behavioural / Experience"
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.questions
SET category_name = 'Behavioural / Experience', category_id = 2
WHERE category_name = 'Behavioral';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: Delete 104 invalid questions
-- ─────────────────────────────────────────────────────────────────────────────
DELETE FROM public.question_history WHERE question_id IN (
  -- Individual removals (29)
  51, 54, 75, 145, 148, 155, 165, 168, 233, 250, 260, 262, 266, 275, 285,
  287, 294, 297, 302, 307, 310, 312, 314, 348, 366, 378, 390, 401, 411,
  -- Closing Questions block (75)
  426,427,428,429,430,431,432,433,434,435,436,437,438,439,440,
  441,442,443,444,445,446,447,448,449,450,451,452,453,454,455,
  456,457,458,459,460,461,462,463,464,465,466,467,468,469,470,
  471,472,473,474,475,476,477,478,479,480,481,482,483,484,485,
  486,487,488,489,490,491,492,493,494,495,496,497,498,499,500
);

DELETE FROM public.questions WHERE id IN (
  51, 54, 75, 145, 148, 155, 165, 168, 233, 250, 260, 262, 266, 275, 285,
  287, 294, 297, 302, 307, 310, 312, 314, 348, 366, 378, 390, 401, 411,
  426,427,428,429,430,431,432,433,434,435,436,437,438,439,440,
  441,442,443,444,445,446,447,448,449,450,451,452,453,454,455,
  456,457,458,459,460,461,462,463,464,465,466,467,468,469,470,
  471,472,473,474,475,476,477,478,479,480,481,482,483,484,485,
  486,487,488,489,490,491,492,493,494,495,496,497,498,499,500
);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: Split "Strengths & Weaknesses" into two categories
-- All S&W → Weaknesses first, then promote Strengths IDs
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.questions
SET category_name = 'Weaknesses', category_id = 9
WHERE category_name = 'Strengths & Weaknesses';

UPDATE public.questions
SET category_name = 'Strengths', category_id = 3
WHERE id IN (
  176, 178, 179, 180, 181, 182, 183, 186, 188, 190, 193, 195, 197,
  200, 202, 211, 214, 216, 218, 223, 224, 225
);

-- Also reclassify ID 301 (was Motivation & Fit, pure CS question) → Behavioural / Experience hard
UPDATE public.questions
SET category_name = 'Behavioural / Experience', category_id = 2, difficulty = 'hard'
WHERE id = 301;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: Fix difficulty misclassifications
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.questions SET difficulty = 'medium' WHERE id = 158; -- was hard
UPDATE public.questions SET difficulty = 'hard'   WHERE id = 212; -- was medium
UPDATE public.questions SET difficulty = 'medium' WHERE id = 261; -- was easy

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 6: Apply rewrites from audit List B
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Identity & Background ────────────────────────────────────────────────────
UPDATE public.questions SET question_text = 'What was your primary responsibility during your most recent internship, part-time role, or significant college project?' WHERE id = 6;
UPDATE public.questions SET question_text = 'How did you first develop an interest in this industry or field?' WHERE id = 7;
UPDATE public.questions SET question_text = 'What was the most common day-to-day task in your internship or final-year project?' WHERE id = 8;
UPDATE public.questions SET question_text = 'What aspects of your education or extracurricular experience are transferable across industries?' WHERE id = 11;
UPDATE public.questions SET question_text = 'Walk me through your journey from your degree choice to where you are now.' WHERE id = 12;
UPDATE public.questions SET question_text = 'Describe the team structure in your most recent internship or group project.' WHERE id = 13;
UPDATE public.questions SET question_text = 'Tell me about the project lifecycle you followed during your most significant academic or internship project.' WHERE id = 15;
UPDATE public.questions SET question_text = 'How did you land your first internship or your first significant opportunity in this field?' WHERE id = 16;
UPDATE public.questions SET question_text = 'Describe the largest project you have worked on — what was the scope, how many people were involved, and what was your role?' WHERE id = 21;
UPDATE public.questions SET question_text = 'Walk me through how you typically structure your first day of the week when working on an important project or during an internship.' WHERE id = 22;
UPDATE public.questions SET question_text = 'Tell me about a time you had to work with an external client, customer, or end user — what did you learn from that experience?' WHERE id = 24;
UPDATE public.questions SET question_text = 'Describe a time you had to work closely with people from a completely different background or department to complete a shared goal.' WHERE id = 25;
UPDATE public.questions SET question_text = 'Walk me through each significant chapter of your academic and early professional journey, and what drove each transition.' WHERE id = 36;
UPDATE public.questions SET question_text = 'How has your way of working on projects or in teams changed between your first year of college and now?' WHERE id = 38;
UPDATE public.questions SET question_text = 'Tell me about a time you had to redefine your role or contribution because a project or team''s needs shifted unexpectedly.' WHERE id = 40;
UPDATE public.questions SET question_text = 'How would you explain a complex technical concept or your project work to someone with no technical background?' WHERE id = 41;
UPDATE public.questions SET question_text = 'Tell me about a time you had to work within tight resource constraints — whether time, tools, or team size — and how you managed them.' WHERE id = 42;
UPDATE public.questions SET question_text = 'How do you make sure you keep building your core skills when day-to-day tasks start to feel routine or administrative?' WHERE id = 44;
UPDATE public.questions SET question_text = 'Describe a time you had to step outside your comfort zone or skill set to fill a gap in your team.' WHERE id = 45;
UPDATE public.questions SET question_text = 'Walk me through the most complex project you have been part of — what made it complex and how did you manage it?' WHERE id = 46;
UPDATE public.questions SET question_text = 'How have your past academic or internship experiences shaped the way you approach high-pressure situations?' WHERE id = 47;
UPDATE public.questions SET question_text = 'Tell me about a time you helped someone who was struggling with a task or concept that you understood well.' WHERE id = 48;
UPDATE public.questions SET question_text = 'How do you establish trust and credibility when joining a new team or group project for the first time?' WHERE id = 49;
UPDATE public.questions SET question_text = 'Tell me about a time you had to coordinate with an external person or organisation — a vendor, college society, NGO — to get something done.' WHERE id = 50;

-- ── Behavioural / Experience — easy rewrites ─────────────────────────────────
UPDATE public.questions SET question_text = 'Tell me about a time you went above and beyond what was expected of you for a project, customer, or classmate.' WHERE id = 78;
UPDATE public.questions SET question_text = 'Tell me about a time you put in extra time and effort — outside of regular hours or expectations — to make sure an important task was done well.' WHERE id = 85;
UPDATE public.questions SET question_text = 'Give an example of how you manage stress during high-pressure periods — whether at work, during exams, or on a major project.' WHERE id = 86;
UPDATE public.questions SET question_text = 'Tell me about a time you had to follow a strict set of rules, guidelines, or procedures — and why following them mattered.' WHERE id = 89;
UPDATE public.questions SET question_text = 'Give an example of a time you had to manage someone who was frustrated or unhappy — whether a customer, group member, or classmate.' WHERE id = 94;
UPDATE public.questions SET question_text = 'Tell me about a time you identified a better way to do something and convinced others to adopt the change.' WHERE id = 95;
UPDATE public.questions SET question_text = 'Give an example of a time you helped someone new — a new team member, a junior, or a new classmate — get up to speed quickly.' WHERE id = 98;
UPDATE public.questions SET question_text = 'Describe a situation where you had to represent your team or group in a meeting or presentation.' WHERE id = 104;
UPDATE public.questions SET question_text = 'Tell me about a time you noticed something that didn''t seem right in a process or project and decided to speak up about it.' WHERE id = 105;

-- ── Behavioural / Experience — medium rewrites ────────────────────────────────
UPDATE public.questions SET question_text = 'Tell me about a time you had to convince a senior person — a manager, professor, or supervisor — to give your team what it needed to succeed.' WHERE id = 110;
UPDATE public.questions SET question_text = 'Tell me about a time you had to deliver disappointing news to someone — a client, professor, manager, or teammate — and how you handled it.' WHERE id = 112;
UPDATE public.questions SET question_text = 'Tell me about a time you had to make a trade-off between doing something perfectly and delivering it on time.' WHERE id = 114;
UPDATE public.questions SET question_text = 'Describe a situation where two people in your team had a serious disagreement and you had to help resolve it.' WHERE id = 115;
UPDATE public.questions SET question_text = 'Tell me about a time you improved a process or workflow — and what the measurable impact was on your team or project.' WHERE id = 116;
UPDATE public.questions SET question_text = 'Give an example of a time two people or groups needed your time and effort simultaneously and how you balanced both.' WHERE id = 117;
UPDATE public.questions SET question_text = 'Describe a situation where you realised your original approach to a project wasn''t working and had to start over with a completely different method.' WHERE id = 119;
UPDATE public.questions SET question_text = 'Tell me about a time no one was taking charge of a situation and you stepped up to lead the team to the finish.' WHERE id = 120;
UPDATE public.questions SET question_text = 'Tell me about a time you were working on a project and the requirements or scope kept growing — how did you handle it?' WHERE id = 122;
UPDATE public.questions SET question_text = 'Describe a situation where you had to handle sensitive information or a private matter responsibly.' WHERE id = 123;
UPDATE public.questions SET question_text = 'Tell me about a time you tried something new that didn''t work out, and how you communicated what you learned to your team.' WHERE id = 124;
UPDATE public.questions SET question_text = 'Tell me about a time you spotted a recurring problem that others were overlooking, and what you did to fix it.' WHERE id = 126;
UPDATE public.questions SET question_text = 'Describe a situation where you had to learn something complex or technical on your own, with very little guidance or documentation.' WHERE id = 127;
UPDATE public.questions SET question_text = 'Tell me about a time you had to justify your team''s work or results to someone who was questioning your approach or outcomes.' WHERE id = 128;
UPDATE public.questions SET question_text = 'Give an example of a time you had to persuade a skeptical person — client, professor, or colleague — that your approach was the right one.' WHERE id = 129;
UPDATE public.questions SET question_text = 'Tell me about a time you had very little time to prepare for an important presentation or pitch — what did you do and how did it go?' WHERE id = 130;
UPDATE public.questions SET question_text = 'Describe a situation where someone key to your project dropped out unexpectedly, and how your team adapted.' WHERE id = 131;
UPDATE public.questions SET question_text = 'Tell me about a time you had to improve an outdated process or tool that was slowing everyone down.' WHERE id = 132;
UPDATE public.questions SET question_text = 'Give an example of a time there was a serious communication breakdown in your team and how you resolved it.' WHERE id = 133;
UPDATE public.questions SET question_text = 'Tell me about a time someone had unrealistic expectations for your work or project and how you managed the situation.' WHERE id = 134;
UPDATE public.questions SET question_text = 'Describe a situation where bureaucracy or slow approvals blocked your work and how you found a way through.' WHERE id = 135;
UPDATE public.questions SET question_text = 'Tell me about a time you used data or evidence to challenge an assumption that your team or manager held.' WHERE id = 136;
UPDATE public.questions SET question_text = 'Give an example of a time you had to coordinate a launch, event, or deliverable with people across different locations or teams.' WHERE id = 137;
UPDATE public.questions SET question_text = 'Tell me about a time your team was going through a difficult period and how you helped keep spirits up.' WHERE id = 138;
UPDATE public.questions SET question_text = 'Describe a situation where your workload suddenly increased far beyond what you expected — how did you cope?' WHERE id = 139;
UPDATE public.questions SET question_text = 'Tell me about a time you had to build a productive working relationship with someone who was known to be difficult to work with.' WHERE id = 140;

-- ── Behavioural / Experience — hard rewrites (B3) ────────────────────────────
UPDATE public.questions SET question_text = 'Tell me about a significant mistake you made on a project — what was the impact and how did you take responsibility and recover?' WHERE id = 141;
UPDATE public.questions SET question_text = 'Describe a time you disagreed with a decision made by someone in authority over you on ethical grounds — how did you handle it?' WHERE id = 142;
UPDATE public.questions SET question_text = 'Give an example of a time you had to abandon your entire approach to a project and restart from scratch — what triggered it and how did you manage?' WHERE id = 144;
UPDATE public.questions SET question_text = 'Tell me about a high-pressure situation where your team was struggling and you had to stay calm and lead — walk me through your thinking.' WHERE id = 147;
UPDATE public.questions SET question_text = 'Tell me about a time there was a serious breakdown in communication with a teammate or colleague — what happened and how did you address it?' WHERE id = 149;
UPDATE public.questions SET question_text = 'Describe a situation where you had to achieve the same results with significantly fewer resources — what was your approach?' WHERE id = 150;
UPDATE public.questions SET question_text = 'Tell me about a time you worked with a very difficult person or group — how did you protect your team''s morale while still delivering?' WHERE id = 151;
UPDATE public.questions SET question_text = 'Give an example of a time you had to make an important decision when the information you had pointed in two completely opposite directions.' WHERE id = 152;
UPDATE public.questions SET question_text = 'Tell me about a time you joined a project or team that was already in trouble — what did you do to help turn it around?' WHERE id = 153;
UPDATE public.questions SET question_text = 'Give an example of a time you had to persuade a senior or resistant audience to accept a major change you were proposing.' WHERE id = 156;
UPDATE public.questions SET question_text = 'Tell me about a time one of your team''s significant failures became visible beyond your immediate group — how did you manage the aftermath?' WHERE id = 157;
UPDATE public.questions SET question_text = 'Tell me about a time you had to make a major change to a system or process without being able to pause normal operations — how did you manage it?' WHERE id = 159;
UPDATE public.questions SET question_text = 'Give an example of a time multiple people or groups each needed the same limited resource and you had to negotiate a solution.' WHERE id = 160;
UPDATE public.questions SET question_text = 'Tell me about a time a core system or tool your team depended on completely failed — how did you manage the crisis and the recovery?' WHERE id = 161;
UPDATE public.questions SET question_text = 'Describe a situation where a sudden external change — a rule, policy, or decision outside your control — forced you to completely rethink your plan.' WHERE id = 162;
UPDATE public.questions SET question_text = 'Tell me about a time you took responsibility for a team''s failure even when the blame was shared or unclear — what drove that decision?' WHERE id = 163;
UPDATE public.questions SET question_text = 'Describe a situation where you had to completely rethink your plan at the last minute because of a major new requirement.' WHERE id = 170;
UPDATE public.questions SET question_text = 'Tell me about a time you were asked to deliver significantly more with significantly fewer resources — what was your approach.' WHERE id = 171;
UPDATE public.questions SET question_text = 'Give an example of a time a person or service your team depended on repeatedly underdelivered — how did you handle it?' WHERE id = 172;
UPDATE public.questions SET question_text = 'Tell me about a time you tried to improve or automate a process and faced strong resistance from people affected by the change.' WHERE id = 173;
UPDATE public.questions SET question_text = 'Tell me about a time you had to present data that contradicted what someone important was emotionally invested in — how did you handle the conversation?' WHERE id = 175;

-- ── Strengths rewrites ────────────────────────────────────────────────────────
UPDATE public.questions SET question_text = 'What is your greatest strength when it comes to working under tight time constraints?' WHERE id = 178;
UPDATE public.questions SET question_text = 'What is your greatest strength when it comes to staying organized under pressure?' WHERE id = 181;
UPDATE public.questions SET question_text = 'What is your primary coping strength when handling repetitive or low-stimulation work for extended periods?' WHERE id = 188;
UPDATE public.questions SET question_text = 'What is your biggest strength when it comes to communicating with people outside your immediate team?' WHERE id = 193;
UPDATE public.questions SET question_text = 'How do you handle situations where you clearly know more about a topic than everyone else in the room?' WHERE id = 216;
UPDATE public.questions SET question_text = 'How do you balance the need to execute details perfectly against the need to see the bigger strategic picture?' WHERE id = 218;
UPDATE public.questions SET question_text = 'How do you build a good working relationship with people who do not see the value in what your team does?' WHERE id = 223;
UPDATE public.questions SET question_text = 'What is a skill or quality you have that you feel is consistently underestimated or overlooked by others?' WHERE id = 224;

-- ── Weaknesses rewrites ───────────────────────────────────────────────────────
UPDATE public.questions SET question_text = 'What is a type of work environment you find challenging, and what steps have you taken to adapt?' WHERE id = 189;
UPDATE public.questions SET question_text = 'What types of tasks do you find most draining, and how do you manage your energy when those tasks pile up?' WHERE id = 194;
UPDATE public.questions SET question_text = 'Tell me about a time your natural way of working clashed with your manager''s style — how did you adapt?' WHERE id = 204;
UPDATE public.questions SET question_text = 'How do you prevent your attention to detail from slowing down your team when speed is just as important as accuracy?' WHERE id = 207;
UPDATE public.questions SET question_text = 'What is a skill or tool you relied on heavily in the past that you are now actively working to update or replace?' WHERE id = 209;
UPDATE public.questions SET question_text = 'What is your strategy for saying no or pushing back when you already have too much on your plate?' WHERE id = 215;
UPDATE public.questions SET question_text = 'Tell me about a skill or subject you worked hard to get good at, only to discover you did not enjoy it — what did you do next?' WHERE id = 219;
UPDATE public.questions SET question_text = 'How do you manage your energy and focus during a long, intense stretch of demanding work?' WHERE id = 220;
UPDATE public.questions SET question_text = 'What is your biggest challenge when you need to trust others with important parts of a project?' WHERE id = 221;
UPDATE public.questions SET question_text = 'Tell me about a time your tendency to over-think or over-analyse a problem caused a delay — and what you learned.' WHERE id = 222;

-- ── Motivation & Fit rewrites ─────────────────────────────────────────────────
UPDATE public.questions SET question_text = 'How do you stay productive and connected when working in environments where your team is not physically together?' WHERE id = 263;
UPDATE public.questions SET question_text = 'What is one thing you would like to do differently in your next role compared to your past internship or project experience?' WHERE id = 265;
UPDATE public.questions SET question_text = 'How do you evaluate whether a company''s stated mission genuinely matches how it operates?' WHERE id = 268;
UPDATE public.questions SET question_text = 'What kind of recognition or feedback makes you feel most valued and motivated at work?' WHERE id = 269;
UPDATE public.questions SET question_text = 'Which stage of a project do you enjoy the most — planning, building, testing, or wrapping up — and why?' WHERE id = 271;
UPDATE public.questions SET question_text = 'Why do you think your values align with our company''s culture and the way this team works?' WHERE id = 272;
UPDATE public.questions SET question_text = 'What is one thing from your past work or study experience that you would want to avoid repeating in your next role?' WHERE id = 273;
UPDATE public.questions SET question_text = 'If you were choosing between two companies offering similar roles, what factors would matter most to you?' WHERE id = 279;
UPDATE public.questions SET question_text = 'What does taking ownership mean to you in your day-to-day work?' WHERE id = 290;
UPDATE public.questions SET question_text = 'Why are you drawn to this type and size of organisation rather than a very large corporation or a very small startup?' WHERE id = 292;
UPDATE public.questions SET question_text = 'How do you balance a desire to move quickly with the need to follow careful processes and quality standards?' WHERE id = 296;
UPDATE public.questions SET question_text = 'Tell me about a time you chose an opportunity based on the team or culture rather than purely the compensation.' WHERE id = 300;
UPDATE public.questions SET question_text = 'How do you handle working in an organisation where the priorities of your team sometimes conflict with your personal standards of quality?' WHERE id = 306;
UPDATE public.questions SET question_text = 'How do you make sure your daily work is connected to the biggest goals your team or company is trying to achieve?' WHERE id = 308;
UPDATE public.questions SET question_text = 'Tell me about a time you felt your contribution was being overlooked — how did you address it?' WHERE id = 309;
UPDATE public.questions SET question_text = 'How do you handle working with people across different locations or schedules where real-time communication is difficult?' WHERE id = 311;
UPDATE public.questions SET question_text = 'How do you stay motivated and energised when your work involves a high volume of repetitive tasks or requests?' WHERE id = 313;
UPDATE public.questions SET question_text = 'Describe a time when two teams or groups had conflicting goals — how did you help maintain alignment?' WHERE id = 315;

-- ── Future & Ambition rewrites ────────────────────────────────────────────────
UPDATE public.questions SET question_text = 'What is the professional position or level of responsibility you ultimately aspire to reach in your career?' WHERE id = 356;
UPDATE public.questions SET question_text = 'What certifications, courses, or advanced qualifications are you considering to support your career growth?' WHERE id = 357;
UPDATE public.questions SET question_text = 'How do you stay connected to the broader professional community in your field — events, communities, online spaces?' WHERE id = 358;
UPDATE public.questions SET question_text = 'How do you plan to build and expand your professional portfolio or skill set over the next two years?' WHERE id = 359;
UPDATE public.questions SET question_text = 'Do you see yourself specialising deeply in one area over the next few years, or building skills across multiple areas — and why?' WHERE id = 361;
UPDATE public.questions SET question_text = 'What is the next major skill or area of expertise you want to develop, and how do you plan to approach it?' WHERE id = 362;
UPDATE public.questions SET question_text = 'Describe a specific type of leadership responsibility you are actively working toward, and what you are doing to get there.' WHERE id = 364;
UPDATE public.questions SET question_text = 'How do you plan to build your professional reputation and visibility in your field over the next few years?' WHERE id = 367;
UPDATE public.questions SET question_text = 'What is your strategy for moving from where you are now to taking on more senior responsibilities in your career?' WHERE id = 370;
UPDATE public.questions SET question_text = 'Which sector or area of your industry would you most like to develop deeper expertise in, and why?' WHERE id = 371;
UPDATE public.questions SET question_text = 'What higher-level skill — such as strategy, leadership, or cross-functional planning — are you most eager to develop in this role?' WHERE id = 373;
UPDATE public.questions SET question_text = 'How do you think the fastest-growing trends in your field today will change the nature of your role in the next five years?', difficulty = 'medium' WHERE id = 377;
UPDATE public.questions SET question_text = 'How do you plan to multiply your impact — through mentoring, process improvement, or building tools — as you grow in your career?' WHERE id = 379;
UPDATE public.questions SET question_text = 'How do you plan to build a stronger understanding of business and commercial priorities alongside your technical or functional skills?' WHERE id = 383;
UPDATE public.questions SET question_text = 'Describe how you would approach your first 90 days in a new role to make sure you are adding value as quickly as possible.' WHERE id = 386;
UPDATE public.questions SET question_text = 'What is your plan for leading or contributing to a team in a domain where you have limited prior experience?' WHERE id = 387;
UPDATE public.questions SET question_text = 'How do you manage your career ambitions when promotion or growth opportunities at a company slow down for external reasons?' WHERE id = 388;
UPDATE public.questions SET question_text = 'What does becoming a recognised expert or authority in your field mean to you, and how do you plan to get there?' WHERE id = 391;
UPDATE public.questions SET question_text = 'How do you decide when to build something from scratch versus adopting an existing tool or solution?' WHERE id = 392;
UPDATE public.questions SET question_text = 'How do you plan to adapt your communication style as your responsibilities grow and you interact with more senior people?' WHERE id = 394;
UPDATE public.questions SET question_text = 'What specific task or skill in your field do you think AI will automate or transform in the next three years, and how are you preparing?' WHERE id = 395;
UPDATE public.questions SET question_text = 'How do you intend to measure the impact or return on the major decisions you make in your role over the next year?' WHERE id = 397;
UPDATE public.questions SET question_text = 'How do you plan to stay close to the actual work and execution as your role becomes more strategic and involves more meetings?' WHERE id = 398;
UPDATE public.questions SET question_text = 'How do you build professional relationships across different teams and functions that help you advance shared goals?' WHERE id = 399;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 7: Normalize answer_format + time_limit_seconds per category
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.questions SET answer_format = 'Present → Past → Future', time_limit_seconds = 60  WHERE category_name = 'Identity & Background' AND difficulty = 'easy';
UPDATE public.questions SET answer_format = 'Present → Past → Future', time_limit_seconds = 90  WHERE category_name = 'Identity & Background' AND difficulty = 'medium';
UPDATE public.questions SET answer_format = 'Present → Past → Future', time_limit_seconds = 120 WHERE category_name = 'Identity & Background' AND difficulty = 'hard';

UPDATE public.questions SET answer_format = 'STAR: Situation · Task · Action · Result', time_limit_seconds = 60  WHERE category_name = 'Behavioural / Experience' AND difficulty = 'easy';
UPDATE public.questions SET answer_format = 'STAR: Situation · Task · Action · Result', time_limit_seconds = 90  WHERE category_name = 'Behavioural / Experience' AND difficulty = 'medium';
UPDATE public.questions SET answer_format = 'STAR: Situation · Task · Action · Result', time_limit_seconds = 120 WHERE category_name = 'Behavioural / Experience' AND difficulty = 'hard';

UPDATE public.questions SET answer_format = 'Name it → Prove it → Connect it', time_limit_seconds = 60  WHERE category_name = 'Strengths' AND difficulty = 'easy';
UPDATE public.questions SET answer_format = 'Name it → Prove it → Connect it', time_limit_seconds = 90  WHERE category_name = 'Strengths' AND difficulty = 'medium';
UPDATE public.questions SET answer_format = 'Name it → Prove it → Connect it', time_limit_seconds = 120 WHERE category_name = 'Strengths' AND difficulty = 'hard';

UPDATE public.questions SET answer_format = 'Name it → Show awareness → Show action → Show progress', time_limit_seconds = 60  WHERE category_name = 'Weaknesses' AND difficulty = 'easy';
UPDATE public.questions SET answer_format = 'Name it → Show awareness → Show action → Show progress', time_limit_seconds = 90  WHERE category_name = 'Weaknesses' AND difficulty = 'medium';
UPDATE public.questions SET answer_format = 'Name it → Show awareness → Show action → Show progress', time_limit_seconds = 120 WHERE category_name = 'Weaknesses' AND difficulty = 'hard';

UPDATE public.questions SET answer_format = 'Why them · Why role · Why now', time_limit_seconds = 60  WHERE category_name = 'Motivation & Fit' AND difficulty = 'easy';
UPDATE public.questions SET answer_format = 'Why them · Why role · Why now', time_limit_seconds = 90  WHERE category_name = 'Motivation & Fit' AND difficulty = 'medium';
UPDATE public.questions SET answer_format = 'Why them · Why role · Why now', time_limit_seconds = 120 WHERE category_name = 'Motivation & Fit' AND difficulty = 'hard';

UPDATE public.questions SET answer_format = 'Short-term → Long-term → Connect to role', time_limit_seconds = 60  WHERE category_name = 'Future & Ambition' AND difficulty = 'easy';
UPDATE public.questions SET answer_format = 'Short-term → Long-term → Connect to role', time_limit_seconds = 90  WHERE category_name = 'Future & Ambition' AND difficulty = 'medium';
UPDATE public.questions SET answer_format = 'Short-term → Long-term → Connect to role', time_limit_seconds = 120 WHERE category_name = 'Future & Ambition' AND difficulty = 'hard';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 8: Insert 26 new questions
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.questions (id, rank, category_id, category_name, question_text, frequency, difficulty, answer_format, time_limit_seconds, notes)
VALUES
  -- ── Category 7: Situational / Hypothetical (13, IDs 501–513) ─────────────
  -- Easy (5)
  (501, 1,  10, 'Situational / Hypothetical', 'Your team is given three tasks due on the same day and you can only fully complete two of them. How do you decide which two to prioritise and what do you tell your manager?', 'High', 'easy', 'PACE: Prioritise · Act · Communicate · Evaluate', 60, ''),
  (502, 2,  10, 'Situational / Hypothetical', 'You are in the middle of an important task when your manager asks you to stop and help a colleague with something urgent. How do you handle it?', 'High', 'easy', 'PACE: Prioritise · Act · Communicate · Evaluate', 60, ''),
  (503, 3,  10, 'Situational / Hypothetical', 'A teammate tells you privately that they made a mistake on a report that has already been sent to the client. What do you do?', 'High', 'easy', 'PACE: Prioritise · Act · Communicate · Evaluate', 60, ''),
  (504, 4,  10, 'Situational / Hypothetical', 'You are assigned to a group project and quickly realise that one member is not contributing. How do you handle the situation?', 'High', 'easy', 'PACE: Prioritise · Act · Communicate · Evaluate', 60, ''),
  (505, 5,  10, 'Situational / Hypothetical', 'You have just joined a new team and your first task is unclear. Your manager is in back-to-back meetings all day. What do you do?', 'High', 'easy', 'PACE: Prioritise · Act · Communicate · Evaluate', 60, ''),
  -- Medium (5)
  (506, 6,  10, 'Situational / Hypothetical', 'You discover a small but real error in a report that has already been presented to senior leadership. Fixing it now will require admitting the mistake publicly. What steps do you take?', 'High', 'medium', 'PACE: Prioritise · Act · Communicate · Evaluate', 90, ''),
  (507, 7,  10, 'Situational / Hypothetical', 'You are leading a project and two of your team members have a disagreement that is starting to affect the whole group''s productivity. Neither person wants to back down. What do you do?', 'High', 'medium', 'PACE: Prioritise · Act · Communicate · Evaluate', 90, ''),
  (508, 8,  10, 'Situational / Hypothetical', 'Midway through a project, a key tool or system your team depends on goes down and there is no ETA for it coming back. The deadline is tomorrow. How do you respond?', 'High', 'medium', 'PACE: Prioritise · Act · Communicate · Evaluate', 90, ''),
  (509, 9,  10, 'Situational / Hypothetical', 'You are asked to take over a task from a colleague who has left the team, but there is no handover documentation and the deadline is in 48 hours. Walk me through what you do.', 'High', 'medium', 'PACE: Prioritise · Act · Communicate · Evaluate', 90, ''),
  (510, 10, 10, 'Situational / Hypothetical', 'Your manager approves a plan you are not fully confident in. When you start executing, your concerns prove correct and the plan is failing. What do you do next?', 'High', 'medium', 'PACE: Prioritise · Act · Communicate · Evaluate', 90, ''),
  -- Hard (3)
  (511, 11, 10, 'Situational / Hypothetical', 'You are managing a project that is two weeks behind schedule. Your manager is pushing for the deadline to stay fixed, but your team tells you cutting corners will produce a poor-quality result. How do you navigate this?', 'High', 'hard', 'PACE: Prioritise · Act · Communicate · Evaluate', 120, ''),
  (512, 12, 10, 'Situational / Hypothetical', 'A client contacts you directly, bypassing your manager, to ask you to change the project scope significantly. You know your manager would say no, but the client''s request seems reasonable. What do you do?', 'High', 'hard', 'PACE: Prioritise · Act · Communicate · Evaluate', 120, ''),
  (513, 13, 10, 'Situational / Hypothetical', 'You notice that a process your team uses every day is inefficient and costing significant time. You have a solution but implementing it will require buy-in from three teams, all of whom resist change. How do you drive this improvement?', 'High', 'hard', 'PACE: Prioritise · Act · Communicate · Evaluate', 120, ''),

  -- ── Category 8: Curveball / Pressure (10, IDs 514–523) ───────────────────
  -- Easy (3)
  (514, 1,  11, 'Curveball / Pressure', 'If you could remove one day of the week from the calendar permanently, which day would it be and why?', 'High', 'easy', 'Pause → Reframe → Redirect', 60, ''),
  (515, 2,  11, 'Curveball / Pressure', 'How many petrol stations are there in India? You have two minutes.', 'High', 'easy', 'Pause → Reframe → Redirect', 60, ''),
  (516, 3,  11, 'Curveball / Pressure', 'Sell me this pen.', 'High', 'easy', 'Pause → Reframe → Redirect', 60, ''),
  -- Medium (4)
  (517, 4,  11, 'Curveball / Pressure', 'Your interviewer says: "I have read your resume and honestly, I am not convinced you are qualified for this role." How do you respond?', 'High', 'medium', 'Pause → Reframe → Redirect', 90, ''),
  (518, 5,  11, 'Curveball / Pressure', 'You are asked: "What would you do if you found out your direct colleague was lying about their progress to the manager?" Respond as if you are in a real interview right now.', 'High', 'medium', 'Pause → Reframe → Redirect', 90, ''),
  (519, 6,  11, 'Curveball / Pressure', 'If you had to teach a completely new subject to a class of 50 people starting tomorrow, what subject would you choose and how would you prepare?', 'High', 'medium', 'Pause → Reframe → Redirect', 90, ''),
  (520, 7,  11, 'Curveball / Pressure', 'Your interviewer asks: "Why should I hire you over someone with five years more experience?"', 'High', 'medium', 'Pause → Reframe → Redirect', 90, ''),
  -- Hard (3)
  (521, 8,  11, 'Curveball / Pressure', 'Describe yourself using only three words. Then justify why each word was the right choice given your career so far.', 'High', 'hard', 'Pause → Reframe → Redirect', 120, ''),
  (522, 9,  11, 'Curveball / Pressure', 'If everything on your resume was wiped clean tomorrow, what single story from your life would you use to convince someone to hire you?', 'High', 'hard', 'Pause → Reframe → Redirect', 120, ''),
  (523, 10, 11, 'Curveball / Pressure', 'You have 60 seconds to explain why you deserve this job more than every other candidate the interviewer will meet today. Go.', 'High', 'hard', 'Pause → Reframe → Redirect', 120, ''),

  -- ── Category 3: Strengths — 3 new easy (IDs 524–526) ─────────────────────
  (524, 1, 3, 'Strengths', 'What is one strength that has consistently helped you succeed in group work or team projects?', 'High', 'easy', 'Name it → Prove it → Connect it', 60, ''),
  (525, 2, 3, 'Strengths', 'What do friends or classmates usually come to you for help with?', 'High', 'easy', 'Name it → Prove it → Connect it', 60, ''),
  (526, 3, 3, 'Strengths', 'What is one thing you can do better than most people you have worked or studied with?', 'High', 'easy', 'Name it → Prove it → Connect it', 60, ''),

  -- ── Category 9: Weaknesses — 3 new easy (IDs 527–529) ───────────────────
  (527, 1, 9, 'Weaknesses', 'What is one area you know you need to improve before you are ready to take on more responsibility?', 'High', 'easy', 'Name it → Show awareness → Show action → Show progress', 60, ''),
  (528, 2, 9, 'Weaknesses', 'What is something you have received feedback on more than once that you are actively working to change?', 'High', 'easy', 'Name it → Show awareness → Show action → Show progress', 60, ''),
  (529, 3, 9, 'Weaknesses', 'What is a task or type of work that you consistently find harder than your peers seem to?', 'High', 'easy', 'Name it → Show awareness → Show action → Show progress', 60, '')
;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 9: Verification
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_encoding_errors integer;
  v_closing_left    integer;
  v_cat_count       integer;
BEGIN
  SELECT COUNT(*) INTO v_encoding_errors FROM public.questions WHERE question_text LIKE '%ΓÇö%';
  SELECT COUNT(*) INTO v_closing_left    FROM public.questions WHERE category_name = 'Closing Questions';
  SELECT COUNT(DISTINCT category_name) INTO v_cat_count FROM public.questions;

  RAISE NOTICE 'Encoding errors remaining : %', v_encoding_errors;
  RAISE NOTICE 'Closing Questions remaining: %', v_closing_left;
  RAISE NOTICE 'Distinct categories        : %', v_cat_count;

  IF v_encoding_errors > 0 THEN
    RAISE EXCEPTION 'ABORT: % encoding errors still present', v_encoding_errors;
  END IF;
  IF v_closing_left > 0 THEN
    RAISE EXCEPTION 'ABORT: % Closing Questions still present', v_closing_left;
  END IF;
  IF v_cat_count != 8 THEN
    RAISE EXCEPTION 'ABORT: expected 8 distinct categories, found %', v_cat_count;
  END IF;

  RAISE NOTICE 'All checks passed.';
END $$;

COMMIT;

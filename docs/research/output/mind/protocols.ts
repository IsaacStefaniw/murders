/**
 * Mind round — candidate protocols. NOT wired into the app.
 *
 * Written 2026-09-08 under the restructured pipeline. Gate 1 mined mind
 * and skill together from the shared corpus index (48 episodes read once,
 * used for both). Gate 2 opened 48 papers at registry level with the
 * retraction check clean across all of them. Ledgers in ledgers/, a row
 * per card in sources.md, the rest in findings.md, episodes.md, ladder.md.
 *
 * SEVEN cards, not fifteen. The brief is explicit: this is the largest
 * pillar in the library, it is reasonably well graded, this is a depth
 * and honesty round, and "if you come back with fifteen thin additions
 * you have made the library worse." The round's most valuable output is
 * the six regrades in findings.md — three up, three down — and the safety
 * work below.
 *
 * THE SAFETY CARD IS THE POINT OF THIS ROUND. `sitting-check` exists
 * because the pillar drives real guided sessions with voice and its
 * most-used meditation card carried a seven-word safety line. Verified
 * this round from the primary literature: about one in ten people who
 * have meditated report a functionally impairing adverse effect, one in
 * eighty an impairment lasting a month or more, and 60% of those
 * reporting difficulties were meditation teachers — which removes the
 * comfortable explanation that they were practising wrongly.
 *
 * Grade spread: A 0 · B 1 · C 5 · D 1 · E 0.
 *
 * One card was graded below Gate 2's proposal, on the discipline that
 * cost the Work round ten cards: the adverse-effect prevalence behind
 * `sitting-check` is verified and solid, but a monthly self-review has
 * never itself been trialled. Content verified, practice untested, so C.
 *
 * Nothing here reaches a phone until a human has read it.
 */

import type { Protocol } from '@/features/knowledge/protocols';

export const MIND_CANDIDATES: Protocol[] = [
  // ── SAFETY, WHICH THIS PILLAR OWED ────────────────────────────────────
  {
    id: 'sitting-check',
    evidenceLevel: 'C',
    title: 'How is the sitting actually going?',
    pillar: 'mind',
    area: 'health',
    goalDomains: ['health', 'behaviour', 'personal'],
    summary:
      'Once a month, five minutes: is the practice leaving you calmer or more wound up? Louder thoughts, worse sleep, feeling oddly far away from yourself, old things surfacing. Any of those, you stop and say so.',
    why: 'Almost nobody tells you this part, so we will. In careful surveys of people who meditate, about one in ten report an effect that got in the way of their life, and about one in eighty an effect lasting a month or more. The detail that matters most: around sixty per cent of the people reporting difficulties were meditation teachers. That rules out the easy explanation that they were doing it wrong. None of this makes the practice a bad idea, and most people are fine. It makes a monthly look worth five minutes, because the signs are specific and easy to miss from the inside, and because knowing you are allowed to stop is what makes starting safe.',
    attribution: [],
    days: [0],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '11:00', windowMin: 360 },
    energy: 'any',
    tier: 'should',
    neverNag: true,
    sessionType: 'journal',
    safety: 'You may stop at any time, and stopping is not failure. Stop and talk to a doctor or therapist if a sit reliably leaves you more anxious than you started, if your thoughts get louder rather than quieter, if you feel detached from yourself or the world around you, if your sleep worsens, or if old and difficult material starts surfacing and staying. Meditation is not a substitute for treatment. If you are in crisis, Lifeline is 13 11 14.',
  },

  // ── DOING, WHEN DOING IS HARD ─────────────────────────────────────────
  {
    id: 'worry-window',
    evidenceLevel: 'C',
    title: 'A window to worry on purpose',
    pillar: 'mind',
    area: 'health',
    goalDomains: ['health', 'behaviour'],
    summary:
      'A fixed fifteen minutes to worry deliberately. Outside it, when a worry arrives, write one line and put it in the window rather than arguing with it now.',
    why: 'Trying not to worry does not work and you already know that. Giving the worrying a time and a place does something different: it stops the argument happening at every hour of the day, which is the part that exhausts people rather than the worrying itself. The trials behind this are small and mostly in students, so it is worth trying rather than settled. Two practical notes from the research. The window goes in the late afternoon or early evening, never near bedtime, and you use the whole fifteen minutes even if you have run out of worry, because the point is that worry has somewhere to be.',
    attribution: [],
    days: [1, 2, 3, 4, 5],
    durationMin: 15,
    anchor: { kind: 'fixed', start: '17:00', windowMin: 120 },
    energy: 'any',
    tier: 'could',
    neverNag: true,
    finishBeforeSleepMin: 60,
    safety: 'This is for ordinary worry that will not switch off. It is not for panic attacks, and it is not for intrusive images after something frightening or traumatic — deliberately going toward those without support can make them worse, and that is a conversation for a psychologist or your GP.',
  },
  {
    id: 'talk-to-yourself-by-name',
    evidenceLevel: 'C',
    title: 'Use your own name',
    pillar: 'mind',
    area: 'growth',
    goalDomains: ['behaviour', 'personal', 'career'],
    summary:
      'Two minutes before something that matters: describe what is about to happen using your own name and "you", not "I". Then go.',
    why: 'The grammar turns out to do some work. When people talk themselves through a stressful thing using their own name instead of the first person, they tend to appraise it more like a challenge and less like a threat, and they perform a little better under pressure. The effect is small and the studies are mostly short laboratory tasks and speeches, so treat it as a cheap thing to test on yourself rather than a technique that will change your week. It costs two minutes and it works best said out loud, which is why the card puts it just before the thing rather than the night before.',
    attribution: [],
    days: [1, 2, 3, 4, 5],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '08:30', windowMin: 300 },
    energy: 'any',
    tier: 'could',
    neverNag: true,
    safety: 'This is for nerves before something that matters. It is not a technique for grief, and it will not do anything about a situation that is genuinely dangerous rather than daunting.',
  },
  {
    id: 'compassion-break',
    evidenceLevel: 'B',
    title: 'The words you would use for a friend',
    pillar: 'mind',
    area: 'health',
    goalDomains: ['health', 'behaviour', 'personal'],
    summary:
      'Three times a week, five minutes: write or say what you would say to a good friend in your exact situation. In their words, not the ones you use on yourself.',
    why: 'Self-compassion interventions have been tested more thoroughly than most things in this pillar, across many randomised trials, and they reliably move distress and wellbeing by a modest amount. The mechanism is not positive thinking and it is not letting yourself off. It is that most people already know how to be fair and useful to somebody they care about, and simply do not extend it inward, so the exercise is a translation rather than a new skill. Five minutes, three times a week, and the written version is as good as anything more elaborate.',
    attribution: ['Kristin Neff'],
    days: [1, 3, 5],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '19:00', windowMin: 180 },
    energy: 'evening',
    tier: 'could',
    sessionType: 'journal',
    safety: 'Turning kindness toward yourself can bring up the very pain it is meant to soothe, especially the first few times. That is expected and it has a name in the research; it is not a sign you are doing it wrong. If it reliably leaves you distressed rather than steadier, ease off and take it to a therapist rather than pushing through.',
  },
  {
    id: 'two-hours-outside',
    evidenceLevel: 'C',
    title: 'Two hours outside, however it lands',
    pillar: 'mind',
    area: 'health',
    goalDomains: ['health', 'behaviour', 'experience'],
    summary:
      'Two hours a week outside in green space, counted as a weekly total. One long walk or six short ones, the research says it makes no difference.',
    why: 'In a survey of nearly twenty thousand people, the number that separated those reporting good health and wellbeing from those who did not was about two hours a week in nature. Below it, no association; above it, the benefit levelled off. The genuinely useful part is the shape rather than the number: it made no difference whether the two hours came as one long visit or several short ones. That takes the pressure off the weekend, and it means a walk at lunch counts toward the same total as a Sunday in a park. This is a large cross-sectional study, so it tells you what goes together rather than what causes what.',
    attribution: [],
    days: [0, 6],
    durationMin: 60,
    anchor: { kind: 'fixed', start: '10:00', windowMin: 360 },
    energy: 'any',
    tier: 'should',
    safety: 'Two hours is a number from a survey, not a target anybody has to hit — a week with twenty minutes in it is a week with twenty minutes in it. Sun protection, water and footwear are the ordinary outdoor cautions. If low mood or anxiety is the reason this card appealed to you, time outside is worth having and is not a substitute for a GP or a psychologist. Educational structure, not medical advice.',
  },
  {
    id: 'write-it-three-times',
    evidenceLevel: 'C',
    title: 'Write the hard thing three times, then stop',
    pillar: 'mind',
    area: 'health',
    goalDomains: ['health', 'behaviour', 'personal'],
    summary:
      'Three sessions in one week, fifteen minutes each, writing without stopping about the thing that is sitting there. Then deliberately finish. Nobody reads it.',
    why: 'Writing continuously about something difficult, for a few sessions and then stopping, has been tested for decades. The effects are small and they are real, and the design detail people usually drop is the one that matters most: it is meant to end. Three sessions, then done, not a practice you carry indefinitely. It is not about producing anything or reaching a conclusion, which is why nobody reads it and why spelling does not matter. Expect to feel worse immediately afterwards and better over the following days; that pattern is normal and is in the research rather than a sign it went wrong.',
    attribution: [],
    days: [1, 3, 5],
    durationMin: 15,
    anchor: { kind: 'fixed', start: '19:00', windowMin: 120 },
    energy: 'evening',
    tier: 'could',
    neverNag: true,
    sessionType: 'journal',
    finishBeforeSleepMin: 90,
    safety: 'This is for something that has settled enough to look at, not for something you are still inside. Do not use it for recent trauma, for an ongoing situation that is frightening you, or while grief is very raw — writing straight into those without support can make things worse, and a psychologist is the right person for them. Feeling low for an hour or two afterwards is expected; feeling worse for days is a reason to stop and talk to someone. Lifeline is 13 11 14.',
  },
  {
    id: 'say-the-loss-out-loud',
    evidenceLevel: 'D',
    title: 'Say it to one person',
    pillar: 'mind',
    area: 'relationship',
    goalDomains: ['health', 'relationship', 'personal'],
    summary:
      'Every couple of weeks, for as long as you need it: ask one person to listen to what this is actually like. Not to fix it or console you. To hear it.',
    why: 'After a loss the thing most people lack is not advice, it is somebody willing to hear the unedited version without hurrying them toward being alright. There is no trial of this and there is not going to be one, so it is graded early days and honestly. What we do know is that the models people are usually handed, stages and timelines, are not supported, and that grief does not proceed on a schedule. Asking directly for listening rather than comfort is a small thing that makes the asking possible, and it stops when you no longer need it.',
    attribution: [],
    days: [0],
    durationMin: 30,
    anchor: { kind: 'fixed', start: '15:00', windowMin: 300 },
    energy: 'any',
    tier: 'could',
    neverNag: true,
    safety: 'There is no correct timeline for this and nothing here is a standard to measure yourself against. If the grief is not shifting at all after many months, or if you are not safe, that is a GP or a psychologist rather than an app. Lifeline is 13 11 14, and 13YARN is 13 92 76.',
  },
];

/**
 * Skill & Craft round — candidate protocols. NOT wired into the app.
 *
 * Written 2026-09-08 under the restructured pipeline: Gate 1 mined mind
 * and skill together from the shared corpus index (48 episodes, read
 * once, used for both pillars), Gate 2 verified 42 DOIs through the full
 * chain. Ledgers in ledgers/, a row per card in sources.md, the rest in
 * findings.md, episodes.md and ladder.md.
 *
 * SIX cards, not fifteen. The brief calls this "the best-evidenced pillar
 * in the library relative to its size" and says to run it short. The
 * honest yield of a verification round on an already-strong pillar is a
 * handful of well-sourced additions plus the regrades, and this round's
 * most valuable output is arguably not here at all — it is the five
 * proposed regrades in findings.md, four of which move DOWN, including
 * one card resting on a paper that has been retracted.
 *
 * Grade spread: A 0 · B 2 · C 2 · D 1 · E 1.
 *
 * Two candidates were graded down from Gate 2's proposal, on the same
 * discipline that cost the Work round ten cards: grade the practice, not
 * the paper behind it. Pretesting rests on five experiments from one
 * laboratory on one passage, which is "some evidence" rather than "tested
 * and it held up". And the sleep-and-consolidation card asks you to
 * schedule practice a certain way, which is an instruction nobody has
 * tested, however good the underlying meta-analysis is.
 *
 * Nothing here reaches a phone until a human has read it.
 */

import type { Protocol } from '@/features/knowledge/protocols';

export const SKILL_CANDIDATES: Protocol[] = [
  {
    id: 'let-the-gap-stretch',
    evidenceLevel: 'B',
    title: 'Let the gap stretch',
    pillar: 'skill',
    area: 'growth',
    goalDomains: ['personal', 'career', 'behaviour'],
    summary:
      'Once a week, push the things you now know solidly further out — daily to every few days, then to weekly. Keep the shaky ones close.',
    why: 'Spacing your review beats cramming, and that part is settled. The useful question is how far apart, and there is an answer: across more than thirteen hundred people, the best gap scaled with how long you needed to remember something. Roughly a fifth to two fifths of the way out for something you need in a week, and a much smaller fraction of the distance for something you need in a year. In practice that means the gap should keep growing as an item gets solid, which is the opposite of reviewing everything equally. This works alongside your existing review rather than replacing it.',
    attribution: [],
    days: [6],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '09:30', windowMin: 240 },
    energy: 'morning',
    tier: 'could',
  },
  {
    id: 'guess-before-you-read',
    evidenceLevel: 'C',
    title: 'Guess before you read',
    pillar: 'skill',
    area: 'growth',
    goalDomains: ['personal', 'career', 'behaviour'],
    summary:
      'Before you open the chapter or the video, write three questions you think it will answer and your best guess at each. Then read. Being wrong is the point.',
    why: 'Guessing before you learn something looks like a waste of the three minutes and is not. In a series of experiments, people who guessed first remembered more afterwards than people who simply studied for longer, and the gain showed up even on the questions they had guessed wrong. Something about having reached for an answer changes what happens when the real one arrives. The evidence is five experiments from one laboratory on one piece of reading, so this is worth trying rather than settled, and it costs three minutes at the front of something you were going to do anyway.',
    attribution: [],
    days: [1, 2, 3, 4, 5],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '09:00', windowMin: 360 },
    energy: 'any',
    tier: 'could',
    safety: 'You are meant to get these wrong. A wrong guess is doing the work here, so do not tidy them up afterwards or grade yourself on them.',
  },
  {
    id: 'one-behaviour-one-cue',
    evidenceLevel: 'B',
    title: 'One behaviour, one cue',
    pillar: 'skill',
    area: 'growth',
    goalDomains: ['behaviour', 'personal'],
    summary:
      'Pick one small thing and one cue you meet every day. After the kettle goes on, or at seven, whichever you will actually notice. Then let it take the time it takes.',
    why: 'A habit is a behaviour that has stopped costing a decision, and the research on how that happens is more forgiving than the folklore. It takes most people somewhere between two and four months, and the measured spread runs from about three weeks to most of a year, so any single number you have been given is somebody rounding. The cue can be a routine or a clock time; a trial that compared them directly found no difference, so use whichever you will notice. And the finding that matters most on a bad week: missing one day did not measurably set people back.',
    attribution: ['James Clear'],
    days: [0, 1, 2, 3, 4, 5, 6],
    durationMin: 5,
    anchor: { kind: 'wake', offsetMin: 60, windowMin: 480 },
    energy: 'any',
    tier: 'should',
    neverNag: true,
  },
  {
    id: 'sleep-is-the-second-half',
    evidenceLevel: 'C',
    title: 'Sleep is the second half of the session',
    pillar: 'skill',
    area: 'growth',
    goalDomains: ['personal', 'behaviour', 'health'],
    summary:
      'Sunday, five minutes: put the hardest new physical practice on a day you will sleep normally afterwards. Not the night before an early start.',
    why: 'When you learn something with your hands — an instrument, a lift, a language\'s sounds, a craft — a good deal of the consolidation happens while you sleep. Pooled across dozens of studies with more than sixteen hundred people, groups who slept after practising outperformed groups who stayed awake by a moderate margin. The studies used simple laboratory tasks rather than a guitar, and nobody has tested the scheduling instruction itself, which is why this is a planning nudge rather than a promise. It costs nothing to put the hard session on a night you will sleep properly.',
    attribution: [],
    days: [0],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '18:00', windowMin: 180 },
    energy: 'evening',
    tier: 'could',
  },
  {
    id: 'learn-the-ground-first',
    evidenceLevel: 'D',
    title: 'Learn the ground before the technique',
    pillar: 'skill',
    area: 'growth',
    goalDomains: ['personal', 'career'],
    summary:
      'Starting something new: spend one session just getting the map. The names, the shape, the vocabulary. Before any book on how to study it.',
    why: 'Study technique cannot compensate for not knowing what the passage is about. In the study that made this vivid, children who were weak readers but knew the game outperformed strong readers who did not, on every measure, and knowing the subject helped regardless of reading ability. That is one small study from the 1980s in one domain, so treat it as a good prior rather than a finding. It matches what most people notice anyway: the second book in a field is far easier than the first, and it is not because your technique improved.',
    attribution: [],
    days: [6],
    durationMin: 30,
    anchor: { kind: 'fixed', start: '10:00', windowMin: 300 },
    energy: 'morning',
    tier: 'could',
  },
  {
    id: 'finish-on-a-good-one',
    evidenceLevel: 'E',
    title: 'Finish on one you got right',
    pillar: 'skill',
    area: 'growth',
    goalDomains: ['personal', 'behaviour'],
    summary:
      'When the session is nearly done, do one repetition you know you can do well. Then stop there.',
    why: 'This is a craftsman\'s habit rather than a finding, and it is worth saying so plainly. The idea that the last repetition gets consolidated preferentially overnight is not something anyone has shown, and we looked. What is true is smaller and still good: ending on something that went well is a better place to stop, it makes the next session easier to walk into, and walking in is most of the battle. Some of this is the ritual itself, and the ritual works.',
    attribution: [],
    days: [1, 2, 3, 4, 5],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '18:00', windowMin: 300 },
    energy: 'any',
    tier: 'could',
    neverNag: true,
  },
];

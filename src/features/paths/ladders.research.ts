/**
 * The five ladders the research rounds wrote and nothing consumed.
 *
 * `docs/research/output/{training,mind,nutrition,connection,skill}/ladder.md`
 * have existed since the rounds landed. Only `work` was ever coded, so five
 * sixths of the ordering intelligence in this product sat in Markdown: the
 * part that says what comes first, what is wasted until the rung below is
 * solid, and what the coach says at the transition.
 *
 * That is the difference between a coach and a list. Someone who has read
 * forty hours of this material and still cannot start is usually being
 * offered rung four.
 *
 * Every protocol id below is live. The work ladder was written against an
 * unmerged library and most of its rungs were dormant on the day it shipped;
 * these are not, so the ordering takes effect immediately.
 *
 * Where a pillar has more than one ladder they are genuinely different
 * ladders, not easy and hard versions of one. Someone who does not train is
 * not on a lower rung of the training ladder — they are on a ladder whose
 * first step does not require them to become a person who trains.
 */

import type { Ladder } from '@/features/paths/ladder';

/** The route every connection ladder is gated on. */
const SAFETY_ROUTE = '1800RESPECT, 1800 737 732';

/* ── Training ─────────────────────────────────────────────────────────── */

export const TRAINING_LADDER: Ladder = {
  id: 'training-main',
  pillar: 'training',
  variant: 'Already training, at least sometimes',
  whenStuck:
    'Stuck for time: drop to the fifteen-minute rung rather than negotiating with the week. Stuck on a plateau: fix how hard the sets already are before adding any. Most people train slightly easier than they think, and adding volume on top of that only adds fatigue.',
  rungs: [
    {
      n: 1,
      title: 'There is a floor',
      protocolIds: ['strength-minimum-weekly'],
      why: 'The rung with mortality data behind it, and almost all of the benefit arrives in the first half hour a week. Past about two hours the association turns back the other way, so this is a floor to defend rather than a target to beat.',
      coachLine: 'Two sessions. Never a week at zero. That is the whole rung.',
    },
    {
      n: 2,
      title: 'The week collapses and something still happens',
      protocolIds: ['one-set-week'],
      why: 'Deliberately a rung rather than a fallback, because the bad week is the normal week for most people and a ladder that only works in a good one is a ladder for somebody else. The researchers’ own phrase for it is “suboptimal, yet significant”.',
      coachLine: 'Fifteen minutes exists in almost every week. One hard set each of a squat, a press and a pull.',
    },
    {
      n: 3,
      title: 'The sets you already do get better',
      protocolIds: ['add-one-to-your-estimate', 'two-in-the-tank-for-strength'],
      why: 'The cheapest rung on the ladder: nothing new goes in the diary. One corrects a measured tendency to underestimate what you can lift; the other says you do not have to reach failure when strength is the goal.',
      coachLine: 'Nothing new in the week. The same sets, honestly hard.',
    },
    {
      n: 4,
      title: 'Add what the goal actually needs',
      protocolIds: ['load-the-tendons', 'ride-on-cardio-days'],
      why: 'Only once the sets are honest. Tissue lags behind muscle for anyone whose training is going well, and the cardio interaction only matters for people doing both kinds of work.',
    },
  ],
};

export const TRAINING_START_LADDER: Ladder = {
  id: 'training-start',
  pillar: 'training',
  variant: 'Not training at all',
  whenStuck:
    'The gap between nothing and a little is the biggest one in this pillar, and it does not require anybody to reclassify themselves first. If a few hard minutes is too much, make it fewer minutes rather than a conversation about motivation.',
  rungs: [
    {
      n: 1,
      title: 'A few hard minutes, inside an ordinary day',
      protocolIds: ['exercise-snacks'],
      why: 'Three to five hard minutes scattered through a day you were having anyway. No gym, no change of clothes, and no decision to become someone who trains.',
      coachLine: 'Not a gym. Not a programme. Three minutes, a few times, in the day you already have.',
    },
    {
      n: 2,
      title: 'There is a floor',
      protocolIds: ['strength-minimum-weekly'],
      why: 'Only once the first rung has taken. This is the same floor the main ladder starts on, reached from underneath.',
    },
  ],
};

export const TRAINING_OVER_65_LADDER: Ladder = {
  id: 'training-over-65',
  pillar: 'training',
  variant: 'Over sixty-five',
  whenStuck:
    'Adding components did not make it work better in the trials, so the answer to a stall is rarely more. Two or three times a week, kept up for at least three months, is the thing that was actually tested.',
  rungs: [
    {
      n: 1,
      title: 'Steady on your feet',
      protocolIds: ['steady-on-your-feet'],
      why: 'The strongest evidence in the pillar. Balance and resistance together is what prevents falls, the trials ran at least three months, and participants preferred doing it alone at home over the alternatives.',
      coachLine:
        'Balance and resistance, two or three times a week. Not a programme — the research found that adding more to it did not help.',
    },
    {
      n: 2,
      title: 'Something moves fast',
      protocolIds: ['move-one-lift-fast'],
      why: 'Power fades before strength does, and power is what catches you.',
    },
  ],
};

/* ── Mind ─────────────────────────────────────────────────────────────── */

export const MIND_LADDER: Ladder = {
  id: 'mind-main',
  pillar: 'mind',
  variant: 'Low mood, anxiety or rumination',
  /**
   * The strongest ordering claim in the library, and it was implicit.
   * Almost everything in this pillar works less well on top of a sleep
   * debt, and the sleep pillar has better evidence than most of what sits
   * here — so it is asked before a single rung is offered.
   */
  gate: {
    ask: 'Before we add anything: how is the sleep? If that is the problem we fix it first, and half of this gets easier.',
    routeTo: 'sleep',
  },
  whenStuck:
    'Stuck at rung one: make it smaller. The whole logic of that card is that the action comes before the motivation, so the answer to “I could not face it” is a smaller thing, not a pep talk. Stuck because this is depression rather than a bad month: say so kindly and route out. The best-evidenced option in this area is delivered by a person, and naming it is more trustworthy than quietly substituting something weaker.',
  alongside: ['two-hours-outside', 'outdoor-reset', 'cyclic-sighing', 'nsdr', 'phone-parked'],
  rungs: [
    {
      n: 1,
      title: 'Do one small thing',
      protocolIds: ['one-small-act'],
      why: 'The only thing here that reliably works when someone is too flat to do anything effortful. Deliberately not meditation: a person who cannot get out of the house is not helped by being asked to sit with their attention.',
      coachLine: 'Not because you feel like it. That is rather the point.',
    },
    {
      n: 2,
      title: 'Give the difficult thing a container',
      protocolIds: ['worry-window', 'write-it-three-times', 'evening-journal'],
      why: 'Once someone is doing things again, the next problem is that the hard material arrives at all hours. These do not remove it. They give it a time and a place, which is what stops it colonising the rest of the day.',
    },
    {
      n: 3,
      title: 'Change the tone',
      protocolIds: [
        'compassion-break',
        'talk-to-yourself-by-name',
        'best-possible-self',
        'gratitude-letter',
      ],
      why: 'Only worth reaching once one and two are holding. All four are about how you address yourself, and all four are modest, cheap and repeatedly tested.',
    },
    {
      n: 4,
      title: 'Sitting practice, with its safety card attached',
      protocolIds: ['meditation-10', 'open-monitoring', 'loving-kindness', 'sitting-check'],
      why: 'Close to the opposite of how this is usually sold. Meditation is the most demanded thing in the category and it is neither the best-evidenced nor the safest thing in this pillar: about one in ten people who meditate report an effect that got in the way of their life. `sitting-check` ships with any sitting practice or the sitting practice does not ship — a rule, not a preference.',
      coachLine:
        'Ten minutes, and one thing before we start: you can stop at any time, and telling me it is making things worse is a useful answer rather than a failure.',
    },
  ],
};

/* ── Nutrition ────────────────────────────────────────────────────────── */

export const NUTRITION_LADDER: Ladder = {
  id: 'nutrition-main',
  pillar: 'nutrition',
  variant: 'Eating better without counting anything',
  whenStuck:
    'Trying to fix everything at once: rung one only. Asking for a protein number: give a range and never a point — the figure everyone quotes comes from a paper whose own analysis does not support it. Asking about water: below about two per cent of body mass there is no measurable effect on thinking, so drink when thirsty.',
  alongside: ['plan-food-after-a-short-night', 'one-lever-only'],
  rungs: [
    {
      n: 1,
      title: 'The same food, one step back',
      protocolIds: ['less-processed-same-food'],
      why: 'The best-evidenced single lever here. People given matched diets ate five hundred more calories a day on the processed version without choosing to, which makes this a card about the shopping list rather than about willpower — and it changes nothing about how much or when.',
      coachLine:
        'Same list, one step less processed. You are not choosing worse on the other one. The food is doing it.',
    },
    {
      n: 2,
      title: 'Fullness without restriction',
      protocolIds: ['the-version-that-takes-chewing'],
      why: 'Still no amounts and still nothing counted. Food that takes longer to eat leaves people fuller for the same energy, and it compounds with the rung below rather than replacing it.',
    },
    {
      n: 3,
      title: 'When, for people whose day is unusual',
      protocolIds: ['eat-in-the-daylight', 'kitchen-closed'],
      why: 'Deliberately not first, because meal timing is where this field is loudest and its evidence is much smaller than its volume. The popular mechanism is also wrong: the trial usually invoked found no difference in energy expenditure, resting metabolic rate or weight lost — only in hunger. The reason to eat earlier is appetite and overnight glucose.',
    },
    {
      n: 4,
      title: 'The specific goals',
      protocolIds: [
        'protein-before-bed-on-lifting-days',
        'the-cholesterol-plate',
        'what-you-eat-changes-the-night',
      ],
      why: 'Last, because each is for a particular person. Offering all of them to everybody is how a nutrition coach becomes noise.',
    },
  ],
};

/* ── Connection ───────────────────────────────────────────────────────── */

/**
 * Asked before any rung of any connection ladder is offered.
 *
 * Listening better is not the answer to coercion, and a card implying
 * otherwise does harm. This is the one gate in the library that exists to
 * stop a pillar rather than to order it.
 */
const CONNECTION_GATE = {
  ask: 'Is there anyone here you are afraid of, or who uses money, contact or freedom against you?',
  routeTo: SAFETY_ROUTE,
};

export const FRIENDSHIP_LADDER: Ladder = {
  id: 'connection-friendship',
  pillar: 'connection',
  variant: 'Friendship and loneliness',
  gate: CONNECTION_GATE,
  whenStuck:
    'Lonelier the more people they see: they are on the wrong rung. Move from contact to expectations, and say why carefully — the finding is not that their loneliness is a thinking error.',
  rungs: [
    {
      n: 1,
      title: 'More contact',
      protocolIds: ['the-friend-who-wants-to-hear'],
      why: 'If the problem is that you see nobody, this is the rung, and the evidence is clear that supplying access is what raises actual contact.',
    },
    {
      n: 2,
      title: 'What you expect when you walk in',
      protocolIds: ['what-do-you-expect-them-to-think'],
      why: 'If you have contact and still feel unconnected, more contact will not fix it and can make things worse. The interventions that move the felt outcome work on expectations. Getting these two rungs the wrong way round is the most common mistake in this area.',
    },
    {
      n: 3,
      title: 'Solitude counts',
      protocolIds: ['solitude-counts'],
      why: 'Less a rung than a stop sign. Some people are fine, and a coach that only ever pushes upward eventually reads as an accusation.',
    },
  ],
};

export const COUPLE_LADDER: Ladder = {
  id: 'connection-couple',
  pillar: 'connection',
  variant: 'A partner',
  gate: CONNECTION_GATE,
  whenStuck:
    'Stuck in the same argument: that may be the answer rather than the problem. A good share of what long-term couples argue about never resolves, and the couples who do well are not the ones who solved it.',
  rungs: [
    {
      n: 1,
      title: 'Answer the good news properly',
      protocolIds: ['good-news-response'],
      why: 'The best-supported single behaviour in the pillar, and it happens on ordinary days rather than in conflict.',
    },
    {
      n: 2,
      title: 'Say the half you leave out',
      protocolIds: ['say-the-feeling-not-just-the-fact'],
      why: 'The mechanism under this whole pillar is whether the other person feels understood. Reporting the day accurately is not the same as being known.',
    },
    {
      n: 3,
      title: 'One turn where you only listen',
      protocolIds: ['one-turn-just-listening'],
      why: 'Now we are in disagreement, and the order matters: nobody manages this rung who is not already doing the two below it on good days.',
    },
    {
      n: 4,
      title: 'The thing underneath, and the one you keep having',
      protocolIds: ['name-the-fear-under-it', 'the-recurring-one-agreed'],
      why: 'The recurring argument gets an agreement rather than a resolution, because most of them do not get one.',
    },
    {
      n: 5,
      title: 'Add a person',
      protocolIds: ['add-a-person'],
      why: 'The ceiling, named. Self-directed relationship education moves relationship quality by approximately nothing; the same material with a facilitator involved reaches a moderate effect. The top of this ladder is the moment the app says it is not the right tool.',
      coachLine:
        'You have been doing this on your own for months. The evidence says self-directed work does very little here and the same work with someone in the room does a lot. That is not about how hard you have tried.',
    },
  ],
};

export const FAMILY_LADDER: Ladder = {
  id: 'connection-family',
  pillar: 'connection',
  variant: 'Children and the household',
  gate: CONNECTION_GATE,
  whenStuck:
    'The highest-leverage thing here is the standing rule at rung one, not any practice above it. What predicts how children do is the conflict they are exposed to, not the household structure.',
  rungs: [
    {
      n: 1,
      title: 'Keep it between the two of you',
      protocolIds: ['keep-it-between-the-two-of-you'],
      why: 'A standing rule rather than a practice, and the highest-leverage thing in the family block.',
    },
    {
      n: 2,
      title: 'Their side first, fully',
      protocolIds: ['their-concern-first'],
      why: 'Their concern, understood and said back, before yours goes on the table and before any solution. The order is the active ingredient.',
    },
    {
      n: 3,
      title: 'Ask which one they want',
      protocolIds: ['ask-which-one-they-want'],
      why: 'Small, general, and works on anyone.',
    },
  ],
};

/* ── Skill ────────────────────────────────────────────────────────────── */

export const LEARNING_LADDER: Ladder = {
  id: 'skill-learning',
  pillar: 'skill',
  variant: 'Learning something',
  whenStuck:
    'Nothing sticking: check they are on rung one and not rereading. It is the single most common substitution and the library names it as an antipattern for exactly this reason. Plateaued in a physical skill: do not reach for the external focus cue as though it were settled — a reanalysis found publication bias in every analysis of it.',
  rungs: [
    {
      n: 1,
      title: 'Test yourself instead of rereading',
      protocolIds: ['blank-page-recall'],
      why: 'Everything above this rung is an optimisation of it. Closing the book and writing what you remember beats every control condition it has been run against, and the two techniques most people actually use — highlighting and rereading — are already in the library’s antipattern list.',
      coachLine: 'Close it. Blank page. What do you remember?',
    },
    {
      n: 2,
      title: 'Space the testing',
      protocolIds: ['spaced-review', 'let-the-gap-stretch'],
      why: 'Spacing is what turns the rung below from a study session into retention, and the gap should keep growing as an item gets solid — the opposite of reviewing everything equally.',
      coachLine: 'You know that one now. Push it out.',
    },
    {
      n: 3,
      title: 'Load the front of the session',
      protocolIds: ['guess-before-you-read'],
      why: 'Only worth doing once the two below are habitual, because it optimises a session that is already happening. Three minutes of guessing before you open the thing.',
    },
    {
      n: 4,
      title: 'Protect the consolidation',
      protocolIds: ['sleep-is-the-second-half'],
      why: 'A scheduling constraint rather than a practice. The recovery pillar owns the sleep opportunity; this rung owns when you practise.',
    },
    {
      n: 5,
      title: 'Change what you practise, not how',
      protocolIds: ['learn-the-ground-first'],
      why: 'Last because it is the one people reach for first: buying another book about technique when the actual gap is not knowing the subject.',
    },
  ],
};

export const HABIT_LADDER: Ladder = {
  id: 'skill-habit',
  pillar: 'skill',
  variant: 'Making something stick',
  whenStuck:
    'Buying planners: two meta-analyses say the lever is how you feel about starting, not when you scheduled it.',
  rungs: [
    {
      n: 1,
      title: 'One behaviour, one cue',
      protocolIds: ['one-behaviour-one-cue'],
      why: 'One thing, one cue, and an honest timeline: two to four months for most people, with a measured spread running from three weeks to most of a year.',
      coachLine: 'Missing one day doesn’t set you back. That’s measured, not me being nice.',
    },
    {
      n: 2,
      title: 'The planning form that generalises',
      protocolIds: ['trigger-if-then'],
      why: 'The if-then form is one of the few A grades in the library and it carries across every pillar rather than only this one.',
    },
    {
      n: 3,
      title: 'A place to stop',
      protocolIds: ['finish-on-a-good-one'],
      why: 'Honestly graded at the bottom of the scale, and still worth having: ending somewhere deliberate beats ending where you ran out.',
    },
  ],
};

/**
 * Every research ladder that is coded.
 *
 * The carer track from the connection round is deliberately absent. The
 * research says in as many words that it "does not ladder, because carers
 * do not progress through stages at anyone's convenience", and encoding it
 * as one to make this list tidier would contradict the finding. Those cards
 * stay in the library, reachable, `neverNag`, and unordered.
 */
export const RESEARCH_LADDERS: Ladder[] = [
  TRAINING_LADDER,
  TRAINING_START_LADDER,
  TRAINING_OVER_65_LADDER,
  MIND_LADDER,
  NUTRITION_LADDER,
  FRIENDSHIP_LADDER,
  COUPLE_LADDER,
  FAMILY_LADDER,
  LEARNING_LADDER,
  HABIT_LADDER,
];

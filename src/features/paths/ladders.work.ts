/**
 * The Work coach's ladders, from the research round's `ladder.md`.
 *
 * Three of them, because this pillar has a complication no other pillar
 * has: roughly half this audience does not control their own hours, and a
 * single ladder written for a desk job places badly for a nurse, a chef or
 * a driver. The first rung of the desk ladder — the day has an end — is not
 * available to them at all.
 *
 * Most rungs are DORMANT until the research candidates merge. That is
 * deliberate: the ladder is encoded as written so it is correct on the day
 * the content lands, and `isDormant` skips what does not exist yet rather
 * than offering an empty step.
 */

import type { Ladder } from '@/features/paths/ladder';

export const DESK_WORK_LADDER: Ladder = {
  id: 'work-desk',
  pillar: 'leadership',
  variant: 'Work you decide the hours of',
  whenStuck:
    'Nothing above rung one holds while the day never finishes. If the close-down is not happening, that is the thing to fix — not the thing above it.',
  rungs: [
    {
      n: 1,
      title: 'The day has an end',
      protocolIds: ['shutdown-ritual', 'detachment-window'],
      why: 'Nothing above this rung works while work never finishes. Detachment is the best-evidenced recovery variable in the pillar, and the end-of-work plan is what hands it a clean start.',
      coachLine:
        'You closed it out every day this week. That is the one everything else sits on.',
    },
    {
      n: 2,
      title: 'The off-hours are yours',
      protocolIds: ['days-off-are-not-saturday', 'move-after-the-hard-one'],
      why: 'Once work stops, what fills the gap starts to matter — and control over the evening predicted vigour better than either detachment or relaxation did.',
      coachLine: 'An evening you chose beats an evening I designed.',
    },
    {
      n: 3,
      title: 'The meetings and the feedback stop costing so much',
      protocolIds: [
        'start-at-the-minute',
        'stand-for-the-short-ones',
        'cameras-off-is-fine-here',
        'ten-minutes-after-the-bad-one',
        'keep-it-about-the-work',
        'a-rating-is-one-persons-view',
      ],
      why: 'Cheap, mostly free, and they buy back the hours that make rungs one and two possible. Above rung one deliberately: reclaiming meeting time is no use if the reclaimed time goes back into work.',
    },
    {
      n: 4,
      title: 'The job itself changes',
      protocolIds: ['job-crafting-two-columns', 'take-on-the-harder-thing'],
      why: 'Where the evidence gets genuinely good, and where most people never get to, because they are too depleted at rung one to attempt it.',
      coachLine:
        'You have the room now. This is the part that changes the job rather than surviving it.',
    },
    {
      n: 5,
      title: 'The structural conversation',
      protocolIds: ['load-and-control-review', 'burnout-is-not-a-personal-failing'],
      why: 'Naming which of workload, control, reward, community, fairness or values is wrong, and who can change it.',
    },
  ],
};

export const SHIFT_WORK_LADDER: Ladder = {
  id: 'work-shift',
  pillar: 'leadership',
  variant: 'Work with a roster you do not set',
  whenStuck:
    'You cannot protect the end of a day you do not control. Start with seeing the shape of the week and protecting the sleep inside it.',
  rungs: [
    {
      n: 1,
      title: 'The roster is visible',
      protocolIds: [
        'count-the-quick-returns',
        'night-anchor-sleep',
        'night-shift-light',
        'dark-glasses-home',
        'pre-nights-nap',
        'on-shift-nap',
        'caffeine-on-nights',
      ],
      why: 'A nurse cannot decide when work ends. She can see the shape of the week and protect the sleep inside it.',
      coachLine: 'Four nights this week. Here is the shape that protects the drive home.',
    },
    {
      n: 2,
      title: 'The dangerous edges are arranged in advance',
      protocolIds: ['plan-the-ride-home', 'no-drive-after-nights'],
      why: 'Rung two and not rung four, deliberately. This is the one with a crash on the other side of it.',
    },
    {
      n: 3,
      title: 'The days off are real days off',
      protocolIds: ['days-off-are-not-saturday', 'the-break-is-for-how-you-feel', 'heat-work-week'],
      why: 'Weekend never means Saturday here, and the cards are written that way.',
    },
    {
      n: 4,
      title: 'The roster conversation',
      protocolIds: ['ask-for-forward-rotation'],
      why: 'Forward rotation, faster rotation, a say in your own shifts — with a number from rung one to bring to it.',
    },
    {
      n: 5,
      title: 'The structural conversation',
      protocolIds: ['load-and-control-review', 'burnout-is-not-a-personal-failing'],
    },
  ],
};

export const WORK_TRANSITION_LADDER: Ladder = {
  id: 'work-transition',
  pillar: 'leadership',
  variant: 'Between jobs',
  // Separate, temporary, and nothing here is ever chased. Somebody three
  // weeks past a redundancy does not need an adherence score.
  neverNag: true,
  whenStuck: 'Start time, finish time, one reason to leave the house. That is the whole job today.',
  rungs: [
    {
      n: 1,
      title: 'The weekday has a shape',
      protocolIds: ['the-weekday-shape'],
      why: 'The structure, not the search. Best-evidenced thing here, and it asks nothing about applications.',
      coachLine:
        'Start time, finish time, one reason to leave the house. That is the whole job today.',
    },
    {
      n: 2,
      title: 'The doors are listed once',
      protocolIds: ['list-the-doors-once'],
      why: 'While it is still administrative rather than an admission.',
    },
    {
      n: 3,
      title: 'The first rejection is named before it lands',
      protocolIds: ['name-the-rejection-first'],
    },
    {
      n: 4,
      title: 'Rehearsed, not just sent',
      protocolIds: ['rehearse-dont-just-send'],
      why: 'Skills and encouragement together, because separately neither worked.',
    },
  ],
};

export const WORK_LADDERS: Ladder[] = [
  DESK_WORK_LADDER,
  SHIFT_WORK_LADDER,
  WORK_TRANSITION_LADDER,
];

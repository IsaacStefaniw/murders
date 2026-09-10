/**
 * A programme for stopping, rather than a card for tonight.
 *
 * `tonight.ts` handles the hour: the plan, the stand-in, what to say after
 * a lapse. What it never had was an arc — somebody who logs four events in
 * a week gets an account of that week and nothing to walk up. The coach
 * could describe the problem and could not offer a route through it.
 *
 * ── Why this rewards and does not punish ────────────────────────────────
 *
 * The best-evidenced psychosocial approach to exactly this problem is
 * contingency management: reinforcement for abstinence, delivered close to
 * the behaviour and growing as it accumulates. It has been trialled more
 * than almost anything else in the field, and what it reinforces is the
 * abstinence — not the person's account of themselves.
 *
 * It is deliberately NOT copied whole. Classic contingency management
 * escalates a reward with consecutive clean tests and resets it to the
 * floor on a positive one, and the reset is the part this app will not
 * have. `tonight.ts` already says why: "a streak is a thing you can lose
 * and the research on what follows a lapse says the story of loss is what
 * does the damage." A schedule that can be lost hands somebody a reason to
 * stop reporting honestly, and an app that cannot verify anything depends
 * entirely on honest reporting.
 *
 * So the ladder is built on nights ACCUMULATED, never consecutive. Ten
 * clear nights with a lapse in the middle is ten clear nights. The number
 * only goes up, which is the same rule the tally already follows.
 *
 * ── Why there is no punishment ──────────────────────────────────────────
 *
 * Requested, and declined with the reasoning written down rather than
 * quietly dropped: a penalty of exercise for a lapse — "you drank, now run
 * for forty-five minutes". Using training as a consequence for a moral
 * failure is a documented way to damage the training habit, it is a
 * standard feature of disordered exercise, and this app carries an
 * eating-disorder off-ramp on its nutrition cards for the same family of
 * reasons. It would also contradict the sentence the recovery coach says
 * after every lapse: one event, not a verdict.
 *
 * What the person CAN choose in advance is the reward, which is the half
 * of the mechanism the evidence actually supports.
 */

import { behaviourInfo } from '@/features/behaviours/catalog';
import { clearDaysOf, standInFor } from '@/features/behaviours/tonight';
import { toDateKey } from '@/lib/dates';
import type { BehaviourEvent, BehaviourIntention } from '@/types/domain';

export interface Stage {
  n: number;
  /** Clear nights accumulated before this stage opens. */
  from: number;
  title: string;
  /** What this stage is actually about. */
  focus: string;
  /** The practice it adds, where it adds one. */
  protocolId?: string;
  coachLine: string;
}

/**
 * The arc, in the order the research puts it.
 *
 * Stage one is not "stop". It is knowing when it happens, because the
 * pattern engine needs events before it can put anything in front of
 * anybody, and because a plan written against a guessed trigger is a plan
 * for someone else. Stage two is the if-then sentence, which is one of the
 * few grade-A forms in the library. Stage three changes the room rather
 * than the resolve. Stage four is the long one, and it says so.
 */
export const STOP_STAGES: Stage[] = [
  {
    n: 1,
    from: 0,
    title: 'Find out when it actually happens',
    focus:
      'Nothing here works against a guessed trigger. A week or two of honest logging — including the ones you only remember afterwards — is what turns this from advice into your advice.',
    coachLine:
      'Log them as they happen or days later, it does not matter. Four is enough for the pattern to show.',
  },
  {
    n: 2,
    from: 3,
    title: 'One sentence, decided in advance',
    focus:
      'Cue first, and the second half is something you do rather than something you avoid. Plans written as "I will not" leave nothing to do with the moment, which is the moment that needs something to do.',
    protocolId: 'trigger-if-then',
    coachLine: 'When the cue arrives you are not deciding. You already decided.',
  },
  {
    n: 3,
    from: 7,
    title: 'Change the room, not the resolve',
    focus:
      'The reliable finding across this whole area is that friction beats willpower. Making it two steps harder at the moment it is easiest is worth more than any amount of intending.',
    protocolId: 'one-behaviour-one-cue',
    coachLine: 'The version of you at 10pm is not the one making this decision. Decide for them now.',
  },
  {
    n: 4,
    from: 21,
    title: 'The long middle',
    focus:
      'Two to four months is what the habit research measures for most people, and the spread runs from three weeks to most of a year. This stage is mostly nothing happening, which is what it is supposed to look like.',
    protocolId: 'one-small-act',
    coachLine: 'Nothing dramatic from here. That is the stage working, not the stage stalling.',
  },
];

/** Where somebody is on the arc, and what is next. */
export function stageFor(clearNights: number): {
  current: Stage;
  next: Stage | null;
  nightsToNext: number | null;
} {
  let current = STOP_STAGES[0];
  for (const s of STOP_STAGES) if (clearNights >= s.from) current = s;
  const next = STOP_STAGES.find((s) => s.from > clearNights) ?? null;
  return {
    current,
    next,
    nightsToNext: next ? next.from - clearNights : null,
  };
}

/**
 * Where a reward falls due.
 *
 * Accumulated, never consecutive — see the header. The steps grow because
 * escalation is the part of the evidence that carries, and they stop at
 * ninety because a schedule with no end is a subscription rather than a
 * programme.
 */
export const REWARD_NIGHTS = [7, 14, 30, 60, 90];

export interface Reward {
  nights: number;
  /** What the person said they would give themselves at this point. */
  promised: string | null;
  line: string;
}

const KEY = (nights: number) => `reward${nights}`;

/** What somebody promised themselves at a milestone, if anything. */
export const promisedAt = (answers: Record<string, string>, nights: number): string | null =>
  answers[KEY(nights)]?.trim() || null;

/** The answers value that records a promise. */
export const promiseKey = KEY;

/** Milestones already collected, so one is never offered twice. */
export function collectedNights(answers: Record<string, string>): number[] {
  return (answers.rewardsTaken ?? '')
    .split(',')
    .map((n) => Number(n))
    .filter((n) => REWARD_NIGHTS.includes(n));
}

/** The answers value with this milestone marked collected. */
export function markCollected(answers: Record<string, string>, nights: number): string {
  return [...new Set([...collectedNights(answers), nights])].sort((a, b) => a - b).join(',');
}

/**
 * A reward that has come due and has not been taken.
 *
 * Only one at a time, and the smallest outstanding one first: somebody who
 * arrives at thirty nights without having marked seven should be walked
 * through them rather than handed the largest.
 */
export function rewardDue(clearNights: number, answers: Record<string, string>): Reward | null {
  const taken = collectedNights(answers);
  const nights = REWARD_NIGHTS.find((n) => clearNights >= n && !taken.includes(n));
  if (nights === undefined) return null;
  const promised = promisedAt(answers, nights);
  return {
    nights,
    promised,
    line: promised
      ? `${nights} clear nights. You said: ${promised}. Go and do it.`
      : `${nights} clear nights counted. You did not name anything for this one — name what the next one is worth and it will be waiting.`,
  };
}

/** The next milestone to promise something for, so it is chosen in advance. */
export function nextToPromise(
  clearNights: number,
  answers: Record<string, string>,
): number | null {
  return REWARD_NIGHTS.find((n) => n > clearNights && !promisedAt(answers, n)) ?? null;
}

export interface WeekShape {
  events: number;
  behaviours: string[];
  /** True where more than one behaviour ran in the same week. */
  clustered: boolean;
  line: string;
}

/**
 * What the last seven days actually held, across every behaviour at once.
 *
 * The pattern engine works one behaviour at a time, which misses the thing
 * a person notices first: that the drinking and the vaping happen in the
 * same week, usually the same evening. Naming the cluster is more useful
 * than two separate counts, and it is what a coach would say.
 */
export function weekShape(
  intentions: BehaviourIntention[],
  events: BehaviourEvent[],
  todayKey: string,
): WeekShape {
  const from = new Date(todayKey);
  from.setDate(from.getDate() - 6);
  const fromKey = toDateKey(from);

  const recent = events.filter((e) => {
    const k = toDateKey(new Date(e.occurredAt));
    return k >= fromKey && k <= todayKey;
  });
  const byIntention = new Map<string, number>();
  for (const e of recent) byIntention.set(e.intentionId, (byIntention.get(e.intentionId) ?? 0) + 1);

  const behaviours = intentions
    .filter((i) => byIntention.has(i.id))
    .map((i) => behaviourInfo(i.behaviour).label.toLowerCase());

  const clustered = behaviours.length > 1;
  const events_ = recent.length;

  let line: string;
  if (events_ === 0) {
    line = 'Nothing logged this week.';
  } else if (clustered) {
    line = `${events_} this week, across ${behaviours.join(' and ')}. They tend to travel together, and the plan works better aimed at the evening they share than at either one on its own.`;
  } else {
    line = `${events_} this week, all ${behaviours[0]}.`;
  }
  return { events: events_, behaviours, clustered, line };
}

/**
 * What to say to somebody who has just logged something from days ago.
 *
 * Deliberately not the moment note, which is written for the hour it
 * happened and offers a mechanism for tonight. Days later the useful thing
 * is the shape of the week and the next step on the arc.
 */
export function afterTheFact(
  intentions: BehaviourIntention[],
  events: BehaviourEvent[],
  answers: Record<string, string>,
  todayKey: string,
): { shape: WeekShape; stage: Stage; next: string } {
  const week = weekShape(intentions, events, todayKey);
  const { current, next, nightsToNext } = stageFor(clearDaysOf(answers).length);
  const standIn = standInFor(answers);
  return {
    shape: week,
    stage: current,
    next:
      next && nightsToNext !== null
        ? `${current.coachLine} ${nightsToNext} more clear ${nightsToNext === 1 ? 'night' : 'nights'} opens “${next.title.toLowerCase()}”.`
        : `${current.coachLine} Tonight, if it comes up: ${standIn.line}`,
  };
}

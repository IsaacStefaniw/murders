/**
 * The protocols that actually apply to Isaac, surfaced instead of buried.
 *
 * ── The problem this fixes ─────────────────────────────────────────────
 *
 * Isaac, 9 Nov 2026: *"surface all recommended daily protocols for me"*,
 * and separately asked for *"a big journaling arm"*, *"a big
 * mindfulness/wim hoff breathing/meditation arm"*, *"stretching and
 * recovery"*, and *"psychological focusing on leadership, betterment,
 * habits"*.
 *
 * All four already exist. Counted:
 *
 *     mind        56 protocols   <- the LARGEST pillar in the app
 *     connection  45
 *     nutrition   42
 *     leadership  41
 *     training    38
 *     wealth      36
 *     skill       28
 *     sleep       23
 *     longevity   14
 *
 * Mind is the biggest thing in this product and it has never been on a
 * screen he opens. Every one of these renders only inside `/path/[id]`,
 * two taps behind a Coaches tab he stopped visiting. This module is the
 * shortlist, so they are reachable from Today.
 *
 * ── Why a curated list rather than a filter ─────────────────────────────
 *
 * Of 323 protocols, **15 are grade A and 101 are B. The other 193 are C
 * or D.** A screen that printed everything applicable would bury the five
 * things that are actually well evidenced under a hundred and ninety
 * that are not, which is the opposite of surfacing. So this names them,
 * grade first, and says which of his goals each one serves.
 *
 * Nothing here is invented: every id below is a protocol in
 * `features/knowledge`, every grade is the one recorded there, and
 * `assertAllExist` fails the build if an id ever stops existing.
 *
 * ── The finding worth stating once ───────────────────────────────────
 *
 * **Three of the five grade-A protocols in these two pillars are if-then
 * plans**, and if-then planning is the direct mechanism for both of his
 * quit goals:
 *
 *     trigger-if-then   [A]  If-then your three riskiest moments
 *     if-then-plan      [A]  If-then plan the week
 *     admin-if-then     [A]  If-then the three that always slip
 *
 * The app has held grade-A support for exactly what he is trying to do,
 * and showed him none of it. That is the whole session in one line.
 */

import { EVIDENCE_LABELS, protocolById, type EvidenceLevel, type Protocol } from '@/features/knowledge/protocols';

/**
 * His seven stated goals, as the keys everything below hangs off.
 *
 * `nutrition` is deliberately NOT served here and the test asserts that:
 * this module surfaces the **mind and leadership** pillars, and nutrition
 * has its own graded lever ladder in `features/nutrition/plan.ts` plus a
 * written week in `docs/ISAAC_NUTRITION_9NOV.md`. Reaching across to it
 * from here would mean two sources deciding the same thing, which is how
 * `mealPlan` ended up with one writer and no composer.
 */
export type MyGoal =
  | 'quit-drinking'
  | 'quit-vaping'
  | 'gym'
  | 'nutrition'
  | 'habits'
  | 'parent'
  | 'work';

export const GOAL_LABEL: Record<MyGoal, string> = {
  'quit-drinking': 'Quit drinking',
  'quit-vaping': 'Quit vaping',
  gym: 'Smash the gym',
  nutrition: 'Get great at nutrition',
  habits: 'Scientific habits',
  parent: 'Be the best parent',
  work: 'Be excellent at my job',
};

export interface Surfaced {
  protocolId: string;
  /** Which of his goals this serves. First one is the primary. */
  serves: MyGoal[];
  /**
   * When it belongs in his week, in his own clock rather than an anchor.
   * `null` means it is not a daily thing — weekly or monthly, and the
   * screen should not imply otherwise.
   */
  at: string | null;
  /** Why this one for him specifically, not why it works in general. */
  mine: string;
  /**
   * This protocol IS an item the week already holds, named.
   *
   * `week.ts` prints "One line in the log" at 21:45; the thing behind it
   * is `urge-log`, graded B. Surfacing it without saying so would put two
   * entries at the same minute claiming to be different practices — which
   * is exactly what his routines screen used to do, five times over, and
   * why he stopped opening it.
   */
  alreadyInWeek?: true;
}

/* ── The spine: the three grade-A if-then plans ─────────────────────── */

/**
 * If-then planning, and why it leads.
 *
 * It is the best-evidenced single technique in behaviour change and it is
 * the exact shape of his problem: a predictable trigger at a predictable
 * time. His chain is 17:30-20:30 hard stretch -> stress -> vape, boys
 * asleep -> quiet house -> the drink. Every link has a time on it, and an
 * if-then is a decision made before the trigger rather than during it.
 *
 * `urge-tonight-plan` (B) is the daily version of the same idea and is
 * already in his week at 17:30. These three are the structural version:
 * written once, then standing.
 */
export const SPINE: Surfaced[] = [
  {
    protocolId: 'trigger-if-then',
    serves: ['quit-drinking', 'quit-vaping'],
    at: null,
    mine: 'Your three riskiest moments are already named and all three have a clock on them: Monday 19:15 after futsal, the quiet house at 20:30, and a named event. Write the if-then for each once and it stands for all of them.',
  },
  {
    protocolId: 'if-then-plan',
    serves: ['work', 'habits'],
    at: null,
    mine: 'Sunday, with the thirty minutes that already exist for food. The week is declared, so this is about the three things most likely to slip in it.',
  },
  {
    protocolId: 'admin-if-then',
    serves: ['work'],
    at: null,
    mine: 'The things that always slip. You said visible output and finishing things, and this is the half of that which is not about effort.',
  },
];

/* ── Daily, and genuinely daily ────────────────────────────────────── */

/**
 * The ones that belong in a day, placed at his times rather than at an
 * anchor the scheduler would resolve wrongly.
 *
 * `detachment-window` is the find. It is graded B, it is called "the off
 * switch", and it is a sixty-minute deliberate detachment from work — and
 * his 20:30-22:00 window is ninety blank minutes that the whole plan says
 * needs a job. The app had the answer to its own hardest question in the
 * mind pillar the entire time.
 */
export const DAILY: Surfaced[] = [
  {
    protocolId: 'launch-pad',
    serves: ['work', 'habits'],
    at: '07:45',
    mine: 'Ten minutes before the 08:00 block, so the ninety minutes start on something decided rather than on email.',
  },
  {
    protocolId: 'micro-breaks',
    serves: ['work'],
    at: '10:00',
    mine: 'Hourly through the morning block. The cheapest thing on this list and the one most likely to be skipped.',
  },
  {
    protocolId: 'cyclic-sighing',
    serves: ['habits', 'quit-vaping'],
    at: '17:25',
    mine: 'Five minutes in the car before pickup — the start of the three hard hours. You asked for a breathing arm, and this is the one with a controlled trial behind it rather than a following.',
  },
  {
    protocolId: 'detachment-window',
    serves: ['work', 'parent', 'quit-drinking'],
    at: '20:30',
    mine: 'This is the answer to the ninety blank minutes. Graded B, called "the off switch", and it was sitting in the mind pillar while the plan called that window its hardest unsolved problem.',
  },
  {
    protocolId: 'urge-log',
    serves: ['habits', 'quit-drinking', 'quit-vaping'],
    at: '21:45',
    alreadyInWeek: true,
    mine: 'This is already in your week as "one line in the log" — this is its name and its grade. Five minutes, and in twelve weeks it tells you when the urges actually land rather than when you assume they do.',
  },
];

/* ── Weekly and monthly ────────────────────────────────────────────── */

/**
 * Not daily, and labelled as such.
 *
 * A weekly practice printed on a daily screen becomes a thing he fails
 * six days out of seven, which is the mechanism this product exists not to
 * have. `at: null` everywhere here is deliberate.
 */
export const PERIODIC: Surfaced[] = [
  {
    protocolId: 'evening-journal',
    serves: ['habits', 'quit-drinking'],
    at: null,
    mine: 'The longer form of the 21:45 line, for a night that needs more than one. Use it instead of the log, never as well — two journals is how both stop.',
  },
  {
    protocolId: 'decision-journal',
    serves: ['work', 'habits'],
    at: null,
    mine: 'The other half of the journaling arm, and the half that serves the job. Write the decision and the reasoning before the outcome is known — it is the only way to find out later whether you were right or lucky.',
  },
  {
    protocolId: 'the-weekday-shape',
    serves: ['work', 'parent'],
    at: null,
    mine: 'A start time, a finish time, and one thing outside. You already have all three — 08:00, 16:30, and futsal. This is the protocol that says that is the shape, not a compromise.',
  },
  {
    protocolId: 'write-alone-then-pool',
    serves: ['work'],
    at: null,
    mine: 'Grade A, five minutes, and it is about meetings rather than about you. Write alone first, then pool.',
  },
  {
    protocolId: 'the-break-is-for-how-you-feel',
    serves: ['work'],
    at: null,
    mine: 'Grade A. Take the break for the right reason — not when the task is done, but when you need it.',
  },
  {
    protocolId: 'one-person-a-week',
    serves: ['parent', 'habits'],
    at: null,
    mine: 'Your own profile says it twice: plans with other people in them survive a bad week. Futsal is one. This is the other, and it costs fifteen minutes.',
  },
  {
    protocolId: 'notification-audit',
    serves: ['work', 'parent'],
    at: null,
    mine: 'Twenty minutes, once. You already put the phone in another room at 19:00; this is the version that works during the day too.',
  },
  {
    protocolId: 'cue-audit',
    serves: ['habits', 'quit-drinking', 'quit-vaping'],
    at: null,
    mine: 'Monthly. Pair it with naming next month’s two or three events — the same half hour, and the same question: what is in the house, and what is on the calendar.',
  },
  {
    protocolId: 'stress-buffer-session',
    serves: ['quit-vaping', 'gym'],
    at: null,
    mine: 'Move it out on the heavy days. You named work pressure as one of three stresses, and four lifts and a game a week already are this protocol — worth knowing that is what they are doing.',
  },
  {
    protocolId: 'stress-reappraisal',
    serves: ['work', 'habits'],
    at: null,
    mine: 'Read the nerves as readiness. Five minutes, and it applies to the hard conversation rather than the hard set.',
  },
];

/* ── Reading it back ───────────────────────────────────────────────── */

export const ALL: Surfaced[] = [...SPINE, ...DAILY, ...PERIODIC];

export interface Resolved extends Surfaced {
  protocol: Protocol;
  grade: EvidenceLevel;
  gradeLabel: string;
}

/**
 * Join the shortlist to the library.
 *
 * An unknown id is dropped rather than rendered as a blank card, and
 * `missingIds` reports it so a test can fail instead of a screen quietly
 * losing a row. Silent omission is how the product lost the nutrition
 * coach for six weeks.
 */
export function resolve(list: Surfaced[] = ALL): { items: Resolved[]; missingIds: string[] } {
  const items: Resolved[] = [];
  const missingIds: string[] = [];
  for (const s of list) {
    const protocol = protocolById(s.protocolId);
    if (!protocol) {
      missingIds.push(s.protocolId);
      continue;
    }
    items.push({
      ...s,
      protocol,
      grade: protocol.evidenceLevel,
      gradeLabel: EVIDENCE_LABELS[protocol.evidenceLevel],
    });
  }
  return { items, missingIds };
}

/** Grade A first, then B, and within a grade the shorter one first. */
const GRADE_RANK: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4 };

export function byGrade(items: Resolved[]): Resolved[] {
  return [...items].sort(
    (a, b) =>
      (GRADE_RANK[a.grade] ?? 9) - (GRADE_RANK[b.grade] ?? 9) ||
      a.protocol.durationMin - b.protocol.durationMin,
  );
}

/** What a given goal is served by, best-evidenced first. */
export function forGoal(goal: MyGoal): Resolved[] {
  return byGrade(resolve().items.filter((x) => x.serves.includes(goal)));
}

/**
 * Today's, in clock order.
 *
 * Only the ones with a time. The spine and the periodic ones are
 * deliberately excluded: a standing if-then is not a thing you do today,
 * and printing it as one makes it a daily failure.
 */
export function today(): Resolved[] {
  return resolve(DAILY)
    .items.filter((x) => x.at !== null)
    .sort((a, b) => (a.at ?? '').localeCompare(b.at ?? ''));
}

/**
 * Total minutes the daily ones ask for. Honest, so it can be judged.
 *
 * It reads 85, and 85 minutes a day on top of four lifts and a game would
 * be absurd. Sixty of it is `detachment-window`, which fills the
 * 20:30-22:00 block that is already blank and that the plan calls its
 * hardest unsolved problem — so it adds nothing to the day, it gives
 * existing empty time a job. Another five is `urge-log`, which is already
 * in the week.
 *
 * **The genuinely new demand is twenty minutes**: the launch pad, hourly
 * breaks, and five minutes of breathing in the car. `addedMinutes` is
 * that number, and it is the one worth showing on a screen — a total that
 * counts time he already has as time being asked for is the kind of number
 * that makes somebody close an app.
 */
export const dailyMinutes = (): number =>
  today().reduce((sum, x) => sum + x.protocol.durationMin, 0);

/** Daily minutes this actually ADDS, excluding what the week already holds. */
export const addedMinutes = (): number =>
  today()
    .filter((x) => !x.alreadyInWeek && x.protocolId !== 'detachment-window')
    .reduce((sum, x) => sum + x.protocol.durationMin, 0);

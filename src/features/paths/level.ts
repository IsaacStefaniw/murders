/**
 * Level — how a pathway scales from someone's first week to their fifth year.
 *
 * The problem this solves is not "beginners need easier workouts". It is
 * that a single programme handed to a first-timer and a decade-deep lifter
 * is wrong for both: the first is hurt by it and the second is bored by it,
 * and both leave. Every pathway has the same shape of problem — a first
 * budget and a tenth are not the same exercise, and neither is a first
 * fifteen-minute sit and a forty-five-minute one.
 *
 * Three rules decide the level, and they exist to stop the two failure
 * modes at either end.
 *
 * A CLAIM SETS THE FLOOR, UP TO A POINT. Someone who says they have
 * trained for years should not be made to prove it by grinding through a
 * beginner block — that is an insult and they will delete the app. So the
 * declared answer is believed, immediately, up to `established`.
 *
 * THE TOP RUNG IS EARNED, NEVER CLAIMED. `advanced` is not on the intake
 * form. It requires logged work over real time, and for training it
 * additionally requires strength that is actually advanced. This is the
 * gate: an advanced block contains top singles and overreaching weeks that
 * are genuinely unsafe for someone who selected the word optimistically,
 * and a form field is not evidence.
 *
 * STEPPING BACK IS ALWAYS AVAILABLE AND NEVER AUTOMATIC. If the plan is
 * too hard, the person says so and the level drops. We never demote
 * someone silently for not logging — a thin log is far more often a busy
 * fortnight than a lie, and an app that quietly decides you were
 * exaggerating is an app people stop being honest with.
 */

import type { PathId } from './definitions';

export type PathLevel = 'foundation' | 'developing' | 'established' | 'advanced';

export const LEVEL_ORDER: PathLevel[] = ['foundation', 'developing', 'established', 'advanced'];

export const levelRank = (level: PathLevel): number => LEVEL_ORDER.indexOf(level);

/**
 * What each rung is called to the person on it. Deliberately not
 * "beginner/intermediate/advanced" — nobody enjoys being told they are a
 * beginner at their own life, and "foundation" describes the work rather
 * than ranking the person.
 */
export const LEVEL_LABEL: Record<PathLevel, string> = {
  foundation: 'Foundation',
  developing: 'Developing',
  established: 'Established',
  advanced: 'Advanced',
};

/** One line explaining what changes at this level, shown beside the label. */
export const LEVEL_BLURB: Record<PathId, Record<PathLevel, string>> = {
  training: {
    foundation: 'Fewer movements, lighter loads, a technical focus every session. The point is to learn the patterns and finish every session able to do it again.',
    developing: 'Barbell work comes in, sets go up, loads stop being cautious. Enough volume to drive progress, not enough to bury a week.',
    established: 'Full prescribed volume and intensity, a peak week, and a heavy top set on the lift you care most about.',
    advanced: 'Higher intensity, an overreach week before the deload, and top singles. This is only offered once the log supports it.',
  },
  nutrition: {
    foundation: 'One change at a time — protein at breakfast before anything else moves.',
    developing: 'Targets for protein and fibre, and a weekly weight trend rather than a daily number.',
    established: 'Full targets, meal timing around training, and adjustment from your own trend.',
    advanced: 'Periodised intake that moves with the training block, and a maintenance phase that is planned rather than accidental.',
  },
  money: {
    foundation: 'One account, one automatic transfer, one number to watch.',
    developing: 'A savings rate, a buffer target, and the first debt ordered properly.',
    established: 'Full ladder — buffer, debt, invested percentage, tracked monthly.',
    advanced: 'Allocation across accounts and a drawdown plan, reviewed quarterly.',
  },
  work: {
    foundation: 'One protected block a day. Ending the day knowing what tomorrow starts with.',
    developing: 'Two blocks, a weekly shape, and the first hard boundary defended.',
    established: 'Full executive block — deep work, delegation, and a review that actually changes next week.',
    advanced: 'Quarterly arcs with the week built backwards from them.',
  },
  recovery: {
    foundation: 'The next hour is the whole plan. One tool that works, available instantly.',
    developing: 'Trigger patterns named, and a counter-move ready before the moment arrives.',
    established: 'The pattern is mapped and the interventions are timed to it.',
    advanced: 'Maintenance — the plan is for the year, not the night.',
  },
  relationship: {
    foundation: 'One ritual that survives a bad week.',
    developing: 'A weekly rhythm and one conversation that has been avoided.',
    established: 'Rituals, repair, and a shared plan you both actually agreed to.',
    advanced: 'The long arc — what you are building over years, revisited each season.',
  },
  family: {
    foundation: 'One outing in the diary before the week starts.',
    developing: 'A weekly adventure and regular one-on-one time with each child.',
    established: 'Traditions, adventures, and time protected against work.',
    advanced: 'A family year — seasons, trips, and the traditions that outlast childhood.',
  },
};

/**
 * What a level costs to reach, per pathway.
 *
 * Sessions and weeks BOTH matter, and the weeks matter more. Twenty
 * sessions in a fortnight is a burst; twenty across three months is a
 * habit, and only the second one earns a harder programme. This is why
 * the gate cannot be gamed by a keen weekend.
 */
export interface LevelThreshold {
  /** Logged sessions in this pathway. */
  sessions: number;
  /** Distinct calendar weeks in which at least one session was logged. */
  weeks: number;
}

const NO_GATE: LevelThreshold = { sessions: 0, weeks: 0 };

export const LEVEL_GATES: Record<PathId, Record<PathLevel, LevelThreshold>> = {
  training: {
    foundation: NO_GATE,
    developing: { sessions: 12, weeks: 6 },
    established: { sessions: 36, weeks: 16 },
    advanced: { sessions: 100, weeks: 40 },
  },
  nutrition: {
    foundation: NO_GATE,
    developing: { sessions: 10, weeks: 4 },
    established: { sessions: 30, weeks: 12 },
    advanced: { sessions: 90, weeks: 32 },
  },
  money: {
    foundation: NO_GATE,
    developing: { sessions: 4, weeks: 4 },
    established: { sessions: 12, weeks: 12 },
    advanced: { sessions: 30, weeks: 32 },
  },
  work: {
    foundation: NO_GATE,
    developing: { sessions: 10, weeks: 4 },
    established: { sessions: 30, weeks: 12 },
    advanced: { sessions: 90, weeks: 32 },
  },
  recovery: {
    foundation: NO_GATE,
    developing: { sessions: 8, weeks: 4 },
    established: { sessions: 24, weeks: 12 },
    advanced: { sessions: 60, weeks: 26 },
  },
  relationship: {
    foundation: NO_GATE,
    developing: { sessions: 6, weeks: 6 },
    established: { sessions: 16, weeks: 16 },
    advanced: { sessions: 40, weeks: 40 },
  },
  family: {
    foundation: NO_GATE,
    developing: { sessions: 6, weeks: 6 },
    established: { sessions: 16, weeks: 16 },
    advanced: { sessions: 40, weeks: 40 },
  },
};

/** What the log actually shows. Computed, never stored. */
export interface LevelEvidence {
  sessions: number;
  weeks: number;
  /**
   * Pathway-specific proof required for the top rung on top of volume —
   * for training, strength standards. Pathways without one pass `true`
   * and are gated on volume alone.
   */
  standardsMet: boolean;
}

export const EMPTY_EVIDENCE: LevelEvidence = { sessions: 0, weeks: 0, standardsMet: false };

const meets = (ev: LevelEvidence, gate: LevelThreshold): boolean =>
  ev.sessions >= gate.sessions && ev.weeks >= gate.weeks;

/**
 * The highest level this log supports on its own, ignoring what the
 * person said about themselves.
 */
export function earnedLevel(path: PathId, evidence: LevelEvidence): PathLevel {
  const gates = LEVEL_GATES[path];
  let earned: PathLevel = 'foundation';
  for (const level of LEVEL_ORDER) {
    if (level === 'advanced' && !evidence.standardsMet) break;
    if (meets(evidence, gates[level])) earned = level;
    else break;
  }
  return earned;
}

/**
 * The level a claim buys immediately. Capped below `advanced` on purpose:
 * that is the whole gate, and no intake answer opens it.
 */
export function claimedFloor(claim: PathLevel | null | undefined): PathLevel {
  if (!claim) return 'foundation';
  return levelRank(claim) > levelRank('established') ? 'established' : claim;
}

/**
 * The level actually used to build the programme.
 *
 * The claim and the log are combined by taking the higher — believing the
 * person about their past and the log about their present, whichever says
 * more. A voluntary step-back then caps the result, because a person
 * telling us the plan is too hard is better evidence than either.
 */
export function levelFor(
  path: PathId,
  claim: PathLevel | null | undefined,
  evidence: LevelEvidence = EMPTY_EVIDENCE,
  stepBackTo?: PathLevel | null,
): PathLevel {
  const floor = claimedFloor(claim);
  const earned = earnedLevel(path, evidence);
  const combined = levelRank(earned) > levelRank(floor) ? earned : floor;
  if (stepBackTo && levelRank(stepBackTo) < levelRank(combined)) return stepBackTo;
  return combined;
}

export interface LevelProgress {
  current: PathLevel;
  next: PathLevel | null;
  /** Sessions and weeks still outstanding; zero once that half is met. */
  sessionsToGo: number;
  weeksToGo: number;
  /** Non-null when volume is met but a pathway-specific standard is not. */
  blockedBy: string | null;
  /** One sentence for the hub: what unlocks the next rung. */
  text: string;
}

/**
 * What stands between here and the next rung, in the person's own terms.
 *
 * Shown in the pathway hub so the ladder is visible rather than a surprise
 * — a level you can see yourself climbing is a reason to come back, and a
 * level that changes without warning is a bug report.
 */
export function levelProgress(
  path: PathId,
  current: PathLevel,
  evidence: LevelEvidence,
  standardText = 'the strength standards for this level',
): LevelProgress {
  const idx = levelRank(current);
  const next = idx < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[idx + 1] : null;
  if (!next) {
    return {
      current,
      next: null,
      sessionsToGo: 0,
      weeksToGo: 0,
      blockedBy: null,
      text: 'Top of the ladder. From here the block adapts to your numbers rather than your level.',
    };
  }

  const gate = LEVEL_GATES[path][next];
  const sessionsToGo = Math.max(0, gate.sessions - evidence.sessions);
  const weeksToGo = Math.max(0, gate.weeks - evidence.weeks);
  const volumeMet = sessionsToGo === 0 && weeksToGo === 0;
  const blockedBy = next === 'advanced' && volumeMet && !evidence.standardsMet ? standardText : null;

  if (blockedBy) {
    return { current, next, sessionsToGo, weeksToGo, blockedBy, text: `${LEVEL_LABEL[next]} also needs ${blockedBy}.` };
  }
  if (volumeMet) {
    return { current, next, sessionsToGo, weeksToGo, blockedBy, text: `${LEVEL_LABEL[next]} is unlocked — the next block steps up.` };
  }

  const parts: string[] = [];
  if (sessionsToGo > 0) parts.push(`${sessionsToGo} more ${sessionsToGo === 1 ? 'session' : 'sessions'}`);
  if (weeksToGo > 0) parts.push(`${weeksToGo} more ${weeksToGo === 1 ? 'week' : 'weeks'}`);
  return {
    current,
    next,
    sessionsToGo,
    weeksToGo,
    blockedBy,
    text: `${parts.join(' and ')} to reach ${LEVEL_LABEL[next]}.`,
  };
}

/**
 * Distinct ISO weeks touched by a set of date keys.
 *
 * Counting weeks rather than days is what makes the gate about
 * persistence: five sessions in one week counts once.
 */
export function distinctWeeks(dateKeys: string[]): number {
  const weeks = new Set<string>();
  for (const key of dateKeys) {
    const [y, m, d] = key.split('-').map(Number);
    if (!y || !m || !d) continue;
    const date = new Date(y, m - 1, d);
    // Monday-anchored week key, computed locally so a Sunday session in
    // Sydney is not filed under the previous week in UTC.
    const day = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - day);
    weeks.add(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`);
  }
  return weeks.size;
}

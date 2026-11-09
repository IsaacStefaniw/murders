/**
 * The week, declared rather than computed.
 *
 * ── Why a constant beats a scheduler here ───────────────────────────────
 *
 * `features/planner` exists to answer "where does this go?" — it places
 * routines into days against work hours, energy and competing items. For
 * one user with a fixed week that question has a known answer, and the
 * scheduler's attempts to re-derive it are what made the app wrong.
 *
 * The specific mechanism: `protocols.startFor` resolves an anchor ONCE at
 * routine creation and writes a SEED into `preferredStart`. Then
 * `detectSlotMismatch` relocates body-clock routines into whatever slot
 * looks best and writes that back permanently. Measured across the old
 * cohort, 46 of 72 active routines drifted fifteen minutes or more from
 * the time the screen printed, and 35 drifted an hour or more. Isaac's own
 * screen read 17:30 for a strength session on a day he finished at 16:30
 * and collected two children.
 *
 * Nothing below can drift, because nothing below is derived.
 *
 * ── The slots, and why these and not others ─────────────────────────────
 *
 * He has three kinds of time available and one of them is a trap:
 *
 *   lunch, any weekday     ~30 min   midday affinity 0.30
 *   Tue & Fri 17:00        ~30 min   evening affinity 0.68  <- his best
 *   05:30 before the boys   50 min   morning affinity 0.22  <- his worst
 *
 * Those are his own recorded numbers. He asked for the 05:30 slot and it
 * is deliberately not used: it is the slot he already does not use (the
 * note beside the figure reads "believes in the 06:30 gym session, does it
 * about a fifth of the time"), and it costs an hour of a 6½-hour night
 * that the boys already raid. Sleep is the rung the chain in `profile.ts`
 * rests on — short sleep raises impulsivity, which makes both the vape and
 * the drink harder to refuse the following evening. Funding a session from
 * it spends goal one to buy goal three.
 *
 * It survives as `MAKEUP_SLOT`: the place a missed session goes, used on
 * purpose a handful of times a year rather than planned four times a week
 * and used once. A slot that is planned and missed is how an app teaches
 * somebody to ignore it.
 *
 * ── Monday ────────────────────────────────────────────────────────────
 *
 * Futsal at 18:15, every week. It is the most durable item in the week —
 * his own profile says twice that "plans with other people in them survive
 * a bad week; plans with only themselves in them do not" — and it supplies
 * the conditioning, which is why no session below carries an interval
 * finisher.
 *
 * So Monday is a leg day already. Repeated sprinting and decelerating is a
 * large lower-body load, and squats at Monday lunch plus futsal at 18:15
 * is two hard leg sessions in nine hours. Monday lunch lifts UPPER, lower
 * body sits 48 hours after the game and 72 hours before the next, and
 * Monday evening overrides four items of the daily spine.
 */

import { FREE_EVENINGS, LUNCH_SESSION_MIN, ME } from '@/features/me/profile';
import type { Weekday } from '@/types/domain';

export type SessionSlot = 'lunch' | 'evening' | 'makeup';

export interface PlannedSession {
  /** The block session this day runs. Joins to `ProgrammeSession.title`. */
  session: 'Upper A' | 'Upper B' | 'Lower A' | 'Lower B';
  /** Squat-led, bench-led, hinge-led, overhead-led. */
  mainLift: 'Squat' | 'Bench press' | 'Deadlift' | 'Overhead press';
  slot: SessionSlot;
  start: string;
  minutes: number;
}

/**
 * The four lifting days.
 *
 * Even 2-and-2 upper/lower, which is what he chose. His squat sits at
 * 0.85x his bench where 1.30 is typical, so the lower body is 30–35%
 * behind and a lower bias would close it faster — but a lopsided plan in
 * the fortnight he quits drinking and vaping is a plan he resents, and
 * four sessions completed beat three sessions resented. Block two is where
 * that gap gets pointed at.
 */
export const LIFTING: Partial<Record<Weekday, PlannedSession>> = {
  // Monday: upper, because the legs are spoken for at 18:15.
  1: {
    session: 'Upper A',
    mainLift: 'Bench press',
    slot: 'lunch',
    start: '12:15',
    minutes: LUNCH_SESSION_MIN,
  },
  // Tuesday: partner collects, so his best slot of the week is free. Upper
  // again — legs are still sore from the game and it does not matter for
  // an overhead press.
  2: {
    session: 'Upper B',
    mainLift: 'Overhead press',
    slot: 'evening',
    start: '17:00',
    minutes: 30,
  },
  // Wednesday: 48 hours after futsal. The legs are back.
  3: {
    session: 'Lower A',
    mainLift: 'Squat',
    slot: 'lunch',
    start: '12:15',
    minutes: LUNCH_SESSION_MIN,
  },
  // Friday: partner collects again, and 72 hours before the next game.
  5: {
    session: 'Lower B',
    mainLift: 'Deadlift',
    slot: 'evening',
    start: '17:00',
    minutes: 30,
  },
};

/** Thursday lifts nothing. A walk. Not a bonus session and not a spare slot. */
export const REST_DAYS: Weekday[] = [4, 6, 0];

/**
 * Where a missed session goes. Never where a session is planned.
 *
 * Friday lunch first, because it costs nothing. Only then the 05:30 that
 * costs an hour of sleep.
 */
export const MAKEUP_SLOT = { day: 5 as Weekday, start: '12:15', fallback: '05:30' } as const;

/* ── The daily spine ─────────────────────────────────────────────────── */

export interface SpineItem {
  at: string;
  what: string;
  /** Why it is at this minute, where the minute is the point. */
  because?: string;
}

/**
 * The same every weekday, so there is nothing to decide on a Tuesday.
 *
 * Two of these are load-bearing and the rest are furniture:
 *
 * **17:30 — decide tonight.** `urge-tonight-plan` is graded B and its
 * whole mechanism is that it happens BEFORE the trigger. 17:30 is the
 * start of the three-hour hard stretch; 20:30 is the end of it. Putting
 * the decision at 20:30 asks the tired version of him to make it.
 *
 * **19:30 — kitchen closed.** Three hours before bed, and he is mid bath
 * and books, which is the best enforcement there is. It also collides with
 * `protein-before-bed-on-lifting-days`, graded C, which wants protein in
 * the last hour before bed. The close wins: a C-graded marginal gain does
 * not get to open the door the primary goal depends on staying shut.
 */
export const SPINE: SpineItem[] = [
  { at: '06:45', what: 'Protein breakfast', because: 'It is a third of the day’s protein and takes five minutes' },
  { at: '08:00', what: 'Deep work, 90 minutes', because: 'Work affinity 0.85 in the morning, and nobody is reachable yet' },
  { at: '17:30', what: 'Decide tonight', because: 'Before the hard stretch, not after it' },
  { at: '18:00', what: 'Dinner' },
  { at: '18:30', what: 'Ten-minute walk, boys come', because: 'post-meal-walk (B), the kitchen close, and the boys, in one' },
  { at: '19:00', what: 'Bath and books. Phone in another room' },
  { at: '19:30', what: 'Kitchen closed' },
  { at: '21:45', what: 'One line in the log' },
  { at: '22:00', what: 'Bed' },
];

/**
 * Monday replaces four of those.
 *
 * He is NOT written off for bedtime: the game ends about 19:15 and the
 * boys are not asleep until 20:00–20:30, so he is home for lights-out.
 * What he misses is dinner with them and the walk. An earlier draft of
 * this plan gave Monday up entirely on a wrong bedtime.
 */
export const MONDAY_OVERRIDE: SpineItem[] = [
  { at: '16:45', what: 'Pre-game carbs', because: 'Futsal runs on glycogen. 60–80 g, low fat, low fibre' },
  { at: '17:45', what: '500 ml water, pinch of salt' },
  { at: ME.futsalStart, what: 'Futsal' },
  { at: '19:30', what: 'Post-game dinner — no cooking', because: 'Home hungry and tired is when a recipe becomes a takeaway' },
  { at: '20:00', what: 'Home for lights-out' },
];

/** Items the Monday override removes rather than replaces. */
export const MONDAY_DROPS = ['18:00', '18:30'];

/**
 * The spine for a given weekday, Monday handled.
 *
 * Sorted by time rather than by which list an item came from, because the
 * screen reads it top to bottom and a Monday that printed the override
 * after the spine would say "bed" before "futsal".
 */
export function spineFor(day: Weekday): SpineItem[] {
  if (day !== ME.futsalDay) return SPINE;
  const kept = SPINE.filter((i) => !MONDAY_DROPS.includes(i.at) && i.at !== '19:30');
  return [...kept, ...MONDAY_OVERRIDE].sort((a, b) => a.at.localeCompare(b.at));
}

/** What today holds, if anything. */
export function sessionFor(day: Weekday): PlannedSession | undefined {
  return LIFTING[day];
}

/** True where the partner collects, so a 17:00 session is possible. */
export const isFreeEvening = (day: Weekday): boolean => FREE_EVENINGS.includes(day);

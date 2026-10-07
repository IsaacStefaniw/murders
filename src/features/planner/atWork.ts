/**
 * The times the plan asks for that the person is at work.
 *
 * ── The sentence nobody was saying ──────────────────────────────────────
 *
 * A review run as the target persona, at 06:40 on a Tuesday, trying to
 * answer one question: is today a gym day, before or after work?
 *
 * Alex works 08:30 to 18:30. Six of his nine active routines have a
 * preferred start before 18:30 — strength at 17:30, the walk at 17:45,
 * cardio at 17:45. The routines screen prints those times. They are
 * impossible, every working day, and have been since the day they were
 * created.
 *
 * The reviewer's verdict was the right one: "the one sentence a coach
 * would write — your evening slot has failed three weeks running and you
 * finish at half six, so train before work or move it to the weekend — is
 * derivable from two screens the product already renders, and the product
 * never says it."
 *
 * ── Why nothing caught it ───────────────────────────────────────────────
 *
 * `adaptation.ts` has six detectors and every one is BEHAVIOURAL: it waits
 * for a thing to fail, repeatedly, and then reacts. `detectSlotMismatch`
 * needs observations. `detectMissedTwice` needs two misses.
 *
 * This is the other kind, and the app had none of it: a STRUCTURAL clash,
 * true on day one, before any evidence exists. Nothing in the codebase
 * compared a routine's preferred time against the work hours the person
 * stated in the interview. The two facts sat two screens apart for six
 * weeks and were never put together.
 *
 * It is also the cheaper thing to fix for the person. A behavioural
 * detector costs three weeks of failure before it speaks. This one could
 * have spoken on the first evening.
 *
 * ── What it deliberately does not do ────────────────────────────────────
 *
 * It does not move anything. The time might be exactly right — people
 * leave early, work from home, have a gym in the building. It states what
 * it found and offers the move; the person decides. Telling somebody their
 * own week is wrong, and then changing it for them, is the behaviour this
 * product exists not to have.
 */

import { toMinutes } from '@/lib/dates';
import type { LifeProfile, Routine, Weekday } from '@/types/domain';

export interface AtWorkClash {
  routine: Routine;
  /** Work days this routine wants to start before work ends. */
  days: Weekday[];
  /** The soonest it could actually begin, on those days. */
  earliestReal: string;
}

/**
 * Routines that want to start while the person is at work.
 *
 * `duringWork` is excluded because those are carved out of the work day on
 * purpose — a deep-work block at 09:15 is not a clash, it is the point.
 * `anchorToWorkEnd` is excluded because it already moves with the finish
 * time rather than guessing at one.
 */
export function clashesWithWork(
  routines: Routine[],
  profile: Pick<LifeProfile, 'workDays' | 'workEnd'> | null | undefined,
): AtWorkClash[] {
  if (!profile?.workEnd || !profile.workDays?.length) return [];
  const ends = toMinutes(profile.workEnd);
  const workDays = new Set(profile.workDays);

  const out: AtWorkClash[] = [];
  for (const routine of routines) {
    if (!routine.active) continue;
    if (routine.duringWork || routine.anchorToWorkEnd) continue;
    if (toMinutes(routine.preferredStart) >= ends) continue;
    const days = routine.days.filter((d) => workDays.has(d));
    if (days.length === 0) continue;
    out.push({ routine, days, earliestReal: profile.workEnd });
  }
  return out;
}

/** Day letters, Monday first, the way the routines screen prints them. */
const LETTER: Record<Weekday, string> = { 1: 'M', 2: 'T', 3: 'W', 4: 'T', 5: 'F', 6: 'S', 0: 'S' };

/**
 * The line a coach would open with, or null when there is nothing to say.
 *
 * One sentence. It names the number, the cause and the choice, and stops —
 * this person has about eight seconds and has already read enough
 * paragraphs about why exercise is good.
 */
export function atWorkLine(
  clashes: AtWorkClash[],
  profile: Pick<LifeProfile, 'workEnd'> | null | undefined,
): string | null {
  if (clashes.length === 0 || !profile?.workEnd) return null;
  const finish = profile.workEnd;

  if (clashes.length === 1) {
    const { routine, days } = clashes[0];
    const when = days.map((d) => LETTER[d]).join('');
    return `${routine.title} wants ${routine.preferredStart} on ${when}, and you are at work until ${finish}. Move it or let it start late.`;
  }

  // Plural, and the count is the point: this is not one awkward block, it
  // is the shape of the week.
  return `${clashes.length} things want a time you are at work — you finish at ${finish}. Either they move, or they all land in the same evening.`;
}

/**
 * How crowded the hours they actually own are.
 *
 * The second half of the same problem, and the one the person feels.
 * Everything pushed past the end of work lands in the four or five hours
 * between getting home and sleeping, and six things in that window is not
 * a plan somebody keeps — Alex's simulated weeks ran three to five items
 * every weekday evening and he completed about half.
 */
export function eveningLoad(
  routines: Routine[],
  profile:
    | Pick<LifeProfile, 'workDays' | 'workStart' | 'workEnd' | 'sleepTime'>
    | null
    | undefined,
): { count: number; hours: number } | null {
  if (!profile?.workStart || !profile.workEnd || !profile.sleepTime) return null;
  const starts = toMinutes(profile.workStart);
  const ends = toMinutes(profile.workEnd);
  const sleeps = toMinutes(profile.sleepTime);
  if (sleeps <= ends) return null;
  const workDays = new Set(profile.workDays ?? []);

  const count = routines.filter((r) => {
    if (!r.active || r.duringWork) return false;
    if (!r.days.some((d) => workDays.has(d))) return false;
    // Anything wanting a slot from the start of work onwards lands after
    // it: either it was scheduled in the evening, or it was scheduled
    // during work and got pushed there. A 06:30 routine is a morning
    // thing and does not belong in this count.
    return toMinutes(r.preferredStart) >= starts;
  }).length;

  return { count, hours: Math.round(((sleeps - ends) / 60) * 10) / 10 };
}

/**
 * How many, in a week — a measurement, not a scoreboard.
 *
 * Isaac, twice: "Can I easily add in number of drinks or vaping occasions
 * for a week?" and then "How do you easily log drinking and vaping each
 * week?" The honest answer to the second was: you cannot. `BehaviourLog`
 * records one occasion at a time behind a day picker and a part-of-day
 * picker, so a Friday of four drinks and a Saturday of three is seven trips
 * through a two-step flow. Nobody does that, which means the app holds no
 * usable figure for the thing it asks about on the way in.
 *
 * ── WHY THIS IS NOT THE THING `BehaviourLog` REFUSES ────────────────────
 *
 * That refusal is real and it stands: "a number here would become a total,
 * a total would become a chart, and the chart would be a restriction
 * scoreboard aimed at the people least well served by one."
 *
 * Read it closely and it is an objection to a DAILY RUNNING TALLY displayed
 * back as a score. It is not an objection to measurement, and the proof is
 * that the app already collects exactly this number — `drinkingBand` asks
 * "in a usual week, roughly how many standard drinks?" during onboarding,
 * scores a mortality hazard off the answer in `pace.ts`, and then never
 * lets anyone correct it.
 *
 * So the app was in the worst of both worlds: refusing to let somebody
 * record how much they drink, while scoring them on a one-off estimate
 * made before they had any reason to be accurate.
 *
 * THE LINE: a weekly standing number is a MEASUREMENT. A daily running
 * tally is a SCOREBOARD. Ship the first, keep refusing the second.
 *
 * ── WHAT THAT MEANS IN PRACTICE ─────────────────────────────────────────
 *
 * One number, once a week, for a week that has finished. It is reported
 * only against its published guideline, never as a streak, never as "days
 * clean", never as a line going down. It is deliberately NOT a
 * MetricObservation: metrics feed the trend engine and the trajectory
 * projections, and a projection of somebody's drinking is the chart this
 * module exists to not build.
 *
 * ── WHY THE NUMBER IS WORTH MORE THAN THE LOGGING CONVENIENCE ───────────
 *
 * `negativeHabits.ts` already bands drinking in STANDARD DRINKS A WEEK —
 * the same units — so a measured week maps straight onto the published
 * bands and replaces a stale onboarding guess with a reading. That turns
 * this from a data-entry feature into a better instrument.
 */

import type { BehaviourKey } from '@/types/domain';
import type { DrinkingBand } from '@/features/health/negativeHabits';
import { addDays, newId } from '@/lib/dates';

/** The behaviours where a weekly count means something published. */
export const COUNTABLE: Partial<Record<BehaviourKey, { unit: string; unitPlural: string; prompt: string }>> = {
  alcohol: {
    unit: 'standard drink',
    unitPlural: 'standard drinks',
    prompt: 'Roughly how many standard drinks last week?',
  },
  vaping: {
    unit: 'time',
    unitPlural: 'times',
    prompt: 'Roughly how many times did you vape last week?',
  },
  smoking: {
    unit: 'cigarette',
    unitPlural: 'cigarettes',
    prompt: 'Roughly how many cigarettes last week?',
  },
};

export interface WeeklyCount {
  id: string;
  behaviour: BehaviourKey;
  /** The Monday of the week it describes. */
  weekStart: string;
  count: number;
  recordedAt: string;
}

/** The Monday on or before a date. Weeks are Monday-based throughout. */
export function weekStartOf(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  // getUTCDay: 0 = Sunday. Monday-based offset.
  return addDays(dateKey, -((day + 6) % 7));
}

/** The week that has finished — the one worth asking about. */
export function lastWeekStart(today: string): string {
  return addDays(weekStartOf(today), -7);
}

/**
 * Standard drinks a week onto the published bands.
 *
 * The cut points are `negativeHabits.DRINKING_YEARS_LOST`'s own, which come
 * from Wood and colleagues via the grams-a-week thresholds: 100g is ten
 * Australian standard drinks, 200g is twenty, 350g is thirty-five.
 */
export function bandFromDrinks(drinks: number): DrinkingBand {
  if (drinks <= 0) return 'none';
  if (drinks <= 10) return 'lowRisk';
  if (drinks <= 20) return 'moderate';
  if (drinks <= 35) return 'high';
  return 'veryHigh';
}

/** The most recent count for a behaviour, or null. */
export function latestCount(
  counts: WeeklyCount[],
  behaviour: BehaviourKey,
): WeeklyCount | null {
  let best: WeeklyCount | null = null;
  for (const c of counts) {
    if (c.behaviour !== behaviour) continue;
    if (!best || c.weekStart > best.weekStart) best = c;
  }
  return best;
}

export function countFor(
  counts: WeeklyCount[],
  behaviour: BehaviourKey,
  weekStart: string,
): WeeklyCount | null {
  return counts.find((c) => c.behaviour === behaviour && c.weekStart === weekStart) ?? null;
}

export function makeCount(
  behaviour: BehaviourKey,
  weekStart: string,
  count: number,
  at = new Date().toISOString(),
): WeeklyCount {
  return { id: newId('wc'), behaviour, weekStart, count: Math.max(0, Math.round(count)), recordedAt: at };
}

/** NHMRC: no more than 10 standard drinks a week, no more than 4 on a day. */
export const ALCOHOL_WEEKLY_GUIDELINE = 10;

/**
 * What the number says, against its guideline and nothing else.
 *
 * No praise for a low week and no comment on a high one. The guideline is
 * stated, the number is stated, and the comparison is left to the person —
 * which is the same posture `catalog.ts` takes everywhere: say what a
 * behaviour does, never that it is bad.
 */
export function drinksLine(count: number): string {
  if (count === 0) return 'No drinks recorded for last week.';
  const unit = count === 1 ? 'standard drink' : 'standard drinks';
  const over = count - ALCOHOL_WEEKLY_GUIDELINE;
  const against =
    over > 0
      ? `${over} above the Australian guideline of ${ALCOHOL_WEEKLY_GUIDELINE} a week`
      : over === 0
        ? `exactly the Australian guideline of ${ALCOHOL_WEEKLY_GUIDELINE} a week`
        : `${-over} under the Australian guideline of ${ALCOHOL_WEEKLY_GUIDELINE} a week`;
  return `${count} ${unit} last week — ${against}.`;
}

/**
 * Vaping, counted and deliberately not scored.
 *
 * Life's Essential 8 scores nicotine by STATUS, not by count: an inhaled
 * nicotine product sits at 25 on the published table whether it happened
 * twice or twenty times. So a count here sharpens the conversation and
 * moves no score, and saying so is the difference between a number that
 * informs and a number that pretends.
 */
export function vapingLine(count: number): string {
  if (count === 0) return 'No vaping recorded for last week.';
  return (
    `${count} ${count === 1 ? 'time' : 'times'} last week. The published nicotine table scores ` +
    `whether you use an inhaled nicotine product, not how often — so this number sharpens the ` +
    `picture without moving that score.`
  );
}

export function lineFor(behaviour: BehaviourKey, count: number): string {
  if (behaviour === 'alcohol') return drinksLine(count);
  if (behaviour === 'vaping') return vapingLine(count);
  const spec = COUNTABLE[behaviour];
  const unit = spec ? (count === 1 ? spec.unit : spec.unitPlural) : 'times';
  return count === 0 ? 'Nothing recorded for last week.' : `${count} ${unit} last week.`;
}

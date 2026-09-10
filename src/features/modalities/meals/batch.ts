/**
 * Cooking once for several nights.
 *
 * The nutrition coach planned seven dinners and quietly assumed seven
 * evenings of cooking. Almost nobody has those. What people actually do —
 * and what the coach never supported — is cook two or three times and eat
 * from it, which is a different plan from the same list of dishes.
 *
 * Two things this needs that the app already half had:
 *
 *   Which dishes.  `batch_friendly` and `freezes_well` have been on the
 *                  dish records all along and nothing read them. A dish
 *                  that does not keep is a bad choice for a Sunday cook
 *                  however good it is on a Tuesday.
 *   How much.      `Dish.amounts` is written for two, and its own comment
 *                  says "scaling to the household is a decision about how
 *                  much the app should presume". This is that decision,
 *                  made explicitly and shown rather than hidden.
 *
 * ── Why the shopping list multiplies rather than restates ───────────────
 *
 * Scaling "1 small whole bird, about 1.2 kg" by three is a sentence nobody
 * can write correctly: the 1.2 kg is per bird, "birds" needs a plural, and
 * "3 tin" is wrong in a way that makes an app look careless in the aisle.
 *
 * So a clean weight or volume is scaled arithmetically, where there is no
 * ambiguity and no plural to get wrong, and everything else is shown as
 * the original amount times a number. "500 g × 3" is never wrong, reads
 * fine on a phone in a supermarket, and does not pretend to a precision
 * the record does not carry.
 */

import type { Dish } from '@/features/modalities/meals/food';
import type { Weekday } from '@/types/domain';

export interface BatchInput {
  /** The dinners the week already has, by weekday. */
  dinners: Record<number, string>;
  /** How many times they are willing to cook. */
  cookSessions: number;
  /** How many people each dinner feeds. The dish amounts are written for two. */
  eaters: number;
}

export interface CookRun {
  /** The dish being cooked, by title. */
  title: string;
  /** The weekdays this cook covers, in order. */
  days: Weekday[];
  /** Dinners this one cook has to produce. */
  servings: number;
  /** What to multiply the dish's stated amounts by. */
  factor: number;
}

export interface BatchPlan {
  runs: CookRun[];
  /** Evenings of cooking saved against one dish a night. */
  eveningsSaved: number;
  line: string;
}

/** The amounts on a dish record are written for this many people. */
export const AMOUNTS_WRITTEN_FOR = 2;

/** How many nights running the same dinner is reasonable to ask of anyone. */
export const MAX_NIGHTS_PER_COOK = 4;

const UNIT_SCALE: Record<string, { at: number; to: string; by: number }> = {
  g: { at: 1000, to: 'kg', by: 1000 },
  ml: { at: 1000, to: 'l', by: 1000 },
};

const tidy = (n: number): string =>
  Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));

/**
 * A shopping amount, scaled.
 *
 * Arithmetic only where the amount is a bare weight or volume — the one
 * case with no plural and no per-item ambiguity. Everything else is
 * multiplied in plain sight.
 */
export function scaleAmount(amount: string, factor: number): string {
  if (factor === 1) return amount;
  const clean = amount.trim();
  const match = /^(\d+(?:\.\d+)?)\s*(g|kg|ml|l)$/i.exec(clean);
  if (!match) return `${clean} × ${factor}`;

  const unit = match[2].toLowerCase();
  let value = Number(match[1]) * factor;
  const up = UNIT_SCALE[unit];
  if (up && value >= up.at) return `${tidy(value / up.by)} ${up.to}`;
  return `${tidy(value)} ${unit}`;
}

/** Every amount on a dish, scaled together. */
export function scaleAmounts(
  amounts: Dish['amounts'],
  factor: number,
): Record<string, string> {
  if (!amounts) return {};
  return Object.fromEntries(
    Object.entries(amounts).map(([item, amount]) => [item, scaleAmount(amount, factor)]),
  );
}

/**
 * Is this dish worth cooking a lot of at once?
 *
 * Reads the tags that were already on every record. A dish with neither is
 * not rejected — it is simply not preferred, because somebody's week may
 * contain nothing else and a plan that refuses to produce one is worse
 * than a plan that says "this one is better eaten fresh".
 */
export const keepsWell = (dish: Dish): boolean =>
  dish.tags.includes('batch_friendly') || dish.tags.includes('freezes_well');

/**
 * The week, rearranged into a few cooks.
 *
 * Runs of consecutive days, because the point is to cook once and eat from
 * it, and because a run that skips a night means a fridge decision nobody
 * wants to make. The dish for each run is chosen from what the week
 * already planned, preferring one that keeps — the coach's choices are not
 * overruled, they are re-ordered.
 */
export function batchPlan(input: BatchInput, byTitle: Map<string, Dish>): BatchPlan {
  const days = Object.keys(input.dinners)
    .map(Number)
    .sort((a, b) => a - b) as Weekday[];

  const sessions = Math.max(1, Math.min(input.cookSessions, days.length));
  if (days.length === 0) {
    return { runs: [], eveningsSaved: 0, line: 'No dinners planned yet this week.' };
  }

  // Even runs, longest first, capped — four nights of the same dinner is
  // already generous and the fifth is how somebody ends up ordering in.
  const runs: CookRun[] = [];
  let index = 0;
  for (let s = 0; s < sessions; s++) {
    const remaining = days.length - index;
    const left = sessions - s;
    const size = Math.min(MAX_NIGHTS_PER_COOK, Math.ceil(remaining / left));
    const runDays = days.slice(index, index + size);
    index += size;
    if (runDays.length === 0) break;

    // The dish: whichever of this run's planned dinners keeps best.
    const candidates = runDays.map((d) => input.dinners[d]);
    const title =
      candidates.find((t) => {
        const dish = byTitle.get(t);
        return dish ? keepsWell(dish) : false;
      }) ?? candidates[0];

    const servings = runDays.length;
    runs.push({
      title,
      days: runDays,
      servings,
      // Amounts are written for two, so a run of four dinners for one
      // person is the same shop as two dinners for two.
      factor: Math.max(1, Math.round((servings * input.eaters) / AMOUNTS_WRITTEN_FOR)),
    });
  }

  // Anything left over after the cap keeps its own night.
  for (; index < days.length; index++) {
    const day = days[index];
    runs.push({
      title: input.dinners[day],
      days: [day],
      servings: 1,
      factor: Math.max(1, Math.round(input.eaters / AMOUNTS_WRITTEN_FOR)),
    });
  }

  const eveningsSaved = days.length - runs.length;
  const line =
    eveningsSaved > 0
      ? `${runs.length} ${runs.length === 1 ? 'cook' : 'cooks'} covers ${days.length} dinners — ${eveningsSaved} ${eveningsSaved === 1 ? 'evening' : 'evenings'} you are not cooking.`
      : `${runs.length} dinners, cooked on the night. Nothing to batch at this many sessions.`;

  return { runs, eveningsSaved, line };
}

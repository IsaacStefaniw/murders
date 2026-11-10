/**
 * Mood, as a number the model can actually read.
 *
 * ── What was wrong, and it was not that mood went unrecorded ───────────
 *
 * Isaac, 10 Nov 2026: *"I want to record my mood, weight and sleep every
 * day as well... Mood score is 7.5/10."*
 *
 * Two of the three already worked. `body.weight` has a metric and a
 * hand-entry screen; `sleep.hours` has a metric, an Apple Health sync and
 * a pre-workout ask. **Mood had neither.** It was stored as
 * `Reflection.mood`, and `readiness.ts`, `essential8.ts`,
 * `paceInputs.ts` and `summarise.ts` all read the `metrics` array — so
 * the one number he volunteered without being asked was the one number
 * nothing in the app could see.
 *
 * And the type could not hold his answer. `ReflectionMood` is
 * `1 | 2 | 3 | 4 | 5`. **Seven and a half out of ten does not fit in it**,
 * and rounding it to a 4 throws away the only thing a daily series is
 * for.
 *
 * ── Why the five chips stay ────────────────────────────────────────────
 *
 * They are the right instrument for a one-tap evening close, and a row of
 * eleven numbers is not. Five words somebody can hit without reading is
 * what gets answered on the night it is hard to answer anything — which
 * is the night the reading matters.
 *
 * So the chips keep their labels and carry a ten-point value, and a half
 * step either side makes 7.5 expressible for somebody who thinks in
 * halves. One value, two speeds of entry.
 *
 * ── One write, two shapes ─────────────────────────────────────────────
 *
 * `features/me/adopt.ts` makes the argument against a second way of
 * writing the same state, and it is right: *"a second way of writing the
 * same state is how two code paths drift until one of them is wrong."*
 *
 * This is not that. There is ONE write site, the evening check-in, and it
 * derives both shapes from one score through `toReflectionMood` below.
 * The 1–5 bucket exists because `lib/ai/agents.ts` already reads
 * `Reflection.mood` and prints "Mood (1-5)" into its prompt; changing the
 * type would be churn across the codebase to no benefit. The 0–10 metric
 * is the one the model reads. If a second write site ever appears, this
 * comment is the reason it should not.
 */

import type { ReflectionMood } from '@/types/domain';

/** The metric the series lives in. Matches the key in model/metrics. */
export const MOOD_KEY = 'mind.mood';

/** The lowest and highest a mood reading may be, with the step between. */
export const MOOD_RANGE = { min: 0, max: 10, step: 0.5 } as const;

/**
 * The five chips, in the words that were already there, each carrying its
 * ten-point value.
 *
 * Even numbers on purpose: it puts each label at the centre of its band
 * rather than at an edge, so a half step in either direction stays inside
 * the meaning of the word that was tapped. "Good" is 8, and 7.5 is still
 * good.
 */
export const MOOD_CHIPS: { score: number; label: string }[] = [
  { score: 2, label: 'Rough' },
  { score: 4, label: 'Off' },
  { score: 6, label: 'Fine' },
  { score: 8, label: 'Good' },
  { score: 10, label: 'Great' },
];

/** Clamp to the range and snap to the half step. A typo is not a reading. */
export function cleanMood(score: number): number {
  const snapped = Math.round(score / MOOD_RANGE.step) * MOOD_RANGE.step;
  return Math.min(MOOD_RANGE.max, Math.max(MOOD_RANGE.min, snapped));
}

/**
 * The 1–5 bucket, for the one consumer that still reads it.
 *
 * Rounds half upward, so 7.5 reads as "Good" rather than "Fine" — the
 * chip he would have tapped. A score of 0 or 1 still has to land on 1,
 * because `ReflectionMood` has no zero.
 */
export function toReflectionMood(score: number): ReflectionMood {
  const bucket = Math.min(5, Math.max(1, Math.round(cleanMood(score) / 2)));
  return bucket as ReflectionMood;
}

/** The label whose band this score sits in, for printing it back. */
export function moodLabel(score: number): string {
  return MOOD_CHIPS[toReflectionMood(score) - 1].label;
}

/**
 * What a run of readings is allowed to claim.
 *
 * The same bar `features/me/journal.ts` sets for the behaviour log, for
 * the same reason, and this project has now read a figure without its
 * denominator three times: a cohort zero that was a wiring bug, a 0.70
 * that was a twelve-rep weight, and a "much better than usual" with no
 * baseline behind it. A first mood score is not a mood.
 */
export function moodStanding(count: number): string {
  if (count === 0) {
    return 'Nothing recorded yet. The first one is worth more than the next ten, because it is what makes the rest comparable.';
  }
  if (count === 1) {
    return 'One reading. It is a number, not yet a mood — on its own there is nothing for it to be better or worse than.';
  }
  if (count < 14) {
    return `${count} readings. A fortnight is where a run of days starts to have a shape; nothing before that is worth drawing a line through.`;
  }
  return `${count} readings — enough for the shape of a fortnight to be read rather than guessed.`;
}

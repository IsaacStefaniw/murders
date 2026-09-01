/**
 * How hard a set should feel, in words rather than a number.
 *
 * RPE is a real and useful scale, and it is also a piece of gym jargon
 * that means nothing to most people. An app that shows "RPE 8" has quietly
 * decided its audience already lifts — and then needs a manual to fix
 * that. The number stays in the model, where it does the work; the screen
 * says what the number means.
 */
export function effortWords(rpe: number): string {
  if (rpe <= 5) return 'easy — this one is meant to feel light';
  if (rpe <= 6) return 'comfortable, plenty left';
  if (rpe <= 7) return 'solid effort, about 3 reps left in you';
  if (rpe <= 8) return 'hard, about 2 reps left in you';
  if (rpe <= 9) return 'very hard, 1 rep left at most';
  return 'everything you have';
}

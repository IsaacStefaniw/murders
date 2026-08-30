/**
 * Nutrition coach — deterministic dinner rotation.
 *
 * Structure over restriction: every idea is protein-anchored with
 * vegetables, cookable on a weeknight, and named in food words rather
 * than macro words. No calorie targets, no diet identity, no claims —
 * the evidence story (protein-first, mostly whole foods, decided once)
 * lives in the knowledge base.
 */


export const DINNER_IDEAS: string[] = [
  'Roast chicken, potatoes & greens',
  'Beef & vegetable stir-fry',
  'Salmon, rice & broccoli',
  'Mince, beans & salsa bowls',
  'Eggs & veg fry-up with sourdough',
  'Fish tacos with slaw',
  'Slow-cooker stew (set it in the morning)',
  'Chicken curry with extra veg',
  'Big salad with tuna & white beans',
  'Pork chops, apple & roast veg',
  'Chilli con carne (cook once, eat twice)',
  'Halloumi & roast vegetable tray bake',
];

/** Next idea after `current`, cycling the rotation. */
export function nextIdea(current: string): string {
  const i = DINNER_IDEAS.indexOf(current);
  return DINNER_IDEAS[(i + 1) % DINNER_IDEAS.length];
}

/**
 * A deterministic starting week seeded by the date, so two people (or two
 * weeks) don't get identical suggestions but the same week is stable.
 * Leftovers night lands mid-week on purpose — a plan that admits real life
 * survives real life.
 */
export function suggestWeek(weekStart: string): Record<number, string> {
  const seed = Array.from(weekStart).reduce((a, c) => a + c.charCodeAt(0), 0);
  const week: Record<number, string> = {};
  for (let d = 0; d <= 6; d++) {
    week[d] = DINNER_IDEAS[(seed + d * 3) % DINNER_IDEAS.length];
  }
  week[4] = 'Leftovers night';
  return week;
}

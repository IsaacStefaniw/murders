/**
 * Nutrition coach — deterministic dinner rotation.
 *
 * Structure over restriction: every idea is protein-anchored with
 * vegetables, cookable on a weeknight, and named in food words rather
 * than macro words. No calorie targets, no diet identity, no claims —
 * the evidence story (protein-first, mostly whole foods, decided once)
 * lives in the knowledge base.
 *
 * Each idea carries an `effort` band so the rotation can honour the
 * cooking answer the user actually gave. Before this, the app told people
 * "your rotation favours one-pan, under-20-minute dinners" while the
 * rotation ignored the answer entirely — a claim the code didn't keep.
 * This is deliberately a minimal shape, not a food database: no
 * ingredients, allergens or macros yet, so nothing here can pretend to
 * handle allergies or intolerances. That model is still to come.
 */

export type CookingEffort = 'quick' | 'normal' | 'enjoy';

export interface DinnerIdea {
  title: string;
  /** Roughly: quick ≤20 min and usually one pan; enjoy is a cook's evening. */
  effort: CookingEffort;
}

export const DINNERS: DinnerIdea[] = [
  { title: 'Roast chicken, potatoes & greens', effort: 'enjoy' },
  { title: 'Beef & vegetable stir-fry', effort: 'quick' },
  { title: 'Salmon, rice & broccoli', effort: 'quick' },
  { title: 'Mince, beans & salsa bowls', effort: 'quick' },
  { title: 'Eggs & veg fry-up with sourdough', effort: 'quick' },
  { title: 'Fish tacos with slaw', effort: 'normal' },
  { title: 'Slow-cooker stew (set it in the morning)', effort: 'normal' },
  { title: 'Chicken curry with extra veg', effort: 'normal' },
  { title: 'Big salad with tuna & white beans', effort: 'quick' },
  { title: 'Pork chops, apple & roast veg', effort: 'normal' },
  { title: 'Chilli con carne (cook once, eat twice)', effort: 'enjoy' },
  { title: 'Halloumi & roast vegetable tray bake', effort: 'normal' },
];

export const DINNER_IDEAS: string[] = DINNERS.map((d) => d.title);

/**
 * The ideas a cooking preference actually allows. "Quick" is a hard
 * constraint — someone with no time can't use a roast — while "enjoy"
 * widens rather than narrows, since a cook still wants easy nights.
 */
export function ideasFor(cooking?: CookingEffort): string[] {
  if (cooking === 'quick') return DINNERS.filter((d) => d.effort === 'quick').map((d) => d.title);
  if (cooking === 'normal') return DINNERS.filter((d) => d.effort !== 'enjoy').map((d) => d.title);
  return DINNER_IDEAS;
}

/** Next idea after `current`, cycling within what the preference allows. */
export function nextIdea(current: string, cooking?: CookingEffort): string {
  const pool = ideasFor(cooking);
  const i = pool.indexOf(current);
  // Current isn't in the pool (preference changed): start at the top.
  if (i === -1) return pool[0];
  return pool[(i + 1) % pool.length];
}

/**
 * A deterministic starting week seeded by the date, so two people (or two
 * weeks) don't get identical suggestions but the same week is stable.
 * Leftovers night lands mid-week on purpose — a plan that admits real life
 * survives real life.
 */
export function suggestWeek(weekStart: string, cooking?: CookingEffort): Record<number, string> {
  const pool = ideasFor(cooking);
  const seed = Array.from(weekStart).reduce((a, c) => a + c.charCodeAt(0), 0);
  const week: Record<number, string> = {};
  for (let d = 0; d <= 6; d++) {
    week[d] = pool[(seed + d * 3) % pool.length];
  }
  week[4] = 'Leftovers night';
  return week;
}

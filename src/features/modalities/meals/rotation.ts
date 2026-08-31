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
 * The dish list below is the fallback pool, kept for the case where a
 * person has stated no preferences at all. Once they have, the rotation
 * sources from the real food model in `food.ts` — ingredients, allergens,
 * intolerances and dietary patterns — and the safety gate there is
 * fail-closed. That model used to exist and reach no screen; the
 * preference-aware functions at the bottom of this file are the join.
 */

import { DISHES, rankDishes, type FoodPreferences } from '@/features/modalities/meals/food';

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

/* ── Preference-aware rotation ────────────────────────────────────────────
 *
 * Everything above works on titles alone and cannot know that a dish
 * contains sesame. These take the person's stated preferences and go
 * through `food.ts`, whose allergen gate excludes on "may contain" and on
 * any dish whose ingredients have not been reviewed. A false exclusion
 * costs someone a dinner suggestion; a false inclusion could hurt them.
 * ------------------------------------------------------------------- */

/**
 * The dishes a person can actually eat, best first.
 *
 * Falls back to the simple pool only when nothing has been declared — a
 * person with no stated allergies loses nothing by the older list, and
 * a person with stated allergies must never be served from it.
 */
export function allowedDishTitles(prefs: FoodPreferences | null): string[] {
  if (!prefs || !hasAnyPreference(prefs)) return ideasFor(prefs?.effort);
  const ranked = rankDishes(DISHES, prefs).filter((r) => !r.excluded);
  return ranked.map((r) => r.dish.title);
}

export const hasAnyPreference = (p: FoodPreferences): boolean =>
  p.patterns.length > 0 ||
  p.allergies.length > 0 ||
  p.intolerances.length > 0 ||
  p.dislikes.length > 0 ||
  p.favourites.length > 0;

/** Next dish after `current`, cycling within what the person can eat. */
export function nextAllowedDish(current: string, prefs: FoodPreferences | null): string {
  const pool = allowedDishTitles(prefs);
  if (pool.length === 0) return current;
  const i = pool.indexOf(current);
  return i === -1 ? pool[0] : pool[(i + 1) % pool.length];
}

/**
 * A week of dinners the person can actually eat.
 *
 * Where the allowed pool is smaller than the week, dishes repeat rather
 * than the week being padded with something excluded. Eating the same
 * safe dinner twice is a normal week; being handed one that contains your
 * allergen is not.
 */
export function suggestAllowedWeek(
  weekStart: string,
  prefs: FoodPreferences | null,
): Record<number, string> {
  const pool = allowedDishTitles(prefs);
  if (pool.length === 0) return suggestWeek(weekStart, prefs?.effort);
  const seed = Array.from(weekStart).reduce((a, c) => a + c.charCodeAt(0), 0);
  const week: Record<number, string> = {};
  for (let d = 0; d <= 6; d++) {
    week[d] = pool[(seed + d * 3) % pool.length];
  }
  week[4] = 'Leftovers night';
  return week;
}

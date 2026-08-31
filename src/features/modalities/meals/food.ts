/**
 * Nutrition coach — the structured food model.
 *
 * `rotation.ts` holds twelve display strings with an effort band, and says
 * so honestly: "nothing here can pretend to handle allergies or
 * intolerances. That model is still to come." This is that model.
 *
 * What it adds over a string: a protein anchor, rough prep minutes, key
 * ingredients, declarable allergens, intolerance triggers and
 * dietary-pattern compatibility — enough to answer "can this person eat
 * this?" honestly, and to learn what they actually enjoy.
 *
 * Design commitments, all deliberate:
 *
 * 1. **Allergens fail CLOSED.** An allergen field is a safety-critical
 *    claim: getting it wrong could put someone in hospital. So absence of
 *    evidence is never treated as evidence of absence — a dish whose
 *    allergen status has not been reviewed is excluded for anyone
 *    declaring an allergy, and so is a dish that merely *may* contain it.
 *    The filter never has to guess; when it doesn't know, it drops the
 *    dish. Losing a dinner idea is a cost we can pay. See `isSafeFor`.
 * 2. **The UI must never present this as a guarantee.** These records
 *    describe a dish *as we wrote it*. The tin in someone's cupboard, the
 *    shared fryer, the substituted sauce, the manufacturer's recipe change
 *    — none of that is knowable here. Surfaces that show allergen
 *    information must show `ALLERGEN_DISCLAIMER` with it, and must never
 *    render a dish as "safe", "allergen-free" or a green tick. It filters
 *    suggestions; it does not clear food for eating.
 * 3. **Structure over restriction.** No calories, no macros, no scoring of
 *    foods as good or bad. Preferences shape a rotation; they never
 *    produce a verdict on what someone ate.
 * 4. **Pure and deterministic**, like the rest of the engine: same inputs,
 *    same ordering, every time — no clock, no randomness.
 */

import type { CookingEffort } from '@/features/modalities/meals/rotation';

/**
 * The declarable allergens of UK/EU food law (the "big 14"), which is a
 * superset of the US big-9 apart from naming. We use the regulatory list
 * rather than inventing our own so that a record can be checked against a
 * label someone is holding.
 */
export type Allergen =
  | 'milk'
  | 'eggs'
  | 'fish'
  | 'crustaceans'
  | 'molluscs'
  | 'peanuts'
  | 'tree_nuts'
  | 'soy'
  | 'gluten'
  | 'sesame'
  | 'mustard'
  | 'celery'
  | 'lupin'
  | 'sulphites';

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  milk: 'Milk & dairy',
  eggs: 'Eggs',
  fish: 'Fish',
  crustaceans: 'Crustaceans (prawns, crab)',
  molluscs: 'Molluscs (mussels, squid)',
  peanuts: 'Peanuts',
  tree_nuts: 'Tree nuts',
  soy: 'Soy',
  gluten: 'Cereals containing gluten',
  sesame: 'Sesame',
  mustard: 'Mustard',
  celery: 'Celery',
  lupin: 'Lupin',
  sulphites: 'Sulphites',
};

/** Shown wherever allergen information appears. Not optional. */
export const ALLERGEN_DISCLAIMER =
  'Allergen tags describe the dish as written here, not the food in your kitchen. Brands, sauces and shared equipment change what is in a meal. Always read the label and check with a clinician about your own allergies — this filters ideas, it never clears food as safe to eat.';

/**
 * Intolerances are not allergies. They are unpleasant rather than
 * dangerous, they scale with how much you eat in a way allergies do not,
 * thresholds are personal. They get their own list so that neither one is
 * quietly treated as the other.
 */
export type Intolerance =
  | 'lactose'
  | 'gluten_non_coeliac'
  | 'fructose'
  | 'onion_garlic_fodmap'
  | 'spice_capsaicin'
  | 'caffeine'
  | 'alcohol'
  | 'histamine';

export const INTOLERANCE_LABELS: Record<Intolerance, string> = {
  lactose: 'Lactose',
  gluten_non_coeliac: 'Gluten (non-coeliac)',
  fructose: 'Fructose',
  onion_garlic_fodmap: 'Onion & garlic (FODMAPs)',
  spice_capsaicin: 'Chilli heat',
  caffeine: 'Caffeine',
  alcohol: 'Alcohol',
  histamine: 'High-histamine foods',
};

/**
 * Dietary patterns. Two different kinds of thing live in this one enum,
 * and the difference matters:
 *
 * - `omnivore`/`vegetarian`/`vegan`/`pescatarian`/`gluten_free`/
 *   `dairy_free` are decidable from ingredients. We can answer them.
 * - `halal` and `kosher` are **not** decidable from an ingredient list.
 *   They depend on slaughter, certification, separation of equipment and,
 *   for kosher, keeping meat and dairy apart across a whole kitchen. What
 *   `compatible` can honestly claim for these is narrow: *this dish
 *   contains no inherently disallowed ingredient* (no pork, no shellfish,
 *   no meat-and-dairy in one dish, no cooking alcohol). Sourcing and
 *   certification remain the user's. Surfaces must word it that way and
 *   never as "halal" / "kosher" full stop. Flagged for a human decision:
 *   see the note at the foot of this file.
 */
export type DietaryPattern =
  | 'omnivore'
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'halal'
  | 'kosher'
  | 'gluten_free'
  | 'dairy_free';

export const DIETARY_PATTERN_LABELS: Record<DietaryPattern, string> = {
  omnivore: 'Omnivore',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  pescatarian: 'Pescatarian',
  halal: 'Halal-compatible ingredients',
  kosher: 'Kosher-compatible ingredients',
  gluten_free: 'Gluten-free',
  dairy_free: 'Dairy-free',
};

/** What the meal is built around. Protein first is the whole rotation. */
export type ProteinAnchor =
  | 'chicken'
  | 'turkey'
  | 'beef'
  | 'lamb'
  | 'pork'
  | 'fish'
  | 'shellfish'
  | 'eggs'
  | 'dairy'
  | 'legumes'
  | 'soy_protein'
  | 'nuts_seeds';

/** Practical, plan-shaped tags — how a dish behaves in a real week. */
export type DishTag =
  | 'one_pan'
  | 'no_cook'
  | 'batch_friendly'
  | 'freezes_well'
  | 'slow_cooker'
  | 'sheet_pan'
  | 'salad'
  | 'soup_stew'
  | 'handheld'
  | 'store_cupboard';

/**
 * How thoroughly this record's allergen fields have been checked.
 *
 * `reviewed` means a human has gone through the full declarable list for
 * this dish as written. `unreviewed` is the default for anything a user
 * or an import created, and it is not a soft warning: an unreviewed dish
 * is withheld from anyone who has declared any allergy at all. Never
 * default a record to `reviewed` in code; a person sets it.
 */
export type AllergenReview = 'reviewed' | 'unreviewed';

export interface Dish {
  id: string;
  title: string;
  /** Roughly: quick ≤20 min and usually one pan; enjoy is a cook's evening. */
  effort: CookingEffort;
  /** Hands-on plus oven time, rounded honestly. Not a promise. */
  prepMin: number;
  proteinAnchor: ProteinAnchor;
  tags: DishTag[];
  /**
   * Recognisable ingredients, lowercase — what dislikes and favourites
   * match against ("no mushrooms"). Not a recipe and not exhaustive.
   */
  keyIngredients: string[];
  /** Allergens present in the dish as written here. */
  allergens: Allergen[];
  /**
   * Allergens that are usually or optionally present: bought stock, a jar
   * of curry paste, bread on the side, a shared pan. Treated exactly like
   * `allergens` when filtering — the distinction exists to explain the
   * exclusion to the user, never to soften it.
   */
  mayContain: Allergen[];
  /** Intolerance triggers present as written. */
  triggers: Intolerance[];
  /** Patterns this dish is compatible with. See the halal/kosher caveat. */
  compatible: DietaryPattern[];
  allergenReview: AllergenReview;
}

/**
 * One enjoyment rating, captured after a meal. An append-only log rather
 * than a single mutable score: taste changes, and "I liked this once in
 * March" should not outvote "I've been bored of it since June".
 *
 * 1 = would rather not again … 5 = put it back in the rotation.
 */
export interface EnjoymentRating {
  dishId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  /** ISO date key, as elsewhere in the app. */
  at: string;
}

export interface FoodPreferences {
  /**
   * All declared patterns must hold at once — vegetarian *and*
   * gluten-free means a dish has to satisfy both.
   */
  patterns: DietaryPattern[];
  /** Hard exclusion, fail-closed. */
  allergies: Allergen[];
  /** Hard exclusion on known triggers. */
  intolerances: Intolerance[];
  /** Soft: dish ids or ingredient words. Deprioritised, not removed. */
  dislikes: string[];
  /** Soft: dish ids or ingredient words. Boosted. */
  favourites: string[];
  /** Append-only; the most recent rating for a dish is the one that counts. */
  enjoyment: EnjoymentRating[];
  /** Optional: the cooking answer from the nutrition path. */
  effort?: CookingEffort;
}

export const EMPTY_FOOD_PREFERENCES: FoodPreferences = {
  patterns: [],
  allergies: [],
  intolerances: [],
  dislikes: [],
  favourites: [],
  enjoyment: [],
};

export type ExclusionReason =
  | 'allergen'
  | 'allergen_may_contain'
  | 'allergen_unreviewed'
  | 'intolerance'
  | 'dietary_pattern'
  | 'effort';

export interface DishRanking {
  dish: Dish;
  /** Higher sorts first. Only meaningful for dishes that are allowed. */
  score: number;
  /** Set when the dish is excluded; the reason is for explaining, not persuading. */
  excluded?: ExclusionReason;
  /** Which allergen/intolerance/pattern caused it, for a plain-words line. */
  excludedBy?: string;
}

// ── The safety gate ───────────────────────────────────────────────────────

/**
 * Fail-closed allergen check. Returns true only when we positively know
 * the dish is free of every declared allergen:
 *
 * - unreviewed record + any declared allergy → false (we don't know);
 * - allergen listed, or listed as "may contain" → false;
 * - otherwise true.
 *
 * The asymmetry is the point. A false exclusion costs someone a dinner
 * suggestion. A false inclusion could hurt them.
 */
export function allergenExclusion(
  dish: Dish,
  allergies: Allergen[],
): { reason: ExclusionReason; by: string } | undefined {
  if (allergies.length === 0) return undefined;
  if (dish.allergenReview !== 'reviewed') {
    return { reason: 'allergen_unreviewed', by: dish.title };
  }
  for (const a of allergies) {
    if (dish.allergens.includes(a)) return { reason: 'allergen', by: ALLERGEN_LABELS[a] };
    if (dish.mayContain.includes(a)) {
      return { reason: 'allergen_may_contain', by: ALLERGEN_LABELS[a] };
    }
  }
  return undefined;
}

/**
 * Intolerances exclude on *known* triggers only, and do not fail closed on
 * unreviewed records. That is a considered difference from allergens:
 * withholding every unreviewed dish from someone who is a bit sensitive to
 * onions would empty their rotation to buy nothing. Deliberate, and worth
 * a human's sign-off — it is the one place where the two lists behave
 * differently.
 */
function intoleranceExclusion(
  dish: Dish,
  intolerances: Intolerance[],
): { reason: ExclusionReason; by: string } | undefined {
  for (const i of intolerances) {
    if (dish.triggers.includes(i)) return { reason: 'intolerance', by: INTOLERANCE_LABELS[i] };
  }
  return undefined;
}

function patternExclusion(
  dish: Dish,
  patterns: DietaryPattern[],
): { reason: ExclusionReason; by: string } | undefined {
  for (const p of patterns) {
    if (!dish.compatible.includes(p)) {
      return { reason: 'dietary_pattern', by: DIETARY_PATTERN_LABELS[p] };
    }
  }
  return undefined;
}

/** Honours the cooking answer the way `ideasFor` does: quick is a hard no. */
function effortExclusion(
  dish: Dish,
  effort?: CookingEffort,
): { reason: ExclusionReason; by: string } | undefined {
  if (effort === 'quick' && dish.effort !== 'quick') return { reason: 'effort', by: 'time to cook' };
  if (effort === 'normal' && dish.effort === 'enjoy') return { reason: 'effort', by: 'time to cook' };
  return undefined;
}

// ── Scoring: soft preferences ─────────────────────────────────────────────

/** Weights are small integers so the ordering stays readable in a test. */
const FAVOURITE_BOOST = 3;
const DISLIKE_PENALTY = -4;
/** A rating of 3 is neutral; 5 adds +2, 1 subtracts −2. */
const ENJOYMENT_WEIGHT = 1;

function matches(dish: Dish, needle: string): boolean {
  const n = needle.trim().toLowerCase();
  if (!n) return false;
  if (dish.id === n) return true;
  if (dish.title.toLowerCase().includes(n)) return true;
  return dish.keyIngredients.some((ing) => ing.includes(n));
}

/** The most recent rating for a dish, or undefined. Ties break on order. */
function latestRating(dishId: string, log: EnjoymentRating[]): number | undefined {
  let best: EnjoymentRating | undefined;
  for (const r of log) {
    if (r.dishId !== dishId) continue;
    if (!best || r.at >= best.at) best = r;
  }
  return best?.rating;
}

export function scoreDish(dish: Dish, prefs: FoodPreferences): number {
  let score = 0;
  if (prefs.favourites.some((f) => matches(dish, f))) score += FAVOURITE_BOOST;
  if (prefs.dislikes.some((d) => matches(dish, d))) score += DISLIKE_PENALTY;
  const rating = latestRating(dish.id, prefs.enjoyment);
  if (rating !== undefined) score += (rating - 3) * ENJOYMENT_WEIGHT;
  return score;
}

/**
 * Every dish with a verdict: excluded ones carry a reason, allowed ones a
 * score. The meals screen uses this to say *why* an idea disappeared,
 * which is the difference between a filter and a black box.
 */
export function rankDishes(dishes: Dish[], prefs: FoodPreferences): DishRanking[] {
  const ranked = dishes.map((dish) => {
    const hit =
      allergenExclusion(dish, prefs.allergies) ??
      intoleranceExclusion(dish, prefs.intolerances) ??
      patternExclusion(dish, prefs.patterns) ??
      effortExclusion(dish, prefs.effort);
    return {
      dish,
      score: hit ? 0 : scoreDish(dish, prefs),
      excluded: hit?.reason,
      excludedBy: hit?.by,
    };
  });
  // Stable and deterministic: score, then original order via id.
  return ranked.sort((a, b) => b.score - a.score || a.dish.id.localeCompare(b.dish.id));
}

/**
 * The dishes this person can actually be offered, best first.
 *
 * Hard: allergens (fail closed), intolerances, dietary patterns, and the
 * cooking-effort answer. Soft: dislikes sink, favourites and enjoyed
 * dishes rise — a disliked dish is still an option on a night when
 * nothing else fits, because a rotation that runs out is worse than a
 * rotation with a dull Tuesday in it.
 */
export function filterDishes(dishes: Dish[], prefs: FoodPreferences): Dish[] {
  return rankDishes(dishes, prefs)
    .filter((r) => r.excluded === undefined)
    .map((r) => r.dish);
}

// ── Seed corpus ───────────────────────────────────────────────────────────
//
// Every record below was written allergen-first: the question asked of each
// dish was "what is declarable here", not "what sounds nice". `mayContain`
// carries the honest uncertainty — bought stock, jarred paste, bread on the
// side, soy sauce that is usually wheat-based. Sulphites ride along with
// most bought stock, wine and dried fruit; celery hides in almost every
// stock and mirepoix, which is why the stews carry it.
//
// halal/kosher entries mean ingredient-compatible only (see DietaryPattern).
// Meat dishes therefore carry `halal`/`kosher` where the ingredients allow
// it, and the UI must say "compatible ingredients — sourcing is yours".

export const DISHES: Dish[] = [
  {
    id: 'roast-chicken-potatoes-greens',
    title: 'Roast chicken, potatoes & greens',
    effort: 'enjoy',
    prepMin: 90,
    proteinAnchor: 'chicken',
    tags: ['sheet_pan', 'batch_friendly'],
    keyIngredients: ['chicken', 'potatoes', 'olive oil', 'green beans', 'lemon'],
    allergens: [],
    mayContain: ['celery', 'sulphites'],
    triggers: ['onion_garlic_fodmap'],
    compatible: ['omnivore', 'halal', 'kosher', 'gluten_free', 'dairy_free'],
    allergenReview: 'reviewed',
  },
  {
    id: 'beef-veg-stir-fry',
    title: 'Beef & vegetable stir-fry',
    effort: 'quick',
    prepMin: 20,
    proteinAnchor: 'beef',
    tags: ['one_pan'],
    keyIngredients: ['beef', 'peppers', 'broccoli', 'soy sauce', 'ginger', 'garlic'],
    allergens: ['soy', 'gluten'],
    mayContain: ['sesame', 'sulphites'],
    triggers: ['onion_garlic_fodmap', 'gluten_non_coeliac'],
    compatible: ['omnivore', 'halal', 'kosher', 'dairy_free'],
    allergenReview: 'reviewed',
  },
  {
    id: 'salmon-rice-broccoli',
    title: 'Salmon, rice & broccoli',
    effort: 'quick',
    prepMin: 20,
    proteinAnchor: 'fish',
    tags: ['one_pan', 'sheet_pan'],
    keyIngredients: ['salmon', 'rice', 'broccoli', 'lemon', 'olive oil'],
    allergens: ['fish'],
    mayContain: [],
    triggers: [],
    compatible: ['omnivore', 'pescatarian', 'halal', 'kosher', 'gluten_free', 'dairy_free'],
    allergenReview: 'reviewed',
  },
  {
    id: 'chilli-con-carne',
    title: 'Chilli con carne',
    effort: 'enjoy',
    prepMin: 60,
    proteinAnchor: 'beef',
    tags: ['batch_friendly', 'freezes_well', 'soup_stew'],
    keyIngredients: ['beef mince', 'kidney beans', 'tomatoes', 'chilli', 'onion', 'cumin'],
    allergens: [],
    mayContain: ['celery', 'sulphites'],
    triggers: ['spice_capsaicin', 'onion_garlic_fodmap'],
    compatible: ['omnivore', 'halal', 'kosher', 'gluten_free', 'dairy_free'],
    allergenReview: 'reviewed',
  },
  {
    id: 'slow-cooker-beef-stew',
    title: 'Slow-cooker beef stew (set it in the morning)',
    effort: 'normal',
    prepMin: 25,
    proteinAnchor: 'beef',
    tags: ['slow_cooker', 'batch_friendly', 'freezes_well', 'soup_stew'],
    keyIngredients: ['beef', 'carrots', 'celery', 'potatoes', 'stock', 'thyme'],
    allergens: ['celery', 'sulphites'],
    mayContain: ['gluten', 'mustard'],
    triggers: ['onion_garlic_fodmap'],
    compatible: ['omnivore', 'halal', 'kosher', 'dairy_free'],
    allergenReview: 'reviewed',
  },
  {
    id: 'chicken-curry-extra-veg',
    title: 'Chicken curry with extra veg',
    effort: 'normal',
    prepMin: 40,
    proteinAnchor: 'chicken',
    tags: ['batch_friendly', 'freezes_well'],
    keyIngredients: ['chicken', 'coconut milk', 'spinach', 'curry paste', 'onion', 'garlic'],
    allergens: [],
    mayContain: ['mustard', 'sulphites', 'fish'],
    triggers: ['spice_capsaicin', 'onion_garlic_fodmap'],
    compatible: ['omnivore', 'halal', 'kosher', 'gluten_free', 'dairy_free'],
    allergenReview: 'reviewed',
  },
  {
    id: 'chicken-fajita-tray-bake',
    title: 'Chicken fajita tray bake',
    effort: 'quick',
    prepMin: 30,
    proteinAnchor: 'chicken',
    tags: ['sheet_pan', 'one_pan', 'handheld'],
    keyIngredients: ['chicken', 'peppers', 'onion', 'paprika', 'corn tortillas', 'lime'],
    allergens: [],
    mayContain: ['gluten', 'milk'],
    triggers: ['spice_capsaicin', 'onion_garlic_fodmap'],
    compatible: ['omnivore', 'halal', 'kosher', 'dairy_free'],
    allergenReview: 'reviewed',
  },
  {
    id: 'turkey-bolognese',
    title: 'Turkey bolognese with hidden veg',
    effort: 'normal',
    prepMin: 40,
    proteinAnchor: 'turkey',
    tags: ['batch_friendly', 'freezes_well'],
    keyIngredients: ['turkey mince', 'tomatoes', 'carrot', 'celery', 'pasta', 'oregano'],
    allergens: ['gluten', 'celery'],
    mayContain: ['eggs', 'milk', 'sulphites'],
    triggers: ['gluten_non_coeliac', 'onion_garlic_fodmap'],
    compatible: ['omnivore', 'halal', 'kosher'],
    allergenReview: 'reviewed',
  },
  {
    id: 'lamb-kofta-salad',
    title: 'Lamb kofta with chopped salad',
    effort: 'normal',
    prepMin: 35,
    proteinAnchor: 'lamb',
    tags: ['salad', 'handheld'],
    keyIngredients: ['lamb mince', 'cumin', 'tomato', 'cucumber', 'parsley', 'red onion'],
    allergens: [],
    mayContain: ['gluten', 'sesame', 'milk'],
    triggers: ['onion_garlic_fodmap'],
    compatible: ['omnivore', 'halal', 'kosher', 'dairy_free'],
    allergenReview: 'reviewed',
  },
  {
    id: 'pork-chops-apple-roast-veg',
    title: 'Pork chops, apple & roast veg',
    effort: 'normal',
    prepMin: 40,
    proteinAnchor: 'pork',
    tags: ['sheet_pan', 'one_pan'],
    keyIngredients: ['pork chops', 'apple', 'parsnip', 'sage', 'olive oil'],
    allergens: [],
    mayContain: ['mustard', 'sulphites'],
    triggers: ['fructose'],
    compatible: ['omnivore', 'gluten_free', 'dairy_free'],
    allergenReview: 'reviewed',
  },
  {
    id: 'fish-tacos-slaw',
    title: 'Fish tacos with slaw',
    effort: 'normal',
    prepMin: 30,
    proteinAnchor: 'fish',
    tags: ['handheld'],
    keyIngredients: ['white fish', 'cabbage', 'lime', 'corn tortillas', 'yoghurt', 'coriander'],
    allergens: ['fish', 'milk'],
    mayContain: ['gluten', 'eggs', 'mustard'],
    triggers: ['lactose'],
    compatible: ['omnivore', 'pescatarian'],
    allergenReview: 'reviewed',
  },
  {
    id: 'miso-salmon-greens',
    title: 'Miso salmon with greens & rice',
    effort: 'quick',
    prepMin: 25,
    proteinAnchor: 'fish',
    tags: ['sheet_pan', 'one_pan'],
    keyIngredients: ['salmon', 'miso', 'pak choi', 'rice', 'ginger'],
    allergens: ['fish', 'soy'],
    mayContain: ['gluten', 'sesame'],
    triggers: [],
    compatible: ['omnivore', 'pescatarian', 'halal', 'dairy_free'],
    allergenReview: 'reviewed',
  },
  {
    id: 'prawn-garlic-rice',
    title: 'Garlic prawns with rice & peas',
    effort: 'quick',
    prepMin: 20,
    proteinAnchor: 'shellfish',
    tags: ['one_pan'],
    keyIngredients: ['prawns', 'garlic', 'rice', 'peas', 'chilli', 'parsley'],
    allergens: ['crustaceans'],
    mayContain: ['milk', 'sulphites'],
    triggers: ['spice_capsaicin', 'onion_garlic_fodmap'],
    compatible: ['omnivore', 'pescatarian', 'gluten_free'],
    allergenReview: 'reviewed',
  },
  {
    id: 'tuna-white-bean-salad',
    title: 'Big salad with tuna & white beans',
    effort: 'quick',
    prepMin: 10,
    proteinAnchor: 'fish',
    tags: ['no_cook', 'salad', 'store_cupboard'],
    keyIngredients: ['tuna', 'cannellini beans', 'red onion', 'olive oil', 'lemon', 'rocket'],
    allergens: ['fish'],
    mayContain: ['mustard', 'sulphites'],
    triggers: ['onion_garlic_fodmap'],
    compatible: ['omnivore', 'pescatarian', 'halal', 'kosher', 'gluten_free', 'dairy_free'],
    allergenReview: 'reviewed',
  },
  {
    id: 'mackerel-tomato-toast',
    title: 'Smoked mackerel, tomatoes & toast',
    effort: 'quick',
    prepMin: 10,
    proteinAnchor: 'fish',
    tags: ['no_cook', 'store_cupboard'],
    keyIngredients: ['smoked mackerel', 'tomatoes', 'sourdough', 'lemon', 'black pepper'],
    allergens: ['fish', 'gluten'],
    mayContain: ['milk', 'sesame', 'sulphites'],
    triggers: ['gluten_non_coeliac', 'histamine'],
    compatible: ['omnivore', 'pescatarian', 'halal', 'kosher'],
    allergenReview: 'reviewed',
  },
  {
    id: 'eggs-veg-fry-up',
    title: 'Eggs & veg fry-up with sourdough',
    effort: 'quick',
    prepMin: 15,
    proteinAnchor: 'eggs',
    tags: ['one_pan'],
    keyIngredients: ['eggs', 'mushrooms', 'tomatoes', 'spinach', 'sourdough'],
    allergens: ['eggs', 'gluten'],
    mayContain: ['milk'],
    triggers: ['gluten_non_coeliac'],
    compatible: ['omnivore', 'vegetarian', 'pescatarian', 'halal', 'kosher'],
    allergenReview: 'reviewed',
  },
  {
    id: 'shakshuka',
    title: 'Shakshuka with chickpeas',
    effort: 'normal',
    prepMin: 30,
    proteinAnchor: 'eggs',
    tags: ['one_pan', 'batch_friendly'],
    keyIngredients: ['eggs', 'tomatoes', 'chickpeas', 'peppers', 'cumin', 'paprika'],
    allergens: ['eggs'],
    mayContain: ['milk', 'gluten'],
    triggers: ['spice_capsaicin', 'onion_garlic_fodmap'],
    compatible: [
      'omnivore',
      'vegetarian',
      'pescatarian',
      'halal',
      'kosher',
      'gluten_free',
      'dairy_free',
    ],
    allergenReview: 'reviewed',
  },
  {
    id: 'halloumi-tray-bake',
    title: 'Halloumi & roast vegetable tray bake',
    effort: 'normal',
    prepMin: 35,
    proteinAnchor: 'dairy',
    tags: ['sheet_pan', 'one_pan'],
    keyIngredients: ['halloumi', 'courgette', 'peppers', 'red onion', 'olive oil', 'oregano'],
    allergens: ['milk'],
    mayContain: [],
    triggers: ['lactose', 'onion_garlic_fodmap'],
    compatible: ['omnivore', 'vegetarian', 'pescatarian', 'halal', 'kosher', 'gluten_free'],
    allergenReview: 'reviewed',
  },
  {
    id: 'baked-feta-tomato-orzo',
    title: 'Baked feta, tomato & orzo',
    effort: 'quick',
    prepMin: 30,
    proteinAnchor: 'dairy',
    tags: ['one_pan', 'sheet_pan'],
    keyIngredients: ['feta', 'cherry tomatoes', 'orzo', 'garlic', 'basil'],
    allergens: ['milk', 'gluten'],
    mayContain: ['eggs'],
    triggers: ['lactose', 'gluten_non_coeliac', 'onion_garlic_fodmap'],
    compatible: ['omnivore', 'vegetarian', 'pescatarian', 'halal', 'kosher'],
    allergenReview: 'reviewed',
  },
  {
    id: 'red-lentil-dhal',
    title: 'Red lentil dhal with spinach',
    effort: 'normal',
    prepMin: 35,
    proteinAnchor: 'legumes',
    tags: ['batch_friendly', 'freezes_well', 'store_cupboard', 'soup_stew'],
    keyIngredients: ['red lentils', 'coconut milk', 'spinach', 'turmeric', 'ginger', 'garlic'],
    allergens: [],
    mayContain: ['mustard'],
    triggers: ['spice_capsaicin', 'onion_garlic_fodmap'],
    compatible: [
      'omnivore',
      'vegetarian',
      'vegan',
      'pescatarian',
      'halal',
      'kosher',
      'gluten_free',
      'dairy_free',
    ],
    allergenReview: 'reviewed',
  },
  {
    id: 'chickpea-coconut-curry',
    title: 'Chickpea & coconut curry',
    effort: 'quick',
    prepMin: 25,
    proteinAnchor: 'legumes',
    tags: ['one_pan', 'batch_friendly', 'store_cupboard'],
    keyIngredients: ['chickpeas', 'coconut milk', 'tomatoes', 'curry powder', 'onion', 'rice'],
    allergens: [],
    mayContain: ['mustard', 'sulphites'],
    triggers: ['spice_capsaicin', 'onion_garlic_fodmap'],
    compatible: [
      'omnivore',
      'vegetarian',
      'vegan',
      'pescatarian',
      'halal',
      'kosher',
      'gluten_free',
      'dairy_free',
    ],
    allergenReview: 'reviewed',
  },
  {
    id: 'black-bean-sweet-potato-tacos',
    title: 'Black bean & sweet potato tacos',
    effort: 'normal',
    prepMin: 35,
    proteinAnchor: 'legumes',
    tags: ['sheet_pan', 'handheld'],
    keyIngredients: ['black beans', 'sweet potato', 'corn tortillas', 'lime', 'coriander', 'chilli'],
    allergens: [],
    mayContain: ['gluten', 'milk'],
    triggers: ['spice_capsaicin', 'fructose'],
    compatible: [
      'omnivore',
      'vegetarian',
      'vegan',
      'pescatarian',
      'halal',
      'kosher',
      'dairy_free',
    ],
    allergenReview: 'reviewed',
  },
  {
    id: 'tofu-noodle-stir-fry',
    title: 'Crispy tofu noodle stir-fry',
    effort: 'quick',
    prepMin: 20,
    proteinAnchor: 'soy_protein',
    tags: ['one_pan'],
    keyIngredients: ['tofu', 'noodles', 'soy sauce', 'pak choi', 'spring onion', 'ginger'],
    allergens: ['soy', 'gluten'],
    mayContain: ['sesame', 'eggs'],
    triggers: ['gluten_non_coeliac', 'onion_garlic_fodmap'],
    compatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher', 'dairy_free'],
    allergenReview: 'reviewed',
  },
  {
    id: 'peanut-sesame-noodles-edamame',
    title: 'Peanut-sesame noodles with edamame',
    effort: 'quick',
    prepMin: 20,
    proteinAnchor: 'legumes',
    tags: ['one_pan', 'store_cupboard'],
    keyIngredients: ['peanut butter', 'sesame oil', 'noodles', 'edamame', 'lime', 'chilli'],
    allergens: ['peanuts', 'sesame', 'soy', 'gluten'],
    mayContain: ['eggs'],
    triggers: ['spice_capsaicin', 'gluten_non_coeliac'],
    compatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher', 'dairy_free'],
    allergenReview: 'reviewed',
  },
  {
    id: 'quinoa-roast-veg-almond',
    title: 'Quinoa, roast veg & toasted almonds',
    effort: 'normal',
    prepMin: 40,
    proteinAnchor: 'nuts_seeds',
    tags: ['sheet_pan', 'salad', 'batch_friendly'],
    keyIngredients: ['quinoa', 'almonds', 'aubergine', 'courgette', 'lemon', 'parsley'],
    allergens: ['tree_nuts'],
    mayContain: ['sesame', 'sulphites'],
    triggers: [],
    compatible: [
      'omnivore',
      'vegetarian',
      'vegan',
      'pescatarian',
      'halal',
      'kosher',
      'gluten_free',
      'dairy_free',
    ],
    allergenReview: 'reviewed',
  },
  {
    id: 'minestrone-butter-beans',
    title: 'Minestrone with butter beans',
    effort: 'normal',
    prepMin: 40,
    proteinAnchor: 'legumes',
    tags: ['soup_stew', 'batch_friendly', 'freezes_well'],
    keyIngredients: ['butter beans', 'celery', 'carrot', 'tomatoes', 'pasta', 'stock'],
    allergens: ['celery', 'gluten'],
    mayContain: ['milk', 'sulphites'],
    triggers: ['gluten_non_coeliac', 'onion_garlic_fodmap'],
    compatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher', 'dairy_free'],
    allergenReview: 'reviewed',
  },
  {
    id: 'mushroom-barley-risotto',
    title: 'Mushroom & barley risotto',
    effort: 'enjoy',
    prepMin: 50,
    proteinAnchor: 'dairy',
    tags: ['one_pan', 'batch_friendly'],
    keyIngredients: ['mushrooms', 'pearl barley', 'parmesan', 'stock', 'thyme', 'white wine'],
    allergens: ['gluten', 'milk', 'sulphites'],
    mayContain: ['celery', 'eggs'],
    triggers: ['gluten_non_coeliac', 'lactose', 'alcohol', 'onion_garlic_fodmap'],
    compatible: ['omnivore', 'vegetarian', 'pescatarian'],
    allergenReview: 'reviewed',
  },
  {
    id: 'greek-yoghurt-bowl',
    title: 'Yoghurt bowl with berries & seeds',
    effort: 'quick',
    prepMin: 5,
    proteinAnchor: 'dairy',
    tags: ['no_cook', 'store_cupboard'],
    keyIngredients: ['greek yoghurt', 'berries', 'pumpkin seeds', 'honey', 'cinnamon'],
    allergens: ['milk'],
    mayContain: ['tree_nuts', 'sesame', 'gluten'],
    triggers: ['lactose', 'fructose'],
    compatible: ['omnivore', 'vegetarian', 'pescatarian', 'halal', 'kosher', 'gluten_free'],
    allergenReview: 'reviewed',
  },
];

/**
 * Titles only, for the string-based rotation in `rotation.ts` while it is
 * still keyed on display strings. New surfaces should take `Dish`.
 */
export const DISH_TITLES: string[] = DISHES.map((d) => d.title);

export function dishById(id: string): Dish | undefined {
  return DISHES.find((d) => d.id === id);
}

/*
 * ── Open questions for a human ───────────────────────────────────────────
 *
 * These are decisions, not TODOs. Each one changes what the app claims:
 *
 * 1. **halal / kosher in the same enum as vegan.** We can only check
 *    ingredients; certification, slaughter and kitchen separation are
 *    invisible to us. Either the UI wording stays "compatible ingredients
 *    — sourcing is yours", or these two move out of `compatible` into a
 *    separate advisory field, or we drop them rather than half-answer.
 * 2. **Who may set `allergenReview: 'reviewed'`.** Right now the seed
 *    corpus is reviewed and everything else is not. If users can add
 *    dishes, can they mark their own as reviewed? (Probably yes — it is
 *    their kitchen and their allergy — but never for a dish that is then
 *    shared with anyone else.)
 * 3. **Intolerances do not fail closed; allergens do.** Deliberate and
 *    argued above, but it is the kind of asymmetry that should be a signed
 *    decision rather than a default someone inherits.
 * 4. **Severity.** "Anaphylactic to peanuts" and "avoids dairy because it
 *    is uncomfortable" are both `allergies` entries today. Adding severity
 *    would let the UI reserve its strongest language for the case that
 *    warrants it — but it also invites treating a mild-looking allergy as
 *    less than hard, which is exactly what must not happen.
 * 5. **Cross-contamination is entirely unmodelled** — shared fryers, a
 *    "may contain" line on a packet we never see. `ALLERGEN_DISCLAIMER`
 *    is doing all the work there; a lawyer should read it.
 */

/**
 * The allergen gate, walked for every allergen on the declarable list.
 *
 * `food.test.ts` proves the rule with peanuts. A rule proved for one
 * allergen is a rule that could have a typo in another; this walks all
 * fourteen through every door a dish can reach a person by — the filter,
 * the ranking, the week, the cycle button — and checks the seed corpus
 * against its own claims.
 */

import {
  ALLERGEN_LABELS,
  DIETARY_PATTERN_LABELS,
  DISHES,
  EMPTY_FOOD_PREFERENCES,
  INTOLERANCE_LABELS,
  allergenExclusion,
  filterDishes,
  rankDishes,
  type Allergen,
  type DietaryPattern,
  type Dish,
  type FoodPreferences,
  type Intolerance,
} from '@/features/modalities/meals/food';
import {
  DINNERS,
  allowedDishTitles,
  nextAllowedDish,
  suggestAllowedWeek,
  suggestWeek,
} from '@/features/modalities/meals/rotation';

const ALLERGENS = Object.keys(ALLERGEN_LABELS) as Allergen[];
const INTOLERANCES = Object.keys(INTOLERANCE_LABELS) as Intolerance[];
const PATTERNS = Object.keys(DIETARY_PATTERN_LABELS) as DietaryPattern[];

const prefs = (over: Partial<FoodPreferences> = {}): FoodPreferences => ({ ...EMPTY_FOOD_PREFERENCES, ...over });

const dish = (over: Partial<Dish> = {}): Dish => ({
  id: 'test-dish',
  title: 'Test dish',
  effort: 'quick',
  prepMin: 15,
  proteinAnchor: 'eggs',
  tags: [],
  keyIngredients: ['eggs'],
  allergens: [],
  mayContain: [],
  triggers: [],
  compatible: ['omnivore'],
  allergenReview: 'reviewed',
  ...over,
});

const byTitle = (title: string) => DISHES.find((d) => d.title === title);

describe.each(ALLERGENS)('allergen %s', (allergen) => {
  it('excludes a dish that lists it, names the label, and never leaks through any door', () => {
    const listed = dish({ id: 'listed', title: 'Listed', allergens: [allergen] });
    const may = dish({ id: 'may', title: 'May contain', mayContain: [allergen] });
    const unreviewed = dish({ id: 'unknown', title: 'Unknown', allergenReview: 'unreviewed' });
    const clean = dish({ id: 'clean', title: 'Clean' });
    const p = prefs({ allergies: [allergen] });

    expect(allergenExclusion(listed, [allergen])).toEqual({ reason: 'allergen', by: ALLERGEN_LABELS[allergen] });
    expect(allergenExclusion(may, [allergen])).toEqual({ reason: 'allergen_may_contain', by: ALLERGEN_LABELS[allergen] });
    expect(allergenExclusion(unreviewed, [allergen])?.reason).toBe('allergen_unreviewed');
    expect(allergenExclusion(clean, [allergen])).toBeUndefined();

    expect(filterDishes([listed, may, unreviewed, clean], p).map((d) => d.id)).toEqual(['clean']);
    const ranked = rankDishes([listed, may, unreviewed, clean], p);
    expect(ranked.filter((r) => r.excluded).map((r) => r.dish.id).sort()).toEqual(['listed', 'may', 'unknown']);
    // Excluded dishes score nothing, so they never outrank an allowed one.
    for (const r of ranked) if (r.excluded) expect(r.score).toBe(0);
  });

  it('is honoured by the seed corpus through the week, the cycle and the list', () => {
    const p = prefs({ allergies: [allergen] });
    const allowed = allowedDishTitles(p);
    const forbidden = DISHES.filter((d) => d.allergens.includes(allergen) || d.mayContain.includes(allergen) || d.allergenReview !== 'reviewed');
    for (const d of forbidden) expect(allowed).not.toContain(d.title);
    for (const title of allowed) {
      const d = byTitle(title)!;
      expect(d).toBeDefined();
      expect(d.allergenReview).toBe('reviewed');
      expect(d.allergens).not.toContain(allergen);
      expect(d.mayContain).not.toContain(allergen);
    }
    // Something is left to eat, for every single allergen.
    expect(allowed.length).toBeGreaterThanOrEqual(3);

    for (const weekStart of ['2026-03-02', '2026-09-07', '2026-12-28']) {
      const week = suggestAllowedWeek(weekStart, p);
      for (const [d, title] of Object.entries(week)) {
        if (Number(d) === 4) continue;
        expect(allowed).toContain(title);
      }
      expect(suggestAllowedWeek(weekStart, p)).toEqual(week);
    }

    // Cycling from any dish, allowed or not, lands on an allowed one.
    for (const start of [...DISHES.map((d) => d.title), 'Leftovers night', '']) {
      const next = nextAllowedDish(start, p);
      expect(allowed).toContain(next);
    }
  });
});

describe('the seed corpus keeps its own promises', () => {
  it('every dish is reviewed, uniquely named, and lists an allergen once', () => {
    expect(new Set(DISHES.map((d) => d.id)).size).toBe(DISHES.length);
    expect(new Set(DISHES.map((d) => d.title)).size).toBe(DISHES.length);
    for (const d of DISHES) {
      expect(d.allergenReview).toBe('reviewed');
      for (const a of d.allergens) expect(ALLERGENS).toContain(a);
      for (const a of d.mayContain) expect(ALLERGENS).toContain(a);
      for (const a of d.allergens) expect(d.mayContain).not.toContain(a);
      for (const t of d.triggers) expect(INTOLERANCES).toContain(t);
      for (const c of d.compatible) expect(PATTERNS).toContain(c);
      expect(d.compatible).toContain('omnivore');
      expect(d.prepMin).toBeGreaterThan(0);
      expect(d.keyIngredients.length).toBeGreaterThan(0);
    }
  });

  it('a dietary pattern claim is never contradicted by the allergen list or the anchor', () => {
    const meat = new Set(['chicken', 'turkey', 'beef', 'lamb', 'pork']);
    const sea = new Set(['fish', 'shellfish']);
    for (const d of DISHES) {
      const c = new Set(d.compatible);
      if (c.has('vegan')) {
        expect(d.allergens).not.toEqual(expect.arrayContaining(['milk']));
        expect(d.allergens).not.toEqual(expect.arrayContaining(['eggs']));
        expect(meat.has(d.proteinAnchor) || sea.has(d.proteinAnchor) || d.proteinAnchor === 'eggs' || d.proteinAnchor === 'dairy').toBe(false);
      }
      if (c.has('vegetarian') || c.has('vegan')) {
        expect(meat.has(d.proteinAnchor) || sea.has(d.proteinAnchor)).toBe(false);
        for (const a of ['fish', 'crustaceans', 'molluscs'] as const) expect(d.allergens).not.toContain(a);
      }
      if (c.has('pescatarian')) expect(meat.has(d.proteinAnchor)).toBe(false);
      if (c.has('gluten_free')) expect(d.allergens).not.toContain('gluten');
      if (c.has('dairy_free')) expect(d.allergens).not.toContain('milk');
      // Kosher-compatible ingredients: no pork, no shellfish, no meat with dairy.
      if (c.has('kosher')) {
        expect(d.proteinAnchor).not.toBe('pork');
        expect(d.proteinAnchor).not.toBe('shellfish');
        if (meat.has(d.proteinAnchor)) expect(d.allergens).not.toContain('milk');
      }
      if (c.has('halal')) expect(d.proteinAnchor).not.toBe('pork');
    }
  });

  it('a pattern is a preference, never an allergy: the allergy gate still sees "may contain"', () => {
    // Eight dishes claim dairy-free or gluten-free while listing milk or
    // gluten under "may contain" (bread on the side, optional cheese). The
    // pattern describes the dish as written; whether the label should be
    // withheld is a content decision recorded in the QA report. What the
    // code must guarantee is that declaring the ALLERGY, not the pattern,
    // excludes every one of them.
    const claimed = DISHES.filter(
      (d) =>
        (d.compatible.includes('dairy_free') && d.mayContain.includes('milk')) ||
        (d.compatible.includes('gluten_free') && d.mayContain.includes('gluten')),
    );
    for (const d of claimed) {
      const allergy = d.mayContain.includes('milk') && d.compatible.includes('dairy_free') ? 'milk' : 'gluten';
      expect(allergenExclusion(d, [allergy])?.reason).toBe('allergen_may_contain');
    }
  });
});

describe('intolerances and patterns, each on its own', () => {
  it.each(INTOLERANCES)('%s removes every dish that lists it as a trigger and nothing else', (intolerance) => {
    const out = filterDishes(DISHES, prefs({ intolerances: [intolerance] }));
    for (const d of out) expect(d.triggers).not.toContain(intolerance);
    expect(out.length).toBe(DISHES.filter((d) => !d.triggers.includes(intolerance)).length);
  });

  it.each(PATTERNS)('%s keeps only dishes that claim it', (pattern) => {
    const out = filterDishes(DISHES, prefs({ patterns: [pattern] }));
    for (const d of out) expect(d.compatible).toContain(pattern);
    expect(out.length).toBe(DISHES.filter((d) => d.compatible.includes(pattern)).length);
    expect(out.length).toBeGreaterThan(0);
  });

  it('an allergy stacked on a pattern keeps both rules', () => {
    const p = prefs({ patterns: ['vegetarian'], allergies: ['eggs', 'milk'], intolerances: ['onion_garlic_fodmap'] });
    const out = filterDishes(DISHES, p);
    for (const d of out) {
      expect(d.compatible).toContain('vegetarian');
      expect(d.allergens).not.toEqual(expect.arrayContaining(['eggs']));
      expect(d.allergens).not.toEqual(expect.arrayContaining(['milk']));
      expect(d.mayContain).not.toEqual(expect.arrayContaining(['eggs']));
      expect(d.mayContain).not.toEqual(expect.arrayContaining(['milk']));
      expect(d.triggers).not.toContain('onion_garlic_fodmap');
    }
  });
});

describe('the week', () => {
  it('is deterministic with leftovers mid-week, with or without preferences', () => {
    for (const p of [null, prefs(), prefs({ effort: 'quick' }), prefs({ allergies: ['fish'] }), prefs({ patterns: ['vegan'] })]) {
      const week = suggestAllowedWeek('2026-09-07', p);
      expect(Object.keys(week).map(Number).sort()).toEqual([0, 1, 2, 3, 4, 5, 6]);
      expect(week[4]).toBe('Leftovers night');
      expect(suggestAllowedWeek('2026-09-07', p)).toEqual(week);
    }
    expect(suggestWeek('2026-09-07')[4]).toBe('Leftovers night');
  });

  /**
   * When nothing in the corpus is known to be safe, the week must not
   * quietly fall back to the unchecked pool. A person who declared an
   * allergy is never served from a list that cannot see it.
   */
  it('never serves the unchecked pool to someone whose allergies empty the list', () => {
    const everything = prefs({ allergies: ALLERGENS });
    expect(allowedDishTitles(everything)).toEqual([]);
    const week = suggestAllowedWeek('2026-09-07', everything);
    const unchecked = new Set(DINNERS.map((d) => d.title));
    for (const [d, title] of Object.entries(week)) {
      expect({ day: d, title, fromUncheckedPool: unchecked.has(title) }).toEqual({ day: d, title, fromUncheckedPool: false });
    }
    // The cycle button has nowhere to go and says so by staying put.
    expect(nextAllowedDish(week[0], everything)).toBe(week[0]);
  });

  it('a quick-only cook with allergies gets quick dishes only, all reviewed', () => {
    const p = prefs({ effort: 'quick', allergies: ['gluten', 'milk'] });
    const titles = allowedDishTitles(p);
    expect(titles.length).toBeGreaterThan(0);
    for (const t of titles) {
      const d = byTitle(t)!;
      expect(d.effort).toBe('quick');
      expect(d.allergens).not.toEqual(expect.arrayContaining(['gluten']));
      expect(d.mayContain).not.toEqual(expect.arrayContaining(['milk']));
    }
  });
});

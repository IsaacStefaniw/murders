import {
  DISHES,
  EMPTY_FOOD_PREFERENCES,
  allergenExclusion,
  filterDishes,
  rankDishes,
  type Dish,
  type FoodPreferences,
} from '@/features/modalities/meals/food';

const prefs = (over: Partial<FoodPreferences> = {}): FoodPreferences => ({
  ...EMPTY_FOOD_PREFERENCES,
  ...over,
});

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

describe('allergens fail closed', () => {
  it('excludes a dish that lists the allergen', () => {
    const d = dish({ allergens: ['peanuts'] });
    expect(filterDishes([d], prefs({ allergies: ['peanuts'] }))).toEqual([]);
  });

  it('excludes a "may contain" dish exactly as hard as a known one', () => {
    const d = dish({ mayContain: ['peanuts'] });
    expect(filterDishes([d], prefs({ allergies: ['peanuts'] }))).toEqual([]);
  });

  /** The whole point: not knowing is not the same as knowing it is fine. */
  it('withholds an unreviewed dish from anyone declaring any allergy', () => {
    const unknown = dish({ allergenReview: 'unreviewed' });
    expect(filterDishes([unknown], prefs({ allergies: ['milk'] }))).toEqual([]);
    // …but an unreviewed dish is fine for someone with no allergies at all.
    expect(filterDishes([unknown], prefs())).toHaveLength(1);
  });

  it('names the reason so the UI can explain the gap', () => {
    const d = dish({ allergens: ['sesame'] });
    const [r] = rankDishes([d], prefs({ allergies: ['sesame'] }));
    expect(r.excluded).toBe('allergen');
    expect(r.excludedBy).toBe('Sesame');
  });

  it('every seeded dish survives its own allergen list', () => {
    for (const d of DISHES) {
      for (const a of d.allergens) {
        expect(allergenExclusion(d, [a])).toBeDefined();
      }
      expect(allergenExclusion(d, [])).toBeUndefined();
    }
  });
});

describe('intolerances and patterns', () => {
  it('excludes a known trigger', () => {
    const d = dish({ triggers: ['lactose'] });
    expect(filterDishes([d], prefs({ intolerances: ['lactose'] }))).toEqual([]);
  });

  it('requires every declared pattern at once', () => {
    const d = dish({ compatible: ['omnivore', 'vegetarian'] });
    expect(filterDishes([d], prefs({ patterns: ['vegetarian'] }))).toHaveLength(1);
    expect(filterDishes([d], prefs({ patterns: ['vegetarian', 'gluten_free'] }))).toEqual([]);
  });

  it('leaves a usable rotation for each pattern in the seed corpus', () => {
    for (const p of ['vegan', 'vegetarian', 'pescatarian', 'gluten_free', 'dairy_free'] as const) {
      expect(filterDishes(DISHES, prefs({ patterns: [p] })).length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('soft preferences', () => {
  it('deprioritises dislikes without removing them', () => {
    const liked = dish({ id: 'a', title: 'Rice bowl', keyIngredients: ['rice'] });
    const disliked = dish({ id: 'b', title: 'Mushroom pan', keyIngredients: ['mushrooms'] });
    const out = filterDishes([disliked, liked], prefs({ dislikes: ['mushrooms'] }));
    expect(out.map((d) => d.id)).toEqual(['a', 'b']);
  });

  it('boosts favourites and lets recent enjoyment overtake an older rating', () => {
    const a = dish({ id: 'a' });
    const b = dish({ id: 'b' });
    const withRatings = prefs({
      enjoyment: [
        { dishId: 'b', rating: 5, at: '2026-03-01' },
        { dishId: 'b', rating: 1, at: '2026-06-01' },
      ],
      favourites: ['a'],
    });
    expect(filterDishes([b, a], withRatings).map((d) => d.id)).toEqual(['a', 'b']);
  });

  it('is deterministic — same inputs, same order', () => {
    const p = prefs({ favourites: ['salmon'], dislikes: ['mushrooms'] });
    expect(filterDishes(DISHES, p)).toEqual(filterDishes(DISHES, p));
  });
});

describe('effort', () => {
  it('honours a quick-only cooking answer', () => {
    const out = filterDishes(DISHES, prefs({ effort: 'quick' }));
    expect(out.length).toBeGreaterThan(0);
    for (const d of out) expect(d.effort).toBe('quick');
  });
});

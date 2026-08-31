import {
  DISHES,
  EMPTY_FOOD_PREFERENCES,
  type FoodPreferences,
} from '@/features/modalities/meals/food';
import {
  allowedDishTitles,
  DINNER_IDEAS,
  nextAllowedDish,
  nextIdea,
  suggestAllowedWeek,
  suggestWeek,
} from '@/features/modalities/meals/rotation';

describe('dinner rotation', () => {
  it('fills all seven nights deterministically, leftovers night included', () => {
    const week = suggestWeek('2026-09-06');
    expect(Object.keys(week)).toHaveLength(7);
    expect(week[4]).toBe('Leftovers night');
    expect(suggestWeek('2026-09-06')).toEqual(week);
    // A different week starts differently — no groundhog-day menus.
    expect(suggestWeek('2026-09-13')).not.toEqual(week);
  });

  it('cycles through every idea without repeating until the list wraps', () => {
    const seen = new Set<string>();
    let current = DINNER_IDEAS[0];
    for (let i = 0; i < DINNER_IDEAS.length; i++) {
      seen.add(current);
      current = nextIdea(current);
    }
    expect(seen.size).toBe(DINNER_IDEAS.length);
    expect(current).toBe(DINNER_IDEAS[0]);
  });

  it('every idea reads as food, not macros', () => {
    for (const idea of DINNER_IDEAS) {
      expect(idea).not.toMatch(/calorie|protein|macro|carb(?!onara)|gram/i);
    }
  });
});

describe('preference-aware rotation', () => {
  const prefs = (over: Partial<FoodPreferences> = {}): FoodPreferences => ({
    ...EMPTY_FOOD_PREFERENCES,
    ...over,
  });

  it('falls back to the simple pool when nothing has been declared', () => {
    expect(allowedDishTitles(prefs())).toEqual(DINNER_IDEAS);
    expect(allowedDishTitles(null)).toEqual(DINNER_IDEAS);
  });

  /**
   * The whole point of routing through the food model. The old pool was
   * twelve titles with no ingredients behind them, so it could not have
   * honoured this if it tried.
   */
  it('honours a declared allergy, and only offers dishes known to be free of it', () => {
    const titles = allowedDishTitles(prefs({ allergies: ['peanuts'] }));
    expect(titles.length).toBeGreaterThan(0);
    for (const title of titles) {
      const dish = DISHES.find((d) => d.title === title)!;
      expect(dish.allergenReview).toBe('reviewed');
      expect(dish.allergens).not.toContain('peanuts');
      expect(dish.mayContain).not.toContain('peanuts');
    }
  });

  it('honours a dietary pattern', () => {
    const titles = allowedDishTitles(prefs({ patterns: ['vegetarian'] }));
    for (const title of titles) {
      expect(DISHES.find((d) => d.title === title)!.compatible).toContain('vegetarian');
    }
  });

  /**
   * Repeating a safe dinner is a normal week. Padding the week with
   * something excluded is not.
   */
  it('repeats within the allowed set rather than reaching outside it', () => {
    const narrow = prefs({ allergies: ['fish', 'crustaceans', 'milk', 'gluten', 'eggs'] });
    const allowed = new Set(allowedDishTitles(narrow));
    const week = suggestAllowedWeek('2026-03-02', narrow);
    for (const [day, dish] of Object.entries(week)) {
      if (Number(day) === 4) continue; // leftovers night
      expect(allowed.has(dish)).toBe(true);
    }
  });

  it('cycling a day stays inside what the person can eat', () => {
    const p = prefs({ patterns: ['vegetarian'] });
    const allowed = allowedDishTitles(p);
    let current = allowed[0];
    for (let i = 0; i < allowed.length + 2; i++) {
      current = nextAllowedDish(current, p);
      expect(allowed).toContain(current);
    }
  });

  it('is stable for the same week and different across weeks', () => {
    const p = prefs({ intolerances: ['lactose'] });
    expect(suggestAllowedWeek('2026-03-02', p)).toEqual(suggestAllowedWeek('2026-03-02', p));
    expect(suggestAllowedWeek('2026-03-02', p)).not.toEqual(suggestAllowedWeek('2026-03-09', p));
  });
});

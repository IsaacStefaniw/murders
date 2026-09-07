import {
  DISHES,
  EMPTY_FOOD_PREFERENCES,
  type FoodPreferences,
} from '@/features/modalities/meals/food';
import { NO_SAFE_DISH, suggestAllowedWeek, suggestWeek } from '@/features/modalities/meals/rotation';
import {
  AISLE_ORDER,
  aisleOf,
  buildShoppingList,
  dishForTitle,
  lunchAnchors,
  shareShoppingListText,
  shoppingItemLine,
} from '@/features/modalities/meals/shopping';

const prefs = (over: Partial<FoodPreferences> = {}): FoodPreferences => ({
  ...EMPTY_FOOD_PREFERENCES,
  ...over,
});

/** A week keyed by weekday, from a list starting Sunday. */
const week = (titles: string[]): Record<number, string> =>
  Object.fromEntries(titles.map((t, i) => [i, t]));

describe('aisles', () => {
  it('every ingredient in the seed corpus has an aisle, so nothing lands in "anything else" by accident', () => {
    const missing = new Set<string>();
    for (const dish of DISHES) {
      for (const ing of dish.keyIngredients) if (aisleOf(ing) === 'other') missing.add(ing);
    }
    expect([...missing]).toEqual([]);
  });

  it('every stated amount names an ingredient the dish actually lists', () => {
    for (const dish of DISHES) {
      for (const key of Object.keys(dish.amounts ?? {})) {
        expect(dish.keyIngredients).toContain(key);
      }
    }
  });

  it('an ingredient it has never seen still gets on the list, at the end', () => {
    expect(aisleOf('dragon fruit')).toBe('other');
    expect(AISLE_ORDER[AISLE_ORDER.length - 1]).toBe('other');
  });
});

describe('dishForTitle', () => {
  it('matches the rotation pool titles that carry an aside the dish does not', () => {
    expect(dishForTitle('Chilli con carne (cook once, eat twice)')?.id).toBe('chilli-con-carne');
    expect(dishForTitle('Salmon, rice & broccoli')?.id).toBe('salmon-rice-broccoli');
  });

  it('does not guess when there is no dish behind a title', () => {
    expect(dishForTitle('Mince, beans & salsa bowls')).toBeUndefined();
    expect(dishForTitle('Leftovers night')).toBeUndefined();
  });
});

describe('buildShoppingList', () => {
  it('groups the decided dinners by aisle, in shop order, with amounts where the dish states them', () => {
    const list = buildShoppingList({
      dinners: week([
        'Salmon, rice & broccoli',
        'Leftovers night',
        'Chilli con carne (cook once, eat twice)',
        'Leftovers night',
        'Leftovers night',
        'Leftovers night',
        'Leftovers night',
      ]),
      prefs: prefs(),
    });
    expect(list.empty).toBe(false);
    expect(list.dinners).toEqual(['Salmon, rice & broccoli', 'Chilli con carne (cook once, eat twice)']);
    const labels = list.sections.map((s) => s.aisle);
    // Shop order, not insertion order.
    expect(labels).toEqual([...labels].sort((a, b) => AISLE_ORDER.indexOf(a) - AISLE_ORDER.indexOf(b)));
    const meat = list.sections.find((s) => s.aisle === 'meat_fish')!;
    const salmon = meat.items.find((i) => i.name === 'salmon')!;
    expect(salmon.amount).toBe('2 fillets');
    expect(salmon.forDishes).toEqual(['Salmon, rice & broccoli']);
    const produce = list.sections.find((s) => s.aisle === 'produce')!;
    // Broccoli has no stated amount: the plain item, never an invented number.
    expect(produce.items.find((i) => i.name === 'broccoli')!.amount).toBeUndefined();
  });

  it('merges an ingredient two dinners share into one line that names both', () => {
    const list = buildShoppingList({
      dinners: week(['Salmon, rice & broccoli', 'Miso salmon with greens & rice']),
      prefs: prefs(),
    });
    const meat = list.sections.find((s) => s.aisle === 'meat_fish')!;
    const salmon = meat.items.filter((i) => i.name === 'salmon');
    expect(salmon).toHaveLength(1);
    expect(salmon[0].forDishes).toEqual(['Salmon, rice & broccoli', 'Miso salmon with greens & rice']);
    expect(salmon[0].amount).toBe('2 fillets + 2 fillets');
  });

  it('leftovers night and a week with no safe dish put nothing on the list', () => {
    const none = buildShoppingList({ dinners: week(Array(7).fill('Leftovers night')), prefs: null, supplements: [] });
    // Only the lunch anchors remain, and with prefs null they still respect nothing declared.
    expect(none.dinners).toEqual([]);
    expect(none.unmatched).toEqual([]);
    const unsafe = buildShoppingList({ dinners: week(Array(7).fill(NO_SAFE_DISH)), prefs: null, supplements: [] });
    expect(unsafe.dinners).toEqual([]);
  });

  it('names the dinners it cannot build from, rather than guessing their ingredients', () => {
    const list = buildShoppingList({ dinners: week(['Mince, beans & salsa bowls']), prefs: prefs() });
    expect(list.unmatched).toEqual(['Mince, beans & salsa bowls']);
    expect(shareShoppingListText(list)).toContain('Your own dinners — add what they need: Mince, beans & salsa bowls');
  });

  it('inherits the allergen gate: a week built for a peanut allergy never lists peanuts', () => {
    const p = prefs({ allergies: ['peanuts', 'tree_nuts'] });
    for (const start of ['2026-09-06', '2026-09-13', '2026-09-20', '2026-09-27']) {
      const list = buildShoppingList({ dinners: suggestAllowedWeek(start, p), prefs: p });
      const names = list.sections.flatMap((s) => s.items.map((i) => i.name));
      expect(names.some((n) => /peanut|almond/.test(n))).toBe(false);
    }
  });

  it('adds only the supplements the person switched on, with the library condition beside them', () => {
    const list = buildShoppingList({
      dinners: week(['Leftovers night']),
      prefs: prefs(),
      supplements: ['creatine', 'vitamin-d', 'not-a-thing'],
    });
    const supplements = list.sections.find((s) => s.aisle === 'supplements')!;
    expect(supplements.items.map((i) => i.name)).toEqual(['Creatine monohydrate, the plain kind']);
    const pharmacy = list.sections.find((s) => s.aisle === 'pharmacy')!;
    expect(pharmacy.items[0].note).toBe('only after a blood test showed low');
    // Nothing switched on: no supplements section at all — never suggested.
    const off = buildShoppingList({ dinners: week(['Leftovers night']), prefs: prefs() });
    expect(off.sections.find((s) => s.aisle === 'supplements')).toBeUndefined();
    expect(off.sections.find((s) => s.aisle === 'pharmacy')).toBeUndefined();
  });

  it('is deterministic', () => {
    const inputs = { dinners: suggestWeek('2026-09-06'), prefs: prefs(), supplements: ['creatine'] };
    expect(buildShoppingList(inputs)).toEqual(buildShoppingList(inputs));
  });
});

describe('lunch anchors', () => {
  it('offers three plain anchors to someone with nothing declared', () => {
    expect(lunchAnchors(null).map((a) => a.name)).toEqual([
      'eggs, half a dozen',
      'tinned tuna, a few tins',
      'greek yoghurt, a big tub',
    ]);
  });

  it('respects allergies, patterns and intolerances the way the dinners do', () => {
    const vegan = lunchAnchors(prefs({ patterns: ['vegan'] })).map((a) => a.name);
    expect(vegan).toEqual(['tinned chickpeas or lentils', 'tofu, a block']);
    const eggsFish = lunchAnchors(prefs({ allergies: ['eggs', 'fish'] })).map((a) => a.name);
    expect(eggsFish).not.toContain('eggs, half a dozen');
    expect(eggsFish).not.toContain('tinned tuna, a few tins');
    const lactose = lunchAnchors(prefs({ intolerances: ['lactose'] })).map((a) => a.name);
    expect(lactose).not.toContain('greek yoghurt, a big tub');
    const soyVegan = lunchAnchors(prefs({ patterns: ['vegan'], allergies: ['soy'] })).map((a) => a.name);
    expect(soyVegan).toEqual(['tinned chickpeas or lentils']);
  });

  it('land on the list marked for lunches, not for a dinner', () => {
    const list = buildShoppingList({ dinners: week(['Leftovers night']), prefs: prefs() });
    const eggs = list.sections.flatMap((s) => s.items).find((i) => i.name === 'eggs, half a dozen')!;
    expect(eggs.note).toBe('for five lunches');
    expect(eggs.forDishes).toEqual([]);
  });
});

describe('share as text', () => {
  it('reads in plain words, grouped by aisle, with the amounts-for-two line', () => {
    const list = buildShoppingList({
      dinners: week(['Salmon, rice & broccoli']),
      prefs: prefs(),
      supplements: ['creatine'],
    });
    const text = shareShoppingListText(list, 'week of Sunday 6 September');
    expect(text.startsWith('Shopping list — week of Sunday 6 September\nDinners: Salmon, rice & broccoli')).toBe(true);
    expect(text).toContain('\nMeat & fish\n- Salmon — 2 fillets (Salmon, rice & broccoli)');
    expect(text).toContain('\nSupplements\n- Creatine monohydrate, the plain kind');
    expect(text).toContain('Amounts are for two.');
    expect(text).not.toMatch(/calorie|macro|protocol/i);
  });

  it('formats a line the way the pack does', () => {
    expect(shoppingItemLine({ name: 'broccoli', forDishes: ['Salmon, rice & broccoli'] })).toBe(
      'Broccoli (Salmon, rice & broccoli)',
    );
    expect(shoppingItemLine({ name: 'iron, as your doctor said', forDishes: [], note: 'only after a ferritin test' })).toBe(
      'Iron, as your doctor said (only after a ferritin test)',
    );
  });
});

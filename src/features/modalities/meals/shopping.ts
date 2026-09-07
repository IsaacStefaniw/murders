/**
 * Nutrition coach — the shopping list.
 *
 * The usability review's finding 8, nine people out of nine: after "Lock
 * in the week" there was nothing to shop from. The dinners were decided,
 * every dish already carried its ingredients, and the list was never
 * built. This is that list.
 *
 * It is built from three things and nothing else:
 *
 * 1. **The week's decided dinners.** Titles come from the rotation; each
 *    one is matched back to its `Dish`, whose `keyIngredients` become
 *    items and whose `amounts` — where the dish states them — become the
 *    quantity beside the item. The allergen gate has already run by the
 *    time a title reaches a locked-in week, so the list inherits it: a
 *    dish that was excluded never had its ingredients here.
 * 2. **A protein anchor for lunches.** The library's "protein anchor at
 *    every meal" covers lunch and the dinners do not, so the list carries
 *    a short set of lunch anchors that respect the same allergies and
 *    dietary patterns as the dinners.
 * 3. **Whatever the person has switched on** under "what you take
 *    already" — never anything suggested.
 *
 * Grouped by aisle, deterministic, and pure: same week, same preferences,
 * same list. Shown and shared in plain words, the way the rest of the pack
 * reads. Amounts are written for two and the list says so.
 */

import {
  DISHES,
  type Allergen,
  type Dish,
  type FoodPreferences,
} from '@/features/modalities/meals/food';
import { NO_SAFE_DISH } from '@/features/modalities/meals/rotation';
import { SUPPLEMENT_CHOICES } from '@/features/nutrition/supplements';

export type Aisle =
  | 'produce'
  | 'meat_fish'
  | 'dairy_eggs'
  | 'bakery'
  | 'pantry'
  | 'spices_sauces'
  | 'frozen'
  | 'supplements'
  | 'pharmacy'
  | 'other';

export const AISLE_LABELS: Record<Aisle, string> = {
  produce: 'Fruit & veg',
  meat_fish: 'Meat & fish',
  dairy_eggs: 'Dairy, eggs & chilled',
  bakery: 'Bakery',
  pantry: 'Tins, grains & dry goods',
  spices_sauces: 'Herbs, spices & sauces',
  frozen: 'Frozen',
  supplements: 'Supplements',
  pharmacy: 'Pharmacy',
  other: 'Anything else',
};

/** The order a shop is walked, roughly — fresh first, pharmacy last. */
export const AISLE_ORDER: Aisle[] = [
  'produce',
  'meat_fish',
  'dairy_eggs',
  'bakery',
  'pantry',
  'spices_sauces',
  'frozen',
  'supplements',
  'pharmacy',
  'other',
];

/**
 * Where each ingredient the seed corpus names is found. Every entry in
 * `DISHES[].keyIngredients` resolves here — a test holds that — so nothing
 * from a decided dinner lands in "anything else" by accident. An
 * ingredient this map has never seen still gets on the list; it just goes
 * to the end.
 */
const AISLE_OF: Record<string, Aisle> = {
  // Fruit & veg, fresh herbs included.
  potatoes: 'produce',
  'green beans': 'produce',
  lemon: 'produce',
  lime: 'produce',
  peppers: 'produce',
  broccoli: 'produce',
  ginger: 'produce',
  garlic: 'produce',
  tomatoes: 'produce',
  tomato: 'produce',
  'cherry tomatoes': 'produce',
  chilli: 'produce',
  onion: 'produce',
  'red onion': 'produce',
  'spring onion': 'produce',
  carrots: 'produce',
  carrot: 'produce',
  celery: 'produce',
  spinach: 'produce',
  cucumber: 'produce',
  parsley: 'produce',
  coriander: 'produce',
  basil: 'produce',
  thyme: 'produce',
  sage: 'produce',
  apple: 'produce',
  parsnip: 'produce',
  cabbage: 'produce',
  'pak choi': 'produce',
  rocket: 'produce',
  mushrooms: 'produce',
  courgette: 'produce',
  aubergine: 'produce',
  'sweet potato': 'produce',
  berries: 'produce',
  // Meat & fish.
  chicken: 'meat_fish',
  beef: 'meat_fish',
  'beef mince': 'meat_fish',
  'turkey mince': 'meat_fish',
  'lamb mince': 'meat_fish',
  'pork chops': 'meat_fish',
  salmon: 'meat_fish',
  'white fish': 'meat_fish',
  prawns: 'meat_fish',
  'smoked mackerel': 'meat_fish',
  // Dairy, eggs and the chilled cabinet.
  eggs: 'dairy_eggs',
  yoghurt: 'dairy_eggs',
  'greek yoghurt': 'dairy_eggs',
  halloumi: 'dairy_eggs',
  feta: 'dairy_eggs',
  parmesan: 'dairy_eggs',
  tofu: 'dairy_eggs',
  // Bakery.
  sourdough: 'bakery',
  'corn tortillas': 'bakery',
  // Tins, grains and dry goods.
  rice: 'pantry',
  pasta: 'pantry',
  orzo: 'pantry',
  noodles: 'pantry',
  quinoa: 'pantry',
  'pearl barley': 'pantry',
  'red lentils': 'pantry',
  'kidney beans': 'pantry',
  'cannellini beans': 'pantry',
  'butter beans': 'pantry',
  'black beans': 'pantry',
  chickpeas: 'pantry',
  tuna: 'pantry',
  'coconut milk': 'pantry',
  stock: 'pantry',
  almonds: 'pantry',
  'pumpkin seeds': 'pantry',
  honey: 'pantry',
  'peanut butter': 'pantry',
  'olive oil': 'pantry',
  'white wine': 'pantry',
  // Herbs, spices and sauces.
  'soy sauce': 'spices_sauces',
  'sesame oil': 'spices_sauces',
  'curry paste': 'spices_sauces',
  'curry powder': 'spices_sauces',
  miso: 'spices_sauces',
  cumin: 'spices_sauces',
  paprika: 'spices_sauces',
  oregano: 'spices_sauces',
  turmeric: 'spices_sauces',
  cinnamon: 'spices_sauces',
  'black pepper': 'spices_sauces',
  // Frozen.
  peas: 'frozen',
  edamame: 'frozen',
};

export function aisleOf(ingredient: string): Aisle {
  return AISLE_OF[ingredient.trim().toLowerCase()] ?? 'other';
}

export interface ShoppingItem {
  /** Lowercase, as the dish names it. */
  name: string;
  /** The amount, where a dish stated one. Two dishes' amounts are joined. */
  amount?: string;
  /** The dinners this is for — empty for lunch anchors and supplements. */
  forDishes: string[];
  /** A short plain-words qualifier — "only after a blood test showed low". */
  note?: string;
}

export interface ShoppingSection {
  aisle: Aisle;
  label: string;
  items: ShoppingItem[];
}

export interface ShoppingList {
  sections: ShoppingSection[];
  /** The dinners the list covers, in weekday order. */
  dinners: string[];
  /** Decided dinners the dish model does not know — the person adds their own. */
  unmatched: string[];
  /** True when nothing at all is on it. */
  empty: boolean;
}

export interface ShoppingInputs {
  /** The locked-in week: weekday → dinner title. */
  dinners: Record<number, string>;
  prefs?: FoodPreferences | null;
  /** Ids from `SUPPLEMENT_CHOICES` the person has switched on. */
  supplements?: string[];
  /** The dish model to read; the seed corpus unless a test says otherwise. */
  dishes?: Dish[];
}

/** Nights that need nothing bought: leftovers, and a week with no safe dish. */
const NOTHING_TO_BUY = new Set(['Leftovers night', NO_SAFE_DISH]);

/** A title with its bracketed aside removed, lowercased — for matching. */
function plainTitle(title: string): string {
  return title
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * The dish behind a rotation title. The simple pool in `rotation.ts` and
 * the dish corpus were written separately, so a title may carry an aside
 * — "Chilli con carne (cook once, eat twice)" — the dish does not. Match
 * exactly first, then without the aside.
 */
export function dishForTitle(title: string, dishes: Dish[] = DISHES): Dish | undefined {
  const exact = dishes.find((d) => d.title === title);
  if (exact) return exact;
  const plain = plainTitle(title);
  return dishes.find((d) => plainTitle(d.title) === plain);
}

// ── Lunches ───────────────────────────────────────────────────────────────

interface LunchAnchor {
  name: string;
  aisle: Aisle;
  /** Any of these declared allergies rules it out. */
  allergens: Allergen[];
  /** Left out for anyone on one of these patterns. */
  notFor: FoodPreferences['patterns'];
  /** Left out for these intolerances. */
  triggers: FoodPreferences['intolerances'];
}

/**
 * Plain, cheap, keeps for the week. The order is deliberate: the ones
 * most people can eat first, so the three that survive the gate are the
 * most useful three. Nothing here is a verdict on what anyone eats.
 */
const LUNCH_ANCHORS: LunchAnchor[] = [
  { name: 'eggs, half a dozen', aisle: 'dairy_eggs', allergens: ['eggs'], notFor: ['vegan'], triggers: [] },
  { name: 'tinned tuna, a few tins', aisle: 'pantry', allergens: ['fish'], notFor: ['vegan', 'vegetarian'], triggers: [] },
  { name: 'greek yoghurt, a big tub', aisle: 'dairy_eggs', allergens: ['milk'], notFor: ['vegan', 'dairy_free'], triggers: ['lactose'] },
  { name: 'tinned chickpeas or lentils', aisle: 'pantry', allergens: [], notFor: [], triggers: [] },
  { name: 'cooked chicken, or the roast’s leftovers', aisle: 'meat_fish', allergens: [], notFor: ['vegan', 'vegetarian', 'pescatarian'], triggers: [] },
  { name: 'tofu, a block', aisle: 'dairy_eggs', allergens: ['soy'], notFor: [], triggers: [] },
  { name: 'cottage cheese', aisle: 'dairy_eggs', allergens: ['milk'], notFor: ['vegan', 'dairy_free'], triggers: ['lactose'] },
];

const LUNCH_COUNT = 3;

/** The lunch protein anchors this person can be offered, at most three. */
export function lunchAnchors(prefs?: FoodPreferences | null): { name: string; aisle: Aisle }[] {
  const allergies = prefs?.allergies ?? [];
  const patterns = prefs?.patterns ?? [];
  const intolerances = prefs?.intolerances ?? [];
  return LUNCH_ANCHORS.filter(
    (a) =>
      !a.allergens.some((x) => allergies.includes(x)) &&
      !a.notFor.some((p) => patterns.includes(p)) &&
      !a.triggers.some((t) => intolerances.includes(t)),
  )
    .slice(0, LUNCH_COUNT)
    .map(({ name, aisle }) => ({ name, aisle }));
}

// ── The list ──────────────────────────────────────────────────────────────

const LUNCH_NOTE = 'for five lunches';

export function buildShoppingList(inputs: ShoppingInputs): ShoppingList {
  const dishes = inputs.dishes ?? DISHES;
  const byAisle = new Map<Aisle, Map<string, ShoppingItem>>();
  const add = (aisle: Aisle, item: ShoppingItem) => {
    const bucket = byAisle.get(aisle) ?? new Map<string, ShoppingItem>();
    const existing = bucket.get(item.name);
    if (existing) {
      // The same ingredient twice in a week is one line with both dinners
      // on it, and both amounts where both dishes stated one.
      existing.forDishes = [...existing.forDishes, ...item.forDishes];
      if (item.amount) existing.amount = existing.amount ? `${existing.amount} + ${item.amount}` : item.amount;
    } else {
      bucket.set(item.name, { ...item });
    }
    byAisle.set(aisle, bucket);
  };

  const dinners: string[] = [];
  const unmatched: string[] = [];
  for (let weekday = 0; weekday <= 6; weekday++) {
    const title = inputs.dinners[weekday];
    if (!title || NOTHING_TO_BUY.has(title)) continue;
    dinners.push(title);
    const dish = dishForTitle(title, dishes);
    if (!dish) {
      unmatched.push(title);
      continue;
    }
    for (const ingredient of dish.keyIngredients) {
      add(aisleOf(ingredient), {
        name: ingredient,
        amount: dish.amounts?.[ingredient],
        forDishes: [dish.title],
      });
    }
  }

  for (const anchor of lunchAnchors(inputs.prefs)) {
    add(anchor.aisle, { name: anchor.name, forDishes: [], note: LUNCH_NOTE });
  }

  for (const id of inputs.supplements ?? []) {
    const choice = SUPPLEMENT_CHOICES.find((c) => c.id === id);
    if (!choice) continue;
    add(choice.aisle, { name: choice.item, forDishes: [], note: choice.condition });
  }

  const sections: ShoppingSection[] = AISLE_ORDER.filter((a) => byAisle.has(a)).map((aisle) => ({
    aisle,
    label: AISLE_LABELS[aisle],
    // Alphabetical inside an aisle: a list someone reads while walking.
    items: [...byAisle.get(aisle)!.values()].sort((a, b) => a.name.localeCompare(b.name)),
  }));

  return {
    sections,
    dinners: [...new Set(dinners)],
    unmatched: [...new Set(unmatched)],
    empty: sections.length === 0,
  };
}

// ── Share as text ─────────────────────────────────────────────────────────

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** One line per item, in the pack's words. */
export function shoppingItemLine(item: ShoppingItem): string {
  let line = capitalise(item.name);
  if (item.amount) line += ` — ${item.amount}`;
  if (item.note) line += ` (${item.note})`;
  else if (item.forDishes.length) line += ` (${[...new Set(item.forDishes)].join(', ')})`;
  return line;
}

/**
 * The whole list as plain text for the share sheet — Notes, Messages, or
 * a partner who is at the shop. `weekLabel` is whatever the screen calls
 * the week; the function does not read the clock.
 */
export function shareShoppingListText(list: ShoppingList, weekLabel?: string): string {
  const lines: string[] = [];
  lines.push(weekLabel ? `Shopping list — ${weekLabel}` : 'Shopping list');
  if (list.dinners.length) lines.push(`Dinners: ${list.dinners.join(' · ')}`);
  for (const section of list.sections) {
    lines.push('');
    lines.push(section.label);
    for (const item of section.items) lines.push(`- ${shoppingItemLine(item)}`);
  }
  if (list.unmatched.length) {
    lines.push('');
    lines.push(`Your own dinners — add what they need: ${list.unmatched.join(', ')}`);
  }
  lines.push('');
  lines.push('Amounts are for two. Read the label for allergens — the list follows your preferences, it never clears food as safe.');
  return lines.join('\n');
}

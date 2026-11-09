/**
 * Isaac's dinners for the week of Mon 9 Nov 2026, and the shopping list.
 *
 * Both come from the repo's own code — `DISHES` in
 * `features/modalities/meals/food.ts` (28 dishes with a protein anchor,
 * effort, prep time and key ingredients) and `buildShoppingList` in
 * `features/modalities/meals/shopping.ts`, which aisles the ingredients
 * and knows which nights need nothing bought.
 *
 * Chosen against his real constraints rather than at random:
 *   Mon  futsal 18:15, eats ~19:30 — must need no cooking
 *   Tue  lifts 17:00, dinner 18:00 — 20 min ceiling
 *   Wed  lifts at lunch, dinner 18:00 — 30 min
 *   Thu  no training — the long one, batch-friendly
 *   Fri  lifts 17:00, dinner 18:00 — 20 min ceiling
 *   Sat  a wedding
 *   Sun  prep day — the 90-minute roast IS the prep, and it feeds Monday
 */
import { DISHES } from '@/features/modalities/meals/food';
import { buildShoppingList, shareShoppingListText } from '@/features/modalities/meals/shopping';

// Weekday keys as the store uses them: 0 = Sunday.
const DINNERS: Record<number, string> = {
  1: 'Smoked mackerel, tomatoes & toast',
  2: 'Garlic prawns with rice & peas',
  3: 'Chicken fajita tray bake',
  4: 'Turkey bolognese with hidden veg',
  5: 'Salmon, rice & broccoli',
  6: 'Big salad with tuna & white beans',
  0: 'Roast chicken, potatoes & greens',
};

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

it('plans the week and builds the shopping list', () => {
  const byTitle = new Map(DISHES.map((d) => [d.title, d]));

  console.log('\nTHE WEEK\n');
  for (const k of [1, 2, 3, 4, 5, 6, 0]) {
    const d = byTitle.get(DINNERS[k]);
    if (!d) {
      console.log(`${DAY[k]}  ${DINNERS[k]}  —  NOT IN THE DISH LIBRARY`);
      continue;
    }
    console.log(
      `${DAY[k]}  ${d.title.padEnd(34)} ${String(d.prepMin).padStart(2)} min  ${d.proteinAnchor.padEnd(10)} ${d.tags.join(',')}`,
    );
  }

  const list = buildShoppingList({ dinners: DINNERS });
  console.log(`\n${'─'.repeat(50)}\n${shareShoppingListText(list, 'week of Mon 9 Nov')}`);
  if (list.unmatched.length) console.log(`\nunmatched: ${list.unmatched.join(', ')}`);
});

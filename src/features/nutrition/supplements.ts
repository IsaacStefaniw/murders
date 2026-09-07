/**
 * What the person already takes — a preference, not an intake question.
 *
 * The brief asked for "Anything you take already?" on the intake only if
 * the answer changes the plan. It does not: the ladder, the protein
 * target and the week's dinners are the same whether or not someone
 * takes creatine. What the answer changes is the shopping list, so it is
 * a toggle on the nutrition hub, stored in the path's own answers under
 * `supplements` the way every multi-answer question already is — comma
 * joined, read with `parseSupplements`. No new store field.
 *
 * Every choice here points at its library entry, so the grade, the
 * source and the safety line are one tap away from the toggle. Nothing
 * on this list is suggested; the toggle exists so that something a
 * person has already decided to buy appears on the list beside the
 * dinners. The conditions on vitamin D and iron are the library's own
 * "test before you take" line, repeated where the switch is.
 */

import type { Aisle } from '@/features/modalities/meals/shopping';

export interface SupplementChoice {
  id: string;
  /** The library entry that carries the evidence and the safety line. */
  protocolId: string;
  label: string;
  /** Shown beside the toggle where the library says the item is conditional. */
  condition?: string;
  /** How it reads on the shopping list. */
  item: string;
  aisle: Aisle;
}

export const SUPPLEMENT_CHOICES: SupplementChoice[] = [
  {
    id: 'creatine',
    protocolId: 'creatine-monohydrate',
    label: 'Creatine monohydrate',
    item: 'Creatine monohydrate, the plain kind',
    aisle: 'supplements',
  },
  {
    id: 'protein-powder',
    protocolId: 'protein-powder-is-food',
    label: 'Protein powder',
    condition: 'food in a tub, not a plan',
    item: 'Protein powder',
    aisle: 'supplements',
  },
  {
    id: 'oily-fish',
    protocolId: 'omega-3-fish-first',
    label: 'Oily fish twice a week',
    condition: 'before any capsule',
    item: 'Tinned sardines or mackerel, two meals’ worth',
    aisle: 'meat_fish',
  },
  {
    id: 'vitamin-d',
    protocolId: 'vitamin-d-test-first',
    label: 'Vitamin D',
    condition: 'only after a blood test showed low',
    item: 'Vitamin D, as your doctor said',
    aisle: 'pharmacy',
  },
  {
    id: 'iron',
    protocolId: 'iron-test-before-you-take',
    label: 'Iron',
    condition: 'only after a ferritin test',
    item: 'Iron, as your doctor said',
    aisle: 'pharmacy',
  },
  {
    id: 'magnesium',
    protocolId: 'magnesium-honest',
    label: 'Magnesium',
    condition: 'the evidence is thin',
    item: 'Magnesium',
    aisle: 'pharmacy',
  },
];

/** The ids switched on, from the comma-joined answer. */
export function parseSupplements(raw: string | undefined): string[] {
  if (!raw) return [];
  const known = new Set(SUPPLEMENT_CHOICES.map((c) => c.id));
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => known.has(s));
}

/** The answer string after switching one id on or off. */
export function toggleSupplement(raw: string | undefined, id: string): string {
  const current = parseSupplements(raw);
  const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id];
  return next.join(',');
}

export function supplementById(id: string): SupplementChoice | undefined {
  return SUPPLEMENT_CHOICES.find((c) => c.id === id);
}

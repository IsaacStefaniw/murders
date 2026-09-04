/**
 * IntentNorth Plus — the entitlement and the line it draws.
 *
 * Decided 2026-09-03 (docs/MONETISATION.md): people pay from day one. The
 * interview, the profile and the first insight are free; the coaches
 * running the day are Plus. What stays free permanently is the day's
 * shape, every urge, reset and lapse-recovery tool, backup and restore,
 * and a view of everything Plus would run — every coach, every rung, every
 * protocol by name — so the locked half is a real look at the product,
 * not a wall.
 *
 * Everything in this file is pure. The StoreKit adapter (lib/purchases)
 * feeds it purchases; the store keeps the result; screens read it.
 */
import type { Protocol } from '@/features/knowledge/protocols';
import type { Routine } from '@/types/domain';
import { weekdayOf } from '@/lib/dates';

export const PLUS_PRODUCTS = {
  annual: 'app.intentnorth.plus.annual',
  monthly: 'app.intentnorth.plus.monthly',
  lifetime: 'app.intentnorth.plus.lifetime',
} as const;

export type PlusProductId = (typeof PLUS_PRODUCTS)[keyof typeof PLUS_PRODUCTS];

export const PLUS_SUBSCRIPTION_IDS: readonly string[] = [PLUS_PRODUCTS.annual, PLUS_PRODUCTS.monthly];
export const PLUS_ALL_IDS: readonly string[] = [...PLUS_SUBSCRIPTION_IDS, PLUS_PRODUCTS.lifetime];

export type Entitlement = {
  plus: boolean;
  /** Where the answer came from. 'dev' exists only in development builds. */
  source: 'none' | 'purchase' | 'dev';
  productId?: string;
  /** ISO. Absent for lifetime and for 'none'. */
  expiresAt?: string;
  /** ISO, when StoreKit was last asked. */
  checkedAt?: string;
};

export const NO_ENTITLEMENT: Entitlement = { plus: false, source: 'none' };

/** The subset of a StoreKit purchase the decision needs. */
export type PurchaseLike = {
  productId: string;
  purchaseState?: 'pending' | 'purchased' | 'unknown';
  /** Milliseconds since epoch, subscriptions only. */
  expirationDateIOS?: number | null;
};

/**
 * From what StoreKit says this Apple ID currently owns, is this person Plus?
 * Lifetime wins outright; otherwise the subscription that expires latest,
 * and only if it has not already. A pending purchase is not a purchase.
 */
export function entitlementFromPurchases(purchases: PurchaseLike[], now: Date = new Date()): Entitlement {
  const checkedAt = now.toISOString();
  const owned = purchases.filter((p) => (p.purchaseState ?? 'purchased') === 'purchased');
  const lifetime = owned.find((p) => p.productId === PLUS_PRODUCTS.lifetime);
  if (lifetime) return { plus: true, source: 'purchase', productId: lifetime.productId, checkedAt };
  const live = owned
    .filter((p) => PLUS_SUBSCRIPTION_IDS.includes(p.productId))
    .filter((p) => typeof p.expirationDateIOS === 'number' && p.expirationDateIOS > now.getTime())
    .sort((a, b) => (b.expirationDateIOS as number) - (a.expirationDateIOS as number));
  const best = live[0];
  if (!best) return { ...NO_ENTITLEMENT, checkedAt };
  return {
    plus: true,
    source: 'purchase',
    productId: best.productId,
    expiresAt: new Date(best.expirationDateIOS as number).toISOString(),
    checkedAt,
  };
}

/** Development builds and tests can grant Plus without StoreKit. */
export function grantedEntitlement(source: 'dev' = 'dev'): Entitlement {
  return { plus: true, source, checkedAt: new Date().toISOString() };
}

/** How many protocols per pillar are open to read without Plus. */
export const FREE_PROTOCOLS_PER_PILLAR = 5;

/**
 * The library, split. The first few of each pillar are open — the list
 * order is the knowledge base's own, foundation first — and the rest are
 * shown by name and locked.
 */
export function splitLibrary(
  listed: Protocol[],
  plus: boolean,
  perPillar: number = FREE_PROTOCOLS_PER_PILLAR,
): { open: Set<string>; openCount: number; total: number } {
  const open = new Set<string>();
  if (plus) {
    for (const p of listed) open.add(p.id);
    return { open, openCount: listed.length, total: listed.length };
  }
  const seen: Record<string, number> = {};
  for (const p of listed) {
    // The hardest-moment rule reaches the library too: an urge tool is never
    // listed by name behind a lock, whatever else its area has open.
    if (isAlwaysFreeProtocol(p.id)) {
      open.add(p.id);
      continue;
    }
    const n = seen[p.pillar] ?? 0;
    if (n < perPillar) {
      open.add(p.id);
      seen[p.pillar] = n + 1;
    }
  }
  return { open, openCount: open.size, total: listed.length };
}

/**
 * The hardest-moment rule, in code. Anything that belongs to the Habits &
 * urges pathway — its goal, or an urge protocol added from the library —
 * runs whether or not the person is Plus. "We never charge for someone's
 * hardest moment" is a promise on the website and in the app, and this is
 * the one place it is enforced.
 */
export function isAlwaysFreeRoutine(r: Routine, recoveryGoalId?: string): boolean {
  if (recoveryGoalId && r.goalId === recoveryGoalId) return true;
  return typeof r.protocolId === 'string' && isAlwaysFreeProtocol(r.protocolId);
}

/** The urge tools: free in the library, free to add, free to run. */
export function isAlwaysFreeProtocol(protocolId: string): boolean {
  return protocolId.startsWith('urge');
}

/** The routines the engine places today: all of them with Plus, the free ones without. */
export function runningRoutines(routines: Routine[], plus: boolean, recoveryGoalId?: string): Routine[] {
  return plus ? routines : routines.filter((r) => isAlwaysFreeRoutine(r, recoveryGoalId));
}

/**
 * What the coaches would have run on this date and did not, because the
 * person is not Plus. Shown, locked, on Today — the product's own evidence
 * of what it would do with their day. The always-free routines are not
 * here: they ran.
 */
export function sessionsPlusWouldRun(routines: Routine[], dateKey: string, recoveryGoalId?: string): Routine[] {
  const weekday = weekdayOf(dateKey);
  return routines
    .filter((r) => r.active !== false && r.days.includes(weekday) && !isAlwaysFreeRoutine(r, recoveryGoalId))
    .sort((a, b) => a.preferredStart.localeCompare(b.preferredStart));
}

/** Guided sits longer than a reset are Plus. Two minutes is always free. */
export const FREE_MEDITATION_MAX_MIN = 2;

export function meditationLengthNeedsPlus(minutes: number, plus: boolean): boolean {
  return !plus && minutes > FREE_MEDITATION_MAX_MIN;
}

/** What Plus runs, in the order the paywall lists it. Copy lives here so
 * the paywall and Settings say the same thing. */
export const PLUS_RUNS: readonly (readonly [string, string])[] = [
  ['All seven coaches, running', 'Training, nutrition, money, work, habits and urges, relationship and family — real sessions placed into your real days, and moved when the day changes.'],
  ['Levels you earn', 'Four levels in every program, earned from what you log: four-week training blocks that add load as you progress, and the deeper steps everywhere else.'],
  ['Apple Health shapes the day', 'Last night’s sleep, resting heart rate and heart-rate variability (HRV) change today’s session without you typing anything.'],
  ['The weekly report and your history', 'What actually happened, against your own weeks — nobody else’s.'],
  ['Where this is heading', 'Projections from your own numbers: at this rate, when you arrive.'],
  ['The full library', 'Every practice, graded A to E for how strong the evidence is, one tap into your week.'],
  ['Guided sits beyond the reset', 'Spoken practices from five to twenty minutes.'],
];

export const FREE_ALWAYS: readonly string[] = [
  'Your profile and your first insight',
  'The day’s shape — sleep, work, meals and what you fixed',
  'Every urge, reset and lapse-recovery tool',
  'Breathing and the two-minute practices',
  'Backup and restore — your data is yours',
];

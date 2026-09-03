/**
 * StoreKit 2 through expo-iap, on the phone, with no server.
 *
 * Three products, one entitlement. `Transaction.currentEntitlements` is
 * what Apple says this Apple ID owns right now; that answer, run through
 * the pure rules in features/plus/entitlement, is the whole billing
 * system. IntentNorth receives nothing about the purchase — Apple is the
 * merchant, the receipt stays with Apple, and the privacy page stays true.
 *
 * Every call is guarded: on web and under Jest there is no StoreKit, and
 * the answer is simply "not Plus". Failures never throw into a screen —
 * they resolve to a result the screen can explain.
 */
import { Platform } from 'react-native';
import {
  deepLinkToSubscriptions,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
  type Product,
  type ProductSubscription,
  type Purchase,
} from 'expo-iap';

import {
  PLUS_ALL_IDS,
  PLUS_PRODUCTS,
  PLUS_SUBSCRIPTION_IDS,
  entitlementFromPurchases,
  type Entitlement,
  type PurchaseLike,
} from '@/features/plus/entitlement';
import { track } from '@/lib/telemetry';
import { useAppStore } from '@/state/store';

export const STOREKIT_AVAILABLE = Platform.OS === 'ios';

/** What the paywall shows for one product. Prices come from Apple, never from code. */
export type PlusOffer = {
  productId: string;
  kind: 'annual' | 'monthly' | 'lifetime';
  displayPrice: string;
  title: string;
};

const KIND_OF: Record<string, PlusOffer['kind']> = {
  [PLUS_PRODUCTS.annual]: 'annual',
  [PLUS_PRODUCTS.monthly]: 'monthly',
  [PLUS_PRODUCTS.lifetime]: 'lifetime',
};

const KIND_ORDER: PlusOffer['kind'][] = ['annual', 'monthly', 'lifetime'];

let connected = false;

async function connect(): Promise<boolean> {
  if (!STOREKIT_AVAILABLE) return false;
  if (connected) return true;
  try {
    connected = await initConnection();
  } catch {
    connected = false;
  }
  return connected;
}

function toLike(p: Purchase): PurchaseLike {
  const ios = p as Purchase & { expirationDateIOS?: number | null };
  return {
    productId: p.productId,
    purchaseState: p.purchaseState,
    expirationDateIOS: ios.expirationDateIOS ?? null,
  };
}

/** Ask Apple what this Apple ID owns and record the answer in the store. */
export async function refreshEntitlement(): Promise<Entitlement> {
  const current = useAppStore.getState().entitlement;
  if (!(await connect())) return current;
  try {
    const owned = await getAvailablePurchases();
    const next = entitlementFromPurchases(owned.map(toLike));
    // A development grant is not overwritten by an honest "nothing owned".
    if (current.source === 'dev' && !next.plus) return current;
    useAppStore.getState().setEntitlement(next);
    return next;
  } catch {
    return current;
  }
}

/** The three offers with Apple's localised prices. Empty when StoreKit cannot answer. */
export async function loadOffers(): Promise<PlusOffer[]> {
  if (!(await connect())) return [];
  try {
    const [subs, lifetime] = await Promise.all([
      fetchProducts({ skus: [...PLUS_SUBSCRIPTION_IDS], type: 'subs' }),
      fetchProducts({ skus: [PLUS_PRODUCTS.lifetime], type: 'in-app' }),
    ]);
    const all = [...(subs ?? []), ...(lifetime ?? [])] as (Product | ProductSubscription)[];
    return all
      .filter((p) => PLUS_ALL_IDS.includes(p.id))
      .map((p) => ({ productId: p.id, kind: KIND_OF[p.id], displayPrice: p.displayPrice, title: p.title }))
      .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
  } catch {
    return [];
  }
}

export type PurchaseOutcome = { ok: true; entitlement: Entitlement } | { ok: false; cancelled: boolean; message?: string };

/**
 * Buy one product. Resolves when Apple's sheet closes; the entitlement is
 * then re-read from what Apple says is owned rather than trusted from the
 * purchase callback alone.
 */
export async function buy(productId: string): Promise<PurchaseOutcome> {
  if (!(await connect())) return { ok: false, cancelled: false, message: 'The App Store is not available on this device.' };
  void track('product_chosen');
  try {
    const type = productId === PLUS_PRODUCTS.lifetime ? 'in-app' : 'subs';
    const result =
      type === 'subs'
        ? await requestPurchase({ type: 'subs', request: { apple: { sku: productId } } })
        : await requestPurchase({ type: 'in-app', request: { apple: { sku: productId } } });
    const purchases = result == null ? [] : Array.isArray(result) ? result : [result];
    for (const p of purchases) {
      try {
        await finishTransaction({ purchase: p, isConsumable: false });
      } catch {
        // A transaction Apple has already finished is not a failure.
      }
    }
    const entitlement = await refreshEntitlement();
    if (entitlement.plus) {
      void track('purchase_completed');
      return { ok: true, entitlement };
    }
    return { ok: false, cancelled: true };
  } catch (err) {
    const e = err as { code?: string; message?: string };
    const cancelled = e.code === 'user-cancelled' || e.code === 'E_USER_CANCELLED' || /cancel/i.test(e.message ?? '');
    return { ok: false, cancelled, message: cancelled ? undefined : e.message };
  }
}

/** Required by App Review on every paywall. Re-syncs with Apple and re-reads. */
export async function restore(): Promise<Entitlement> {
  if (!(await connect())) return useAppStore.getState().entitlement;
  try {
    await restorePurchases();
  } catch {
    // restorePurchases throws when there is nothing to restore on some
    // StoreKit versions; the re-read below is the source of truth.
  }
  return refreshEntitlement();
}

export async function manageSubscription(): Promise<void> {
  if (!STOREKIT_AVAILABLE) return;
  try {
    await deepLinkToSubscriptions();
  } catch {
    // Nothing to do; Settings → Apple ID → Subscriptions is always there.
  }
}

/**
 * Transactions can arrive outside a purchase — a renewal, a family share,
 * a purchase finished on another device. Listen for the life of the app,
 * finish what arrives and re-read the entitlement.
 */
export function listenForPurchases(): () => void {
  if (!STOREKIT_AVAILABLE) return () => undefined;
  const updated = purchaseUpdatedListener((purchase) => {
    void (async () => {
      try {
        await finishTransaction({ purchase, isConsumable: false });
      } catch {
        // Already finished.
      }
      await refreshEntitlement();
    })();
  });
  const errored = purchaseErrorListener(() => undefined);
  void refreshEntitlement();
  return () => {
    updated.remove();
    errored.remove();
  };
}

/** Apple's standard licence, which App Review accepts as the terms of use link. */
export const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
export const PRIVACY_URL = 'https://intentnorth.app/privacy';

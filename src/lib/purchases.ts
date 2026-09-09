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
 *
 * Build 16 was rejected under 2.1(b) because the paywall said "The App
 * Store did not answer" on the reviewer's device. Three things in this
 * file made that outcome likelier than it had to be, and all three are
 * fixed here:
 *
 *  - The two product fetches ran under `Promise.all`, so one unavailable
 *    product threw away the other two. They are settled separately now:
 *    whatever Apple does return is shown.
 *  - One attempt, no retry. StoreKit on a freshly signed-in sandbox
 *    account answers late or not at all on the first ask, and a paywall
 *    opened seconds after launch is exactly when that happens.
 *  - Every failure collapsed to an empty array, so "Apple errored",
 *    "Apple has no products for this app" and "there is no StoreKit here"
 *    were one indistinguishable state on screen and in a screenshot.
 *    loadOffers now says which, in StoreKit's own words.
 */
import { AppState, Platform } from 'react-native';
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
  reconcileEntitlement,
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

/**
 * Why the paywall has nothing to show. The distinction matters: two of
 * these are ours or Apple's to retry, one is a product-configuration
 * problem in App Store Connect that no amount of retrying will fix, and
 * telling them apart is the difference between guessing at a rejection
 * and reading the answer off the screen.
 */
export type OfferFailure = 'none' | 'no-storekit' | 'not-connected' | 'store-error' | 'no-products';

export type OfferResult = {
  offers: PlusOffer[];
  failure: OfferFailure;
  /** StoreKit's own words, short enough to sit under a heading. */
  detail?: string;
};

/** What one failed StoreKit call told us. */
export type StoreFailure = {
  code?: string;
  message?: string;
  /** expo-iap sets this when the store answered with no matching products. */
  emptyList?: boolean;
};

const KIND_OF: Record<string, PlusOffer['kind']> = {
  [PLUS_PRODUCTS.annual]: 'annual',
  [PLUS_PRODUCTS.monthly]: 'monthly',
  [PLUS_PRODUCTS.lifetime]: 'lifetime',
};

const KIND_ORDER: PlusOffer['kind'][] = ['annual', 'monthly', 'lifetime'];

/** Three tries, ~1.6s of waiting in the worst case, 5s before a hung call is abandoned. */
const OFFER_ATTEMPTS = 3;
const OFFER_BACKOFF_MS = [0, 400, 1200];
const CALL_TIMEOUT_MS = 5_000;

/**
 * How long a finished purchase is given to reach us before we stop waiting.
 * The short window is for the case where Apple handed back nothing at all,
 * which is what a cancelled sheet looks like as well as a slow one: waiting
 * the full eight seconds there would leave "Waiting for the App Store…" on
 * screen after somebody has already tapped Cancel. Nothing is lost by
 * giving up early — the listener in the root layout is still running, and
 * a transaction that lands later turns Plus on wherever the person is.
 */
const PURCHASE_SETTLE_MS = 8_000;
const PURCHASE_GRACE_MS = 2_500;
const PURCHASE_POLL_MS = 700;

let connected = false;

const sleep = (ms: number) => (ms > 0 ? new Promise<void>((r) => setTimeout(r, ms)) : Promise.resolve());

/**
 * A StoreKit call that never comes back is worse than one that fails: the
 * paywall sits on "Getting prices…" forever and the reviewer sees a
 * spinner instead of a price. Every native call gets a deadline.
 */
function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject({ code: 'timeout', message: `The App Store did not answer within ${ms / 1000}s.` }), ms);
    work.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/** Whatever StoreKit threw, reduced to the two fields worth showing or deciding on. */
export function toStoreFailure(err: unknown): StoreFailure {
  const e = (typeof err === 'object' && err !== null ? err : {}) as {
    code?: unknown;
    message?: unknown;
    isEmptyProductList?: unknown;
  };
  return {
    code: typeof e.code === 'string' ? e.code : undefined,
    message: typeof e.message === 'string' ? e.message.slice(0, 160) : undefined,
    emptyList: e.isEmptyProductList === true,
  };
}

let lastConnectFailure: StoreFailure | null = null;

async function connect(): Promise<boolean> {
  if (!STOREKIT_AVAILABLE) return false;
  if (connected) return true;
  try {
    connected = await withTimeout(initConnection(), CALL_TIMEOUT_MS);
    if (connected) lastConnectFailure = null;
  } catch (err) {
    lastConnectFailure = toStoreFailure(err);
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
    const kept = reconcileEntitlement(current, next, __DEV__);
    if (kept === current) return current;
    useAppStore.getState().setEntitlement(kept);
    return kept;
  } catch {
    return current;
  }
}

/**
 * Off-device only: the store-screenshot pipeline (scripts/store-shots)
 * exports the web build with EXPO_PUBLIC_OFFER_PREVIEW set to a JSON list
 * of {productId, displayPrice}, so the review screenshot of the paywall
 * shows the real products at the prices set in App Store Connect. It is
 * never read where StoreKit exists, and no build profile sets it.
 */
function previewOffers(): PlusOffer[] {
  const raw = process.env.EXPO_PUBLIC_OFFER_PREVIEW;
  if (STOREKIT_AVAILABLE || !raw) return [];
  try {
    const list = JSON.parse(raw) as { productId: string; displayPrice: string }[];
    return list
      .filter((p) => PLUS_ALL_IDS.includes(p.productId))
      .map((p) => ({ productId: p.productId, kind: KIND_OF[p.productId], displayPrice: p.displayPrice, title: p.productId }))
      .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
  } catch {
    return [];
  }
}

function toOffers(products: (Product | ProductSubscription)[]): PlusOffer[] {
  return products
    .filter((p) => PLUS_ALL_IDS.includes(p.id))
    .map((p) => ({ productId: p.id, kind: KIND_OF[p.id], displayPrice: p.displayPrice, title: p.title }))
    .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
}

/**
 * What one round of asking Apple amounts to. Pure, so the rule that
 * decides between "Apple errored" and "Apple has no products for this
 * app" is a test rather than a thing we find out from a rejection.
 *
 * An error carrying `isEmptyProductList` is not a fault: it is Apple
 * saying these identifiers are not sold here, which is the App Store
 * Connect answer, not a network one.
 */
export function classifyOffers(offers: PlusOffer[], errors: StoreFailure[]): OfferResult {
  const faults = errors.filter((e) => !e.emptyList);
  if (offers.length > 0) {
    // A partial answer is still a working paywall. The detail is kept for
    // the log rather than the screen, which has prices on it.
    return { offers, failure: 'none', detail: faults.length ? describeFailure(faults[0]) : undefined };
  }
  if (faults.length > 0) return { offers: [], failure: 'store-error', detail: describeFailure(faults[0]) };
  return {
    offers: [],
    failure: 'no-products',
    detail: 'The App Store answered, and has no products to sell for this app on this account.',
  };
}

function describeFailure(f: StoreFailure): string {
  if (f.code && f.message) return `${f.code}: ${f.message}`;
  return f.message ?? f.code ?? 'No reason given.';
}

/**
 * The three offers with Apple's localised prices, or the reason there are
 * none. Retries, because the first ask after launch — or after somebody
 * signs into a sandbox account and comes back — is the one that fails.
 */
export async function loadOffers(): Promise<OfferResult> {
  if (!STOREKIT_AVAILABLE) {
    const preview = previewOffers();
    return preview.length > 0
      ? { offers: preview, failure: 'none' }
      : { offers: [], failure: 'no-storekit' };
  }

  let last: OfferResult = { offers: [], failure: 'not-connected' };

  for (let attempt = 0; attempt < OFFER_ATTEMPTS; attempt++) {
    await sleep(OFFER_BACKOFF_MS[attempt] ?? 0);

    if (!(await connect())) {
      last = {
        offers: [],
        failure: 'not-connected',
        detail: lastConnectFailure ? describeFailure(lastConnectFailure) : undefined,
      };
      continue;
    }

    // Settled separately: the subscriptions and the lifetime product fail
    // independently, and one missing product must not hide the others.
    const [subs, lifetime] = await Promise.allSettled([
      withTimeout(fetchProducts({ skus: [...PLUS_SUBSCRIPTION_IDS], type: 'subs' }), CALL_TIMEOUT_MS),
      withTimeout(fetchProducts({ skus: [PLUS_PRODUCTS.lifetime], type: 'in-app' }), CALL_TIMEOUT_MS),
    ]);

    const products: (Product | ProductSubscription)[] = [];
    const errors: StoreFailure[] = [];
    for (const settled of [subs, lifetime]) {
      if (settled.status === 'fulfilled') products.push(...((settled.value ?? []) as (Product | ProductSubscription)[]));
      else errors.push(toStoreFailure(settled.reason));
    }

    last = classifyOffers(toOffers(products), errors);
    if (last.offers.length > 0) return last;
  }

  return last;
}

/**
 * What the paywall says when there is nothing to show. Here rather than in
 * the screen because App Review reads it, a test asserts it, and it must
 * never be a dead end: every branch ends with something the person can
 * still do.
 */
export function describeNoOffers(result: OfferResult): { heading: string; body: string; canRetry: boolean } {
  switch (result.failure) {
    case 'no-storekit':
      return {
        heading: 'Purchases happen in the iPhone app.',
        body: 'This build cannot reach the App Store, so there is nothing to buy here.',
        canRetry: false,
      };
    case 'no-products':
      return {
        heading: 'The App Store has no prices for this app yet.',
        body: 'Nothing has been charged. Everything free stays open below, and "Restore purchases" will find a purchase made on this Apple ID.',
        canRetry: true,
      };
    default:
      return {
        heading: 'The App Store did not answer.',
        body: 'Nothing has been charged. Try again in a moment — everything free stays open below, and "Restore purchases" will find a purchase made on this Apple ID.',
        canRetry: true,
      };
  }
}

export type PurchaseOutcome = { ok: true; entitlement: Entitlement } | { ok: false; cancelled: boolean; message?: string };

/** Apple's error codes, in words a person can act on. */
export function messageForPurchaseError(f: StoreFailure): string | undefined {
  switch (f.code) {
    case 'user-cancelled':
    case 'E_USER_CANCELLED':
      return undefined;
    case 'network-error':
    case 'timeout':
      return 'The App Store could not be reached. Nothing was charged.';
    case 'item-unavailable':
    case 'sku-not-found':
      return 'That option is not available on this Apple ID’s store. Nothing was charged.';
    case 'already-owned':
      return 'This Apple ID already owns Plus. "Restore purchases" will turn it back on.';
    case 'deferred-payment':
    case 'pending':
      return 'Apple is waiting on approval for this payment. Plus turns on by itself once it clears.';
    default:
      return f.message ?? 'The purchase did not go through. Nothing was charged.';
  }
}

export function wasCancelled(f: StoreFailure): boolean {
  return f.code === 'user-cancelled' || f.code === 'E_USER_CANCELLED' || /cancel/i.test(f.message ?? '');
}

/**
 * StoreKit hands a finished transaction to the listener, not to the caller
 * of requestPurchase — expo-iap says in as many words not to rely on the
 * returned payload for the outcome. So the entitlement is polled for a few
 * seconds rather than read once: reading it once is how a real sandbox
 * purchase came back as "nothing happened".
 */
async function waitForEntitlement(ms: number): Promise<Entitlement> {
  const deadline = Date.now() + ms;
  let entitlement = await refreshEntitlement();
  while (!entitlement.plus && Date.now() < deadline) {
    await sleep(PURCHASE_POLL_MS);
    entitlement = await refreshEntitlement();
  }
  return entitlement;
}

/**
 * Buy one product. Resolves when Apple's sheet closes and the transaction
 * has either arrived or run out of time; the entitlement is read from what
 * Apple says is owned rather than trusted from the purchase callback.
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
    const entitlement = await waitForEntitlement(purchases.length > 0 ? PURCHASE_SETTLE_MS : PURCHASE_GRACE_MS);
    if (entitlement.plus) {
      void track('purchase_completed');
      return { ok: true, entitlement };
    }
    // The sheet closed and nothing owned came back. If Apple handed us a
    // transaction anyway, saying "cancelled" would be a lie — and the
    // listener in the root layout will still turn Plus on when it lands.
    if (purchases.some((p) => PLUS_ALL_IDS.includes(p.productId))) {
      return {
        ok: false,
        cancelled: false,
        message: 'Apple has taken the purchase but has not confirmed it yet. Plus turns on by itself when it does; "Restore purchases" checks again.',
      };
    }
    return { ok: false, cancelled: true };
  } catch (err) {
    const f = toStoreFailure(err);
    const cancelled = wasCancelled(f);
    return { ok: false, cancelled, message: cancelled ? undefined : messageForPurchaseError(f) };
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
  // A restore on a fresh device can land a moment after the sync returns,
  // so this waits the same way a purchase does — briefly, then gives the
  // honest "nothing found" rather than a premature one.
  return waitForEntitlement(PURCHASE_POLL_MS * 3);
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
 *
 * Coming back from the background is also a re-read: signing into a
 * sandbox Apple Account happens in Settings, which means leaving the app,
 * and the reviewer returns expecting the paywall to have caught up.
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
  const foregrounded = AppState.addEventListener('change', (state) => {
    if (state === 'active') void refreshEntitlement();
  });
  void refreshEntitlement();
  return () => {
    updated.remove();
    errored.remove();
    foregrounded.remove();
  };
}

/** Apple's standard licence, which App Review accepts as the terms of use link. */
export const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
export const PRIVACY_URL = 'https://intentnorth.app/privacy';

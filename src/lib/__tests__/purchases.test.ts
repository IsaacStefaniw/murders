/**
 * The paywall's failure states, which is where build 16 was rejected.
 *
 * Nothing here touches StoreKit: the decisions worth testing were the ones
 * buried in a `catch { return [] }`, and they are pure functions now.
 */
import {
  classifyOffers,
  describeNoOffers,
  messageForPurchaseError,
  toStoreFailure,
  wasCancelled,
  type PlusOffer,
} from '@/lib/purchases';
import { PLUS_PRODUCTS } from '@/features/plus/entitlement';

const offer = (productId: string, kind: PlusOffer['kind']): PlusOffer => ({
  productId,
  kind,
  displayPrice: 'A$89.99',
  title: 'Plus',
});

const annual = offer(PLUS_PRODUCTS.annual, 'annual');
const lifetime = offer(PLUS_PRODUCTS.lifetime, 'lifetime');

describe('classifyOffers', () => {
  it('is a working paywall when everything came back', () => {
    expect(classifyOffers([annual, lifetime], [])).toMatchObject({ failure: 'none' });
  });

  it('shows what did come back when one product failed', () => {
    // The rejection case: `Promise.all` let a missing lifetime product take
    // the two subscriptions with it, and the screen went blank.
    const result = classifyOffers([annual], [{ code: 'sku-not-found', message: 'no such product' }]);
    expect(result.failure).toBe('none');
    expect(result.offers).toHaveLength(1);
  });

  it('separates a store fault from a store with nothing to sell', () => {
    expect(classifyOffers([], [{ code: 'network-error', message: 'offline' }]).failure).toBe('store-error');
    expect(classifyOffers([], []).failure).toBe('no-products');
  });

  it('treats an empty product list as configuration, not a fault', () => {
    // Apple answered. It just has no products for these identifiers, which
    // is App Store Connect's answer and not something a retry changes.
    const result = classifyOffers([], [{ code: 'query-product', message: 'empty', emptyList: true }]);
    expect(result.failure).toBe('no-products');
  });

  it("carries the reason in Apple's own words", () => {
    const result = classifyOffers([], [{ code: 'network-error', message: 'The network connection was lost.' }]);
    expect(result.detail).toContain('network-error');
    expect(result.detail).toContain('network connection was lost');
  });
});

describe('describeNoOffers', () => {
  it('never leaves the person without something to do', () => {
    for (const failure of ['no-storekit', 'not-connected', 'store-error', 'no-products'] as const) {
      const copy = describeNoOffers({ offers: [], failure });
      expect(copy.heading.length).toBeGreaterThan(0);
      expect(copy.body.length).toBeGreaterThan(0);
    }
  });

  it('says nothing was charged wherever a purchase could have been attempted', () => {
    for (const failure of ['not-connected', 'store-error', 'no-products'] as const) {
      expect(describeNoOffers({ offers: [], failure }).body).toMatch(/nothing has been charged/i);
      expect(describeNoOffers({ offers: [], failure }).canRetry).toBe(true);
    }
  });

  it('does not offer a retry where there is no App Store to retry', () => {
    expect(describeNoOffers({ offers: [], failure: 'no-storekit' }).canRetry).toBe(false);
  });

  it('stops claiming Apple was silent when Apple answered', () => {
    expect(describeNoOffers({ offers: [], failure: 'no-products' }).heading).not.toMatch(/did not answer/i);
    expect(describeNoOffers({ offers: [], failure: 'store-error' }).heading).toMatch(/did not answer/i);
  });
});

describe('toStoreFailure', () => {
  it('reads the fields StoreKit actually sets', () => {
    expect(toStoreFailure({ code: 'user-cancelled', message: 'cancelled', isEmptyProductList: true })).toEqual({
      code: 'user-cancelled',
      message: 'cancelled',
      emptyList: true,
    });
  });

  it('survives a thrown string, a null, and a message that is not one', () => {
    expect(toStoreFailure('boom')).toEqual({ code: undefined, message: undefined, emptyList: false });
    expect(toStoreFailure(null)).toEqual({ code: undefined, message: undefined, emptyList: false });
    expect(toStoreFailure({ message: 42 })).toEqual({ code: undefined, message: undefined, emptyList: false });
  });

  it('keeps a long native message short enough to show', () => {
    const long = toStoreFailure({ message: 'x'.repeat(500) });
    expect(long.message).toHaveLength(160);
  });
});

describe('purchase errors', () => {
  it('says nothing when the person closed the sheet themselves', () => {
    expect(wasCancelled({ code: 'user-cancelled' })).toBe(true);
    expect(messageForPurchaseError({ code: 'user-cancelled' })).toBeUndefined();
  });

  it('points an already-owned purchase at restore rather than at failure', () => {
    expect(messageForPurchaseError({ code: 'already-owned' })).toMatch(/restore/i);
  });

  it('promises nothing was charged when the store could not be reached', () => {
    expect(messageForPurchaseError({ code: 'network-error' })).toMatch(/nothing was charged/i);
    expect(messageForPurchaseError({ code: 'timeout' })).toMatch(/nothing was charged/i);
  });

  it('says a deferred payment will finish by itself', () => {
    expect(messageForPurchaseError({ code: 'deferred-payment' })).toMatch(/turns on by itself/i);
  });

  it('falls back to whatever Apple said, and to a sentence when it said nothing', () => {
    expect(messageForPurchaseError({ code: 'unknown', message: 'Something went wrong.' })).toBe('Something went wrong.');
    expect(messageForPurchaseError({})).toMatch(/did not go through/i);
  });
});

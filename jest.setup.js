/**
 * Jest setup.
 *
 * AsyncStorage has no native module under Jest, which meant nothing could
 * import `state/store` — so the store, and every journey through it, was
 * completely untested. That is precisely where the Build 10 defects lived:
 * each pure function was correct and the composition was not. The official
 * in-memory mock makes the store importable, so journey tests can drive it.
 */

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

/**
 * expo-iap is a native StoreKit binding with no JS fallback. The adapter in
 * lib/purchases guards every call behind Platform.OS === 'ios', but the
 * module must still import; this stub makes it importable and makes every
 * call answer "nothing owned, no products" — the free state.
 */
jest.mock('expo-iap', () => ({
  initConnection: jest.fn(async () => true),
  endConnection: jest.fn(async () => true),
  fetchProducts: jest.fn(async () => []),
  getAvailablePurchases: jest.fn(async () => []),
  requestPurchase: jest.fn(async () => null),
  finishTransaction: jest.fn(async () => undefined),
  restorePurchases: jest.fn(async () => undefined),
  deepLinkToSubscriptions: jest.fn(async () => undefined),
  purchaseUpdatedListener: jest.fn(() => ({ remove: () => undefined })),
  purchaseErrorListener: jest.fn(() => ({ remove: () => undefined })),
}));

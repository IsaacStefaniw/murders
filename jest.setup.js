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

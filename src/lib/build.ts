/** Build identity, inlined at export time via EXPO_PUBLIC_BUILD_TAG. */
export const BUILD_TAG = process.env.EXPO_PUBLIC_BUILD_TAG ?? 'dev';

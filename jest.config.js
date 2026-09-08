/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    // Stylesheets are for the app bundler, not for a test. theme.ts imports
    // global.css for the web build, and without this every test that
    // touches a design token dies on a stray ':root {'.
    '\\.(css)$': '<rootDir>/jest.styleMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  // Agent worktrees live under .claude/ inside the repo; they are other
  // branches, not this one, and must never be run or watched from here.
  testPathIgnorePatterns: ['/node_modules/', '/\\.claude/'],
  modulePathIgnorePatterns: ['<rootDir>/.claude/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@supabase/.*))',
  ],
};

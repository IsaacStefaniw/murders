// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // Jest setup runs in the test environment, not the app runtime.
    files: ["jest.setup.js"],
    languageOptions: { globals: { jest: "readonly", require: "readonly" } },
  },
]);

#!/usr/bin/env bash
# Build the shareable web preview.
#
# Deliberately NOT an npm script: `package.json`'s "scripts" object is an
# expo-updates fingerprint source, so adding one changes the app's runtime
# version and cuts every installed build off from over-the-air updates.
#
#   bash scripts/preview-web.sh [outFile]
set -euo pipefail
EXPO_PUBLIC_BUILD_TAG=web-preview npx expo export --platform web --clear
node scripts/package-web-preview.mjs "${1:-web-preview.html}"

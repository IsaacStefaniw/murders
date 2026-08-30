# Releasing INTENT to TestFlight

Everything runs on Expo's cloud build machines — no Mac required at any step.

## One-time account setup (owner, ~15 min + Apple's approval wait)

1. **Apple Developer Program** ($99/yr): enroll via the *Apple Developer* app
   on iPhone or https://developer.apple.com/enroll. Approval can take up to
   48 hours.
2. **Expo account** (free): https://expo.dev/signup.
3. **Expo access token** (lets CI/agents build on your behalf):
   expo.dev → Account settings → *Access tokens* → *Create token*.
   Revocable any time from the same page.
4. **App Store Connect API key** (lets EAS manage signing + submit builds):
   https://appstoreconnect.apple.com → *Users and Access* → *Integrations* →
   *App Store Connect API* → *Team Keys* → *Generate API Key*, role **Admin**.
   Record the **Key ID** and **Issuer ID**, and download the `.p8` file
   (single download — keep it). Revocable from the same page.

Treat the token and `.p8` as credentials: share only when needed, revoke
when done.

## Per-release commands

```bash
export EXPO_TOKEN=...            # from step 3

# First time only: link the repo to an EAS project
npx eas-cli init --non-interactive

# Build for iOS (cloud): ~15–30 min
npx eas-cli build --platform ios --profile production --non-interactive

# Submit the latest build to TestFlight
npx eas-cli submit --platform ios --latest \
  --asc-api-key-path ./AuthKey.p8 \
  --asc-api-key-id <KEY_ID> \
  --asc-api-key-issuer-id <ISSUER_ID> \
  --non-interactive
```

First submission auto-creates the App Store Connect app record
(`com.isaacstefaniw.intentos`). After Apple's processing (~10–30 min), the
build appears in the **TestFlight** app on iPhone; add testers (partner,
friends) by email under App Store Connect → TestFlight → Internal/External
Testing.

Never commit `AuthKey.p8`, tokens, or anything credential-shaped —
`.gitignore` already excludes `*.p8` and `.env*`.

## Versioning

`eas.json` uses `appVersionSource: remote` with `autoIncrement` on the
production profile — build numbers bump automatically; bump the
human-visible `version` in `app.json` when it matters.

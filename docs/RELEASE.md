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

## The fingerprint trap: never touch the root `.gitignore`

`runtimeVersion.policy` is `fingerprint`, and an over-the-air update reaches
a build only when the two fingerprints match. The root `.gitignore` is one of
the hashed sources (`@expo/fingerprint` reason: `bareGitIgnore`), so **adding
a single line to it strands every installed build** — the update is refused
rather than delivered, and no error reaches the phone.

This has now cost the project four times: the `.gitignore` lines, the
`package.json` `scripts` object, `app.json`'s `name`, and a `.sites-runtime/`
entry added by the website tooling that would have cut build 16 off from all
148 commits behind it.

Rules:

- Never edit the root `.gitignore` between a build and its updates. Put
  local scratch in `.git/info/exclude` (per-clone, never hashed) or inside a
  subdirectory's own `.gitignore`.
- Anything describing the app to the platform is native, and native means a
  new build.
- Before shipping an update, verify the fingerprint matches the target build:

  ```bash
  npx @expo/fingerprint@latest . | node -e \
    "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).hash))"
  ```

  Compare against the runtime version the build reports in Settings, which
  `src/lib/updates.ts` surfaces for exactly this reason.

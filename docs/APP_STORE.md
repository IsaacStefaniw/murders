# App Store submission — IntentNorth 1.0.0

Everything App Store Connect will ask for, under the same rule as the
website: nothing the build does not do, every number counted from the code,
program never prescription. Fields are sized to Apple's limits.

## What this branch fixed for review

Found by auditing the TestFlight build against the App Review Guidelines:

- **A time machine and seeded fake history were in the production build,
  ungated.** "Seed two weeks of history" sat in Settings for any reviewer to
  find. The lab is now behind `__DEV__`, which is false in every EAS build, so
  it compiles out.
- **A "Plus" tier that could not be bought.** Was hidden for a free 1.0;
  Isaac's decision on 2026-09-03 is that people pay from day one, so 1.0
  now carries StoreKit 2 through `expo-iap`, three real products, a paywall
  after the first insight and restore-purchases. See "In-app purchases"
  below — the products must exist in App Store Connect and be attached to
  the version before review, or the paywall shows "the App Store did not
  answer" and the reviewer rejects under 2.1.
- **Settings said "Demo mode".** To a reviewer that reads as a demo. It now
  says what is true: everything lives on this device.
- **The backup button did nothing on iOS** — `navigator.clipboard`, a web
  API, same fault as the household share. It uses the share sheet now, and
  restore re-reads the store instead of relying on a page reload that only
  exists in a browser.
- **Both Health permission prompts said "INTENT reads…"** — the old name,
  on the two sentences Apple's reviewer reads most carefully. Now IntentNorth.
  This did not change the runtime fingerprint (verified: identical hash
  before and after), so it breaks no installed build.

## App Information

| Field | Value |
|---|---|
| Name | IntentNorth |
| Subtitle (30) | Seven coaches. One profile. |
| Primary category | Health & Fitness |
| Secondary category | Productivity |
| Price | Free to download; IntentNorth Plus by in-app purchase (see below) |
| Bundle ID | com.isaacstefaniw.intentos |
| Version | 1.0.0 (build number set by EAS) |
| Copyright | 2026 Isaac Stefaniw |
| Support URL | https://intentnorth.app/support |
| Marketing URL | https://intentnorth.app |
| Privacy Policy URL | https://intentnorth.app/privacy |
| Content rights | Does not contain third-party content requiring rights |

## In-app purchases — must exist before the build is submitted

The **Paid Applications agreement, banking and tax forms** in App Store
Connect → Agreements, Tax and Banking must be *Active* before products can be
created, and the products must be attached to version 1.0 when it is
submitted, so Apple reviews them with the binary. Enrol in the **Small
Business Program** before the first sale (15% instead of 30%).

Create one subscription group, **IntentNorth Plus**, and three products with
these exact identifiers — the app asks StoreKit for them by name:

| Product | Type | Identifier | Price (AUD) |
|---|---|---|---|
| Plus — Yearly | Auto-renewable, 1 year, in group "IntentNorth Plus", rank 1 | `app.intentnorth.plus.annual` | 89.99 |
| Plus — Monthly | Auto-renewable, 1 month, same group, rank 2 | `app.intentnorth.plus.monthly` | 14.99 |
| Plus — Lifetime | Non-consumable | `app.intentnorth.plus.lifetime` | 249 |

Optional, no code change: a 7-day free introductory offer on Yearly. Prices
are Apple's and are shown in the app exactly as Apple returns them —
nothing is typed in code. Each product needs a display name, a description
and one review screenshot (the paywall itself will do). Every product's
localisation must be complete or the whole submission stalls at "Missing
Metadata".

Sandbox: App Store Connect → Users and Access → Sandbox Testers; sign into
that Apple ID under Settings → App Store → Sandbox Account on a test iPhone.
Sandbox subscriptions renew on a compressed clock (a year ≈ one hour).

What is free is what the site has promised since launch: the interview,
the profile, the first insight, the day's shape, every urge/reset/lapse
tool, breathing and the two-minute practices, backup and restore, and a
full view — by name — of every coach, rung and protocol. Everything that
*runs* is Plus.

## Promotional text (170)

> Seven coaches, one profile. A training block built from your own lifts, a library that grades its own evidence, and nothing you enter ever leaves your phone.

## Description (4,000)

> Seven coaches, one profile, and a week that fits the life you actually have.
>
> IntentNorth builds a real program for each thing you care about — training, food, habits and urges, work, money, your relationship and your family — from one set of answers, and places it into the days you have. Every line on today's plan carries the reason it is there.
>
> TRAINING THAT LEARNS FROM WHAT YOU LOG
> Four-week blocks — build, build, progress, deload — sized to your days, your equipment and your own lifts. Log a set and the next target follows a rule you can read: every set at the target, reps held, and the load moves. Four levels, earned from your log, with your starting point placed by what you lift. Say "this is too easy" and the block changes. Connect Apple Health (read-only) and a short night changes today's session: main work stays, accessories rest. 5,376 distinct programmes from the builder's own inputs; no two people get the same one.
>
> A LIBRARY THAT TELLS YOU HOW GOOD ITS EVIDENCE IS
> 177 practices, every one graded A to E and credited to the public work behind it — 188 researchers and practitioners named. 145 carry a plain-words safety line. Most of it is not an A, and it says so.
>
> HABITS AND URGES, WITHOUT THE VERDICT
> Sixteen behaviours. Log one and you get the mechanism and the lever, never a streak to break. Support for your hardest moments is free, permanently, and never behind a paywall.
>
> THE REST OF A LIFE
> Guided breathing. Seven spoken meditations, in a voice you choose. A weekly review that ends in one decision. A money ladder with one step live at a time. Rituals that survive a bad week, and a weekend that actually happens.
>
> YOURS, ON YOUR PHONE
> No account. No analytics. Nothing you enter leaves your device. Apple Health is read, never written. Save a backup any time; delete the app and it is gone.
>
> IntentNorth provides education and structured planning. It is not medical, psychological or financial advice, and it does not diagnose or treat any condition.

Every figure above is counted from the shipped code: 177 / 145 / 188 from
the protocol library, 16 from the behaviour catalogue, 7 meditation scripts,
6 money rungs, 4 levels, and 5,376 by generating every declared combination
through `buildProgramme` and hashing the output — all distinct.

## Keywords (100, comma-separated, no spaces)

`habits,strength,training,sleep,recovery,coach,planner,routine,nutrition,money,meditation` — 82 characters. Do not add competitor names.

## What's New (1.0.0)

> First release. Seven coaches working from one profile: training blocks built from your own lifts, a graded evidence library, habit and urge support that stays free, guided breathing and spoken meditation, and a weekly review. Everything stays on your phone.

## Age rating — questionnaire answers

| Question | Answer | Why |
|---|---|---|
| Medical/Treatment Information | Infrequent/Mild | Health education with safety lines; disclaims diagnosis and treatment |
| Alcohol, Tobacco, or Drug Use or References | Infrequent/Mild | Alcohol-and-sleep education; urge support names behaviours a person chooses to track |
| Everything else (violence, sexual content, gambling, contests, horror, profanity) | None | — |
| Unrestricted Web Access | No | No browser; external links open Safari |
| Made for Kids | No | Not directed at under-16s (privacy page says so) |

Expect **12+**. Do not choose 4+; the alcohol content is real.

## App Privacy — the nutrition label

Apple's definition: data is "collected" when it is transmitted off the
device. Audited against the code, one thing is:

| Data type | Collected? | Detail |
|---|---|---|
| **Identifiers → Device ID** | **Yes** — App Functionality, not linked to the user, not used for tracking | `expo-updates` sends `EAS-Client-ID`, a per-install UUID, with every update check (`FileDownloader.swift:442`). The privacy page's line "carries none of your plan, health or personal data" is true, but it omits this identifier — see the correction below. |
| Health & Fitness | No | Read from HealthKit, used on-device, never transmitted |
| Purchases | No | StoreKit on-device; Apple is the merchant and IntentNorth receives nothing about the purchase. "Purchase history" is collected only if the developer transmits it, which the app does not |
| Contact info, user content, usage data, diagnostics, location, browsing, search, financial, sensitive info | No | Nothing collects them — no account, no analytics SDK, no server |
| Tracking | No | — |

"Data Not Collected" would be the easy label and it would be **wrong** by
about one UUID. Declare the Device ID. Apple checks HealthKit apps'
privacy policies specifically: ours names Health data, read-only, no
advertising use — that passes.

**Privacy page correction for the website session.** In "App updates",
after "which app version and device platform is asking", add: *"and an
anonymous installation identifier so that the same phone is not counted
twice. It is not linked to you, and it carries none of your plan, health or
personal data."* That makes the page match the label.

## App Review Information

- **Sign-in required:** No. There are no accounts. Leave demo credentials blank and say so in the notes.
- **Contact:** Isaac's name, phone and email (Apple may call).
- **Notes to the reviewer** — paste:

> IntentNorth runs entirely on the device. There is no account, no sign-in and no server: every answer, plan and log is stored locally, and nothing is transmitted except an anonymous installation identifier with the app-update check. Apple Health access is optional and read-only — the app never writes to Health, and Health data never leaves the phone.
>
> To see the app in two minutes: complete the nine-question interview on first launch (any answers), which builds the week; "Today" shows the day's plan with the reason for each item; "Life" opens the seven pathways — open Training to see the level card and a built four-week block, and tap into a session to see sets, reps and rest decided. Settings → Practice library shows the graded evidence library. The app contains no AI or generated content; every sentence is deterministic.
>
> In-app purchases: after the interview the app shows IntentNorth Plus with three products (yearly and monthly auto-renewable subscriptions, and a lifetime non-consumable), priced by the App Store. Tap "Not now" to continue without buying: the day's shape, every urge and reset tool, the two-minute practices, backup and a full view of every coach and protocol remain usable; the coaches' sessions show locked. "Restore purchases" is on the paywall and in Settings. Recovery, urge and hardest-moment support is free permanently and is never placed behind a purchase.
>
> Content is educational and the app states throughout that it is not medical, psychological or financial advice.

## Export compliance

`ITSAppUsesNonExemptEncryption: false` is already in `app.json`, so the
encryption question is answered automatically at upload. HTTPS-only.

## Screenshots

Required: **6.7"** (1290×2796). Recommended: **6.9"** (1320×2868). iPad not
required — `supportsTablet` is false. Captured from the real web build with a
seeded state, at exactly those pixel sizes, so every sentence on them is the
app's own output; the set is in the app session for review before any go on
the listing. Suggested order (Apple shows the first three): Today · Training
level card · Workout · Coaches · Library · Progress.

## The build

`eas-release.yml` builds the **production** profile (auto-incremented build
number) and `eas submit` delivers it to App Store Connect. That is all the
automation needed: from there the steps are in the ASC web UI.

The review-readiness fixes above are JavaScript only, so the fingerprint is
unchanged and they could reach the existing TestFlight build over the air —
but the store submission should be a **fresh production build** from this
branch, so the binary embeds them.

## The path from here — in order

1. **Trademark clearance.** Not done, and it matters more now that the name
   is on a domain, two films and a website. IP Australia (ATMOSS) and the
   USPTO TESS search, class 9 and class 42. A conflict does not get an app
   rejected; it gets it taken down later. Cannot be run from this container.
2. Dispatch `eas-release.yml` from this branch (`submit: true`). ~7 minutes to
   build, ~15 for Apple to process.
3. In App Store Connect: the app record already exists (the workflow
   resolves its id). Agreements first (above), then the three products,
   then create version **1.0**, attach the processed build, add the three
   in-app purchases to the version, fill every field from this document,
   upload the screenshots, answer the age rating and App Privacy
   questionnaires as above, paste the review notes.
4. Submit for review. Typical first-review turnaround is one to three days;
   a HealthKit app occasionally draws a question about Health usage, which
   the privacy page and the notes already answer.
5. When approved: the website gets the App Store badge above the fold as the
   primary call to action, and the privacy paragraph correction goes live
   with it.

## Decisions Isaac owns

- Pay from day one — decided 2026-09-03; 1.0 carries the paywall.
- The trademark search.
- The reviewer contact details.
- Whether the founder quote on the site stays under his name.

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
| Name (30) | IntentNorth: Habit & Routine (28) — see ASO note below |
| Subtitle (30) | Sleep, training, day planner (28) |
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
| Plus — Lifetime | Non-consumable | `app.intentnorth.plus.lifetime` | 255 |

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

## Build 16, rejected 2.1(b) — read this before resubmitting

Submission `0e37c77b-8a7f-4e76-a6a9-a4b8549955ef`, reviewed 2026-09-08 on
iPhone 17 Pro Max and iPad Air 11-inch (M3), iOS and iPadOS 26.6.1:

> the app displayed 'The App Store did not answer' when landing on the
> IntentNorth Plus screen.

That sentence was the paywall's own empty state, and the warning three
paragraphs above this one had already named the cause: **StoreKit returned
no products.** Apple's reply says the rest — review the product
configurations, complete any missing information, and confirm the Paid
Applications agreement is in effect.

### The cause — first answer wrong, corrected 2026-09-09

The first reading of this rejection was that the products must be
misconfigured. **They are not.** The App Store status workflow, run against
the live account, reports all three with prices, localisations and a clean
state:

```
app.intentnorth.plus.annual     served (READY_TO_SUBMIT)
app.intentnorth.plus.monthly    served (READY_TO_SUBMIT)
app.intentnorth.plus.lifetime   served (READY_TO_SUBMIT)
```

The second reading was that the products were configured but never attached
to the submission, on the strength of this, from the same run:

```
state=UNRESOLVED_ISSUES  platform=IOS  submitted=2026-09-04
    items: appStoreVersion × 1
    !! no in-app purchase is part of this submission.
```

**That was also wrong, and it is the more expensive mistake of the two.**
App Store Connect's own App Review page lists the submission of 4 September
as **5 Items**, and the draft that replaced it — the same five — as the
version, the subscription group, both subscriptions and the one-off
purchase. The purchases were in the submission the whole time. The reviewer
had them.

What the script actually saw is that `/v1/reviewSubmissions/{id}/items`
returns items whose relationships arrive without `data` for everything
except the version. Absent linkage is not an absent product, and the script
reported it as one. It has since been changed to say when it knows nothing;
**submission contents are read in the browser, on the app's App Review
page, and nowhere else.**

Three consequences worth recording, because each cost something:

- Four days were spent on a theory the evidence never supported, while the
  real cause went unexamined.
- Three attempts to attach the purchases over the API all failed. Two of
  the calls in the last attempt succeeded: they cancelled the healthy
  submission and opened an empty one, which dropped all three products to
  *Developer Rejected* and required them to be re-added by hand.
- The corrected sequence is the ordinary one. Every submittable item —
  version, subscription group, each subscription, each purchase — carries
  its own **Add for Review** button on its own page, and the draft
  submission collects them. There is no API path for this; do it in the
  browser.

**So the cause is in the app, and it is what the next section describes.**
The reviewer had all three products available and the paywall was still
empty, which leaves the client. The agreement is still worth confirming —
Apple named it, it has no read API, and nothing sells without it.

**And the app copes with anything less.** Everything below stands
regardless of the cause: it is what turned a slow, partial or absent answer
into the one sentence the reviewer screenshotted.

Three faults in `lib/purchases.ts` turned a slow or partial answer into
that sentence, and all three are fixed:

- The two product fetches ran under `Promise.all`, so one unavailable
  product discarded the other two. They are settled separately now — if
  Apple returns the subscriptions but not the lifetime product, the paywall
  shows the subscriptions.
- One attempt, no retry, no deadline. StoreKit answers late on a freshly
  signed-in sandbox account, and the paywall opens seconds after launch.
  It now asks up to three times, and abandons a call that hangs rather than
  spinning on "Getting prices…" forever.
- Every failure collapsed to an empty array, so "Apple errored", "Apple has
  no products for this app" and "there is no StoreKit here" were one
  indistinguishable sentence. The screen now names which, in StoreKit's own
  words, and asks again by itself when the app returns to the foreground —
  which is where a reviewer lands after signing into a sandbox account in
  Settings.

A fourth fix is not about the empty paywall but would have been the next
rejection: `requestPurchase` does not return the outcome — expo-iap says in
as many words not to rely on its result — and the entitlement was read once,
immediately. A sandbox purchase that landed a second later therefore looked
like nothing had happened. The entitlement is now polled until the
transaction arrives, and a purchase Apple has taken but not yet confirmed
says so instead of silently failing.

**Before the next submission, in order:**

1. **Attach the three in-app purchases to version 1.0.** App Store Connect
   → the 1.0 version page → *In-App Purchases and Subscriptions* → add
   `annual`, `monthly` and `lifetime`. This is the established cause and
   the only step that is definitely required.

   **This one cannot be automated.** It was tried against the live account
   and Apple's API refuses: `'subscription' is not a relationship on the
   resource 'reviewSubmissionItems'` (409), and the same for
   `inAppPurchaseV2`. A rejected submission is frozen on top of that —
   *"reviewSubmission state does not allow adding more items"* — so
   submitting again opens a fresh one, which is the normal flow after a
   rejection. Both errors are quoted in
   `.github/scripts/asc-attach-purchases.mjs` so nobody spends the
   afternoon rediscovering them.
2. Business → Agreements: Paid Applications *Active*, banking and tax
   complete. No read API, so it has to be looked at; Apple named it, and
   nothing sells without it. **Confirmed Active on 2026-09-09.**
3. Dispatch **App Store status**. It should now end with *"would reach the
   paywall, and are in the submission"* rather than the warning about
   configured-but-not-attached.
4. On a device signed into a sandbox tester: open the paywall, see three
   prices, buy the monthly, confirm Plus turns on, delete the app,
   reinstall, and confirm "Restore purchases" turns it back on.
5. Put the right build on 1.0 — **build 18**, which carries the paywall
   fixes; 16 was the rejected binary and 17 predates them. The *Put the
   build on the version* workflow does this by API, or it is a dropdown on
   the version page. Then resubmit, and reply to the review thread naming
   what changed: the purchases are now part of the submission, and the
   paywall names the reason and retries instead of showing one sentence
   for every failure.

## Promotional text (170)

> Seven coaches, one profile. A four-week plan built from your own lifts, a library that grades its own evidence, and nothing you enter ever leaves your phone.

## Description (4,000)

Rewritten 8 September 2026. The description is **not indexed for App Store
search** — only the name, subtitle and keyword field are — so its whole job
is conversion, and the first three lines before "more" are almost all most
people read. The previous opening led with "Seven coaches", which is the
thing an outside review and Isaac independently identified as the part that
overwhelms. It now leads with the reader's own experience instead.

> You already know what to do. You have listened to hundreds of hours of it.
>
> IntentNorth is the part that puts it into Tuesday.
>
> Answer twelve questions once. Seven coaches — training, food, habits and urges, work, money, your relationship and your family — build one week from the same set of answers, and place it around the work, sleep and commitments you already have. Every line on today's plan carries the reason it is there.
>
> WHAT ACTUALLY HAPPENS
> The plan fits the week you have, not an ideal one. Move something and it learns where it really belongs. Have a bad week and nothing scolds you. Say a session was too easy and the next block changes. Connect Apple Health, read-only, and a short night quietly changes today's session: the main work stays, the smaller exercises rest.
>
> A LIBRARY THAT GRADES ITS OWN EVIDENCE
> 321 practices, each rated A to E for the strength of the research behind it — 255 researchers and practitioners named for the ones their teaching popularised. 282 carry a plain-words safety line. Most of it is not an A, and it says so, because little of what anyone can teach you about your own life is.
>
> TRAINING BUILT FROM YOUR OWN LIFTS
> Four-week blocks — build, build, progress, then an easier week — sized to your days, your equipment and what you actually lift. Log a set and the next target follows a rule you can read. Four levels, earned from your log rather than claimed. 5,376 distinct programmes from the builder's own inputs; no two people get the same one.
>
> THE REST OF A LIFE
> Guided breathing. Seven spoken meditations, in a voice you choose. A weekly review that ends in one decision. A money ladder with one step live at a time. Rituals that survive a bad week, and a weekend that actually happens.
>
> FREE, FOR AS LONG AS YOU LIKE
> Your profile and your first insight. The shape of your day. The habits you already have, placed into your week. And every urge, reset and lapse-recovery tool — permanently, and never behind a paywall.
>
> YOURS, ON YOUR PHONE
> No account. No analytics. Nothing you enter leaves your device. Apple Health is read, never written. Save a backup any time; delete the app and it is gone.
>
> IntentNorth provides education and structured planning. It is not medical, psychological or financial advice, and it does not diagnose or treat any condition.
>
> Terms of Use: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
> Privacy Policy: https://intentnorth.app/privacy

### Why it is ordered this way

**The opening names the reader's problem, not the app's structure.** Somebody
browsing this has bought self-improvement before and watched their week stay
the same. "You already know what to do" is the most specific true thing we
can say to them, and it makes their existing listening an asset rather than a
competitor.

**"What actually happens" moved to second.** The old copy went straight to
training specifications. A person deciding whether to download wants to know
what using it is like before they want a programme spec.

**Evidence moved above training.** Training is the deepest feature; the
grading is the one no competitor has. Depth proves the product, difference
sells it.

**The free section stays late but stays in.** It is the trust close, and the
permanent free urge and lapse support is the single most disarming sentence
in the listing.

**Numbers that read as inventory were cut.** The counts that remain each
prove a claim: 321/255/282 proves the grading is real, 5,376 proves no two
programmes are the same.

The two links at the end are required by guideline 3.1.2 for any app with
auto-renewable subscriptions: the first submission of 1.0 was rejected on
2026-09-04 for their absence, with the binary itself unchanged.

Every figure above is counted from the shipped code: 321 / 282 / 255 from
the protocol library, 16 from the behaviour catalogue, 7 meditation scripts,
6 money rungs, 4 levels, and 5,376 by generating every declared combination
through `buildProgramme` and hashing the output — all distinct.

## Keywords (100, comma-separated, no spaces)

`tracker,workout,gym,strength,meditation,breathing,money,budget,family,evidence,weekly,fitness,goal` — 98 characters. Do not add competitor names.

## The three indexed fields, and why they changed

**Only the name, subtitle and keyword field are indexed for App Store
search.** The description is not — its whole job is conversion once somebody
has already found the listing. So these 160 characters are the entire search
surface, and Apple weights them in that order, the name most heavily.

**We were using 137 of 160, and every wasted character was in the name.**

| Field | Was | Now |
|---|---|---|
| Name | `IntentNorth` (11/30) | `IntentNorth: Habit & Routine` (28/30) |
| Subtitle | `Sleep, training, routine coach` (30/30) | `Sleep, training, day planner` (28/30) |
| Keywords | 96/100 | 98/100 |
| **Total indexed** | **137/160** | **154/160** |

No word repeats across the three, which matters because Apple indexes them
together and a repeat spends the character twice for nothing. `coach` is
dropped from all three: the earlier search research found the iTunes query for
"coach" in Australia returns The Coach, Louis Vuitton, H&M and Nike Run Club,
so the word carries no shelf at all. `routine` moves up into the name, the
highest-weighted field, and `planner` enters the subtitle in its place.

### What the competitor data says

From `docs/research/seo/appstore_batch1.md`, 22 AU listings with verified
character counts. The apps with the largest rating counts — the closest
available proxy for install volume — all pack the name to its limit:

| App | AU ratings | Name | Used |
|---|---:|---|---|
| Hevy | 16K | `Hevy - Workout Tracker Gym Log` | 30/30 |
| Structured | 15K | `Structured: Daily Planner Todo` | 30/30 |
| Strong | 13K | `Strong Workout Tracker Gym Log` | 30/30 |
| Fitbod | 9.5K | `Fitbod Workout & Gym Planner` | 28/30 |
| Sunsama | 37 | `Sunsama` | 7/30 |

They also keep the subtitle's words distinct from the name's. Hevy's name
carries workout, tracker, gym, log; its subtitle carries weight, lifting,
exercise, plan. Eight terms, no overlap, both fields full.

The exceptions prove the rule rather than breaking it. WHOOP has no subtitle
at all and 4K ratings, because it sells a wearable and its demand arrives from
outside the store. "I Am Sober" is itself the phrase people search. Neither
route is open to us.

### Honest limits on this

The structural finding is a fact: 23 indexed characters were unused, in the
field that counts most. **The choice of which words fill them is judgement,
not measurement** — we have no search-volume data, and nothing here has been
tested against real installs. Treat the term selection as a first version to
be revised once the App Store Connect analytics show what people actually
searched to reach the listing.

### Two things to check before changing this

**The App Store name is not the home-screen name.** `CFBundleDisplayName`
stays `IntentNorth`, so the icon label is unchanged; only the store listing
carries the longer string. That is standard practice and not a rename.

**Editing metadata on a version in review may require pulling it from the
queue.** 1.0 is currently Waiting for Review. Confirm in App Store Connect
before touching these fields, and if in doubt let them ride to the next
submission — an under-optimised listing costs installs, a lost queue position
costs days.

## What's New (1.0.0)

> First release. Seven coaches working from one profile: four-week plans built from your own lifts, a graded evidence library, habit and urge support that stays free, guided breathing and spoken meditation, and a weekly review. Everything stays on your phone.

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

# Monetisation — the model for 1.1

1.0 ships free with the Plus tier hidden, because a paywall with nothing
behind it is a review rejection and because the Paid Applications agreement
is the slowest item on any launch path. That decision only works if 1.1's
model is designed now. This is it, with the reasoning, so it can be argued
with rather than re-derived.

Revision 2 (2026-09-03): the first draft's free tier was more generous than
what the website and the app already disclose. Isaac's direction — a first
week, then everything visible and locked — is the line the site has promised
since launch ("Your profile and first personal insight are free. Complete
daily programs and ongoing optimisation are premium.") and the line the
app's own upgrade screen describes ("a complete week"). This revision
follows that.

Principles that are already promises — on the website, in the app, in the
privacy policy — and therefore constraints, not options:

- Recovery, urge and hardest-moment support is free, permanently, and never
  behind a purchase. "We never charge for someone's hardest moment."
- The profile and the first insight are free.
- No account, no server holding the plan. A billing model that needs a user
  account breaks the privacy page.
- Terms shown before payment; no fabricated pricing on the site until real
  products exist.

## 1. The line — what is free, what is paid

**The first week (free, everything on):** the interview, the profile and
the first insight, then seven days of the full product — every coach, the
adaptive Today, every session, Apple Health, the lot. The week is the
trial, and it runs on the person's own life rather than a demo.

**After the week (free, permanently):**
- The profile, the first insight, and the day's shape on Today — sleep,
  work, meals, fixed commitments — so the app still runs a day.
- Every urge, reset and lapse-recovery tool. Never gated.
- The coaches and the pathways, fully visible, locked: every rung of every
  ladder shown with its name and what it builds; every one of the 177
  evidence-based protocols listed by title and coach, with the five
  foundation protocols per coach open to read and the rest locked. The
  count is real and it is the sell: "5 of 177 open."
- Backup and restore. Data is theirs; leaving must never cost money.

**Plus:** the coaches actually running — programmes on Today, the ladder,
the four-week training blocks with load progression and strength bands,
Apple Health auto-regulation, the weekly report and history, trajectory
projections, spoken meditation, the full protocol library.

Why a hard line after a full week rather than an unlimited foundation tier:
the category converts on the trial, not on a free tier (Rise, Fabulous,
Headspace, Whoop and the rest all gate after onboarding), a solo founder
with no marketing budget cannot fund a large free base, and the site has
already disclosed exactly this line. The cost is lower ratings from people
who wanted a free app; the hardest-moment tools staying free is what makes
that defensible.

## 2. The week — how it is measured

- Anchored to the app's **original purchase date** from StoreKit 2
  (`AppTransaction.originalPurchaseDate`), read on-device, no server, no
  account. A delete-and-reinstall does not reset the week; a new Apple ID
  does, which is acceptable.
- Disclosed on the first screen after the interview: how long, what stops,
  what it costs after. App Review 3.1.1 asks for exactly that disclosure
  before a time-based trial; the free mode after the week has to be a
  usable app rather than a locked door (2.1), which the day's shape, the
  recovery tools and the readable library make it.
- Apple's own introductory offer (seven days free) stays on the annual
  product, for people who subscribe during the week and want the clock to
  restart from the purchase sheet. The on-device week and the Apple offer
  are separate mechanisms and both are allowed.

## 3. The model

Three products, one entitlement:

| Product | Type | Purpose |
|---|---|---|
| Plus — annual | Auto-renewing subscription, 7-day intro offer | The default; anchored below the cost of two single-purpose apps |
| Plus — monthly | Auto-renewing subscription | For people who will not commit to a year |
| Plus — lifetime | Non-consumable | Fits the "on your phone, no server" positioning — you own it; ~3× annual |

## 4. Price — a starting hypothesis, in AUD

| | Price | Effective |
|---|---|---|
| Monthly | $14.99 | — |
| Annual | $89.99 | $7.50/month |
| Lifetime | $249 | — |

Reasoning: seven coaches against single-purpose apps that sit in roughly
the $60–110/year band each. Annual is priced so that anyone paying for a
training app *and* a meditation app is already paying more. The
comparables should be confirmed on the App Store before launch — this
container cannot reach it, and the category moves.

Prices are changed in App Store Connect without a build. Set them, watch
sixty days of Apple's own subscription reports, then adjust. Do not launch
a price test; launch a price.

## 5. The people who installed 1.0

Everyone who installs 1.0 gets everything, free, with no week. When 1.1
draws the line those people lose features they had, which is the fastest
way to turn early supporters into one-star reviews.

Two honest options, both computed on the phone from the original purchase
date, no server:

- **Founding members for life.** Costs the revenue from a cohort that is
  small (1.0 is out for weeks, not months, before 1.1) and buys a story the
  site can tell.
- **Twelve months of Plus, then the normal line.** Honours them, keeps the
  line. *Recommended* — it is generous without being open-ended, and the
  cohort's size is unknown until the reports come in.

Either way, the choice is made before 1.1 ships, and the site says which.

## 6. The technical path

**`expo-iap`, StoreKit 2, entitlements checked on-device.** No RevenueCat.

- No server, no account. `Transaction.currentEntitlements` answers "is this
  person Plus" on the phone. The privacy page stays true; the App Privacy
  label stays as it is — Apple handles the purchase and IntentNorth
  receives nothing about it.
- RevenueCat would be faster to wire and give a dashboard, at the cost of a
  third party receiving an anonymous app-user id and every purchase event.
  That changes the privacy label, the privacy page and the website's
  claims for a convenience Apple's own reports already provide.
- Native module → runtime fingerprint changes → **a new build.** Batch it
  with press-and-hold drag and the `.ics` invite, which need one too.
- The `PLUS_AVAILABLE` constant already gates the tier; the upgrade screen
  is rewritten against real products and real prices, the week is wired
  to the purchase date, and every "Plus" gate point in the ladder, Today,
  the library and the report reads the entitlement.

## 7. Data — what to collect, and what not to

The question is real: a paid product cannot be priced or fixed without
knowing where people stop. Three tiers, in rising order of cost.

**Already available, collecting nothing:** App Store Connect's App
Analytics (installs, sessions, retention, crashes, conversion by source,
from the users who opted in to sharing with developers) and the Sales and
Subscriptions reports (trial starts, conversion, churn, proceeds). No SDK,
no change to any promise. This is the floor and it is more than most
founders look at.

**Recommended for 1.1 — funnel events, no content.** A short fixed list of
events — interview started, interview finished, first insight seen, week
ended, paywall shown, product chosen, purchase completed, coach opened —
with a random per-install identifier, the app version and the country.
Never a profile answer, never a plan, never anything derived from Apple
Health (guideline 5.1.3 forbids that leaving the device for anything but
the health purpose the person consented to). The website's own Cloudflare
Worker can receive it; no third-party analytics vendor is needed. What it
costs: the App Privacy label gains "Product Interaction — not linked to
you", the privacy page's "no analytics" lines are rewritten to "no
personal data", and the site's line softens from "nothing leaves your
phone" to "nothing about you leaves your phone". That is a real change to
a selling point, and it is worth it, because the alternative is guessing.

**Not recommended — profile or health data on a server.** Holding health
information to improve someone's health makes IntentNorth, on the ordinary
reading, a health service provider under the Privacy Act 1988, which
removes the small-business exemption, brings the Australian Privacy
Principles and the Notifiable Data Breaches scheme, and requires express
consent for sensitive information. Apple's HealthKit terms add their own
limits. It also deletes the product's clearest differentiator. Revisit only
when a feature the person asks for — sync between devices, a shared
household plan — needs it, and then opt-in, encrypted, with the policy
rewritten first.

## 8. Money mechanics — Isaac's side

- **Paid Applications agreement, banking and tax forms** in App Store
  Connect. Start now; it takes days and blocks 1.1 entirely.
- **App Store Small Business Program** — 15% commission instead of 30%
  under US$1M. Enrol before the first sale.
- Apple is the merchant of record for Australian customers, so GST and
  refunds are Apple's; the support page already says so.
- Australian Consumer Law: auto-renewal disclosed, terms before payment —
  Apple's purchase sheet does this, and the site already promises it.

## 9. Order of work

1. Isaac: Paid Apps agreement, banking, tax, Small Business Program — this
   week, in parallel with 1.0 review.
2. Isaac: confirm the three prices, the 1.0-cohort choice, and the
   analytics tier.
3. App session: 1.1 — `expo-iap`, the three products, the week anchored to
   purchase date, gate points across ladder, Today, library and report, the
   locked-but-visible library and pathways, the upgrade screen against real
   products, funnel events if agreed; batched with the other
   fingerprint-changing work.
4. Website session: pricing published only once the products exist; the
   privacy page and label updated in the same release as the events, never
   before.

## 10. Decisions (2026-09-03)

Agreed by Isaac:

- Prices as in §4: monthly AU$14.99, annual AU$89.99 with a seven-day
  introductory offer, lifetime AU$249. Confirm the comparables in the
  store before the products are created, then create them at these.
- The 1.0 cohort: twelve months of Plus, computed on-device from the
  original purchase date, then the normal line.
- Funnel events: in, for 1.1, on the terms of §7. The client
  (`src/lib/telemetry.ts`) is written and tested now with a closed list of
  eight events and a four-field payload; it is off in every build until
  `EXPO_PUBLIC_TELEMETRY_URL` is set, which happens in the same release as
  the privacy page and App Privacy label changes. The receiving route on
  the website's Worker is the website session's to build; the contract is
  a POST of `{event, install, build, at}` and a 204.

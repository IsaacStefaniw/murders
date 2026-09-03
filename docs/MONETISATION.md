# Monetisation — the model for 1.1

1.0 ships free with the Plus tier hidden, because a paywall with nothing
behind it is a review rejection and because the Paid Applications agreement
is the slowest item on any launch path. That decision only works if 1.1's
model is designed now. This is it, with the reasoning, so it can be argued
with rather than re-derived.

Principles that are already promises — on the website, in the app, in the
privacy policy — and therefore constraints, not options:

- Recovery, urge and hardest-moment support is free, permanently, and never
  behind a purchase.
- The profile and the first insight are free.
- No account, no server, nothing leaves the phone. A billing model that
  needs a user account breaks the privacy page.
- Terms shown before payment; no fabricated pricing on the site until real
  products exist.

## 1. The line — what is free, what is paid

**Free, forever, no time limit:**
- The interview, the profile, Today and the week.
- All seven coaches at the **foundation** rung.
- The whole Habits & urges pathway, every rung — this is the promise.
- Library browsing, breathing, the two-minute practices.
- Backup and restore. Data is theirs; leaving must never cost money.

**Plus:**
- The ladder above foundation: developing, established, advanced — the
  built four-week training blocks with load progression and strength bands,
  the deeper rungs in every other pathway.
- Apple Health auto-regulation of the day's session.
- The weekly report and history beyond the last fourteen days.
- Trajectory projections ("at this rate you arrive in…").
- Spoken meditation beyond the two-minute resets.

Why the line sits there: the ladder *is* the product, and "This is too easy"
at foundation is the one moment a person has their own evidence that it
works. A paywall that appears then converts on demonstrated value; a paywall
at install converts on hope. Apple's guidance on free tiers also wants the
free app to be genuinely usable, which foundation is — it is a real
programme, not a crippled one.

## 2. The model

Three products, one entitlement:

| Product | Type | Purpose |
|---|---|---|
| Plus — annual | Auto-renewing subscription | The default; anchored below the cost of two single-purpose apps |
| Plus — monthly | Auto-renewing subscription | For people who will not commit to a year |
| Plus — lifetime | Non-consumable | Fits the "on your phone, no server" positioning — you own it; ~3× annual |

Trial: **none by clock.** The free tier is unlimited at foundation, so the
trial is "until you outgrow it". A seven-day introductory offer on annual
only, for people who go straight there.

## 3. Price — a starting hypothesis, in AUD

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

## 4. The people who installed 1.0

Everyone who installs 1.0 gets everything, free. When 1.1 draws the line,
those people lose features they had. That is the fastest way to turn early
supporters into one-star reviews.

**Grandfather them.** StoreKit 2 exposes the app's original purchase date
on-device (`AppTransaction.originalPurchaseDate`) with no server and no
account. Anyone whose first install predates 1.1's release gets Plus for
life — a founding-member entitlement computed on the phone. It costs
nothing, it is true to the privacy stance, and it is a story worth telling
on the site: *the first people in never pay.*

## 5. The technical path

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
  is rewritten against real products and real prices, and every "Plus"
  gate point in the ladder reads the entitlement.

## 6. Measuring it without breaking the privacy promise

App Store Connect's Sales & Trends and Subscriptions reports give
conversion, retention, churn and proceeds, aggregated by Apple, with no SDK
in the app. That is the analytics. The on-device "share your numbers"
feature already exists for anything more.

## 7. Money mechanics — Isaac's side

- **Paid Applications agreement, banking and tax forms** in App Store
  Connect. Start now; it takes days and blocks 1.1 entirely.
- **App Store Small Business Program** — 15% commission instead of 30%
  under US$1M. Enrol before the first sale.
- Apple is the merchant of record for Australian customers, so GST and
  refunds are Apple's; the support page already says so.
- Australian Consumer Law: auto-renewal disclosed, terms before payment —
  Apple's purchase sheet does this, and the site already promises it.

## 8. Order of work

1. Isaac: Paid Apps agreement, banking, tax, Small Business Program — this
   week, in parallel with 1.0 review.
2. Isaac: agree the line and the three prices, or amend them.
3. App session: 1.1 — `expo-iap`, the three products, founding-member
   grandfathering, ladder gate points, the upgrade screen against real
   products; batched with the other fingerprint-changing work.
4. Website session: pricing published only once the products exist, with
   the founding-member story beside it.

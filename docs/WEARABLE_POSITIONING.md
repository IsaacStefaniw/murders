# Wearable positioning: the device you already own

Written 2026-09-07 for the question "should IntentNorth position itself as
the app that works with the wearable you already own, with no subscription
of its own beyond Plus and no new hardware to buy". It tests that idea, and
tests separately the "buy the device and cancel the subscription" line,
which Isaac already suspected was wrong. It is wrong, and section 2 says why.

## What this pass could and could not do

This session's network egress is heavily restricted. Direct fetching was
**blocked** for apple.com, support.apple.com, apps.apple.com, ouraring.com,
support.ouraring.com, support.garmin.com, dcrainmaker.com, techradar.com,
en.wikipedia.org, gummysearch.com, and reddit.com (all of reddit, including
old.reddit.com and the JSON endpoints). The only site that could be fetched
in full was **developer.apple.com**, so the App Review guideline wording in
section 2 is quoted directly and is reliable.

Everything else here comes from a web search whose result set names the
official page. That is weaker than reading the page. Source tags below:

- **[F]** fetched directly and read. Trust it.
- **[S]** a search result summary that cites the named URL. The URL is real
  and is the vendor's own page in most cases, but the page itself was not
  read here. Treat as good but not final; re-check before it goes on a
  website.
- **[3rd]** a third-party blog or stats site, some of which are content
  marketing for a competing app. Low trust, flagged where used.
- **[R]** already verified in `docs/COMPETITIVE_REVIEW_3.md` against the
  Australian App Store on 7 Sep 2026. Highest trust in this document.
- **U** unverified. Nobody should quote it.

Reddit being unreachable means **no subreddit member count in section 5 is
verified**, and no public post could be quoted from its original page.
Section 5 says which numbers came from where and marks the rest U.

---

## 1. The device matrix

Seven columns, matching `READ_TYPES` in `src/features/health/healthkit.ts`:
sleep analysis, resting heart rate, HRV as SDNN, VO2 max, body mass, height,
waist circumference. "Sub?" is the last column: does the vendor require its
own paid subscription for the Apple Health sync itself to keep working.

Y = writes it. N = does not. ? = could not establish. **manual** = the person
types it into Health or into IntentNorth's own body-numbers screen
(`src/features/health/bodyEntries.ts` accepts height, weight, waist, resting
heart rate, HRV and VO2 max by hand, and sleep hours can be typed too).

| Device / app | Sleep | RHR | HRV SDNN | VO2 max | Weight | Height | Waist | Sub for the sync? |
|---|---|---|---|---|---|---|---|---|
| Apple Watch (with iPhone) | Y | Y | Y | Y (Cardio Fitness) | N (needs a scale or manual) | manual | manual | **No** |
| iPhone alone, no wearable | Y (motion-based, Sleep Focus) | N | N | N | manual | manual | manual | **No** |
| Garmin, via Garmin Connect | Y (stages since Connect v4.71) | Y | ? (reported as SDNN by one third party, not confirmed on Garmin's page) | **N** (Garmin excludes it) | Y | ? | N | **No.** Connect+ is additive |
| Polar, via Polar Flow | Y (duration, sleep and wake time) | ? | N | N | ? | ? | N | **No** for the sync. Polar has a separate paid Fitness Program |
| Coros | Y | Y (added in the 2025 app 4.0, measured in sleep) | **N** | ? | ? | ? | N | **No** |
| Suunto | **N** | **N** | **N** | **N** (long-standing forum request) | ? | ? | N | n/a, there is little to gate |
| Withings (ScanWatch, Sleep mat, scales) | Y | Y (heart rate) | ? | **Y** | **Y** plus body composition | ? | N | **No** for the sync. Withings+ is an extra tier |
| Oura ring | Y | Y (heart rate) | **N** (Oura computes RMSSD, Health expects SDNN) | N | Y (reported; direction unclear) | Y (reported; direction unclear) | N | **Yes for Gen3 and Ring 4.** The integration is listed as needing an active membership |
| Whoop | Y | **Y** | **N** (RMSSD vs SDNN, same reason as Oura) | N | N | N | N | **Yes, absolutely.** No membership, no data at all |
| Fitbit / Google Health | Y | Y ("vitals") | ? | ? | Y | ? | N | **No**, since the Aug 2026 two-way sync landed |
| Amazfit / Zepp | Y | Y (heart rate) | patchy, device-limited | ? | ? | ? | N | **No** |
| Xiaomi / Mi Band, via Mi Fitness | Y | Y (heart rate) | ? | ? | ? | ? | N | **No** |
| Ultrahuman ring | Y (stages) | Y | Y is claimed by Ultrahuman, but the ring measures RMSSD, so what lands in the SDNN field is questionable | ? | ? | ? | N | **No.** Ultrahuman markets "no required subscription" |
| RingConn | Y | Y | ? | ? | ? | ? | N | **No.** RingConn markets itself as subscription-free |
| Circular ring | ? | ? | ? | ? | ? | ? | N | ? |
| Wahoo | N (it is a workout app) | N | N | N | N | N | N | **No** for the workout sync; Wahoo sells its own membership |
| Eight Sleep Pod | **Y** (stages, from the mattress) | Y | claimed, but measured as RMSSD | N | N | N | N | **Yes.** Autopilot is required for the first 12 months and beyond |
| Sleep Cycle | **Y** | via iPhone camera, not into Health | N | N | N | N | N | Contested. Sleep Cycle's freemium comparison lists Apple Health integration in the free tier; other listings call the sync premium. **Unresolved** |
| AutoSleep (one-off, A$ price in section 4) | **Y** | N | N | N | N | N | N | **No.** One-off purchase |

### What the matrix actually says

**Three findings matter more than the rest.**

1. **Sleep and resting heart rate are near-universal.** Almost every device
   in the table writes both. Those are also the two signals IntentNorth
   leans on hardest: `SHORT_NIGHT_HOURS = 6` changes today's session on its
   own, and resting heart rate is compared at `RHR_CAUTION_BPM = 5` and
   `RHR_BACK_OFF_BPM = 10` above the person's own fourteen-day median. So
   the readiness engine works on a very wide base of hardware.

2. **HRV in the Apple Health SDNN field is much rarer than it looks.** Apple
   Health stores HRV as SDNN. Oura, Whoop and Eight Sleep all compute RMSSD,
   a different statistic, and Oura and Whoop therefore do **not** write HRV
   to Health at all [S: support.ouraring.com HRV article; DC Rainmaker's 2022
   Whoop export piece as summarised]. Coros does not send HRV. Suunto sends
   nothing of the sort. In practice, the SDNN field is filled by **Apple
   Watch**, possibly Garmin, and by people typing it in. IntentNorth's
   readiness code is honest about this already: `MIN_READINGS = 5` before a
   baseline exists, and the band degrades gracefully to sleep and resting
   heart rate when HRV is absent. But marketing must not say "works with your
   Oura or Whoop HRV". It does not.

3. **VO2 max is rarer still.** Garmin deliberately withholds it. Oura, Whoop,
   Coros and Suunto do not send it. It comes from **Apple Watch** Cardio
   Fitness (Series 3 or later, generated on an outdoor walk, run or hike
   with GPS and enough exertion) and from **Withings**. Everyone else types
   it or goes without.

**Waist circumference:** no consumer device in the list writes it. It is a
tape measure and a text field, everywhere, always. IntentNorth reads it
because a person can type it, not because a band supplies it.

**Height:** effectively a profile field, typed once. Oura is reported to move
height and weight, but the sources disagree on the direction (Oura importing
from Health, versus writing to it), so it is marked unresolved.

**Weight:** comes from a connected scale (Withings is the clean case) or
manual entry, not from a wrist or a finger.

---

## 2. The subscription question, answered honestly

### Whoop

**"Buy it and cancel" is not available for Whoop.** For most of Whoop's
history the hardware was not sold separately at all: the membership included
the band. In 2026 Whoop began testing selling hardware separately in
**Australia and Spain**, described by Whoop support as a limited-time trial
in select markets, at **A$99 for Whoop 5.0 plus A$300 a year**, and **A$149
for Whoop MG plus A$450 a year** [S: notebookcheck.net, trustedreviews.com,
wearablexp.com, arnav.au]. Even in that trial, the band is inert without a
membership: Whoop's own cancellation page says that once the membership is
cancelled "you will not be able to collect, upload, or analyze any of your
biometric data" [S: support.whoop.com/hc/en-us/articles/360023473753]. No
data collected means nothing reaches Apple Health, so IntentNorth sees
nothing. A cancelled Whoop is a bracelet.

### Oura

**"Buy it and cancel" is technically possible for Oura but it breaks the
part IntentNorth needs.** The ring is bought outright, around **A$569 to
A$599** for Ring 4, with membership at **A$9.99 a month or A$109.99 a year**
after a free first month [S: comparemates.com.au, recoveryguru.com.au;
vendor page ouraring.com/membership was unreachable]. Oura's own public
statement on cancelling is that you keep "your three daily Oura Scores, ring
battery, basic profile information, and app settings" and that "all your
contributors, tailored insights, features, in-app content, among other
dimensions of the App will be locked" [S: Oura's own X account, 2021].
Crucially, **the Apple Health integration is listed as available for Gen2
rings, and for Gen3 and Ring 4 with an active Oura membership** [S:
support.ouraring.com/hc/en-us/articles/360025438734]. If that is right, and
it is the strongest signal available without reaching the page, then
cancelling an Oura membership stops the sync that IntentNorth depends on.

### The verdict, in one paragraph

Do not say it. "Buy the device and cancel the subscription" is a myth for
Whoop, where cancelling stops all data collection and the band becomes
jewellery, and it is self-defeating for Oura, where the Apple Health
integration itself appears to require an active membership on current rings.
It is only true for the vendors who never charged in the first place, and for
those there is nothing to cancel, so the line has no content. Beyond being
inaccurate, saying it would be a bad idea for four reasons: it makes
IntentNorth's own truthfulness the first thing a reviewer tests, and the
claim fails; it invites a support burden of "I cancelled my Oura and now your
app shows nothing"; App Review guideline **2.3.1** treats "marketing your app
in a misleading way, such as by promoting content or services that it does
not actually offer" as grounds for removal from the App Store and
"termination of your developer account" [F: developer.apple.com App Review
Guidelines], and a claim that a cancelled Oura keeps feeding IntentNorth is
exactly that kind of promise about a service IntentNorth does not control;
and guideline **1.1.6** rejects "false information and features", with the
explicit note that framing does not save it. Guideline **2.3.10** also
requires app metadata to be "focused on the app itself and its experience"
and to exclude "irrelevant information" [F], which is a further reason not to
build a listing around instructions for managing someone else's billing.

The honest version of the same idea, which is stronger anyway, is in
section 6: **IntentNorth adds no second subscription of its own on top of
whatever you already pay, and it does not need you to buy anything new.**
That is true of the code and true of the business model, and it does not
depend on anyone cancelling anything.

---

## 3. Market sizing

Ordered by how much the number can be trusted.

**The one to use: Rock Health's 2025 Consumer Adoption Survey, 8,000 US
adults, fielded 1 to 23 December 2025.** 46% of Americans report owning a
wearable, up from 13% in 2015; 57% own at least one wearable or connected
device; roughly 4 in 10 own a smartwatch; smart scales 13%; smart rings 8%;
and engagement is high, with 83% wearing the device five or more days a week
and 59% "always or nearly always" [S:
rockhealth.com/insights/whats-your-score-insights-on-wearables-and-connected-devices-from-rock-healths-2025-consumer-adoption-survey/,
corroborated by fiercehealthcare.com, healthcaredive.com, mddionline.com].
This is a real survey with a named sample size and field window. It is US
only.

**Australia: Telsyte Australian Smartphone and Wearable Devices Market Study
2023 estimated 36% of Australians own a smartwatch, up 4 points year on
year**, and Telsyte reported over a million smart wrist wearables sold in the
first half of 2024, up 2%, with smartwatches three-quarters of that and
Apple, Samsung and Fitbit leading [S: telstrawholesale.com.au citing Telsyte;
telsyte.com.au announcements page]. Telsyte is the standard Australian
source. The 36% figure is three years old now and should be treated as a
floor rather than a current reading. **U:** no current Australian figure was
found in this pass.

**Older US baseline, for the trend line only:** Pew Research Center found 21%
of US adults regularly wore a smartwatch or fitness tracker in a June 2019
survey [S:
pewresearch.org/short-reads/2020/01/09/about-one-in-five-americans-use-a-smart-watch-or-fitness-tracker/].
Useful only to show the doubling.

**Apple Watch installed base:** figures found range from "more than 170
million" to "over 250 million in active use", attributed loosely to
Counterpoint and IDC by third-party stats blogs. Counterpoint's own
often-cited milestone was 100 million active wearers. **These are [3rd] and
inconsistent; do not put a number on a page.** What can be said with more
confidence, from Counterpoint via the same third parties, is that Apple led
global smartwatch shipments in 2025 with about 23% of units. **U** on the
installed base.

**Share of smartwatch owners paying a separate subscription: not found.**
This pass could not source a survey giving that percentage, in Australia or
globally. Mark it **unverified** and do not estimate it.

**Subscription fatigue in wearables: no clean survey found either.** What
exists instead is documented, dated backlash, which is better evidence than a
soft statistic anyway:

- **Garmin Connect+**, launched March 2025 at **US$6.99 a month or US$69.99 a
  year**, produced a boycott post on the Garmin subreddit reported at around
  10,000 upvotes, and TechRadar ran a live page collecting reader anger [S:
  tomsguide.com "Garmin launches a paywall…", techradar.com
  "garmin-connect-plus" and the live backlash page]. Sources disagree on
  whether previously free features moved behind it; Garmin said the free
  experience "is not going away". The disagreement itself is the point: the
  fear of a paywall creeping over free features is now the default consumer
  expectation.
- **Whoop**, May 2025, charged existing members an upgrade fee for new
  hardware after promising otherwise, and a Reddit post titled "Upvote this
  if you just canceled your subscription" is reported at about 2,400 upvotes
  [S: techcrunch.com/2025/05/11/fitness-tracker-whoop-faces-unhappy-customers-over-upgrade-policy,
  techradar.com]. Whoop later reversed course [S: techradar.com].
- **Polar** introduced a paid Fitness Program at roughly US$11 a month [S:
  forbes.com, Andrew Williams, 15 April 2025, "The Age Of Paying A Monthly
  Fitness Tracker Subscription Is Here"].

**What the market number actually supports.** Not "millions of people are
waiting for this". It supports a narrower, defensible sentence: wearable
ownership is now close to half of adults in the best-surveyed market, more
than a third of Australians own a smartwatch, the devices are worn nearly
every day, and every major vendor added or expanded a subscription between
2025 and 2026. An app that asks for no second device and no second vendor
subscription is aimed at a real and growing irritation. That is as far as
the evidence goes.

---

## 4. Who already occupies this territory

`docs/COMPETITIVE_REVIEW_3.md` verified Whoop, Rise, Athlytic, Gentler Streak
and Bevel against the Australian App Store on 7 Sep 2026. Those rows are
**[R]** and are not redone. The extension below adds the apps the brief named
that the review did not cover, and answers the one question that matters:
**does it change a plan, or does it only display a number?**

| App | Price and model | What it does with Health data | Changes a plan? |
|---|---|---|---|
| Athlytic **[R]** | A$7.99 a month, A$45.99 a year, no lifetime by policy. App Store privacy label is "Data Not Collected", the only one in the whole review set | Recovery score and target exertion from Apple Watch data, no account | **Number, plus a target.** Sets a target exertion figure. It does not rewrite a session |
| Gentler Streak **[R]** | A$13.99 a month, A$59.99 a year, lifetime A$99.99 to A$299.99, family plans | Activity and readiness with a forgiving tone; free tracking tier | **Suggestion.** "Go Gentler" or rest, and a streak that survives a rest day |
| Bevel **[R]** | A$22.99 a month, A$149.99 a year, plus consumable AI credit packs A$7.99 to A$79.99. Written promise that anything free today stays free | Broad recovery, sleep, strain, stress, nutrition | **Number and content.** No session rewrite found |
| Whoop **[R]** | No App Store purchase. A$299 / A$399 to A$419 / A$599 a year per vendor snippet, sold on Whoop's own checkout. In the 2026 AU trial, hardware separate at A$99 or A$149 | Its own band's data. Syncs sleep, RHR, SpO2, respiratory rate and workouts out to Health; **not HRV** | **Yes, a strain target.** But requires its own band and its own membership |
| Rise **[R]** | A$14.99 a month, A$99.99 to A$149.99 a year, plus an "AI Expert Access" add-on at A$49.99 | Sleep debt and an energy schedule | **Yes, for the day's shape.** Not for training |
| AutoSleep (Tantsissa, Australian developer) | **One-off.** Around US$2.99 to US$8.99 depending on the source and date; a "Sleep, Wake & Be Healthy" bundle with HeartWatch at a one-off US$9.99 with "no ongoing subscription charges" [3rd: gearbrain.com; S: apps.apple.com/au listings for id1164801111 and id1062745479, not fetchable this pass]. **A$ price unverified** | Writes sleep to Apple Health; sleep debt, HRV analysis, nap detection | **No.** Displays and analyses. It changes nothing about your day |
| HeartWatch (Tantsissa) | **One-off**, same family and bundle as above. **A$ price unverified** | Heart rate, resting heart rate, sleep heart rate, sectioned by activity | **No.** Display and alerting |
| Training Today | Free download; sources conflict, one giving US$2.95 a month / US$19.99 a year / US$26.99 lifetime, another describing a free app with a one-time Pro upgrade around US$9.99 to US$14.99. **Model unresolved, A$ unverified** | HRV plus workout detection into a "readiness to train" score, running on the Watch without the phone | **Yes, and this is the closest competitor found.** It generates "dynamic run workout sets", structured sessions chosen from Strength, Aerobic Endurance, Speed Endurance, Speed or Recovery, driven by the readiness score [S: advnture.com, trainingtodayapp.helpscoutdocs.com] |
| Welltory | Free with a 3-day premium trial, then a subscription. **Price not found this pass** | HRV and stress from Apple Health or a phone camera measurement | **No.** Measurement, score and content |
| Cardiogram | Premium was US$14.99 a month or US$99.99 a year as of 2019; the company was acquired in 2021 and a separate "Cardiogram: HR Monitor" listing shows US$3.99. **Current model unresolved** | Heart rate patterns from Watch and Wear OS, family monitoring, doctor sharing | **No** |
| Livity | Claimed free core tier with an optional lower-cost paid tier | Recovery, body battery, sleep and HRV from Apple Watch, on-device, no account | **Number.** Note: the sources ranking Livity first are **healthappinsider.com and superage.app, which read as content marketing for Livity itself.** Treat every claim about it, including the free tier, as **[3rd] and unverified** |

**Two corrections to the third-party record.** Third-party comparison sites
claim Athlytic is "a one-time purchase with an optional pro upgrade". That is
**wrong**: `COMPETITIVE_REVIEW_3.md` verified A$7.99 monthly and A$45.99
yearly on the Australian App Store, and Athlytic's own help documentation
says there are no lifetime unlocks by policy. The same sites describe Bevel's
Pro at US$14.99 a month, which matches the vendor but not the A$22.99 the
Australian store charges. The lesson for this document: the app-comparison
blogs in this niche are unreliable and several are owned by apps in the
comparison.

### The gap

The territory splits cleanly in two, and neither half is what IntentNorth is.

**Half one, the display apps.** Athlytic, HeartWatch, AutoSleep, Welltory,
Cardiogram, Livity. They read Apple Health, compute a recovery or sleep
number, and show it beautifully. Then they stop. The person is left holding a
number and the whole job of deciding what to do with it. Two of them
(AutoSleep, HeartWatch) are genuinely one-off purchases, which is the pricing
IntentNorth admires, and they are display-only.

**Half two, the plan-changers that need their own thing.** Whoop needs its
band and its membership. Rise changes the day but not training, and charges
a subscription. Gentler Streak nudges. **Training Today is the only app found
that reads Apple Health, computes readiness, and then hands back a changed
session** and it does that only for running, and its pricing is unclear.

**The gap is the join.** Nobody found in this pass reads the wearable the
person already owns, judges it **against that person's own baseline rather
than a population band**, and then rewrites the actual session and places it
in a real day, without requiring its own hardware, its own account, or a
second subscription. IntentNorth's `readiness.ts` is explicit about the
baseline point in its own header comment: healthy adults sit anywhere from
about 20ms to 200ms of SDNN, so "any app that colours a number red against a
population band is telling half its users something false". That is a
positioning claim that is also a code fact, which is the rare good kind.

The competitive risk is Training Today widening beyond running, and Athlytic
adding session prescription. Neither has happened yet.

---

## 5. The forum map

**Reddit was unreachable from this session.** Every member count below is
either from a search result summary that named a stats page, or is unverified.
No public post could be opened and quoted from its own page; the two quoted
post titles come from news coverage that quoted them. Isaac should confirm
sizes and read every sidebar himself before posting anywhere.

| Community | Size | What the recurring complaint is | Rules on a founder posting |
|---|---|---|---|
| r/whoop | ~138k members [S: gummysearch.com/r/whoop, page itself blocked] | Subscription value and pricing changes. The May 2025 upgrade-fee reversal produced a post titled **"Upvote this if you just canceled your subscription"** reported at ~2,400 upvotes [S: techcrunch.com, techradar.com] | **U.** Not readable this pass |
| r/Garmin | **U** | Connect+ and the fear of free features moving behind it. A boycott post reported at ~10,000 upvotes [S: techradar.com, tomsguide.com] | **U** |
| r/AppleWatch | **U.** One third-party listing says five Apple subreddits together hold over 4 million subscribers [3rd: painonsocial.com] | Sleep tracking quality, battery, "what do I do with this data" | **U** |
| r/ouraring | **U** | Membership cost and what is lost on cancelling | **U** |
| r/QuantifiedSelf | **U** | Data portability, getting numbers out of vendor silos and into something useful | **U** |
| r/Biohackers | **U** | Stacking devices; "which of these numbers actually matters" | Published rules emphasise respectful interaction and discourage direct medical advice [S: biohacking.fandom.com mirror] |
| r/SmartRings | **U** | Subscription-free rings versus Oura | **U** |
| r/AdvancedRunning | **U** | Readiness scores versus how the legs actually feel | **U** |
| Whoop Community (community.whoop.com) | **U** | Membership questions, including cancellation threads [S: community.whoop.com/t/quit-membership/7862] | Vendor-run. **Assume a founder promoting a competing app is unwelcome** |
| Garmin Forums (forums.garmin.com) | **U** | Long-running threads asking Garmin to send VO2 max, SpO2 and respiration to Apple Health [S: forums.garmin.com/.../254977] | Vendor-run. Same caution |
| Suunto Community (forum.suunto.com) | **U** | Sleep and HRV not reaching Apple Health at all [S: forum.suunto.com topics 739, 8511, 10138] | Vendor-run. Same caution |

**What the rules actually are, in general.** Reddit's site-wide norm is the
90/10 rule: at least 90% ordinary participation, at most 10% anything about
your own product, and each subreddit's own sidebar overrides it. Larger
subreddits commonly add karma and account-age minimums before a link posts at
all [3rd: redship.io, soar.sh, founderreply.com]. The one piece of advice
that appears in every source and costs nothing: **when you mention your own
app, say it is yours in the same sentence.** Undisclosed promotion is what
gets people banned, not disclosure.

**Where Isaac can honestly participate, on the evidence here.** The vendor
forums (Garmin, Suunto, Whoop) are the wrong place: they are the vendor's
house and the complaint threads there are about the vendor's product.
The useful, honest participation is answering the *technical* question that
recurs everywhere and that this document now has real answers to: **which of
my device's numbers actually reach Apple Health, and which do not.** The
Oura and Whoop RMSSD-versus-SDNN answer, the Garmin VO2 max exclusion, and
the Suunto gap are all genuinely useful, verifiable and free of any pitch.
Post those. Mention the app only when someone asks what to do with the data,
and say it is yours.

**Before posting anywhere, confirm:** each subreddit's exact self-promotion
rule from its own sidebar, its karma and account-age gate, and whether it has
a dedicated promotion thread or day. None of that could be read this pass.

---

## 6. What we can honestly claim

Sentences below are true of the code as it stands: `READ_TYPES` in
`src/features/health/healthkit.ts`, the baseline logic and constants in
`src/features/health/readiness.ts`, the manual entry list in
`src/features/health/bodyEntries.ts`, and the read-only comment at the top of
the HealthKit adapter.

### True, and usable on the App Store listing or the website

1. "IntentNorth reads Apple Health. If your watch, ring, band or scale writes
   to Apple Health, IntentNorth can use it."
2. "No new hardware. IntentNorth does not sell a device and does not need one."
3. "IntentNorth never writes to Apple Health. It only reads."
4. "No account. Nothing to sign up for."
5. "Your health data stays on your phone."
6. "Your HRV and resting heart rate are read against your own fourteen-day
   normal, never against a population band."
7. "A short night backs off today's session, and the app tells you that is
   why."
8. "Weight is read as a three-week trend, not as this morning's number."
9. "Sleep and resting heart rate are all IntentNorth needs to change your
   day. HRV and VO2 max make it sharper when your device provides them."
10. "No wearable? Type the numbers in. Height, weight, waist, resting heart
    rate, HRV and VO2 max can all be entered by hand."
11. "IntentNorth does not add a second health subscription on top of the one
    your device may already charge you." (True as long as Plus is IntentNorth's
    only charge, per `docs/MONETISATION.md`.)
12. "A reading changes the session, not just a number on a card."
13. "This is a training input, not a health assessment." (Straight from the
    header of `readiness.ts`. Worth saying out loud, and it is also the
    safest framing under App Review guideline 5.1.3.)

### False, risky, or unprovable. Do not use

1. **"Buy the wearable and cancel the subscription."** False for Whoop, where
   cancelling stops all data collection. Self-defeating for Oura, where the
   Apple Health integration appears to require an active membership on Gen3
   and Ring 4. And a claim about a third party's service that IntentNorth
   cannot control, which is precisely what guideline 2.3.1 warns about.
2. **"Works with your Whoop HRV" or "works with your Oura HRV."** Neither
   writes HRV to Apple Health. They compute RMSSD; Health stores SDNN.
3. **"Works with any wearable."** Suunto sends neither sleep nor resting
   heart rate to Health. Wahoo is a workout app. "Any" is false.
4. **"Reads your Garmin VO2 max."** Garmin does not send it.
5. **"Replaces your Whoop / Oura / Garmin subscription."** IntentNorth cannot
   replace what it does not measure, and for Oura the sync itself may depend
   on that subscription.
6. **"Cheaper than Whoop"** as a headline. Whoop's Australian pricing is a
   moving target in 2026 and the hardware-separate trial changes the sum. Any
   comparison needs a date on it and will go stale.
7. **"Medical", "clinically validated", "diagnoses", "detects illness."** The
   code refuses to make health assessments and says so; the listing must not
   promise one. Guideline 5.1.3 governs this space.
8. **"The only app that..."** Training Today already reads Apple Health,
   computes readiness and prescribes a session, for runners. "The only" is
   not defensible.
9. **"Millions of Australians are waiting for this."** No sourced Australian
   figure supports a claim like that, and the 36% smartwatch figure is from
   2023.
10. **"X% of wearable owners are tired of subscriptions."** No such survey was
    found. Do not invent one.
11. **"Your data never leaves your phone"** stated as absolute, without
    checking every other subsystem in the app. The Health data does not leave.
    Verify the whole claim against `docs/PRIVACY.md` and the App Privacy
    label before it goes on a page, since `COMPETITIVE_REVIEW_3.md` records
    IntentNorth's label as "Device ID, not linked", which is not the same as
    nothing.

---

## 7. Sources

Marked **[F]** if fetched and read here; everything else was named by a
search result whose page could not be opened from this session.

**Apple:** App Review Guidelines https://developer.apple.com/app-store/review/guidelines/ **[F]**.
Cardio Fitness support page https://support.apple.com/en-us/108790 (blocked).
Apple's VO2 max white paper https://www.apple.com/healthcare/docs/site/Using_Apple_Watch_to_Estimate_Cardio_Fitness_with_VO2_max.pdf (blocked).

**Garmin:** https://support.garmin.com/en-US/?faq=lK5FPB9iPF5PXFkIpFlFPA (blocked).
VO2 max request thread https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-mobile-ios/254977/request-for-spo2-vo2-max-and-respiration-data-to-be-shared-to-apple-health-app .
Connect+ press release https://www.garmin.com/en-US/newsroom/press-release/wearables-health/elevate-your-health-and-fitness-goals-with-garmin-connect/ .
Connect+ analysis https://www.dcrainmaker.com/2025/03/garmin-connect-plus-subscription-walkthrough.html (blocked).
Backlash https://www.techradar.com/health-fitness/garmin-connect-plus and https://www.tomsguide.com/wellness/smartwatches/garmin-launches-a-paywall-here-are-all-the-premium-connect-features-that-will-cost-you-usd6-99-a-month .
Sleep stages to Health https://www.notebookcheck.net/Garmin-Connect-begins-sharing-more-sleep-data-with-Apple-Health-after-new-iOS-app-update.753484.0.html .

**Polar:** https://support.polar.com/us-en/support/connecting_polar_flow_with_apple_health .
Polar subscription context https://www.forbes.com/sites/andrewwilliams/2025/04/15/the-age-of-paying-a-monthly-fitness-tracker-subscription-is-here/ .

**Coros:** https://support.coros.com/hc/en-us/articles/360041549551-Connecting-Apple-Health-with-COROS-App and release notes https://support.coros.com/hc/en-us/articles/5146420791060-COROS-App-Release-Notes-iOS .

**Suunto:** https://forum.suunto.com/topic/739/apple-health , https://forum.suunto.com/topic/8511/vo2max-and-apple-health-sync , https://forum.suunto.com/topic/10138/sync-sleep-and-hrv-data-to-trainingpeaks .

**Withings:** https://support.withings.com/hc/en-us/articles/115013184128-Partner-Apps-What-is-Apple-Health and https://support.withings.com/hc/en-us/articles/203728916-Partner-Apps-Sharing-data-with-Apple-Health .

**Oura:** Apple Health integration https://support.ouraring.com/hc/en-us/articles/360025438734-Apple-Health-Integration (blocked).
HRV article https://support.ouraring.com/hc/en-us/articles/360025441974-Heart-Rate-Variability (blocked).
Membership https://support.ouraring.com/hc/en-us/articles/4409086524819-Oura-Membership and https://ouraring.com/membership (blocked).
Oura's public statement on cancelling https://x.com/ouraring/status/1453012242769846276 .
Australian pricing https://comparemates.com.au/guides/oura-ring-4-price-australia-review and https://www.recoveryguru.com.au/blog/where-to-buy-oura-ring-australia/ .

**Whoop:** Apple Health integration https://support.whoop.com/hc/en-us/articles/4413142119195-Apple-Health-Integration .
Cancelling https://support.whoop.com/hc/en-us/articles/360023473753-Canceling-Your-Membership .
What actually exports https://www.dcrainmaker.com/2022/04/exporting-health-actually.html (blocked).
Terms of sale https://www.whoop.com/us/en/whoop-terms-of-sale/ .
Hardware sold separately in Australia and Spain https://www.notebookcheck.net/Whoop-decouples-health-wristband-from-subscription-at-least-in-one-market.1305428.0.html , https://www.trustedreviews.com/news/whoop-removes-the-health-band-from-the-subscription-with-a-catch , https://wearablexp.com/news/whoop-pricing-update/ , https://arnav.au/2026/08/12/whoop-subscription-australia-what-it-costs-and-which-tier-is-worth/ .
Upgrade-fee backlash https://techcrunch.com/2025/05/11/fitness-tracker-whoop-faces-unhappy-customers-over-upgrade-policy and https://www.techradar.com/health-fitness/fitness-trackers/whoop-has-broken-a-promise-on-free-hardware-upgrades-and-users-arent-pleased .

**Fitbit / Google Health:** https://9to5mac.com/2026/08/03/google-health-adds-two-way-apple-health-syncing-on-iphone/ and https://www.macrumors.com/2026/08/03/fitbit-apple-health-syncing/ .

**Amazfit / Zepp:** https://apps.apple.com/us/app/zepp/id1127269366 (blocked) and https://sahha.ai/integrations/amazfit/ .

**Xiaomi:** https://www.mi.com/global/support/faq/details/KA-230360/ and https://www.mi.com/global/support/faq/details/KA-592800/ .

**Ultrahuman:** https://www.ultrahuman.com/blog/how-to-access-your-hrv-data-on-apple-health/ .

**RingConn:** https://ringconn.com/blogs/guides/how-sync-health-and-sleep-tracker-data .

**Circular:** https://apps.apple.com/mx/app/circular-ring/id1583942047 (blocked). Nothing established.

**Wahoo:** https://www.wahoofitness.com/fitness-apps and https://www.wahoofitness.com/wahoo-app-subscription .

**Eight Sleep:** https://sahha.ai/integrations/eight-sleep/ , https://www.eightsleep.com/app-terms-conditions/ , https://the5krunner.com/2026/04/30/eight-sleep-autopilot-4/ .

**Sleep Cycle:** https://support.sleepcycle.com/hc/en-us/articles/207388435-Does-Sleep-Cycle-support-the-Apple-Health-app and https://support.sleepcycle.com/hc/en-us/articles/206704909-Sleep-Cycle-Freemium-vs-Premium-Features .

**AutoSleep and HeartWatch:** https://apps.apple.com/au/app/autosleep-watch-sleep-tracker/id1164801111 , https://apps.apple.com/au/app/heartwatch-heart-rate-monitor/id1062745479 , http://autosleep.tantsissa.com/ , https://www.gearbrain.com/apple-watch-health-apps-2621654369.html .

**Training Today:** https://apps.apple.com/us/app/training-today/id1507992127 , https://trainingtodayapp.com/ , https://trainingtodayapp.helpscoutdocs.com/article/80-getting-started-with-training-today , https://www.advnture.com/news/training-today-app-lanching-bespoke-running-workouts-for-apple-watch-users .

**Welltory:** https://welltory.com/devices/apple-watch-hrv-app/ , https://apps.apple.com/us/app/welltory-heart-rate-monitor/id1074367771 .

**Cardiogram:** https://www.macrumors.com/2019/01/30/cardiogram-apple-watch-premium-service/ , https://appleinsider.com/articles/19/01/30/cardiogram-premium-enables-remote-cross-platform-monitoring-of-apple-watch-and-wear-os-data .

**Market:** https://rockhealth.com/insights/whats-your-score-insights-on-wearables-and-connected-devices-from-rock-healths-2025-consumer-adoption-survey/ , https://www.fiercehealthcare.com/health-tech/health-wearable-ownership-33-past-decade-rock-health-survey , https://www.healthcaredive.com/news/wearable-connected-device-health-ownership-increase-rock-health/821925/ , https://www.pewresearch.org/short-reads/2020/01/09/about-one-in-five-americans-use-a-smart-watch-or-fitness-tracker/ , https://www.telstrawholesale.com.au/wholesaleconnect/category/technology/AU_Smartwatch_Trend_MVNOs.html , https://www.telsyte.com.au/announcements .

**Forums and rules:** https://gummysearch.com/r/whoop/ (blocked) , https://subredditstats.com/r/AppleWatch (not fetched) , https://www.community.whoop.com/t/quit-membership/7862 , https://redship.io/blog/reddit-self-promotion-rules , https://founderreply.com/guides/reddit-self-promotion-rules .

**In-repo:** `docs/COMPETITIVE_REVIEW_3.md` (verified AU App Store prices and
privacy labels, 7 Sep 2026), `docs/MONETISATION.md`, `docs/PRIVACY.md`,
`src/features/health/healthkit.ts`, `src/features/health/readiness.ts`,
`src/features/health/bodyEntries.ts`, `src/features/health/sleepDebt.ts`.

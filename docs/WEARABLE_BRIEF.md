# The wearable door — how to position it on the website

Written 2026-09-07 for the website session. The verified device matrix,
market sizing and forum map are being researched separately and land in
`docs/WEARABLE_POSITIONING.md`; nothing here depends on them except the
device list, which is marked where it goes.

## The insight

Every recovery product ends at a number. Whoop gives a recovery score,
Rise a sleep debt and an energy schedule, Athlytic "translates data into
actionable insights", Gentler Streak suggests going gentler, Bevel shows
recovery and strain. Verified across the category in
`docs/COMPETITIVE_REVIEW_3.md`: not one of them changes what the day
asks of you. Column 12 of that matrix, written app by app, says the same
thing five times — what IntentNorth does that they cannot is
**everything after the number**.

That is the position. Not "we work with your band". The band works fine.
The gap is that nothing you own does anything with what it tells you.

## Why this is the same story, not a second one

`docs/PROBLEM_STATEMENT.md` says the problem is the distance between
hearing good advice and living it: you hear it on a podcast, it is
brilliant, and it is gone by Tuesday. The wearable version is that
problem with a different input. Your ring measured a bad night with more
precision than a lab had twenty years ago, and then you went to work and
did the same day anyway.

So this is not a new brand, a new hero or a new promise. It is a second
**door** into the same house. The podcast door and the band door open on
the same room.

## Where it goes on the site

**Not the hero.** The hero must work for the person with no device, and
that is the larger market. Leading with wearables narrows us to the
quantified-self buyer and drops everyone the markets document is actually
about.

**A door, in three places:**

1. **One section on the home page**, below the fold, after the app is
   explained. Headline, three lines, one link.
2. **A page of its own**, `/works-with-what-you-wear` or similar, that
   can be linked from a forum reply, an App Store listing line, or a
   search result without any other context.
3. **The App Store listing**, one line in the description. See the
   caution below about naming other companies' products.

## The copy

**Headline.** Your ring already knows. Your Tuesday doesn't.

**Sub-line.** Whatever you wear writes to Apple Health. IntentNorth reads
it and changes what today asks of you: the session, the evening, the
order things happen in. Nothing else you own does anything after the
number.

**The three lines under it.**

- A short night backs off today's session, and the session says why.
- Read against your own normal from the last fourteen days, never a
  population band you were never in.
- No new device, no second subscription, no account. Nothing you enter
  leaves your phone.

**The section that earns the trust: what we read, and what we don't.**

We read seven things from Apple Health and nothing else: how long you
slept, resting heart rate, heart-rate variability, cardio fitness, body
weight, height, waist. We never write to Health. We do not read your
messages, your location or your workouts blow by blow.

We do not replace the app your band came with. It measures; we decide
what the day does about it. If you stop wearing the band, the plan keeps
working — it just stops adapting to the nights.

**Which devices, verified.** The full matrix is in
`docs/WEARABLE_POSITIONING.md`; the three families worth naming are Apple
Watch, Garmin through Garmin Connect, and Withings. Sleep and resting
heart rate are close to universal across the matrix, and those two alone
drive the short-night back-off and the resting-heart-rate reading. Do not
write "works with any wearable".

**The trap in the copy, and it is a big one.** Oura and Whoop compute
heart-rate variability as RMSSD; Apple Health stores it as SDNN. Neither
writes HRV to Apple Health at all. So "works with your Oura HRV" is
false, and any line that leads on heart-rate variability quietly excludes
the two brands most likely to read the page. **Lead on sleep and resting
heart rate.** Apple Watch is the only device that reliably fills all four
of sleep, resting heart rate, HRV and cardio fitness; Garmin withholds
cardio fitness deliberately; Withings is the only non-Apple family found
that sends cardio fitness as well as weight.

## What must not be said

These are firm. The app's whole claim is honesty about evidence, and one
loose line here costs more than the traffic it wins.

- **Never "buy the device and cancel the subscription."** Verified:
  Whoop's own cancellation page says that once cancelled you cannot
  "collect, upload, or analyze any of your biometric data", so nothing
  reaches Apple Health and the band is jewellery. Oura is worse for us,
  not better: its Apple Health integration is listed as needing an active
  membership, so cancelling likely kills the exact sync we depend on.
  Beyond being false, App Review 2.3.1 makes misleading marketing grounds
  for removal and account termination. The honest line is stronger
  anyway: no second subscription of ours, and no new hardware.
- **Never "replaces your Whoop / Oura / Garmin."** It does not. It needs
  them to keep writing to Health.
- **Never imply we compute anything from raw sensors.** We read what the
  device wrote. Say "reads" and never "measures".
- **Never name a device we have not verified.** The research doc is the
  only source for that list.
- **Never "the only app that reads your band and changes the plan."**
  Training Today does read Apple Health, compute readiness and prescribe
  a session. It is running only, so the defensible claim is about the
  whole week rather than about being alone: nobody else decides between
  the session and the family dinner from the same night.
- **Nothing medical.** No diagnosis, no interpretation of a heart
  measure as a health finding, no "overtraining" claims. Readiness
  changes a session; that is all it does.
- **On the App Store listing**, naming other companies' products in the
  app name or keyword field is a trademark problem. Keep the listing to
  "works with Apple Health" and let the website name devices.

## The size of it

Rock Health's 2025 Consumer Adoption Survey, 8,000 US adults fielded in
December 2025: 46% own a wearable and 83% of those wear it five or more
days a week. For Australia the only figure found is Telsyte's 2023
smartwatch ownership at 36%, three years old, so treat it as a floor and
do not quote it as current. The share of owners paying a separate
subscription is not sourced and must not be invented; what is real is the
dated backlash — Garmin's Connect+ paywall, Whoop's 2025 upgrade fee,
Polar's paid programme.

## The forums

Isaac wants to participate. The honest way in is not a pitch, it is the
question those communities ask constantly and nobody answers well: *what
do I actually do with my recovery score?* A reply that answers it usefully
for someone who never installs anything is the only kind worth posting.
Community rules, sizes and where a founder may identify themselves are in
the research doc; read them before posting, and disclose every time.

## The build that makes the strongest claim true

Today the app reads only the most recent reading from Apple Health, so a
person with two years of ring history still waits fourteen days for a
baseline, exactly like someone with no device. That is being fixed: the
first sync reads back about sixty days, so a real baseline exists on the
first morning.

**Do not publish the day-one claim until that ships.** Once it has, the
line is: *your ring has been learning your normal for two years, and
IntentNorth reads that history on the first morning rather than starting
you at nothing.* That is the sentence no competitor in the category can
write, because they all start their own clock the day you install them.

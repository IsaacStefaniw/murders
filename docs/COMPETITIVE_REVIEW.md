# Competitive review — where IntentNorth stands, and what to build next

Written 2026-09-04 from a full sweep of the codebase (47,139 lines of
source, 79 test files, 29 routes) and the current state of the apps people
will compare us with. Every internal claim below has a file behind it;
every competitor claim has a source at the end.

## 1. What we have that nobody else does

- **Arbitration across seven domains.** Training, food, sleep, habits and
  urges, work, money, relationship and family from one profile, placed
  into a real week and re-laid when it changes (`src/lib/scheduling/engine.ts`,
  `src/features/planner/`). Sunsama and Motion plan tasks; Whoop and Rise
  read one signal; Fitbod builds one workout. None of them decide between
  the gym and the school run.
- **The evidence is graded and the safety is written down.** 177 protocols
  across nine pillars, each A–E with the public work behind it and 145
  safety lines (`src/features/knowledge/protocols.ts`). No competitor
  shows its evidence grade.
- **The load rule you can read** and blocks that rebuild on "too easy"
  (`src/features/training/programme.ts`). Fitbod adapts, but opaquely.
- **Nothing leaves the phone, and the hardest moment is free.** No account,
  no analytics, no server (`docs/PRIVACY.md`, `src/features/plus/entitlement.ts`).
  Every competitor above has an account and most have a data broker in
  the privacy label.
- **Anatomy gating, bedtime bounds, the week-shape interview** — details
  nobody else has, all with tests.

## 2. What the market treats as table stakes and we do not have

| Expectation | Who set it | Us today | Cost to close |
|---|---|---|---|
| Sleep debt and a daily energy curve | Rise ($69.99/yr) | Readiness from HRV/RHR/sleep hours (`src/features/health/readiness.ts`); no debt model, no energy curve | JS only. We already read sleep from Apple Health. |
| Recovery-matched exertion target for today | Athlytic, Whoop, Gentler Streak | Readiness regulates the session's accessories only | JS only if we add Apple Health workout/heart-rate reads (same library, more types). |
| Home-screen widget, lock-screen widget | Every app in this category | None (zero occurrences) | Native target. New build. |
| Live Activity / Dynamic Island rest timer during a session | Hevy, Strong, Fitbod | None | Native target. New build. |
| Siri / Shortcuts ("log a set", "start a reset") | Hevy, Streaks | None | App Intents. New build. |
| Apple Watch logging | Hevy, Strong, Gentler Streak, Athlytic | None | Watch target. Large. |
| Reads the device calendar | Motion, Reclaim, Sunsama, Structured | Provider interface exists, always returns nothing (`src/lib/calendar/provider.ts`) | `expo-calendar`. New build. |
| Learned time estimates ("this usually takes 42 min") | Sunsama | Adaptation reads logged actuals (`src/lib/scheduling/adaptation.ts`) but never shows the estimate | JS only. |
| Carry-over ritual: yesterday's unfinished into today | Sunsama | Unresolved items are asked about, not carried | JS only. |
| Adaptive expenditure from weigh-ins and intake | MacroFactor | Three-week weight trend, no intake (by design) | Not planned; we chose not to log food. |
| Social accountability | Hevy, Strava | Household share by text only | Needs accounts. Later. |
| Free first year / long trial | Balance | None, by decision | — |
| Android | All | iOS only in practice (HealthKit, StoreKit, EAS profiles) | A strategy decision, not a feature. |

## 3. Technical debt the sweep found (fix before growth)

- **Persisted state grows without bound.** `plans` keeps every day forever;
  `behaviourEvents`, `reflections`, `workoutLogs`, `goals`, `suggestions`,
  `questionLog` are never trimmed. Every write serialises the whole tree
  to one AsyncStorage key. A year of use is ~2,500 plan items and a slow
  save on every tap. Add pruning of plans older than 90 days (keep the
  derived weekly rows) and cap the logs. JS, OTA-able, one afternoon.
- **No persist `version` and no `migrate`.** Schema changes are patched in
  `onRehydrateStorage`. One bad shape change bricks a launch. Add the
  version now while the number is 1.
- **Telemetry has eight events and three call sites.** `interview_started`,
  `interview_finished`, `first_insight_seen`, `week_ended`, `coach_opened`
  are declared and never emitted. When the endpoint exists there will be
  no funnel. JS.
- **Notification taps go nowhere.** Payload data is passed and never
  consumed; no deep-link handling for the `intentos` scheme. JS.
- **No automatic update check on launch**; updates apply only when the
  person opens Settings. JS, one line.
- **Two screens load without a spinner** (paywall, meditation voices);
  one screen in the app shows a loading state. JS.
- **Two session types have no modality entry** (`business_review`,
  `meal_plan`). JS.
- **No CI runs tests, lint or typecheck**; only release workflows. A
  GitHub Actions job on push, ten minutes.
- **A 2.8 MB `web-preview.html` and a `dist/` directory are checked in.**

## 4. Ranked enhancements

Scored on impact for the person, effort, and whether it needs a new build.
"OTA" means it ships to build 16 over the air with no review.

### Tier A — ship over the air before or right after launch

Status 2026-09-04: items 1, 3, 5, 6 and 7 built and pushed (commits 83b0669,
02e2700 and the wiring commit). Item 2 waits on two Apple Health read
types, which is 1.1. Item 4 needs actual durations, which the workout
session now records; the "usually" line follows once a few exist.
Held from the production channel until Apple approves 1.0.
1. **Sleep debt and the energy curve** from the sleep we already read:
   need estimate from a rolling 14-day window, debt = need − actual over
   the last 14 nights, and a morning/afternoon/evening energy shape from
   wake time. Today shows "Sleep debt 3h 20m" and places deep work at the
   peak. This is Rise's whole product, as a feature. JS.
2. **Exertion target for today** from readiness: "Recovery is low — keep
   today's session at the main lift only" is already what the regulation
   does; say it as a target and show yesterday's exertion from Apple Health
   workouts. Adds two Health read types. JS.
3. **State hygiene**: plan pruning, log caps, persist version + migrate.
   Invisible to the person, prevents the slow-app review in month three.
4. **Learned durations on every row**: "usually 42 min" from logged
   actuals, and the plan uses it. Sunsama charges $192 a year for this.
5. **Carry-over at morning setup**: yesterday's unresolved items offered
   as one tap into today.
6. **Wire the five missing funnel events**, notification tap routing, the
   launch update check, the two spinners, the two modality entries.
7. **CI on every push**: typecheck, lint, tests.

### Tier B — the 1.1 native batch (one build, one review)
8. **Widgets**: lock screen "next up at 5:45pm", home screen readiness and
   sleep debt, Control Center "Two-minute reset". `@bacons/apple-targets`
   with SwiftUI reading a shared App Group JSON the app writes.
9. **Live Activity** for the workout rest timer and the breathing session.
10. **App Intents**: "Log a set", "Start a two-minute reset", "What's next",
    which also surfaces the app in Spotlight and Siri.
11. **Device calendar read** through the existing provider interface, so
    meetings become fixed blocks. Read-only, same privacy story.
12. **App Clip**: the two-minute reset from a QR code, free, no install.
13. Already planned: press-and-hold drag (done, holding OTA until
    approval), `.ics` partner invite.

### Tier C — strategic, decide rather than drift
14. **Apple Watch**: logging on the wrist and live heart rate. Large;
    only after widgets prove the demand.
15. **Partner sync and accounts**: the household feature wants it; it
    breaks "no account". If ever, iCloud private database (CloudKit) keeps
    "no server of ours" true. Not before 1.2.
16. **Android**: today the product is iOS. Say so on the site until a
    Health Connect and Play Billing plan exists.

## 5. Pricing, checked against the field

Rise $69.99/yr; Whoop $239/yr; Bevel Pro $99.99/yr; Gentler Streak
$8.99/mo; Fitbod ~$16/mo; Hevy ~$3/mo; Sunsama $192/yr; Balance free for
a year. IntentNorth Plus at AU$89.99 (~US$60) a year sits under Bevel and
Sunsama and above the single-purpose trackers, for seven coaches. The
price holds. What it needs is the widget and the sleep debt, because those
are what a person sees every day without opening the app.

## 6. What to say louder

Evidence grades on screen. The safety lines. The load rule in words. The
anatomy and bedtime rules. "We never charge for someone's hardest moment."
And the arbitration itself: the day that shows what it moved and why.

## Sources

- Rise, Whoop, Oura comparison: https://www.risescience.com/blog/whoop-vs-rise-sleep-app ; https://www.asianefficiency.com/technology/best-ai-sleep-tracking-apps/
- Athlytic, Bevel, Gentler Streak: https://www.healthappinsider.com/en/comparisons/athlytic-vs-bevel-vs-gentler-streak ; https://www.healthappinsider.com/en/reviews/gentler-streak-review
- Hevy, Strong, Fitbod, JuggernautAI: https://www.sensai.fit/blog/hevy-vs-strong-vs-fitbod ; https://fitbod.me/blog/best-workout-tracker-apps-for-2026/
- Sunsama, Motion, Reclaim: https://efficient.app/apps/sunsama ; https://toolfinder.com/comparisons/motion-vs-sunsama
- Fabulous, Streaks, Finch, Bearable: https://productive.fish/blog/habit-tracking/ ; https://habitbox.app/blog/finch-app-review
- Headspace, Calm, Balance, Waking Up: https://neurosity.co/guides/calm-vs-headspace-vs-waking-up-2026
- MacroFactor, Noom: https://macrofactor.com/ ; https://calorierankings.com/reviews/noom/
- Australian budgeting apps: https://www.mozo.com.au/fintech/the-seven-budget-and-savings-apps-every-aussie-needs
- Cozi: https://www.usecalendara.com/blog/cozi-review-2026
- iOS 26 App Intents, widgets, Live Activities: https://developer.apple.com/videos/play/wwdc2026/343/ ; https://blakecrosley.com/blog/ios-26-widget-and-control-surface
- Expo widgets and Live Activities: https://expo.dev/blog/home-screen-widgets-and-live-activities-in-expo ; https://github.com/EvanBacon/expo-apple-targets
- Retention benchmarks: https://adapty.io/blog/health-fitness-app-subscription-benchmarks/ ; https://sahha.ai/blog/health-app-churn-retention/

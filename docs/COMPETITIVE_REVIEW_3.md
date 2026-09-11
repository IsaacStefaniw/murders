# Competitive review, third sweep — the verified pass

Written 2026-09-07 against `docs/archive/COMPETITOR_REVIEW_BRIEF.md`, from a session
that could reach apps.apple.com/au, every vendor site that allows fetching,
and the vendors' help centres. It does not restate
`docs/archive/COMPETITIVE_REVIEW.md` or `docs/archive/COMPETITIVE_REVIEW_2.md`; section 5
says, cell by cell, where they were wrong.

**What this pass could and could not do.** Every price below is the one the
Australian App Store lists as an in-app purchase on 7 Sep 2026, in A$, or the
vendor's own page where the app has no App Store purchase; the source is
tagged. No app was installed: this session has no iPhone, so the "first
three days as a paying user" the brief asked for was not possible. The
dimensions that need it (time to first value, day two, the bad day, a month
in without paying) are filled from the vendor's own description of the
product and marked **U** (unverified) unless the App Store listing states
them. No trial was started, no card entered, nothing was edited outside this
file.

Source tags: **[S]** apps.apple.com/au listing; **[V]** vendor site or help
centre (URL in section 6); **[V-snip]** vendor URL that returned 403 to a
fetch, so the fact is the search-engine snippet of that URL; **[3rd]** a
third-party figure, unverified; **U** unverified.

---

## 1. The matrix

Eight categories, twelve dimensions, one row per app. The twelve dimensions
are numbered as in the brief: 1 five-second test, 2 time to first value,
3 day two, 4 a bad day, 5 what is free, 6 the paywall, 7 single-feature
pricing, 8 a month in without paying, 9 evidence on screen, 10 privacy,
11 what it does better than IntentNorth, 12 what IntentNorth does that it
cannot. IntentNorth's own row closes each table, from the code at the
branch head.

### Whole-day planners

| | Sunsama | Motion | Reclaim | Structured | Akiflow | IntentNorth |
|---|---|---|---|---|---|---|
| 1 Five-second test [S] | "Companion app to the desktop app… not a standalone replacement." A desktop tool with a phone view. | "Use AI to get work done 2x faster… plan your day, schedule meetings, manage projects." Work-team AI calendar. | **No iOS app exists.** Help centre 5 Aug 2026: "Reclaim doesn't have native mobile apps for iOS or Android today." [V] | "A visual daily planner to organize tasks, routines, and habits… plan your day in one clear timeline." | "The ultimate all-in-one planner, combining your calendar, tasks, and agenda into a single AI-powered productivity tool." | Twelve questions, then Today with a reason on every line. |
| 2 Time to first value | Cannot start on the phone: "once you've planned your first day from the Sunsama desktop app" [S]. U for minutes. | Needs a subscription and a connected calendar before anything [S] "requires a Motion subscription". U | Web only; 14-day trial then Lite [V]. U | Free timeline usable on install [V]. U | U | Same sitting: interview, first insight, Today. |
| 3 Day two | Rollover ritual [V, sweep 2]. U | Auto-rescheduled tasks [V, sweep 2]. U | Habits re-placed [V]. U | Replan is Pro [V]. U | U | Plus card appears; morning check-in carries yesterday's leftovers; readiness reads last night. |
| 4 Bad day | Handled by hand at shutdown [V]. U. Reads no sleep. | Silent reschedule [V]. U. Reads no sleep. | Habit moves inside window or drops [V]. U | Replan prompt [V]. U | U | Short night or low own-baseline HRV: main lifts stay, accessories rest, reason written; a meeting on the walk moves the walk and Today names what won. |
| 5 Free | Nothing: "doesn't have a free forever plan and doesn't plan to" [V] | Nothing [V] | Lite: 5 agents, habits, 1 calendar, 1-week range [V] | Timeline, all-day tasks, subtasks, notes, widgets, energy monitor, "can always be downloaded and used for free" [V] | Nothing [V] | Interview, first insight, day's shape, every urge/reset/lapse tool, breathing and two-minute sits, five practices per area, full view of every coach, backup. |
| 6 Paywall | No App Store purchase [S]; web US$22/mo or US$17/mo billed yearly (US$204) [V]; 14-day trial, "doesn't ask for your credit card until your trial is over" [V] | IAP Monthly **A$69.99**, Annual **A$499.99** [S]; "Start your 7-day free trial today!" [S]; a US$1 card hold at signup [V] | Web: Starter US$10, Business US$15 per seat/mo annual; 14 days, no card, drops to Lite [V] | IAP Monthly A$4.99 / A$11.99, Yearly A$14.99 / A$29.99 / A$34.99, Lifetime **A$129.99** [S]; 3-day trial that converts unless cancelled 24 h before [V] | IAP Weekly A$7.99, Monthly A$24.99 / A$49.99, Yearly A$199.99 / A$399.99 [S]; 7-day trial [V] | A$14.99 / A$89.99 / A$249 [brief]; paywall after first insight; 7-day intro offer on annual is optional in App Store Connect (`docs/APP_STORE.md`). |
| 7 Single feature | None; "No lifetime deals" [V] | Credit top-ups only [V] | "Attendee User" packs US$8–32/mo [V] | None | None | None; app-wide entitlement. |
| 8 Never pays, a month in | Locked out [V] | Locked out [V] | Lite forever [V] | Free planner keeps working [V] | Locked out [V] | Day's shape, urge tools, library titles; nothing degrades (`docs/archive/USABILITY_REVIEW.md`, month-in screens). |
| 9 Evidence | None [V] | None [V] | None [V] | None [V] | None [V] | A–E on every practice, source named, safety line. |
| 10 Privacy [S] | Data Linked to You: email, user content, identifiers, usage, diagnostics; account required | Linked: email, name, usage, crash; Not Linked: device ID for third-party ads; account required | n/a | Linked: email, user content; Not Linked: purchases, user ID, usage, diagnostics, photos; account not stated | Linked: email, name, usage, diagnostics, emails or text messages, user ID | Device ID only, not linked (`docs/APP_STORE.md`); no account. |
| 11 Better than us | Planned-vs-actual time on every task [V] | Reads the real calendar, reschedules in seconds [V] | Habit rule with ideal time and window on the real calendar [V] | Timeline, widgets and Live Activities free [S,V] | Calendar, tasks and agenda in one desktop-class tool | |
| 12 We do that it cannot | Place a gym session, a family dinner and a protein anchor in one evening from a profile, no account | Read last night's sleep and change the session; hold a free fraction of the day | Name what lost the hour; bedtime and deadline bounds; ranked areas | Build the day from a profile rather than typed tasks | Decide between domains at all | |

### Training

| | Hevy | Strong | Fitbod | JuggernautAI | Boostcamp | IntentNorth |
|---|---|---|---|---|---|---|
| 1 Five-second test [S] | "Join +10 million users! Hevy is the most intuitive workout tracker & planner… No ads and free." | "The most intuitive workout and exercise tracker for any fitness routine… join over 1.2 million people." | "Build muscle, gain strength and lose weight with a customized workout plan just for you… personalized AI workouts." | "Subscribe to JuggernautAI to access all our coaching… like having the best strength coach in the world with you." 18+. | "Garage Gym Reviews' Best Workout App Overall 2026… Free workout tracker + AI coach." Subtitle reads as a keyword string: "Anytime Pure Health: The Gym". | A four-week block from your own lifts, the load rule in words. |
| 2 Time to first value | First set in minutes; free [S]. U | Minutes; free with 3 routines [S] | After trial start; needs 10–15 workouts to personalise [V, sweep 2]. U | Subscription first [S]; 14-day trial via website, not the store [S dev reply] | Free programs on install [V]. U | Block built at the end of the interview. |
| 3 Day two | Next routine [V]. U | Next routine [V]. U | Muscle recovery percentages [V]. U | Readiness rating feeds the day [V]. U | U | Next session, with readiness read from Apple Health. |
| 4 Bad day | Logs what you did [V] | Logs what you did [V] | Skipped session raises recovery %; short night does nothing [V, sweep 2] | Typed readiness lowers the session [V] | U | Short night or low HRV vs own 14-day median changes the session and says so (`autoRegulate`). |
| 5 Free | Unlimited logging, routines, rest timer, charts, Watch, web [V]; "No ads and free" [S] | Unlimited workouts, 3 custom routines [S]; "ALWAYS be able to use the free version" [V] | Nothing stated [V] | Nothing [V] | "11,000+ programs are free", full tracker, RPE/RIR, plate calculator, weekly reports [V] | As above. |
| 6 Paywall | IAP Monthly A$4.99 / A$6.49, Yearly **A$38.99**, Lifetime **A$119.99** [S]; trial unknown | IAP 1 Month A$7.49, 6 Months A$27.49, 1 Year A$32.99 / A$44.99 / A$45.99, Forever A$129.99 / A$149.99 [S]; description still quotes stale "$4.99/month or $29.99/year" [S]; trial unknown | IAP Monthly A$19.99 / A$24.99, Year A$119.99 / A$149.99; legacy A$11.49–A$91.99 [S]; "After your free trial has ended…" [S]; 7-day trial [V] | IAP Monthly **A$50.99** only; no annual on the AU page [S]; web US$34.99/mo, US$349.99/yr, 2-week trial void if a coupon is used [V] | IAP A$7.99 to A$129.99, no period names shown [S]; web US$14.99/mo, US$59.99/yr; 7-day trial on the annual plan only [V] | A$14.99 / A$89.99 / A$249. |
| 7 Single feature | Hevy Coach, a separate trainer platform with its own 30-day trial [V] | None | None | None | None | None. |
| 8 Never pays | Full logger forever [V] | 3 routines forever [S] | Locked out after trial [V] | Locked out [S] | Free library and tracker [V] | Nothing degrades. |
| 9 Evidence | None; blog cites Schoenfeld [3rd] | None | Blog references sections; no grade [V] | Blog only [V] | "Methodology Library", descriptive, no citations [V] | A–E, source, safety. |
| 10 Privacy [S] | Linked: purchases, usage, contact, contacts; Not Linked: identifiers, sensitive info, diagnostics | Linked: health & fitness, purchases, email, identifiers, crash | **Tracks** usage; Linked: health & fitness, email, name, identifiers, advertising data | **Tracks** purchases, identifiers, usage, diagnostics; Linked: email, name | **Tracks** identifiers; Linked: user ID, device ID; Not Linked: coarse location, email, name | Device ID, not linked; HealthKit read on-device. |
| 11 Better | Live Activity rest timer, Watch [V, sweep 2] | Three taps a set on the wrist [V] | Muscle-by-muscle recovery map, exercise variety [V] | Set-by-set auto-regulation from RPE [V] | 11,000 free programs [V] | |
| 12 We do that it cannot | Decide the session from baseline, sleep and minutes, and say why | Swap a session or exercise and keep the pattern (`swap.ts`), and since this branch rotate the rest of the week | Change today's session on a short night | Read readiness from Apple Health without typing; the rest of the week | Place the session in a day that has a school run in it | |

### Recovery and readiness

| | Whoop | Rise | Athlytic | Gentler Streak | Bevel | IntentNorth |
|---|---|---|---|---|---|---|
| 1 Five-second test [S] | "The leading wearable that turns comprehensive health insights into daily action." No subtitle. "requires a WHOOP wearable." | "Become a better sleeper thanks to 100 years of sleep science. Teams in the NFL, MLB, NBA…" | "Athlytic takes all the data that your Apple Watch collects and translates it into actionable insights. RECOVERY… TARGET EXERTION…" | "An award-winning health and fitness tracker offers personalized guidance that adapts to your daily capabilities… Built with care by a small indie team." | "The #1 app for improving your health, performance, and longevity… backed by science." | Readiness against your own fourteen-day normal, and the day changes. |
| 2 Time to first value | Days of band data [V]. U. **"try both the wearable and app free for 1 month"** [S] | After a two-minute sleep quiz in-app [V-snip]. U | Immediately from existing Watch data [S]. U | Immediately from Health data [S]. U | U | Same sitting. |
| 3 Day two | Recovery and strain target [V]. U | Sleep debt and energy schedule [V]. U | Recovery score and target exertion [S] | Go Gentler suggestion [V]. U | U | Readiness card with sleep debt and energy shape (`sleepDebt.ts`). |
| 4 Bad day | Red recovery, lower target [V] | Dips move, debt grows [V] | Low target [S] | Rest suggested, streak survives [V] | U | Session changes, reason written. |
| 5 Free | Nothing without the band; one free month [S] | Nothing stated [V] | "unknown" on vendor; recovery score free [3rd, sweep 2] | Tracking, progress bar, widgets, streak [3rd] | "Any feature included in Free today will always remain free": recovery, sleep, strain, stress, nutrition, fitness, monitors, cycle, journal, AI food logging [V] | As above. |
| 6 Paywall | No App Store purchase [S]. Vendor AU pages 403; snippet: One A$299, Peak A$399–419, Life A$599 a year, auto-renews [V-snip]; sweep 2's A$299/419/629 [3rd] | IAP Sleep & Energy Premium **A$119.99** (tagged "Free Trial"), Membership A$14.99 / A$50.99 / A$85.99 / A$99.99 / A$149.99 [S]; 7-day trial [V] | IAP Monthly **A$7.99**, Yearly **A$45.99** [S]; "1 week free" [S]; "No lifetime unlocks" [V] | IAP Monthly A$13.99, Yearly A$59.99, Lifetime A$99.99 / A$149.99 / A$209.99 / A$299.99, Family Yearly A$54.99–109.99 [S]; ~7-day trial [3rd] | IAP Monthly **A$22.99**, Annual **A$149.99**, plus Intelligence credit packs A$7.99–79.99 [S]; trial "may vary" [V] | A$14.99 / A$89.99 / A$249. |
| 7 Single feature | Advanced Labs add-on, US only [V-snip] | **"AI Expert Access" A$49.99** sold beside the membership [S] | None | None | Consumable AI credit packs beside the subscription [S] | None. |
| 8 Never pays | No app without a membership [S] | Locked [V] | Recovery score free [3rd] | Free tracking forever [3rd] | Free tier forever, promised in writing [V] | Nothing degrades. |
| 9 Evidence | "science-backed", press releases on its own studies; no grade [V-snip] | "100 years of sleep science"; science page has no linked studies [V] | Help docs: "Studies suggest…", unnamed [V] | unknown | "backed by science", no page found [V] | A–E, source, safety. |
| 10 Privacy [S] | Linked: health, location, contact, content, identifiers, usage, sensitive info, diagnostics, other, across advertising and analytics | **Tracks** identifiers; Linked: health, contact, financial info, product interaction | **"Data Not Collected"** — the only app in the set | Not Linked only: coarse location, purchases, identifiers, usage, diagnostics | **Tracks** identifiers; Linked: device ID, location, email, name, user ID; Not Linked: health, fitness | Device ID, not linked. |
| 11 Better | Continuous strain and the live target [V] | The energy schedule as a picture; chronotype [V] | Exertion target from continuous heart rate, no account, no data collected [S] | The tone; a streak that forgives [V] | Free tier breadth and a written promise not to move it [V] | |
| 12 We do that it cannot | Turn the reading into a changed session placed in a real day | Change training and the evening from the same night | Everything after the number | No streak at all on the practices that must never have one; a session that changes | Decide between the gym and the family dinner | |

### Habits and urges

| | Fabulous | Streaks | Finch | I Am Sober | Reframe | Pelago (ex Quit Genius) | one sec | IntentNorth |
|---|---|---|---|---|---|---|---|---|
| 1 Five-second test [S] | "Welcome to the world of Fabulous. Unlock the power of habits and routines." | "The to-do list that helps you form good habits. Apple Design Award winner." | "Meet your new self-care best friend!… Take care of your pet by taking care of yourself!" | "More than just a free sobriety counter app… a wide network of people all striving for the same goal." Category Lifestyle. 18+. | "The #1 alcohol reduction app… core 160-day, evidence-based, education program." 18+. | "Virtual support for those looking to rethink their habits with alcohol, tobacco, opioids, or cannabis"; activate through your employer. | "Willpower is not enough against social media algorithms! … app usage drops by 57% on average!" | The urge tool is free forever and the practice lands at the hour the urge usually comes. |
| 2 Time to first value | After a long quiz [V, sweep 2]. U | Minutes; paid up front [S] | Minutes [S]. U | "create an account and declare your addiction" [S] | After 7-day trial start [S]. U | Employer link, log in [S] | Free for one app on install [S] | Same sitting; urge tools never gated. |
| 3 Day two | New letter or journey [V]. U | Chain count [V] | Pet's mood [V]. U | Pledge and counter [V] | Daily reading [V]. U | U | The interruption again [V] | Plus card; check-in; timed intervention before the usual window. |
| 4 Bad day | Not punished [V] | Streak resets to zero on a missed required day [V] | Bird is kind [V] | Asks how many times and resets the date [V] | U | U | U | A lapse is one event; never scored. |
| 5 Free | Limited [V]; templates on site | n/a, paid app | Core self-care: bird, goals, reflections, vibes [V-snip] | Counter and pledge; "free to use, but you can support development" [S] | Nothing stated [V] | Free to members via employer [V] | "one app of your choice… completely free" [S] | Every urge/reset/lapse tool, breathing, two-minute sits. |
| 6 Paywall | IAP A$27.99–A$91.99 across ten SKUs (Annual A$70.99, quarterly A$59.99, "Sphere: Annually 50% Off" A$91.99) [S]; trial exists, length not on page [V] | **Paid A$9.99, no IAP, no trial** [S] | IAP "Finch Plus" A$2.99–A$99.99, no period names [S]; "Finch Plus preview… you won't be charged when the preview ends, and there's nothing you need to cancel", activates after 3 days [V-snip] | IAP 1 Month A$13.99 / A$16.49, 6 Months A$36.99, 12 Months A$24.99 / A$54.99; cosmetic packs A$1.99 [S]; 7-day trial [3rd] | IAP Access A$19.99/mo, A$113.99/yr; Silver A$35.99/mo, A$174.99/yr; Premium A$149.99; Annual A$149.99–199.99 [S]; "Try Reframe FREE for 7 days" [S]; vendor: "$100 USD per year" [V] | Legacy Quit Genius SKUs A$14.99–A$229.99 still listed [S]; consumer pricing n/a, employer-paid [V] | IAP 1 Year **A$29.99**, 1 Month A$4.99, Lifetime **A$149.99**, Family A$7.99/mo, A$54.99/yr, A$229 life [S]; "1 week free trial" on Pro [V] | A$14.99 / A$89.99 / A$249. |
| 7 Single feature | Coaching inside Premium [V] | n/a | None | A$1.99 cosmetic packs [S] | "Thrive Coaching" add-on, price not on page [V] | n/a | None | None. |
| 8 Never pays | Limited [V] | n/a | Free core [V-snip] | Counter, one tracker [3rd] | Locked [V] | n/a | One app forever [S] | Nothing degrades. |
| 9 Evidence | "backed by behavioral science… Duke", no named studies [V] | None | None found [V] | None | "evidence-based" in listing; no citations page [S,V] | **Yes**: named peer-reviewed papers on a research page [V] | **Yes**: PNAS 2023, CHI 2024 and others on a research page [V] | A–E, source, safety. |
| 10 Privacy [S] | **Tracks** contact info; Not Linked: coarse location, name, email, usage | Not Linked: crash data only; no account | Linked: user ID, device ID; Not Linked: email, purchases, content, usage | Linked: email, photos/videos, identifiers, usage, diagnostics; account | **Tracks** identifiers; Linked: device ID; Not Linked: usage, location, email, name; subscription required | Linked: usage, health, name, email, support content | Not Linked: usage data only; no account | Device ID, not linked. |
| 11 Better | The first three days are tiny and deliberate [V] | Price; widget; Watch [S] | Warmth; a reason to open that is not a number [V] | Community; milestone calendar [V] | Depth of readings; community [V] | Clinician-backed, employer-paid [V] | Published RCT-grade evidence of its own effect [V] | |
| 12 We do that it cannot | Put the practice at an hour that fits the week | Refuse to count | A timed intervention 45 minutes before the usual hour, from the person's own log | Keep backup and every lapse tool free | Never charge for the urge moment; hold the urge tools beside training, family and money | Be bought by a person | Everything outside the screen-time interruption | |

### Mind

| | Headspace | Calm | Balance | Waking Up | IntentNorth |
|---|---|---|---|---|---|
| 1 Five-second test [S] | "Get happy. Stress less. Sleep soundly. Headspace is your guide to mindfulness… world-class experts like… Andy Puddicombe." | "The #1 app for Sleep, Meditation and Relaxation… recommended by top psychologists, therapists, and mental health experts." | "Improve your stress, sleep, and more with Balance's personalized guided meditation program… Each day, you'll answer questions." | "Recognized as a 2025 Pick by NYT Wirecutter… Waking Up is your complete guide." | Seven spoken meditations, guided breathing, placed at the hour the day has room for. |
| 2 Time to first value | Session one, free Basics [V, sweep 2]. U | Daily Calm free [V]. U | After the trial starts [S]. U | After the 7-day trial starts [V]. U | Two-minute sit free, same sitting. |
| 3 Day two | Session two [V]. U | Next Daily Calm [V]. U | Questions assemble the next sit [S] | Next lesson [V]. U | Sit placed in the day. |
| 4 Bad day | Nothing changes [V] | Nothing changes [V] | Nothing changes [V] | Nothing changes [V] | Wind-down placed against your own bedtime and sleep debt. |
| 5 Free | Not stated on fetched pages [V]; ten Basics sessions [3rd, sweep 2] | Free-content article exists, 403 [V]; Daily Calm and day one of courses [3rd] | "Try for free" only; **no "free first year" wording on the vendor page or the AU listing** [V,S] | Scholarship: "join Waking Up for free… no questions asked" [V] | Breathing, two-minute sits, five practices per area. |
| 6 Paywall | IAP Monthly A$19.99 / A$18.99, Annual **A$91.99** / A$101.99, Headspace Plus A$149.99, A$9.99 [S]; "Try Headspace Plus for free" [S]; 7-day monthly / 14-day annual, "You will not be charged until the trial is over" [V-snip]; description quotes stale UK £ prices [S] | IAP Calm Premium A$19.99–A$25.99 (monthly SKUs), **A$79.99 / A$99.99** (annual SKUs) [S]; 7-day web trial converts on Day 15 [V-snip]; lifetime US$499.99 web [V-snip]; description quotes US$ [S] | IAP Yearly **A$81.99**, Premium A$106.99 / A$114.99, Premium A$19.49 (monthly), Lifetime "75% off" **A$149.99** [S]; "Start your free trial" [S]; subscription page titled "Try Balance free for 30 days" [V] | IAP Monthly **A$29.99**, Yearly **A$229.99**, Family Yearly A$399.99 [S]; "Try 7 Days for Free" [V]; web US$19.99/mo, US$129.99/yr [V]; full refund "no questions asked" [V] | A$14.99 / A$89.99 / A$249. |
| 7 Single feature | Mental-health coaching sold as a separate service [V]; student A$9.99/yr [V] | None; lifetime only | None | None | None. |
| 8 Never pays | Basics and some breathing [3rd] | Daily Calm [3rd] | Unknown after trial | Scholarship or locked [V] | Nothing degrades. |
| 9 Evidence | Science page: "Studies show: Headspace works", no citations on the page [V]; articles cite press [V] | **Calm Health** lists ~13 named studies [V]; app store copy "recommended by top psychologists" | None found [V] | None [V] | A–E, source, safety. |
| 10 Privacy [S] | Linked: health, purchases, location, contact, content, search history, identifiers, usage, diagnostics | **Tracks** purchases, identifiers, usage; Linked: health, purchases, contact, search history, identifiers, usage, diagnostics | **Tracks** identifiers; Linked: purchases, email, name, user ID, device ID, usage | **Tracks** identifiers; Linked: purchases, location, contact, identifiers, usage, diagnostics, content | Device ID, not linked. |
| 11 Better | Voice and course design [V] | Sleep library [V] | Daily questions assembling the sit [S] | The teaching; the scholarship; the refund [V] | |
| 12 We do that it cannot | Place the sit at the hour the day has room for; level the practice from minutes logged | A wind-down against the person's own bedtime | Keep the two-minute reset free without a clock on it | Anything outside the sit | |

### Food without logging

| | MacroFactor | Noom | Dinnerly (AU) | HelloFresh (AU) | Cookidoo | IntentNorth |
|---|---|---|---|---|---|---|
| 1 Five-second test [S] | "Reach your diet goals with the smartest macro tracker and nutrition coach… dynamic algorithm to adapt to changes in your metabolism." | "Build healthy habits that last with Noom… without the pressure or guilt. Track steps." Subtitle carries "GLP-1s". | "Lip-smacking meal kits for less smackeroos… 20 recipes to choose from each week." | "The #1 meal kit app… 33+ delicious recipes available each week." | "Access to the growing universe of… Thermomix Guided Cooking recipes. Create an account and get cooking!" | A protein anchor sized from body weight, a plate shape, dinner decided once. |
| 2 Time to first value | 7-day trial, 2–3 weeks of data for expenditure [S,V]. U | 15–20 minute survey, price revealed only after it [V]. U | Account and delivery [S]. U | Account and delivery [S]. U | Thermomix login [S] | Same sitting. |
| 3 Day two | Waits for data [V] | Next lesson [V]. U | Menu [S] | Menu [S] | Recipe [S] | Dinner decided, walk after the biggest meal. |
| 4 Bad day | Nothing for a short night [V] | Nothing [V] | Nothing | Nothing | Nothing | The plan moves. |
| 5 Free | "does not offer a free subscription tier" [S] | Nothing stated [V] | App free; kits paid | App free; kits paid | Recipes need membership [S] | As above. |
| 6 Paywall | IAP Monthly A$14.49 / A$17.49, Semiannual A$68.99, Annual **A$86.99** / A$103.99, Bundle A$149.99 [S]; "start your 7-day trial" [S]; description prices "for US customers" [S] | IAP "Noom Program" A$64.99, A$69.99, A$149.99, A$189.99, A$199.99, A$239.99, A$309.99; Noom Pro A$14.99 [S]; "7-day trial available… billed up front" [V]; a review says 14 days [S]; AU price only after the survey [V] | No IAP [S] | No IAP [S] | One Year Membership A$99.99 / A$119.99 [S] | A$14.99 / A$89.99 / A$249. |
| 7 Single feature | None; free calculators on the web [V] | Noom Med / GLP-1 programs priced separately, US$129–299/mo [V] | n/a | n/a | n/a | None. |
| 8 Never pays | Locked after trial [S] | Locked [V] | n/a | n/a | n/a | Nothing degrades. |
| 9 Evidence | Algorithm-accuracy page: internal validation plus one cited systematic review; articles cite PubMed densely [V] | Research hub with 40+ peer-reviewed papers, named RCTs [V] | None | None | None | A–E, source, safety. |
| 10 Privacy [S] | Linked only: health, purchases, contact, content, identifiers, usage, diagnostics | **Tracks** purchases, financial info, location, content, identifiers, sensitive info; Linked: all of those plus health, surroundings | Tracks identifiers | Tracks purchases, location, identifiers, usage | Tracks usage | Device ID, not linked. |
| 11 Better | Adaptive expenditure model [V] | Lesson library; human coaches; published RCTs [V] | Cost per meal [S] | Recipe breadth [S] | Guided cooking on the machine | |
| 12 We do that it cannot | Decide dinner with allergens failing closed; the walk after the biggest meal | Change the plan when the week changes; state an evidence grade | Decide the week's dinners from a cooking-time answer | Same | Same | |

### Money, Australia

| | Frollo | WeMoney | Up | Raiz | Spriggy | Big-four goal features | IntentNorth |
|---|---|---|---|---|---|---|---|
| 1 Five-second test [S] | "Start feeling good about money with tools to help you get on top of your finances, save for a goal and pay off debt." Free, no ads. | "FIND SAVINGS AND CRUSH YOUR DEBT… a free Aussie app." | "Simplify Money, Amplify Life… Open an account in minutes and join over 1,000,000 Australians." | "Grow your wealth with Raiz. Join over 330,000 Aussies saving, investing." | "The family app for money, investing and online safety… Trusted by over 1.3 million members." | CommBank "Money plan" goals (needs a GoalSaver); NAB "virtual savings jars" (reviews say replaced by "savings spaces"); ANZ Plus multiple goals earning interest; Westpac shared goals (release notes) [S] | An ordered ladder: automate, one month buffer, expensive debt, three months, invest. |
| 2 Time to first value | After a CDR bank link [V]. U | After a bank link [V]. U | After opening an account [S] | After account and first deposit [V] | After account [S] | Existing customers only | Same sitting. |
| 3 Day two | Categorised transactions [V] | Credit score [V] | Savers [S] | Round-ups [V] | Kid's balance [S] | Balance | Money check-in placed in the week. |
| 4 Bad day | Nothing | Nothing | Nothing | Nothing | Nothing | Nothing | The check-in moves. |
| 5 Free | Everything: "No ads. No subscriptions. No catch." [S,V] | Most of it [S] | The account | Nothing: fees from the first dollar over A$1 balance [V] | Nothing: 7-day trial then a plan [V] | Free to customers | As above. |
| 6 Paywall | None [S] | IAP Pro Monthly **A$9.99**, Yearly **A$98.99** [S]; 7-day trial "before you're charged" [V] | None [S] | Lite A$2.50/mo, Regular from A$5.50, Plus from A$6.50; 0.275% p.a. above A$26–28k; 6-month fee rebate for new users depositing ≥A$30/mo [V] | Classic A$5, Plus A$7, Premium A$12 a month per family, billed annually; 7 days, "no payment details needed" [V] | None | A$14.99 / A$89.99 / A$249. |
| 7 Single feature | n/a | None | n/a | Plan tiers | Plan tiers | n/a | None. |
| 8 Never pays | Everything | Free tier | Account | Fees regardless | Locked after 7 days | n/a | Nothing degrades. |
| 9 Evidence | n/a | n/a | n/a | n/a | n/a | n/a | A–E on money practices too (Payday transfer A, Quarterly position check B). |
| 10 Privacy [S] | Tracks usage; Linked: purchases, financial info, contact, content, identifiers; account required | Tracks contact, identifiers; Linked: financial info incl. credit info | Linked only: financial info, contacts, content, identifiers | Tracks contact info; Linked: financial, contact, device ID | Linked: financial, location, contact, identifiers; no tracking | CommBank/NAB/ANZ Linked; Westpac Tracks identifiers and usage | Device ID, not linked; no bank link, ever. |
| 11 Better | The live picture across 100+ institutions, free [V] | Credit score and debt view [V] | The automation is real money moving [S] | The money is invested [V] | Kids' cards and goals [S] | The money is there | |
| 12 We do that it cannot | The ordered ladder with one step live and a weekly half-hour placed into the week; nothing to sell | Keep money as education with no product to sell | Work with whichever bank the person has | Refuse to skip the buffer before investing | Hold a household's money beside its training and its dinner | Same | |

### Family and relationship

| | Cozi | TimeTree | Skylight | Paired | Lasting | IntentNorth |
|---|---|---|---|---|---|---|
| 1 Five-second test [S] | "The surprisingly simple way to manage everyday family life… 3-time Mom's Choice Award Winner." AU listing spells "Organiser". | "App loved by 75 million users worldwide… Solve time management issues of double-booking." | "The operating system for your family… activate and manage your Skylight Calendar and Skylight Frame." Category Photo & Video. | "The #1 couples app, designed by experts to help you stay in love… 8 million downloads." Category Lifestyle. | "Lasting makes couples counseling simple… the #1 marriage counseling app." | One-on-one time, a booked-in adventure and a weekly two-of-you check-in protected against the gym and work. |
| 2 Time to first value | One shared account, family password [S]. U | Minutes after inviting [V]. U | Hardware first [S] | Pair with partner [S]. U | Foundations series free [3rd]. U | Same sitting. |
| 3 Day two | Shared week [V] | Shared week and chat [V] | The wall | A new conversation every day, free [V] | Next session [V] | The family ritual on the week. |
| 4 Bad day | Nothing | Nothing | Nothing | Nothing | Nothing | The adventure is protected or moved with a reason. |
| 5 Free | Calendar, notifications, lists, recipes [V] | Basic shared calendar with ads [V] | Sync calendars, chore chart [V] | One conversation a day [V] | Foundations [3rd] | As above. |
| 6 Paywall | IAP Cozi Gold A$49.99 / A$59.00 / A$69.00 / A$79.99 / A$99.99, Cozi Max A$129.99 [S]; web Gold US$39/yr, Max US$79/yr; **14-day trial web only**, "the app stores don't offer the free trial option" [V] | IAP Premium A$4.49 (month), **A$44.99** (year), both tagged "Free Trial" [S]; "first month free" [V] | IAP Calendar Plus Monthly A$12.00, Calendar Plus Annual **A$124.99**, Skylight Plus A$4.49 / A$49.00, Frame Plus A$5.99 / A$59.00, Buddy Plus A$5.99 / A$59.99, Digital A$7.49 / A$59.99 [S]; first month free [V-snip] | IAP Premium Monthly A$22.99 / A$23.99, Annual A$49.99 / A$59.99 / A$99.99 / A$124.99 [S]; "Try Paired Premium free for 7 days" [V]; one subscription covers both partners [V] | IAP Lasting Premium A$17.49 / A$24.49 (monthly), A$124.99 / A$129.99 (annual); Lasting Plus A$32.99–A$149.99 [S]; "free 7-day trial period" on monthly or yearly [S]; Terms: "required to provide a valid payment method", one trial ever [V] | A$14.99 / A$89.99 / A$249; the plan is one person's, the household sees a text share. |
| 7 Single feature | Max tier adds AI import, recipe creator, meal planner [V] | None | **Separate subscriptions per product**: Calendar Plus, Frame Plus, Buddy Plus [S] | None | Premium vs Plus tiers [S] | None. |
| 8 Never pays | 30 days of calendar visible [V, sweep 2] | Ads [V] | Hardware works without Plus [V] | One conversation a day [V] | Foundations [3rd] | Nothing degrades. |
| 9 Evidence | None | None | None | Research page names Dr Jacqui Gabb's "Enduring Love?" study, no journal citation [V] | None found [V] | A–E on relationship and family practices (most C–E, and it says so). |
| 10 Privacy [S] | Tracks identifiers, usage; Linked: purchases, contact, content, search history | Tracks identifiers, usage; Linked: location, contact, content | Linked only: email, name, phone | Tracks purchases, identifiers, usage; Not Linked: same; no "Linked" section | Tracks usage; Linked: contact, content, identifiers, sensitive info | Device ID, not linked. |
| 11 Better | The whole household on one calendar with lists [V] | Group chat on an event [V] | It is on the wall [S] | Both partners on one subscription; a daily question [V] | Clinician-designed course [V] | |
| 12 We do that it cannot | Protect one-on-one time against the gym and work | Place family time, not just record it | Decide what goes on the wall | Hold the relationship beside the training and the money, with a grade on each practice | Same | |

---

## 2. The three answers

### 2.1 Trials

**Across the set, a free trial of the paid tier is the norm, seven days is
the mode, and almost nobody takes a card outside Apple's own sheet.**

Of the 36 apps with a paid tier, 30 offer a trial (counting Finch's
no-charge preview). By
length: 7 days for Motion, Akiflow, Fitbod, Boostcamp (annual plan only),
Rise, Athlytic, one sec, Calm, Waking Up, MacroFactor, Noom (vendor; a
review says 14), Reframe, Paired, Lasting (listing), WeMoney, Spriggy, and
I Am Sober and Gentler Streak by third parties; 14 days for Sunsama,
Reclaim, JuggernautAI, Cozi (web only) and Headspace's annual plan (7 on
monthly); a month for Whoop, TimeTree and Skylight; "30 days" in Balance's
subscription-page title; 3 days for Structured. Finch runs a "preview" that
ends without a charge and without a cancellation. No trial at all: Streaks
(paid up front, A$9.99), Frollo and Up (free), Raiz (a fee rebate, not a
trial), and Hevy, Strong, Cookidoo and Bevel (unknown or "may vary"). Balance's "free first year", carried by the last two
sweeps, appears on neither the vendor site nor the AU listing.

Card up front: every App Store trial attaches to the Apple ID's payment
method, which is what Apple's introductory offer on IntentNorth's annual
product would also do; the distinction the last sweep drew between "card
before the first day" apps and the rest is mostly the difference between a
web checkout and Apple's sheet. Explicit no-card trials: Sunsama, Reclaim,
Finch, Spriggy, Cozi (web). Explicit card required: Motion (a US$1 hold),
Lasting (Terms), Waking Up (web checkout), Noom (billed up front).

What the paywall says on the day the trial ends, where a vendor says it:
Headspace, "You will not be charged until the trial is over" and the 14-day
option becomes an annual subscription; Structured, the trial "automatically
converts into a paid subscription" unless cancelled 24 hours before; Calm,
converts to annual on day 15; Finch, "you won't be charged"; Motion, "we
will automatically bill your payment method on the first day of your first
Subscription Term after the free trial period expires". Everyone else relies
on Apple's sheet and receipt.

What a free week would cost and buy, with the field's numbers. RevenueCat's
State of Subscription Apps 2026 puts median trial-to-paid at 34.2% overall
and 37.7% for Health & Fitness (top quartile above 51.4%), and reports 46.5%
of apps now use trials of four days or fewer and 39.9% five to nine days.
Adapty's health-and-fitness benchmarks (27 Mar 2026) give install-to-trial
9.5% globally (14.5% North America), trial-to-paid 42.2%, first renewal
67.7%. Isaac's own hundred-persona round three found 37% would pay, 36%
maybe, 13% "paywall too early", and the maybe group's most concrete ask was
"let me see one full week of a paid program before asking me to commit".
The arithmetic those numbers allow: a seven-day intro offer on the annual
product turns a "maybe" into a trial start at a rate the field puts around
one in ten installs, and converts around four in ten of those. What it
costs is one week of the coaches for the six in ten who do not convert,
and the day-one revenue from the people who would have paid without it,
which this data cannot size. What it does not cost: any code. Apple's
introductory offer is a setting in App Store Connect on the existing annual
product (`docs/APP_STORE.md` already lists it as optional), it discloses
the price and the date on Apple's sheet, and it satisfies guideline 3.1.1
without touching the on-device entitlement. The free first Plus session is
the cheaper-looking alternative the personas asked for; nobody in the set
does it (Finch's "preview" is the nearest), and it needs a code change in
`entitlement.ts` and a way to mark the session as consumed, on-device,
which is a day's work and a new thing to test.

Recommendation, from the evidence: turn on the seven-day introductory offer
on Yearly now, keep monthly and lifetime without one (Boostcamp's pattern:
trial on annual only), and state on the paywall banner what stays free
(the other persona ask). Hold the free first session until sixty days of
Apple's subscription reports say whether the trial is converting.

### 2.2 Single-coach pricing

**Nobody in the set sells one module of a broader product at a lower price
than the whole. Add-ons exist, and they all cost more.**

What was found, with the price: Rise sells "AI Expert Access" at A$49.99
beside its membership (AU listing). Bevel sells consumable "Intelligence
credit" packs, A$7.99 to A$79.99, beside Pro. Reframe sells "Thrive
Coaching" on top of its subscription (price not on the page; third parties
say US$9.99 to US$249.99 a month). Headspace sells mental-health coaching as
a separate service, and a student plan at A$9.99 a year. Noom sells Noom Med
and GLP-1 programs separately at US$129 to US$299 a month, upward of the
core plan. Hevy runs Hevy Coach as a separate trainer platform. Reclaim
sells "Attendee User" packs and Motion sells credit top-ups. I Am Sober sells
A$1.99 cosmetic packs. Skylight is the closest to per-module pricing:
Calendar Plus, Frame Plus and Buddy Plus are separate subscriptions, but
each is for a separate piece of hardware, not a slice of one app. Cozi and
Lasting sell two tiers of the whole (Gold and Max; Premium and Plus), and
Raiz and Spriggy sell plan tiers, all of the whole product.

How they gate it: the add-ons are extra SKUs in the same App Store listing
(Rise, Bevel, I Am Sober) or web-only services (Reframe, Headspace, Noom,
Hevy). No app in the set exposes one coach, one course or one area as a
cheaper entitlement inside a broader app.

For IntentNorth: the reviewers who wanted only Money or only Relationship
have no precedent to point at, and the field's direction is the opposite
(sell the whole, then sell more on top). A single-coach SKU would need a
second subscription group or a non-consumable per coach, a per-coach check
at every gate point that today reads one app-wide entitlement
(`src/features/plus/entitlement.ts`), and a price under A$89.99 a year that
undercuts the seven-coach product for the people most likely to buy it.
The evidence says keep the entitlement app-wide, and answer the
single-coach ask the way the free tier already does: the first rungs of
Money and Relationship are open, and the day's shape runs without Plus.
If a single-coach price is ever tested, the field's shape is upward: a
coach as an add-on for people who already have Plus (a human check-in,
a deeper program), not a cheaper slice.

### 2.3 Evidence on screen

**No competitor shows an evidence grade or a per-practice source. Proven
across 44 Australian App Store listings and every vendor site that could be
read.**

What exists instead: four vendors publish named studies on their websites
(Pelago, a research page of peer-reviewed papers; one sec, PNAS 2023 and CHI
2024 among others; Calm Health, about thirteen named clinical studies; Noom,
a hub of 40+ papers with named RCTs). MacroFactor's articles cite PubMed
densely and its algorithm-accuracy page cites one systematic review. Rise
puts a verdict in the title and a sleep-medicine reviewer on the byline, with
around thirty citations an article, and its science page links nothing.
Headspace's science page says "Studies show: Headspace works" with no
citations; Fabulous says "backed by behavioral science" and names Duke;
Reframe's listing says "evidence-based"; Bevel's says "backed by science";
Whoop's says "science-backed" and issues press releases on its own studies.
Athlytic's help docs say "Studies suggest" without naming any. Paired names
one study without a journal. Fitbod, Hevy, Strong, JuggernautAI, Boostcamp,
Structured, Sunsama, Motion, Akiflow, Streaks, Finch, I Am Sober, Balance,
Waking Up, Cozi, TimeTree, Skylight, Lasting, Frollo, WeMoney, Up, Raiz,
Spriggy and the banks show nothing.

None of it is a grade. None of it is per practice. None of it appears on the
screen where the practice is prescribed; it lives on marketing pages. Rise
is the only one whose editorial voice tells the reader when something does
not work, and it does so in article titles, not in the product. The
statement "no competitor publishes evidence grades" stands, and is now
verified rather than believed.

One correction to how IntentNorth says it, from the persona data: the grade
sentence was the most-flagged jargon after "Zone 2", and two reviewers asked
for named studies rather than named podcasters. The differentiator is real;
its first line on screen needs to read as plainly as the safety line does.

---

## 3. The pricing table

A$ from the Australian App Store in-app purchase list on 7 Sep 2026 unless
tagged [V] (vendor web price, currency as shown) or [3rd]. Where a listing
shows several SKUs for one period (regional and legacy price points), the
range is given. "Card" is whether the trial takes a payment method outside
Apple's sheet.

| App | Monthly | Yearly | Lifetime | Trial | Card up front | Single-feature option |
|---|---|---|---|---|---|---|
| Sunsama | US$22 [V] | US$204 [V] | none | 14 d | No | None |
| Motion | A$69.99 | A$499.99 | none | 7 d | US$1 hold | Credits |
| Reclaim | US$10–22/seat [V] | annual only [V] | none | 14 d | No | Attendee packs |
| Structured | A$4.99–11.99 | A$14.99–34.99 | A$129.99 | 3 d | Apple | None |
| Akiflow | A$24.99–49.99 | A$199.99–399.99 | none | 7 d | unknown | None |
| Hevy | A$4.99–6.49 | A$38.99 | A$119.99 | unknown | Apple | Hevy Coach (separate) |
| Strong | A$7.49 | A$32.99–45.99 | A$129.99–149.99 | unknown | Apple | None |
| Fitbod | A$19.99–24.99 | A$119.99–149.99 | none | 7 d | Apple/web | None |
| JuggernautAI | A$50.99 | none on AU store (US$349.99 web) | none | 14 d, web | Web | None |
| Boostcamp | A$7.99–22.99 (unlabelled) | A$99.99–129.99 (unlabelled) | none | 7 d, annual only | unknown | None |
| Whoop | none | A$299 / A$399–419 / A$599 [V-snip]; A$299 / 419 / 629 [3rd] | none | 1 month [S] | Vendor checkout | Advanced Labs (US) |
| Rise | A$14.99 | A$99.99–149.99 (Premium A$119.99) | none on AU page | 7 d | Apple | AI Expert Access A$49.99 |
| Athlytic | A$7.99 | A$45.99 | none, by policy | 7 d | Apple | None |
| Gentler Streak | A$13.99 | A$59.99 (family A$54.99–109.99) | A$99.99–299.99 | ~7 d [3rd] | Apple | None |
| Bevel | A$22.99 | A$149.99 | none | varies | Apple | Credit packs A$7.99–79.99 |
| Fabulous | A$27.99–29.99 | A$61.99–91.99 | none | yes, length unknown | Apple | Coaching inside Premium |
| Streaks | — | — | A$9.99 paid app | none | — | — |
| Finch | A$2.99–14.99 | A$57.99–99.99 | none | 3-day preview, no charge | No | None |
| I Am Sober | A$13.99–16.49 | A$24.99–54.99 (6 mo A$36.99) | none | 7 d [3rd] | Apple | A$1.99 cosmetic packs |
| Reframe | A$19.99–39.99 | A$113.99–199.99 | A$149.99 "Premium" | 7 d | unknown | Thrive Coaching add-on |
| Pelago | employer-paid | employer-paid | — | — | — | — |
| one sec | A$4.99 | A$29.99 | A$149.99 (family A$229) | 7 d | Apple | None |
| Headspace | A$18.99–19.99 | A$91.99–101.99 (Plus A$149.99) | none | 7 d monthly / 14 d annual | Apple/web | Coaching; student A$9.99/yr |
| Calm | A$19.99–25.99 | A$79.99–99.99 | US$499.99 web | 7 d | Web/Apple | None |
| Balance | A$19.49 | A$81.99–114.99 | A$149.99 (75% off) | "30 days" [V title] | unknown | None |
| Waking Up | A$29.99 | A$229.99 (family A$399.99) | none | 7 d; scholarship free | Web checkout | None |
| MacroFactor | A$14.49–17.49 | A$86.99–103.99 (6 mo A$68.99) | none | 7 d | Apple | None |
| Noom | Noom Pro A$14.99 | Program SKUs A$64.99–309.99 | none | 7 d [V] / 14 d [review] | Yes, billed up front | Noom Med separate |
| Cozi | — | Gold A$49.99–99.99; Max A$129.99 | none | 14 d web only | Web | Max tier |
| TimeTree | A$4.49 | A$44.99 | none | first month | Apple | None |
| Skylight | A$12.00 (Calendar Plus) | A$124.99 (Calendar Plus) | none | first month | Yes | Per-device plans |
| Paired | A$22.99–23.99 | A$49.99–124.99 | none | 7 d | Apple/web | None |
| Lasting | A$17.49–24.49 | A$124.99–129.99 (Plus A$32.99–149.99) | none | 7 d [S]; card required [V] | Yes | Plus tier |
| Frollo | free | free | — | — | — | — |
| WeMoney | A$9.99 | A$98.99 | none | 7 d | Apple | None |
| Up | free | free | — | — | — | — |
| Raiz | A$2.50–6.50 fee [V] | — | — | 6-month fee rebate | Bank link | Plan tiers |
| Spriggy | A$5–12 per family [V] | billed annually [V] | — | 7 d | No | Plan tiers |
| **IntentNorth** | **A$14.99** | **A$89.99** | **A$249** | none today; 7-day intro on annual is a setting | Apple | None |

Where IntentNorth sits: under Motion, Akiflow, Fitbod, JuggernautAI, Whoop,
Rise, Bevel, Gentler Streak, Reframe, Headspace, Calm, Balance, Waking Up,
MacroFactor, Noom, Skylight, Paired and Lasting on the annual price; above
Hevy, Strong, Structured, Athlytic, one sec, WeMoney and TimeTree. The apps
below it log or track one thing; the apps above it do one thing. The
lifetime at A$249 sits between Hevy (A$119.99) and Gentler Streak's top
lifetime (A$299.99), and under Calm's web lifetime. The price holds.

---

## 4. What to build, checked against the second sweep

The second sweep's section 3 listed five over-the-air items. Checked at the
head of this branch:

| Sweep-2 item | Status now |
|---|---|
| 1. Learned durations ("usually 42 min") | **Not built.** No `actualMin` on plan items; the only match for the word "usually" under `src/lib/scheduling` and `src/features/today` is a test file. |
| 2. Move, do not drop (second placement pass over `unplaced`) | **Unverified.** `movedFrom` exists in `engine.ts` (it did before); no evidence of a second pass over unplaced routines was found by grep. Treat as open. |
| 3. Rest timer that survives a locked phone | **Not built.** `workout.tsx` counts `restLeft` down in state; no haptic or local notification at zero. |
| 4. Energy shape into placement | **Not built.** The word "energy" does not appear in `engine.ts`. |
| 5. A swap that moves the rest of the week | **Built.** `swap.ts` now carries `rotatedFrom` and the comment "after a swap the rest of the week moves on from it". |

So four of five stand, and the list below keeps them and adds what this
pass found. Costs are working days for one person including tests, and
every item is JavaScript or a store setting; nothing needs a build.

**Five things over the air before growth**

1. **Turn on the seven-day introductory offer on Plus Yearly.** Section 2.1.
   Closes the "let me see a week" ask from the maybe group, matches the mode
   of the field (7 days, on the annual product, Boostcamp's exact pattern),
   costs no code. Cost: an hour in App Store Connect, plus a paywall line
   that says "7 days free, then A$89.99 a year" in the app's own words.
   Changed from sweep 2: not listed there; sweep 2 recorded pay-from-day-one
   as decided.
2. **Say on the paywall banner what stays free, and lead the grade line with
   the plain words.** Two persona asks ("state up front… that the urge tool
   is free forever", "explain the evidence letter grades in plain words the
   first time they appear"). Closes the "free tier unclear" tag (18% in round
   three) and the grade-jargon tag. Cost: half a day.
3. **Learned durations on every row** (sweep 2, item 1, unchanged). Sunsama's
   planned-versus-actual is what US$204 a year buys; IntentNorth records a
   workout's actual length and nothing else's. Cost: one day.
4. **The rest timer that survives a locked phone** (sweep 2, item 3,
   unchanged): haptic at zero in the foreground, a one-shot local
   notification otherwise, cancelled if the next set is logged early. Hevy
   and Strong are the benchmark and both are native; the useful half is not.
   Cost: half a day.
5. **Energy shape into placement** (sweep 2, item 4, unchanged): pass the
   computed shape into `buildDailyPlan`, let deep work prefer the peak and
   chores the dip, with the reason line saying so. Rise's whole product is
   the energy schedule and its AU price is A$14.99 a month. Cost: one day.

Dropped from the sweep-2 five: "move, do not drop" moves to sixth until
someone confirms whether the second pass exists; it is a day if it does not.

**Five that need a native build** — unchanged in substance from both earlier
sweeps, and still absent from the code (no `ios/` targets for widgets,
activities or intents; the calendar provider returns nothing): widgets
(Structured and Gentler Streak ship them free); a Live Activity for the rest
timer and the breathing session; App Intents for "log a set", "start a
two-minute reset", "what's next"; the device calendar read behind the
existing provider so a meeting on the walk is real; Apple Watch logging last
and only after widgets prove the demand. Sixth, still a decision: Android.

**Three things to say louder because nobody else has them**

1. **Every practice carries its evidence grade, its source and where it
   stops.** Now verified across 44 listings and every readable vendor site:
   nobody shows a grade, four vendors list studies on marketing pages, none
   on the screen that prescribes. Say it as "graded A to E, and most of it
   is not an A", which is the line no competitor can copy without
   downgrading their own copy.
2. **No account, and the only thing that leaves the phone is an anonymous
   update check.** Of 44 listings, one is "Data Not Collected" (Athlytic),
   three are "Not Linked" only (Streaks, one sec, Gentler Streak), and
   twenty-two declare "Data Used to Track You". Every planner, every
   meditation app, Noom, Whoop, Rise, Fitbod, Bevel and Reframe link data to
   the person. Sweep 2 said this; the label counts make it a number.
3. **The hardest moment is free, and it is written in the data, not a
   setting.** Reframe is A$113.99 to A$199.99 a year after seven days; I Am
   Sober keeps backup and groups behind A$54.99; Pelago is only reachable
   through an employer. Unchanged from sweep 2, now with the A$ figures.

A fourth, from this pass: the day says what it moved and which part of life
won. Still true, still unique (Motion and Reclaim move things silently; the
family and money apps move nothing), and still the sentence that belongs at
the top of the first screenshot.

---

## 5. What the last two sweeps got wrong, cell by cell

"Sweep 1" is `docs/archive/COMPETITIVE_REVIEW.md` (2026-09-04); "sweep 2" is
`docs/archive/COMPETITIVE_REVIEW_2.md` (2026-09-06). Both were written without access
to the App Store; this table is what changes when it is read.

| App | Sweep said | Verified now |
|---|---|---|
| Sunsama | US$22 / US$204; 14-day trial, no card (sweep 2) | Correct on the web. Adds: no App Store purchase at all; the iPhone app cannot be started without planning a day on desktop first [S]. |
| Motion | US$19 a seat a month annual; US$29 or US$49 monthly by source; A$ unverified (sweep 2) | A$69.99 a month, A$499.99 a year on the AU store [S]; 7-day trial stated on the listing [S]; a US$1 card hold at signup [V]. |
| Reclaim | Treated as an app in the set with a free tier (sweeps 1 and 2) | There is no iOS app [V, 5 Aug 2026]. The free tier is correct, on the web. |
| Structured | Pro US$19.99 a year (or US$27.99) or US$64.99 once (sweep 2) | A$14.99–34.99 a year, A$4.99–11.99 a month, A$129.99 lifetime [S]; a 3-day trial that auto-converts [V], not mentioned before. |
| Hevy | US$2.99 / US$23.99 / US$74.99 (sweeps 1 and 2) | A$4.99–6.49 / A$38.99 / A$119.99 [S]. "Four routines free" is not on the AU listing; "No ads and free" is. |
| Strong | US$29.99 a year or US$4.99 a month (sweep 2) | Those are the stale numbers in Strong's own description. The AU purchases are A$7.49 a month, A$32.99–45.99 a year, A$129.99–149.99 forever [S]. Three free routines confirmed [S]. |
| Fitbod | US$15.99 / US$95.99; "7 days with a card" (sweep 2); "~$16/mo" (sweep 1) | A$19.99–24.99 / A$119.99–149.99, legacy tiers still listed [S]; trial is Apple's or web, and the AU listing tracks usage data [S]. |
| JuggernautAI | US$34.99 / US$349.99 after 14 days (sweep 2) | AU store sells A$50.99 monthly only; no annual purchase on the AU page; the trial is "from our website", not the store [S]. |
| Whoop | "Nothing free; the band and a membership" (sweeps 1 and 2); A$299 / 419 / 629 (sweep 2) | The AU listing says "try both the wearable and app free for 1 month" [S]. Tier prices: vendor snippet A$299 / 399–419 / 599; sweep 2's A$629 is a third-party figure; **unknown** which is current, vendor pages 403. |
| Rise | "US$69.99 a year, lifetime available; 7-day trial" (sweep 2); "$69.99/yr" (sweep 1) | A$99.99–149.99 a year, A$14.99 a month; no lifetime on the AU page; an "AI Expert Access" A$49.99 add-on exists [S]. Trial confirmed 7 days [V]. |
| Athlytic | "About US$2.99 a month or US$24.99 a year; recovery score free" (sweep 2) | A$7.99 / A$45.99 [S]; vendor US$4.99 / US$29.99, no lifetime by policy [V]; the listing is "Data Not Collected", which no sweep noted and which matters for section 4. |
| Gentler Streak | US$8.99 / US$39.99, lifetime about US$59.99 in promotions (sweep 2) | A$13.99 / A$59.99; lifetime A$99.99–299.99; family plans exist [S]. |
| Bevel | "Pro $99.99/yr" (sweep 1); "not re-checked" (sweep 2) | A$22.99 a month, A$149.99 a year, plus consumable credit packs [S]; vendor US$14.99 / US$99.99 [V]. The written promise never to move a free feature behind the paywall was not recorded. |
| Fabulous | "About US$39.99 a year with a 7-day trial; US$16.99–59.99 by promotion" (sweep 2) | Ten SKUs A$27.99–91.99, annual A$70.99 [S]; trial length is not on the listing or the vendor page [S,V]. |
| Streaks | US$5.99 (sweep 2) | A$9.99 [S]. |
| Finch | US$9.99 / US$69.99, cosmetic (sweep 2) | A$2.99–99.99 across eight unlabelled SKUs [S]; the "Finch Plus preview" ends without a charge and without cancelling [V-snip], which is not a trial and was not recorded. |
| I Am Sober | US$9.99 / US$39.99 after 7 days (sweep 2) | A$13.99–16.49 / A$24.99–54.99 [S]; category Lifestyle, not Health & Fitness; an account is created "and declare your addiction" [S]. |
| Reframe | "7-day trial then US$99.99 a year; coaching US$9.99–249.99 extra" (sweep 2) | A$113.99–199.99 a year, A$19.99–39.99 a month, a A$149.99 "Premium" [S]; vendor "$100 USD per year" [V]; 7 days confirmed [S]. |
| Headspace | US$12.99 / US$69.99; 7-day monthly, 14-day annual; student US$9.99 (sweep 2) | A$18.99–19.99 / A$91.99–101.99 [S]; trial lengths confirmed [V-snip]; the AU description still quotes £ prices [S]. |
| Calm | US$16.99 / US$69.99; lifetime US$399.99–499.99 (sweep 2) | A$19.99–25.99 monthly SKUs, A$79.99–99.99 annual [S]; lifetime US$499.99 on the web [V-snip]; trial converts on day 15 [V-snip]. |
| Balance | "Free for the first year, then US$11.99 or US$69.99" (sweeps 1 and 2); sweep 1 row "Free first year / long trial: Balance" | **Not confirmed.** Neither balanceapp.com (redirects to The Mind Company) nor the AU listing says "free first year"; the listing says "Start your free trial" and the subscription page is titled "Try Balance free for 30 days" [V,S]. Prices A$19.49 / A$81.99–114.99 / A$149.99 lifetime [S]. |
| Waking Up | "30-day trial, US$99.99 (one source US$129.99) or US$14.99 a month" (sweep 2) | Vendor: 7-day trial, US$19.99 / US$129.99 [V]; AU store A$29.99 / A$229.99, family A$399.99 [S]. Scholarship and refund confirmed [V]. |
| MacroFactor | US$11.99 / US$47.99 / US$71.99, card up front (sweep 2) | A$14.49–17.49 / A$68.99 / A$86.99–103.99 [S]; 7-day trial stated on the listing [S]; "card up front" is Apple's sheet. |
| Noom | About US$209 a year or US$70 monthly, 7-day trial with card (sweep 2) | AU program SKUs A$64.99–309.99, Noom Pro A$14.99 [S]; AU price shown only after the survey [V]; a listing review says 14 days [S]. |
| Cozi | Gold US$39 a year (sweeps 1 and 2) | A$49.99–99.99 Gold, A$129.99 Max [S]; the 14-day trial is web only because "the app stores don't offer the free trial option" [V]. |
| TimeTree | US$4.49 / US$44.99, first month free (sweep 2) | A$4.49 / A$44.99 [S], the same numerals in A$; "Free Trial" badge on both [S]. |
| Skylight | Plus A$124.99 (sweep 2) | Correct for Calendar Plus Annual; monthly A$12.00; four other product subscriptions on the same listing [S]. |
| Frollo, WeMoney, Up, Raiz | Free; A$9.99 / A$98.99; free; A$2.50–6.50 (sweep 2) | All correct [S,V]. WeMoney's 7-day trial added [V]. |
| Sweep 2 §5, item 3 | "MacroFactor, Noom, Fitbod and JuggernautAI take a card before the first day" | Fitbod and MacroFactor take Apple's payment method on Apple's sheet, the same as any introductory offer IntentNorth would run. Noom (billed up front) and JuggernautAI (web) are the real cases; Motion and Lasting join them. |
| Sweep 2 §1 matrix, "Time to first value: 14-day trial" for planners | Applied to all four | Structured is 3 days; Akiflow 7; Motion's length is not stated by the vendor; Reclaim has no app. |
| Sweep 2 §1 matrix, "Widgets, Watch, Live Activity: unverified" for most | — | Still unverified; listings do not state them and no app was installed. |
| Not in either sweep | — | Akiflow, Boostcamp, Bevel (listing), Pelago, one sec, Paired, Lasting, Spriggy, Dinnerly, HelloFresh, Cookidoo and the four banks are new here. |

---

## 6. Sources

Australian App Store listings, read 7 Sep 2026 (title, subtitle, in-app
purchase list, privacy label, description):

- Sunsama https://apps.apple.com/au/app/sunsama/id1475755747 ; Motion https://apps.apple.com/au/app/motion-tasks-ai-scheduling/id1580440623 ; Structured https://apps.apple.com/au/app/structured-daily-planner-todo/id1499198946 ; Akiflow https://apps.apple.com/au/app/akiflow-ai-planner-calendar/id1621279084
- Hevy https://apps.apple.com/au/app/hevy-workout-tracker-gym-log/id1458862350 ; Strong https://apps.apple.com/au/app/strong-workout-tracker-gym-log/id464254577 ; Fitbod https://apps.apple.com/au/app/fitbod-workout-gym-planner/id1041517543 ; JuggernautAI https://apps.apple.com/au/app/juggernautai/id1515756471 ; Boostcamp https://apps.apple.com/au/app/boostcamp-gym-workout-fitness/id1529354455
- Whoop https://apps.apple.com/au/app/whoop/id933944389 ; Rise https://apps.apple.com/au/app/rise-energy-sleep-tracker/id1453884781 ; Athlytic https://apps.apple.com/au/app/athlytic-ai-fitness-coach/id1543571755 ; Gentler Streak https://apps.apple.com/au/app/gentler-streak-health-tracker/id1576857102 ; Bevel https://apps.apple.com/au/app/bevel-ai-health-coach/id6456176249
- Fabulous https://apps.apple.com/au/app/fabulous-daily-habit-tracker/id1203637303 ; Streaks https://apps.apple.com/au/app/streaks/id963034692 ; Finch https://apps.apple.com/au/app/finch-self-care-pet/id1528595748 ; I Am Sober https://apps.apple.com/au/app/i-am-sober/id672904239 ; Reframe https://apps.apple.com/au/app/reframe-drink-less-thrive/id1485756576 ; Pelago https://apps.apple.com/au/app/quit-genius-quit-addiction/id1234288038 ; one sec https://apps.apple.com/au/app/one-sec-screen-time-focus/id1532875441
- Headspace https://apps.apple.com/au/app/headspace-sleep-meditation/id493145008 ; Calm https://apps.apple.com/au/app/calm-sleep-meditation/id571800810 ; Balance https://apps.apple.com/au/app/balance-meditation-sleep/id1361356590 ; Waking Up https://apps.apple.com/au/app/waking-up-meditation-wisdom/id1307736395
- MacroFactor https://apps.apple.com/au/app/macrofactor-macro-tracker/id1553503471 ; Noom https://apps.apple.com/au/app/noom-weight-loss-food-tracker/id634598719 ; Dinnerly https://apps.apple.com/au/app/dinnerly-meal-kit/id1415694682 ; HelloFresh https://apps.apple.com/au/app/hellofresh-meal-kit-recipes/id970107419 ; Cookidoo https://apps.apple.com/au/app/official-cookidoo-app/id714004506
- Frollo https://apps.apple.com/au/app/frollo-feel-good-about-money/id1179563005 ; WeMoney https://apps.apple.com/au/app/wemoney-crush-your-debt-fast/id1524236901 ; Up https://apps.apple.com/au/app/up-upgrade-your-banking/id1350717115 ; Raiz https://apps.apple.com/au/app/raiz-earn-save-invest/id1065771295 ; Spriggy https://apps.apple.com/au/app/spriggy/id1080870587 ; CommBank https://apps.apple.com/au/app/commbank/id310251202 ; NAB https://apps.apple.com/au/app/nab-mobile-banking/id373434223 ; ANZ Plus https://apps.apple.com/au/app/anz-plus/id1495738612 ; Westpac https://apps.apple.com/au/app/westpac/id299111811
- Cozi https://apps.apple.com/au/app/cozi-family-organiser/id407108860 ; TimeTree https://apps.apple.com/au/app/timetree-shared-calendar/id952578473 ; Skylight https://apps.apple.com/au/app/skylight-app/id1438779037 ; Paired https://apps.apple.com/au/app/paired-couples-relationship/id1469609343 ; Lasting https://apps.apple.com/au/app/lasting-marriage-couples/id1225049619

Vendor pages (trial mechanics, web prices, free tier, evidence):

- Sunsama https://www.sunsama.com/pricing ; Motion https://www.usemotion.com/pricing , https://www.usemotion.com/terms ; Reclaim https://help.reclaim.ai/en/articles/6405151-what-happens-at-the-end-of-a-free-trial , https://help.reclaim.ai/en/articles/6916961-how-to-use-reclaim-on-your-mobile-device , https://reclaim.ai/pricing ; Structured https://help.structured.app/en/articles/331330 , https://help.structured.app/en/articles/1897986 ; Akiflow https://akiflow.com/pricing
- Hevy https://hevy.com/pricing , https://www.hevyapp.com/features/trainer-platform/ ; Strong https://help.strongapp.io/article/132-strong-pro , https://www.strong.app/ ; Fitbod https://fitbod.me/faqs/ ; JuggernautAI https://www.juggernautai.app/pricing ; Boostcamp https://www.boostcamp.app/pro
- Whoop https://join.whoop.com/au/en/ (403) ; Rise https://www.risescience.com/faq , https://www.risescience.com/science ; Athlytic https://www.athlyticapp.com/ , https://athlyticapp.helpscoutdocs.com/article/20-understanding-recovery ; Gentler Streak https://gentlerstories.com/gentlerstreak/ ; Bevel https://help.bevel.health/en/articles/11583937
- Fabulous https://www.thefabulous.co/ , https://www.thefabulous.co/science-behind-fabulous/ ; Streaks https://streaksapp.com/ ; Finch https://help.finchcare.com/hc/en-us/articles/38087066022285-Finch-Plus-Preview-Explained , https://help.finchcare.com/hc/en-us/articles/38755205001869-Finch-Plus-Pricing ; I Am Sober https://iamsober.com/ ; Reframe https://www.joinreframeapp.com/help/pricing-and-subscription ; Pelago https://www.pelagohealth.com/pricing/ , https://www.pelagohealth.com/resources/research/ ; one sec https://one-sec.app/faq/ , https://one-sec.app/research/
- Headspace https://help.headspace.com/hc/en-us/articles/215758647-How-do-I-purchase-a-Headspace-subscription , https://www.headspace.com/science , https://www.headspace.com/studentplan ; Calm https://support.calm.com/hc/en-us/articles/360003084493-Calm-Web-Free-Trial-Sign-Up-Cancellation-Steps , https://support.calm.com/hc/en-us/articles/30958037515419-Lifetime-Membership-FAQ , https://health.calm.com/resources/clinical-studies/ ; Balance https://themindcompany.com/apps/balance , https://get.balanceapp.com/account/subscription/new ; Waking Up https://www.wakingup.com/ , https://www.wakingup.com/checkout , https://www.wakingup.com/scholarship , https://help.wakingup.com/article/72-what-s-waking-up-s-risk-free-pricing-policy
- MacroFactor https://macrofactor.com/algorithm-accuracy/ ; Noom https://www.noom.com/blog/weight-management/noom-cost/ , https://www.noom.com/research/
- Cozi https://www.cozi.com/faq/ , https://www.cozi.com/compare-plans/ ; TimeTree https://timetreeapp.com/intl/en/premium ; Skylight https://au.myskylight.com/products/calendar-skylight-plus/ ; Paired https://www.paired.com/premium , https://support.paired.com/en/articles/164633-what-s-paired-premium , https://www.paired.com/research ; Lasting https://getlasting.com/terms
- Frollo https://frollo.com.au/frollo-app/ ; WeMoney https://intercom.help/wemoney/en/articles/12528988-how-much-does-wemoney-pro-cost ; Raiz https://raizinvest.com.au/fees/ ; Spriggy https://spriggy.com.au/plans/

Benchmarks:

- RevenueCat, State of Subscription Apps 2026: https://www.revenuecat.com/state-of-subscription-apps/
- Adapty, Health & Fitness app subscription benchmarks, 27 Mar 2026: https://adapty.io/blog/health-fitness-app-subscription-benchmarks/

Internal:

- `docs/archive/COMPETITIVE_REVIEW.md`, `docs/archive/COMPETITIVE_REVIEW_2.md`, `docs/MONETISATION.md` (revision 3), `docs/APP_STORE.md`, `docs/archive/USABILITY_REVIEW.md` (round three table), `docs/review/round3-report.md` (top changes asked for), `docs/PROBLEM_STATEMENT.md`
- Code at this branch head: `src/features/plus/entitlement.ts`, `src/features/training/swap.ts`, `src/app/session/workout.tsx`, `src/lib/scheduling/engine.ts`, `src/features/knowledge/protocols.ts`

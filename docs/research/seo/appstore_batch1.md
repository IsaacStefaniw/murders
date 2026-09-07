# AU App Store competitor research — Batch 1

Researched 2026-09-07 via WebSearch (`site:apps.apple.com/au ...`) + WebFetch of each `apps.apple.com/au/...` listing.
Every field below was read from the AU listing page. "unknown" = not readable from the page. Nothing is inferred from other regions.

## Method caveats (read first)

- **Currency:** apps.apple.com/au displays prices with a bare "$" — this is AUD on the AU storefront. Two pages (Streaks, JuggernautAI) were explicitly confirmed as AUD by the extractor; all others show "$" only. No page showed USD. Prices below are written as A$ on that basis.
- **IAP lists** are the raw "In-App Purchases" list from the listing's Information panel. Apple shows up to ~10 items, often with duplicate names at different prices (legacy/intro/regional price points). Reproduced verbatim, duplicates included.
- **Free trial**: recorded only if the description text on the AU page mentions one. Trial offers that exist only inside the app (post-install paywall) are not visible on the listing and are marked "not stated on page".
- **Account required**: only from description/privacy-label wording. Most listings do not state it — marked "unknown".
- **Rating counts** are the AU-storefront counts as displayed (e.g. "15K Ratings").
- Char counts are for the exact title/subtitle strings, spaces included.

## Summary table

| # | App | AU URL | Title (chars) | Subtitle (chars) | Category | AU rating (count) | Price | Free trial on page | Privacy label(s) | Account required |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Sunsama | https://apps.apple.com/au/app/sunsama/id1475755747 | `Sunsama` (7) | `Daily planner` (13) | Productivity | 3.8 (37) | Free, **no IAP listed** | not stated | Data Linked to You | Yes (must plan first day in desktop app first) |
| 2 | Motion | https://apps.apple.com/au/app/motion-tasks-ai-scheduling/id1580440623 | `Motion: Tasks & AI Scheduling` (29) | `A.I. Time and Project Manager` (29) | Productivity | 3.6 (213) | Free + IAP | **Yes, 7-day** | Data Linked to You; Data Not Linked to You | Yes ("requires a Motion subscription") |
| 3 | Reclaim AI | **NOT ON AU APP STORE** (see notes) | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| 4 | Structured | https://apps.apple.com/au/app/structured-daily-planner-todo/id1499198946 | `Structured: Daily Planner Todo` (30) | `Visual Calendar & Organiser` (27) | Productivity | 4.7 (15K) | Free + IAP | not stated | Data Linked to You; Data Not Linked to You | unknown (not stated; free tier works without) |
| 5 | Akiflow | https://apps.apple.com/au/app/akiflow-ai-planner-calendar/id1621279084 | `Akiflow: AI Planner & Calendar` (30) | `Calendar, To-Do & Agenda` (24) | Productivity | 3.7 (19) | Free + IAP | not stated | Data Linked to You | unknown |
| 6 | Hevy | https://apps.apple.com/au/app/hevy-workout-tracker-gym-log/id1458862350 | `Hevy - Workout Tracker Gym Log` (30) | `Weight Lifting Exercise Plan` (28) | Health & Fitness | 4.9 (16K) | Free + IAP | not stated | Data Linked to You; Data Not Linked to You | unknown |
| 7 | Strong | https://apps.apple.com/au/app/strong-workout-tracker-gym-log/id464254577 | `Strong Workout Tracker Gym Log` (30) | `Strength Training Planner` (25) | Health & Fitness | 4.8 (13K) | Free + IAP | mentions "free trial period" in legal boilerplate only; length not stated | Data Linked to You | unknown |
| 8 | Fitbod | https://apps.apple.com/au/app/fitbod-workout-gym-planner/id1041517543 | `Fitbod Workout & Gym Planner` (28) | `Strength Training & Fitness` (27) | Health & Fitness | 4.8 (9.5K) | Free + IAP | Yes ("After your free trial has ended...") — length not stated | Data Used to Track You; Data Linked to You | Subscription required after trial |
| 9 | JuggernautAI | https://apps.apple.com/au/app/juggernautai/id1515756471 | `JuggernautAI` (12) | `Strength Training Workouts` (26) | Health & Fitness | 4.9 (203) | Free + IAP | not in description (dev reply to a review says trial via website) | Data Used to Track You; Data Linked to You; Data Not Linked to You | Yes ("Subscribe to JuggernautAI to access all our coaching") |
| 10 | Boostcamp | https://apps.apple.com/au/app/boostcamp-gym-workout-fitness/id1529354455 | `Boostcamp: Gym Workout Fitness` (30) | `Anytime Pure Health: The Gym` (28) | Health & Fitness | 4.8 (655) | Free + IAP | not stated | Data Used to Track You; Data Linked to You; Data Not Linked to You | unknown |
| 11 | WHOOP | https://apps.apple.com/au/app/whoop/id933944389 | `WHOOP` (5) | **none** (0) | Health & Fitness | 4.8 (4K) | Free, **no IAP listed** | Yes, 1 month (wearable + app) | Data Linked to You; Data Not Linked to You | Yes (requires WHOOP wearable/membership) |
| 12 | Rise | https://apps.apple.com/au/app/rise-energy-sleep-tracker/id1453884781 | `Rise: Energy & Sleep Tracker` (28) | `Better Health, Focus & Habits` (29) | Health & Fitness | 4.5 (3.7K) | Free + IAP | "Free Trial" tag on the Premium IAP; length not stated | Data Used to Track You; Data Linked to You; Data Not Linked to You | unknown |
| 13 | Athlytic | https://apps.apple.com/au/app/athlytic-ai-fitness-coach/id1543571755 | `Athlytic: Fitness & Recovery` (28) | `HRV Sleep & Training Coach` (26) | Health & Fitness | 4.7 (995) | Free + IAP | **Yes, 1 week** | **Data Not Collected** | No account (no data collected; Apple Watch/HealthKit only) |
| 14 | Gentler Streak | https://apps.apple.com/au/app/gentler-streak-health-tracker/id1576857102 | `Gentler Streak Workout Tracker` (30) | `Wellness with Activity & Rest` (29) | Health & Fitness | 4.7 (357) | Free + IAP | not stated | Data Not Linked to You | unknown (HealthKit-only per description; no account mentioned) |
| 15 | Bevel | https://apps.apple.com/au/app/bevel-ai-health-coach/id6456176249 | `Bevel: AI Health Coach` (22) | `Exercise, Sleep & Nutrition` (27) | Health & Fitness | 4.8 (2.4K) | Free + IAP | not stated | Data Used to Track You; Data Linked to You; Data Not Linked to You | unknown (email/User ID collected → likely, not stated) |
| 16 | Fabulous | https://apps.apple.com/au/app/fabulous-daily-habit-tracker/id1203637303 | `Fabulous: Daily Habit Tracker` (29) | `Healthy Routines & Motivation` (29) | Health & Fitness | 4.3 (6.8K) | Free + IAP | not stated | Data Used to Track You; Data Not Linked to You | unknown |
| 17 | Streaks | https://apps.apple.com/au/app/streaks/id963034692 | `Streaks` (7) | `The habit-forming to-do list` (28) | Health & Fitness | 4.7 (3K) | **Paid A$9.99, no IAP** | n/a | Data Not Linked to You (Crash Data only) | No account (none mentioned) |
| 18 | Finch | https://apps.apple.com/au/app/finch-self-care-pet/id1528595748 | `Finch: Self-Care Pet` (20) | `Daily Journal & Habit Tracker` (29) | Health & Fitness | 4.9 (30K) | Free + IAP | not stated | Data Linked to You; Data Not Linked to You | unknown |
| 19 | I Am Sober | https://apps.apple.com/au/app/i-am-sober/id672904239 | `I Am Sober` (10) | `Sobriety tracker for recovery` (29) | **Lifestyle** | 4.8 (13K) | Free + IAP | boilerplate "free trial period, if offered" only | Data Linked to You | Account mentioned ("When you create an account and declare your addiction...") |
| 20 | Reframe | https://apps.apple.com/au/app/reframe-drink-less-thrive/id1485756576 | `Reframe: Drink Less & Thrive` (28) | `Cut Back or Quit Alcohol Habit` (30) | Health & Fitness | 4.7 (3.8K) | Free + IAP | **Yes, 7 days** | Data Used to Track You; Data Linked to You; Data Not Linked to You | Subscription required ("auto-renewing subscriptions for accessing the app") |
| 21 | Pelago (ex Quit Genius) | https://apps.apple.com/au/app/quit-genius-quit-addiction/id1234288038 | `Pelago Health` (13) | `Substance use support` (21) | Health & Fitness | 4.5 (670) | Free + IAP | not stated (one IAP is named "Silver Trial") | Data Linked to You; Data Not Linked to You | Yes (sign up / log in via employer or health-plan link) |
| 22 | one sec | https://apps.apple.com/au/app/one-sec-screen-time-focus/id1532875441 | `one sec \| screen time + focus` (29) | `App & Website Limit, Blocker` (28) | Productivity | 4.8 (4.1K) | Free + IAP | not stated | Data Not Linked to You (Usage Data only) | No account (free for one app, no sign-up mentioned) |

---

## Per-app notes

### 1. Sunsama
- URL: https://apps.apple.com/au/app/sunsama/id1475755747 — Seller: SUMMAY, Inc. — Age 4+
- IAP: **none listed** on the AU page (billing is on the web; mobile is a companion).
- Free trial: not stated on page.
- Privacy — Data Linked to You: Contact Info (Email Address); User Content (Customer Support, Other User Content); Identifiers (User ID, Device ID); Usage Data (Product Interaction); Diagnostics (Crash Data, Performance Data, Other Diagnostic Data).
- Account: Yes — "You can use the Sunsama mobile app once you've planned your first day from the Sunsama desktop app."
- Description opens: "*Companion app to the desktop app* You can use the Sunsama mobile app once you've planned your first day from the Sunsama desktop app. This mobile app is built as a companion to the desktop app to help you stay in sync when you're away from your desk, not as a standalone replacement."

### 2. Motion
- URL: https://apps.apple.com/au/app/motion-tasks-ai-scheduling/id1580440623 — Seller: NexusBird, Inc — Age 4+
- IAP: Monthly A$69.99; Annual A$499.99.
- Free trial: "Start your 7-day free trial today!"
- Privacy — Data Linked to You: Contact Info (Email, Name), Usage Data (Product Interaction), Diagnostics (Crash Data). Data Not Linked to You: Identifiers (Device ID) for third-party advertising.
- Account: "Use of the Motion app requires a Motion subscription." Also "Motion is best used on a computer; the mobile app is a companion."
- Description opens: "Use AI to get work done 2x faster with 90% less check-ins, emails and messages, meetings, status updates. Ranked #1 fastest-growing product by Amplitude's Product Report. Motion uses automation and AI to intelligently plan your day, schedule meetings, and manage projects."

### 3. Reclaim AI — NOT VERIFIABLE (no listing)
- Two `site:apps.apple.com/au` searches and one open search returned no Reclaim.ai listing. The only AU-store apps named "Reclaim" are unrelated (id6744350699 wardrobe app; id6748927454 eBay lister; id6759008784 subscription canceller; id6758312578 app blocker).
- Reclaim's own help centre (article dated 5 Aug 2026): "Reclaim doesn't have native mobile apps for iOS or Android today, but it's designed to be mobile-friendly." (https://help.reclaim.ai/en/articles/6916961-how-to-use-reclaim-on-your-mobile-device)
- Conclusion: web-app only; no App Store title/subtitle/IAP/privacy label exists to compare against.

### 4. Structured
- URL: https://apps.apple.com/au/app/structured-daily-planner-todo/id1499198946 — Seller: unorderly GmbH — Age 4+
- IAP: Structured Pro (Yearly) A$34.99; Structured Pro (Monthly) A$4.99; Structured Pro (Yearly) A$14.99; Structured Pro (Lifetime) A$129.99; Structured Pro (Monthly) A$11.99; Structured Pro (Yearly) A$29.99.
- Free trial: not stated. Description: "Structured Pro is available monthly, annually, or as a lifetime purchase."
- Privacy — Data Linked to You: Contact Info (Email), User Content (Other User Content). Data Not Linked to You: Purchases (Purchase History), Identifiers (User ID), Usage Data (Product Interaction), Diagnostics (Performance, Crash), User Content (Photos or Videos).
- Account: unknown — not stated; free features listed work standalone.
- Description opens: "A visual daily planner to organize tasks, routines, and habits. Stay focused, reduce overwhelm, and plan your day in one clear timeline. Plan your day visually."

### 5. Akiflow
- URL: https://apps.apple.com/au/app/akiflow-ai-planner-calendar/id1621279084 — Seller: Akiflow Inc. — Age 4+
- IAP: Weekly Premium A$7.99; Monthly Premium A$24.99; Monthly Premium A$49.99; Yearly Premium A$199.99; Yearly Premium A$399.99.
- Free trial: not stated.
- Privacy — Data Linked to You: Contact Info (Email, Name), Usage Data (Product Interaction), Diagnostics (Crash, Performance), User Content (Emails or Text Messages), Identifiers (User ID).
- Account: unknown (not stated).
- Description opens: "Akiflow is the ultimate all-in-one planner, combining your calendar, tasks, and agenda into a single AI-powered productivity tool. Stay organized, plan efficiently, and streamline your workflow—all from one powerful app. Available on all your devices – mobile and desktop."

### 6. Hevy
- URL: https://apps.apple.com/au/app/hevy-workout-tracker-gym-log/id1458862350 — Seller: Hevy Studios S.L. — Age 9+
- IAP: Hevy Pro - Monthly A$4.99; Hevy Pro - Yearly A$38.99; Hevy Pro - Lifetime A$119.99; Hevy Pro - Monthly A$6.49.
- Free trial: not stated ("No ads and free.").
- Privacy — Data Linked to You: Purchases, Usage Data, Contact Info, Contacts. Data Not Linked to You: Identifiers, Sensitive Info, Diagnostics.
- Account: unknown (not stated).
- Description opens: "** Featured by Apple ** Join +10 million users! Hevy is the most intuitive workout tracker & planner in the world. No ads and free."

### 7. Strong
- URL: https://apps.apple.com/au/app/strong-workout-tracker-gym-log/id464254577 — Seller: Strong Fitness PTE Limited — Age 4+
- IAP: Strong PRO (1 Month) A$7.49; Strong PRO (1 Month) A$7.49; Strong PRO (6 Months) A$27.49; Strong PRO (1 Year) A$32.99; Strong PRO (1 Year) A$44.99; Strong PRO (1 Year) A$45.99; Strong PRO Forever A$129.99; Strong PRO Forever A$149.99; Strong PRO A$5.49.
- Note: description text still says "Upgrade to a Strong PRO subscription ($4.99/month or $29.99/year)" — stale vs the IAP list; those look like USD figures baked into the copy.
- Free trial: boilerplate only ("...end of your subscription or free trial period..."), no length.
- Privacy — Data Linked to You: Health & Fitness (Health, Fitness), Purchases (Purchase History), Contact Info (Email), Identifiers (User ID, Device ID), Diagnostics (Crash Data), Other Data Types.
- Account: unknown (not stated). "The free version of Strong can save unlimited workouts, but is limited to 3 custom routines."
- Description opens: "The most intuitive workout and exercise tracker for any fitness routine. Strong is the simplest and most intuitive workout tracker, designed to help you get better results from your workouts. Whether you want to gain strength or just stay healthy, join over 1.2 million people who have downloaded Strong to stay on track in the gym."

### 8. Fitbod
- URL: https://apps.apple.com/au/app/fitbod-workout-gym-planner/id1041517543 — Seller: Fitbod Inc. — Age 9+
- IAP: Monthly Plan A$24.99; Monthly Plan A$19.99; A Year of Fitbod Elite A$149.99; (Legacy Pricing) fitbod ELITE A$15.49; A Year of Fitbod Elite A$119.99; (Legacy Pricing) fitbod ELITE A$91.99; (Legacy Pricing) fitbod ELITE A$11.49; (Legacy Pricing) fitbod ELITE A$69.99.
- Free trial: "After your free trial has ended, this app includes an auto-renewing subscription, which unlocks all premium workouts and features." Length not stated.
- Privacy — Data Used to Track You: Usage Data. Data Linked to You: Health & Fitness (Health, Fitness), Contact Info (Email, Name), User Content (Customer Support), Identifiers (User ID, Device ID), Usage Data (Product Interaction, Advertising Data), Diagnostics (Crash, Performance, Other).
- Account: subscription required after trial; account creation not explicitly stated.
- Description opens: "Build muscle, gain strength and lose weight with a customized workout plan just for you. Fitbod is the ultimate fitness platform made to help enhance your strength training and endurance through personalized AI workouts. You won't just get stronger—you'll do it on your terms."

### 9. JuggernautAI
- URL: https://apps.apple.com/au/app/juggernautai/id1515756471 — Seller: Juggernaut Apps, LLC — Age 18+
- IAP: JuggernautAI Monthly A$50.99 (listed twice). No annual IAP on the AU page.
- Free trial: not in description. A developer reply to a review says "You can get a free trial from our website" — i.e. trial is off-store.
- Privacy — Data Used to Track You: Purchases, Identifiers, Usage Data, Diagnostics. Data Linked to You: Contact Info (Email, Name), User Content (Customer Support), Diagnostics. Data Not Linked to You: Health & Fitness (Fitness), Purchases, Identifiers, Usage Data, Diagnostics.
- Account: Yes — "Subscribe to JuggernautAI to access all our coaching".
- Description opens: "Juggernaut Training Systems' revolutionary A.I. strength training system has arrived on iOS. Subscribe to JuggernautAI to access all our coaching and get stronger than you can imagine with The Smartest Program for You. Designed by legendary coach Chad Wesley Smith with revolutionary technology by Tim Arnold, JuggernautAI is like having the best strength coach in the world with you during every workout in the gym."

### 10. Boostcamp
- URL: https://apps.apple.com/au/app/boostcamp-gym-workout-fitness/id1529354455 — Seller: BPM Health Co. — Age 16+
- Subtitle oddity: "Anytime Pure Health: The Gym" (reads like an ASO keyword string, not a benefit line).
- IAP: Boostcamp Pro A$99.99; Boostcamp Pro A$22.99; Boostcamp Pro A$18.49; Boostcamp Pro A$129.99; Boostcamp Pro A$108.99; Boostcamp Pro A$7.99. (No period names shown.)
- Free trial: not stated.
- Privacy — Data Used to Track You: Identifiers. Data Linked to You: Identifiers (User ID, Device ID). Data Not Linked to You: Location (Coarse), Usage Data, Diagnostics, Contact Info (Email, Name).
- Account: unknown (not stated).
- Description opens: "Garage Gym Reviews' Best Workout App Overall 2026. Featured in Fortune. Free workout tracker + AI coach."

### 11. WHOOP
- URL: https://apps.apple.com/au/app/whoop/id933944389 — Seller: WHOOP — Age 16+
- Subtitle: none on the AU page.
- IAP: none listed on the AU page (membership sold with hardware, outside App Store).
- Free trial: "If you're new to WHOOP, you can try both the wearable and app free for 1 month."
- Privacy — Data Linked to You: Health & Fitness, Location, Contact Info, User Content, Identifiers, Usage Data, Sensitive Info, Diagnostics, Other Data (across advertising, analytics, personalisation, functionality). Data Not Linked to You: Diagnostics (Performance, Other).
- Account: Yes — "The WHOOP app requires a WHOOP wearable."
- Description opens: "WHOOP is the leading wearable that turns comprehensive health insights into daily action. By capturing dozens of data points every second, WHOOP delivers personalized Sleep, Strain, Recovery, Stress, and health insights—24/7. WHOOP uses those insights to provide coaching based on your body's unique physiology..."

### 12. Rise
- URL: https://apps.apple.com/au/app/rise-energy-sleep-tracker/id1453884781 — Seller: Rise Science Inc — Age 13+
- IAP: Sleep & Energy Premium A$119.99; Sleep Improvement Membership A$99.99; Sleep Improvement Membership A$14.99; Sleep Improvement Membership A$50.99; Sleep Improvement Membership A$85.99; Sleep Improvement Membership A$119.99; AI Expert Access A$49.99; Sleep Improvement Membership A$50.99; Sleep Improvement Membership A$99.99; Sleep Improvement Membership A$149.99.
- Free trial: the Premium IAP line carries a "Free Trial" tag ("Sleep & Energy Premium - Lower your sleep debt, increase your energy - Free Trial"); length not on page.
- Privacy — Data Used to Track You: Identifiers. Data Linked to You: Identifiers/Device ID (3rd-party ads), Diagnostics, Health & Fitness, Contact Info, User ID, Product Interaction, Financial Info. Data Not Linked to You: Purchase History, Performance Data, Phone Number, Other.
- Account: unknown (not stated in description).
- Description opens: "Become a better sleeper thanks to 100 years of sleep science. Teams in the NFL, MLB, NBA, MLS as well as many Fortune 500 companies trust Rise to help members achieve better sleep. FROM THE RISE COMMUNITY: ..." (third "sentence" is a testimonial header).

### 13. Athlytic
- URL: https://apps.apple.com/au/app/athlytic-ai-fitness-coach/id1543571755 — Seller: MyndArc, LLC — Age 9+
- Note: URL slug says "ai-fitness-coach" but the live AU title is "Athlytic: Fitness & Recovery" (title has been changed; slug is historical). Verified twice.
- IAP: Athlytic Pro (Yearly) A$45.99; Athlytic Pro (Monthly) A$7.99.
- Free trial: "Subscribers will receive 1 week free of Athlytic".
- Privacy: **Data Not Collected** — "The developer does not collect any data from this app."
- Account: none (all on-device from Apple Watch/HealthKit).
- Description opens: "Athlytic takes all the data that your Apple Watch collects and translates it into actionable insights. RECOVERY: We analyze your heart rate variability and resting heart rate to calculate how recovered you are and ready to train today. EXERTION and TARGET EXERTION: We monitor your cardiovascular load 24/7 and each day provide you with a Target Exertion range to stay in if you are training today based on your Recovery."

### 14. Gentler Streak
- URL: https://apps.apple.com/au/app/gentler-streak-health-tracker/id1576857102 — Seller: Gentler Stories LLC — Age 13+
- Note: slug says "health-tracker" but live AU title is "Gentler Streak Workout Tracker". Verified twice.
- IAP: Gentler Premium Yearly Family A$54.99; Gentler Premium Monthly A$13.99; Gentler Premium Yearly Family A$109.99; Gentler Premium Yearly Family A$65.99; Gentler Premium Monthly Family A$12.99; Gentler Premium Lifetime A$149.99; Gentler Premium Lifetime A$99.99; Gentler Premium Yearly A$59.99; Gentler Premium Lifetime A$299.99; Gentler Premium Lifetime A$209.99.
- Free trial: not stated.
- Privacy — Data Not Linked to You only: Location (Coarse), Purchases, Identifiers, Usage Data, Diagnostics, Other Data.
- Account: unknown; description says health data stays on device via HealthKit, no account mentioned.
- Description opens: "An award-winning health and fitness tracker offers personalized guidance that adapts to your daily capabilities and not the other way around. For those of us who want to move consistently, not constantly. Built with care by a small indie team."

### 15. Bevel
- URL: https://apps.apple.com/au/app/bevel-ai-health-coach/id6456176249 — Developer: Finerpoint, Inc; Seller: Starlight Tech LLC — Age 13+
- IAP: Bevel Pro - Monthly A$22.99; Bevel Pro - Annual A$149.99; 350 Bevel Intelligence-Credits A$7.99; 750 Bevel Intelligence Credits A$14.99; 1550 Bevel Intelligence-Credits A$29.99; 4200 Bevel Intelligence-Credits A$79.99. (Consumable AI-credit packs alongside subscription.)
- Free trial: not stated. "Bevel is available for free with the option to upgrade to Bevel Pro with an auto-renewing subscription."
- Privacy — Data Used to Track You: Identifiers. Data Linked to You: Device ID, Location, Email, Name, Product Interaction, User ID. Data Not Linked to You: Health, Fitness, Crash Data, Performance Data.
- Account: unknown (not stated; email/User ID linked suggests yes).
- Description opens: "Bevel is the #1 app for improving your health, performance, and longevity, trusted by hundreds of thousands and backed by science. From sleep and recovery to stress and strength training, Bevel transforms your health data into personalized guidance you can actually use. Whether you're training for something big or just trying to feel better day to day, Bevel helps you move smarter, recover faster, and live longer."

### 16. Fabulous
- URL: https://apps.apple.com/au/app/fabulous-daily-habit-tracker/id1203637303 — Seller: Fabulous — Age 9+
- IAP: Fabulous Premium A$61.99; Fabulous Premium A$57.99; Fabulous Annual Subscription A$70.99; Fabulous Premium Offer A$78.99; Premium Quarterly A$59.99; Fabulous Premium A$29.99; Sphere: Annually 50% Off A$91.99; Fabulous Premium A$46.99; Fabulous Premium A$27.99; Fabulous Premium A$72.99.
- Free trial: not stated.
- Privacy — Data Used to Track You: Contact Info. Data Not Linked to You: Location (Coarse), Contact Info (Name, Email), Usage Data (Product Interaction).
- Account: unknown (not stated).
- Description opens: "Welcome to the world of Fabulous. Unlock the power of habits and routines. Prioritize your mental health, build healthy habits and improve your life one step at a time."

### 17. Streaks
- URL: https://apps.apple.com/au/app/streaks/id963034692 — Seller: Crunchy Bagel Pty Ltd — Age 4+
- Price: **A$9.99 paid up front; no IAP list on the page.**
- Free trial: n/a.
- Privacy — Data Not Linked to You: Diagnostics (Crash Data) only.
- Account: none mentioned.
- Description opens: "All-new seasonal themes for Christmas, winter, summer spring and autumn. STREAKS. The to-do list that helps you form good habits. Apple Design Award winner."

### 18. Finch
- URL: https://apps.apple.com/au/app/finch-self-care-pet/id1528595748 — Seller: Finch Care Public Benefit Corporation — Age 9+
- IAP (all named "Finch Plus", no period shown): A$2.99; A$8.49; A$14.99; A$57.99; A$59.99; A$69.99; A$79.99; A$99.99.
- Free trial: not stated.
- Privacy — Data Linked to You: Identifiers (User ID, Device ID). Data Not Linked to You: Contact Info (Email), Purchases, User Content, Usage Data, Diagnostics.
- Account: unknown (not stated).
- Description opens: "Meet your new self-care best friend! Finch is a self-care pet app that helps you feel prepared and positive, one day at a time. Take care of your pet by taking care of yourself!"

### 19. I Am Sober
- URL: https://apps.apple.com/au/app/i-am-sober/id672904239 — Seller: I Am Sober LLC — Age 18+ — Category **Lifestyle** (not Health & Fitness)
- IAP: 12 Months A$54.99; 1 Month A$16.49; 1 Month A$13.99; 6 Months A$36.99; 12 Months A$24.99; 6 Months A$36.99; 12 Months A$54.99; I Am Worthy A$1.99; I Am Letting Go A$1.99; I Am Killing It A$1.99. (Last three are one-off cosmetic packs.)
- Free trial: boilerplate "free trial period, if offered" only.
- Privacy — Data Linked to You: Contact Info (Email), User Content (Photos/Videos, Customer Support, Other), Identifiers (User ID, Device ID), Usage Data (Product Interaction), Diagnostics (Crash, Performance, Other).
- Account: mentioned — "When you create an account and declare your addiction, you can instantly see a withdrawal timeline." Also "I Am Sober is free to use, but you can support development of the app with a subscription to Sober Plus."
- Description opens: "I Am Sober is more than just a free sobriety counter app. Along with tracking your sober days, it helps you build new habits and provides ongoing motivation by connecting you to a wide network of people all striving for the same goal: staying sober one day at a time. Through our growing sober community you can learn from others and contribute by sharing insights and tactics that have worked for you."

### 20. Reframe
- URL: https://apps.apple.com/au/app/reframe-drink-less-thrive/id1485756576 — Seller: Glucobit Inc. — Age 18+
- IAP: Reframe Silver (Monthly) A$35.99; Reframe Silver (Annual) A$174.99; Reframe Access (Monthly) A$19.99; Reframe Access (Yearly) A$113.99; Reframe Premium A$149.99; Reframe (Annual) A$199.99; Reframe (Annual) A$149.99; Reframe (Annual) A$199.99; Reframe (Monthly) A$39.99; Reframe (Annual) A$199.99.
- Free trial: "Try Reframe FREE for 7 days, and Reframe the way you think and drink."
- Privacy — Data Used to Track You: Identifiers. Data Linked to You: Identifiers (Device ID). Data Not Linked to You: Usage Data, Location (Coarse), Contact Info (Email, Name), User Content, Identifiers (User ID), Diagnostics (Crash).
- Account: subscription required — "Reframe currently offers auto-renewing subscriptions for accessing the app."
- Description opens: "Reframe is the #1 alcohol reduction app, built to help you drink less and live more. Whether your goal is to cut back or quit drinking entirely, Reframe's neuroscience approach can help you change the way alcohol shows up in your life. With a core 160-day, evidence-based, education program, progress tracking, a private community, and a multitude of tools (think meditations, games, and more!), you've got everything you need to change your relationship with booze at the click of a button."

### 21. Pelago (formerly Quit Genius) — STILL EXISTS on AU store
- URL: https://apps.apple.com/au/app/quit-genius-quit-addiction/id1234288038 (slug still "quit-genius", same app ID; title now "Pelago Health") — Seller: Digital Therapeutics Ltd — Age 18+
- IAP (legacy Quit Genius SKUs still listed): Quit Genius Plus A$63.99; Quit Genius Silver Trial A$21.99; Quit Genius Silver A$21.99; Quit Genius Silver A$38.99; QG Premium A$14.99; Quit Genius Gold A$58.99; QG Premium A$18.49; QG Premium A$40.99; Quit Genius Plus A$15.49; Quit Genius Silver A$229.99.
- Free trial: not stated in description (an IAP is named "Silver Trial").
- Privacy — Data Linked to You: Usage Data (Product Interaction), Health & Fitness (Health), Contact Info (Name, Email), User Content (Customer Support). Data Not Linked to You: Diagnostics (Crash, Performance, Other).
- Account: Yes — B2B/employer model: "If Pelago is included in your benefits, you can activate your membership today!"; "download the app and log in to get started"; "Pelago may be available at no cost to you through your employer, benefits provider, or health plan."
- Description opens: "Pelago provides virtual support for those looking to rethink their habits with alcohol, tobacco, opioids, or cannabis. Pelago helps members work toward goals such as: ‣ Rethinking alcohol use (practicing mindful drinking, drinking less, or quitting) ‣ Quitting or reducing tobacco/nicotine use (cigarettes, vaping, smokeless tobacco, cigars, etc.)"

### 22. one sec
- URL: https://apps.apple.com/au/app/one-sec-screen-time-focus/id1532875441 — Seller: riedel.wtf apps S.L. — Age 9+
- IAP: one sec pro (1 Year) A$29.99; one sec pro (1 Month) A$4.99; one sec pro | Lifetime A$149.99; one sec pro | Family Plan (1 Month) A$7.99; one sec pro | Family Plan (1 Year) A$54.99; one sec pro | Family Lifetime A$229.00.
- Free trial: not stated. "Using one sec with one app of your choice if completely free, for more you'll need to purchase one sec pro" (sic — typo on the listing).
- Privacy — Data Not Linked to You: Usage Data (Product Interaction) only.
- Account: none mentioned.
- Description opens: "Willpower is not enough against social media algorithms! That's why I made one sec: one sec adds friction to distracting apps to make them less appealing…long-term! This principle works really well: we have gained scientific evidence in numerous research studies with the Max-Planck Institute, with the German and Danish government, and in dozens more scientific collaborations: one sec has incredible effects on your screen time: app usage drops by 57% on average!"

---

## Cross-batch observations (facts only, from the pages above)

- Only **Athlytic** carries the "Data Not Collected" label. **Streaks**, **one sec** and **Gentler Streak** are "Data Not Linked to You" only.
- Only **Streaks** is a paid-upfront app (A$9.99, no IAP). **Sunsama** and **WHOOP** are free with no App Store IAP (billed off-platform).
- Free trials stated in description text: Motion (7 days), Athlytic (1 week), Reframe (7 days), WHOOP (1 month, hardware bundle), Fitbod (length not stated), Rise (tag only, length not stated).
- Lifetime SKUs on the AU page: Structured A$129.99; Hevy A$119.99; Strong "Forever" A$129.99/A$149.99; Gentler Streak A$99.99–A$299.99; one sec A$149.99 (A$229.00 family).
- Annual-only-visible price points: Motion A$499.99; Akiflow A$199.99/A$399.99; Reframe A$113.99–A$199.99; Bevel A$149.99; Fitbod A$119.99/A$149.99; Rise A$99.99–A$149.99; I Am Sober A$24.99/A$54.99; Structured A$14.99–A$34.99; Hevy A$38.99; Strong A$32.99–A$45.99; Athlytic A$45.99; Gentler Streak A$59.99; one sec A$29.99.
- Title length: 8 of 21 listed apps use the full 30 chars; 3 use bare brand names (Sunsama 7, WHOOP 5, Streaks 7, JuggernautAI 12).
- Category: everything is Health & Fitness or Productivity except **I Am Sober** (Lifestyle).

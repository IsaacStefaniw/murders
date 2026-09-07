# Search demand for IntentNorth — what the data says

Written 2026-09-07 against `docs/SEO_RESEARCH_BRIEF.md`, from a session with
live access to Google Trends, Google Ads Keyword Planner, the Australian
Google results page and the Australian App Store.

Every number below names its tool. Where a figure could not be sourced it says
**unknown**. Nothing is estimated.

## Tools used, and their limits

| Tool | What it gave | Limit |
|---|---|---|
| Google Trends (trends.google.com, explore endpoint, `hl=en-US`, fetched 7 Sep 2026) | Relative interest 0–100, five-year and twelve-month, AU / US / GB; related and rising queries | Relative only. Five terms per comparison, so every batch carries "habit tracker" as an anchor to cross-compare. Terms below Trends' threshold read 0. The 2026 "year" is January–September only, so it is January-heavy. |
| Google Ads Keyword Planner (Steam Saunas Australia account, plan "Plan from Sep 7, 2026", Aug 2025–Jul 2026, Google Search, all languages) | Average monthly searches, year-on-year change, competition, top-of-page bid | Exact averages because the account has spend history. "—" is Google's own "not enough data" (under roughly 10 a month). The plan is a saved draft in that account; nothing was created or spent. |
| google.com.au (`hl=en-AU`, `gl=au`, not signed in, in-app Chromium, 7 Sep 2026) | Who ranks, whether an AI Overview fires | One SERP per query on one day; personalisation off. |
| Apple iTunes Search API (`itunes.apple.com/search`, `country=au`, `entity=software`) | Which apps rank for a term in the Australian App Store, with rating counts | Ranking only; no search volumes. Apple's autocomplete hints endpoint returned empty. |
| apps.apple.com/au listings (fetched 7 Sep 2026) | Titles, subtitles, in-app purchase prices, privacy labels | Static page; in-app paywalls not visible. |
| Similarweb free pages (data month July 2026) | Total visits, last three months, per competitor | Estimates; three-month totals, not monthly. |
| Ahrefs free keyword generator | Tried for "habit tracker" (AU); returned no results and no error | Not usable without an account. **No App Store ASO tool** (AppFigures, Sensor Tower, MobileAction, AppTweak, Apple Search Ads popularity) was reachable without creating an account, so App Store search volumes are **unknown** throughout. |
| WebSearch / WebFetch (US-biased engine) | Competitor content hubs, vendor pages, published AI Overview studies | Marked where a US SERP is used instead of an AU one. |

---

## 1. One page: what category are we, and what do people type?

**People type "habit tracker", "fitness app", "meditation app" and "weekly
planner". They do not type "life planner", "wellness app", "routine app" or
anything with "evidence" in it.**

Keyword Planner, Australia, average monthly searches (Aug 2025–Jul 2026):

| Term | AU/month | YoY | US/month |
|---|---|---|---|
| weekly planner | 5,400 | −18% | 22,200 |
| habit tracker | 2,400 | 0% | 18,100 |
| fitness app | 2,400 | +46% | 27,100 |
| meditation app | 2,400 | +177% | 40,500 |
| health app | 1,000 | −12% | 9,900 |
| productivity app | 1,000 | +171% | 14,800 |
| sleep app | 880 | 0% | 9,900 |
| habit tracker app | 720 | +50% | 6,600 |
| workout app | 720 | −18% | 8,100 |
| daily planner app | 390 | +22% | 2,400 |
| habit app | 210 | −33% | 1,600 |
| life planner | 210 | −19% | 1,900 |
| workout plan app | 210 | −19% | 1,900 |
| wellness app | 170 | +56% | 3,600 |
| weekly planner app | 170 | −18% | 720 |
| routine app | 170 | −33% | 880 |
| personal trainer app | 140 | 0% | 1,300 |
| evidence based fitness | 20 | 0% | 170 |
| training program app | 20 | 0% | 30 |
| evidence based health | 10 | 0% | 10 |

Google Trends agrees on the order. Five years, Australia, normalised so
"habit tracker" = 1.0 (each batch anchored on it): health app 11×, fitness app
5×, workout plan 4.6×, sleep app 3.8×, weekly planner 3.6×, workout app 2.3×,
meditation app 1.0×, life planner 0.7×, productivity app 0.3×, wellness app
0.3×, routine app 0.25×, habit app 0.2×, evidence based health 0.2×, and
personal trainer app / workout plan app / training program app / daily planner
app / evidence based fitness all at 0 (below threshold).

Three things qualify that table:

- **"weekly planner" is stationery intent.** Trends' related queries for
  "habit tracker" (AU, 12 months) are "habit tracker template" (35),
  "habit tracker journal" (26), "habit tracker pdf" (24, rising +300%); the
  App Store search for "weekly planner" returns calendar and diary apps. The
  5,400 is real but most of it is not looking for an app.
- **"health app" and "sleep app" are Apple and Google.** Related queries for
  "health app": "apple health" (81), "apple health app" (76), "google health
  app" (55, rising +150%); for "sleep app": "apple sleep app" (68), "apple
  watch sleep app" (32). Trends shows "health app" doubling in 2026 (yearly
  average 37.1 → 74.5) and "sleep app" rising (37.9 → 66.3); that is platform
  noise, not a category opening.
- **"meditation app" and "productivity app" are the risers** in Keyword
  Planner (+177% and +171% year on year in Australia) but Trends' five-year
  line for "meditation app" is flat (10.7, 10.5, 10.1, 7.8, 10.4, 10.4 by
  year), so treat the Keyword Planner jump as one year's movement, not a
  trend.

**Which term is rising, which is dying (Trends, AU, yearly averages
2022 → 2025 → 2026 part-year):**

| Term | 2022 | 2025 | 2026 (Jan–Sep) | Reading |
|---|---|---|---|---|
| habit tracker | 13.3 | 18.7 | 22.2 | steady rise |
| fitness app | 32.2 | 44.1 | 57.8 | rising |
| workout app | 28.7 | 40.0 | 54.8 | rising |
| routine app | 0.2 | 1.8 | 7.9 | rising from nothing |
| life planner | 1.7 | 2.3 | 3.6 | small, rising |
| meditation app | 10.5 | 10.4 | 10.4 | flat |
| productivity app | 0 | 0.7 | 4.6 | tiny, rising |
| wellness app | 0.3 | 0.4 | 3.7 | tiny |
| evidence based health | 2.0 | 1.4 | 6.1 | tiny |

Nothing in the category list is dying; the small terms were never alive.

**The App Store answer (iTunes Search API, Australia, 7 Sep 2026).** The
search "habit" returns Habit Tracker: planner routine (12,541 ratings), HabitKit,
Onrise, Finch (29,719), Atoms, Structured (14,711), Productive, Done. "routine"
returns Structured, Habit Tracker: planner routine, Me+ Lifestyle Routine
(19,073), Routine Planner, Finch. "life planner" returns Structured, then apps
with 0–2 ratings. "coach" returns The Coach (men's health), Louis Vuitton, H&M,
TrueCoach, Nike Run Club: the word carries no shelf. "evidence based" returns
Evidence-Based Policing and a medicine guide.

**So: the category is "habit and routine planner", sold as Health & Fitness
with Productivity secondary, which is what `docs/APP_STORE.md` already has.**
The shelf IntentNorth sits on in the store is the one Structured, Habit
Tracker: planner routine, Me+ and Finch occupy. The words that carry search
are *habit*, *routine*, *planner*, *sleep*, *training*, *fitness*. "Seven
coaches", "profile", "evidence" and "life" carry none.

**Problem terms, in people's own words** (Keyword Planner AU / US):

| Term | AU | US |
|---|---|---|
| overwhelmed | 8,100 (−19%) | 74,000 |
| burnout | 5,400 (−33%) | 40,500 |
| how to build a routine | 30 | 320 |
| how to stick to a routine | 10 | 110 |
| no time to exercise | 10 | 50 |
| how to plan my week | 10 | 20 |
| too much to do | 10 | 110 |
| how to fit exercise into a busy week | — | — |
| why can't I stick to a routine | — | — |

Trends (AU, five years, anchor "habit tracker" = 3): burnout 59, overwhelmed
17, too much to do 15; the four "how to" phrasings all read 0. "too much to
do" has doubled over five years (yearly 10.9 → 22.6) and "burnout" has risen
(45.1 → 75.6), but both are diagnostic words, not app-shopping words, and
"burnout" peaks in March–May in Australia (monthly averages 62.2 and 65.6
against 52.5 in December), not in January. The brief's phrasings of the pain
("fit exercise into a busy week", "can't stick to a routine") are not how
anyone types it; nobody types it. The pain is searched as a noun.

### Seasonality (Trends, AU, five-year monthly averages)

| Term | Jan | Feb–Nov average | Dec | Jul | Aug | January lift |
|---|---|---|---|---|---|---|
| habit tracker | 29.9 | 13.5 | 25.6 | 15.6 | 14.0 | 2.2× |
| workout app | 50.9 | 35.7 | 41.6 | 34.5 | 34.5 | 1.4× |
| fitness app | 51.8 | 38.5 | 43.5 | 35.6 | 37.4 | 1.35× |
| meditation app | 12.5 | 9.6 | 9.6 | 9.0 | 8.2 | 1.3× |
| gym | 29.9 | 27.0 | 27.3 | 28.0 | 28.6 | 1.1× |
| sleep app | 41.4 | 38.3 | 35.8 | 37.0 | 34.8 | 1.1× |
| diet | 15.5 | 13.7 | 11.9 | 12.5 | 13.5 | 1.1× |

- **January is sharp for habit terms**: "habit tracker" runs at twice its
  Feb–Nov level in January and is already up in December (the Dec 28 2025 –
  Jan 11 2026 weeks are the five-year peak). Workout and fitness app terms
  lift 35–40%. The App Store shelf will be most crowded and most searched in
  the first two weeks of January.
- **There is no new-financial-year bump** for any app term (July sits at or
  below the Feb–Nov average for all of them).
- **A modest late-July/August bump exists for "gym" only**: the weeks of 2 and
  9 August 2026 scored 35 against the January peak of 37, and the five-year
  July–August average is about 5% above May–June. It does not show for any
  app term.
- **Back-to-school** in Australia is late January and is inside the January
  spike; it cannot be separated from it in this data.
- Launch timing: the data says an app in this category wants to be listed,
  with ratings, before the second week of December. A September launch has
  three months to collect them.

### Rising queries (Trends, AU, last 12 months)

- habit tracker: "habit tracker pdf" +300%, "habitify" +170%, "loop habit
  tracker" +70%, "best habit tracker" +50%.
- workout app: "hevy app" +130%, "hevy" +100%, "macrofactor workout app"
  +100%, "free calisthenics workout app" +40%.
- sleep app: "better sleep app free" (breakout), "google health app" +900%,
  "sleep app iphone" +70%, "sleep score app" +60%.
- fitness app: "cronometer" (breakout), "fitness first app" +80%, "ladder
  fitness" / "ladder app" +50%.
- cold plunge: "benefit of cold plunge" (breakout), "cold plunge machine"
  +350%, "what is cold plunge" +100%, "cold plunge at home" +80%, "cold
  plunge australia" +70%.
- magnesium sleep: "magnesium glycinate and sleep" +140%, "magnesium
  glycinate benefits" +130%, "nutra life magnesium sleep" +70%, "sleep
  supplements" +50%.
- zone 2: "whats zone 2 cardio" +350%, "what is zone 2 exercise" +160% (the
  rest of the rising list is Pokémon Legends Z-A "wild zone 2"; the term is
  polluted).
- morning light: the top and rising queries are a studio, a café, a lamp and
  two song lyrics. Nobody in Australia searches "morning light" meaning the
  practice.

The two app names rising inside category terms are Hevy and Habitify. Ladder
and Cronometer are the other breakout brands. None of the eight apps in the
brief's teardown list appear as a rising query except Hevy and MacroFactor.

---

## 2. The keyword table

Keyword Planner, Aug 2025–Jul 2026 averages. "Comp" is Google's ad
competition. "AU bid" is the top-of-page high-range bid in A$, a rough proxy
for commercial value. "Top three" is the Australian SERP on 7 Sep 2026 (organic
results only; AI Overview noted separately). Difficulty scores from an SEO
tool were **unknown** (no tool access); the SERP column stands in.

### 2.1 Category

| Keyword | AU/mo | US/mo | Comp | AU bid | Intent | Top three, AU |
|---|---|---|---|---|---|---|
| habit tracker | 2,400 | 18,100 | High | 3.21 | commercial/navigational (templates, apps) | unknown (not checked) |
| best habit tracker app | 110 | 1,900 | Low | 4.36 | commercial | zapier.com, reddit r/productivity, habitbox.app, then habi.app, drginacleo.com |
| best habit app 2026 | (≈ "best habit app" 40) | 210 | Medium | 3.84 | commercial | habitbox.app, habi.app, reddit r/ProductivityApps, singularity-app.com, loggd.life |
| fitness app | 2,400 | 27,100 | Low | 8.70 | navigational/commercial | unknown |
| best fitness app australia | 70 | 10 | Medium | 7.65 | commercial | gymandfitness.com.au, pedestrian.tv, reddit r/AussieFrugal, au.pcmag.com, fitness.edu.au |
| meditation app | 2,400 | 40,500 | Low | 8.70 | navigational | unknown |
| sleep app | 880 | 9,900 | Medium | 5.30 | navigational (Apple) | unknown |
| best sleep app | 260 | 1,900 | High | 6.77 | commercial | unknown |
| workout app | 720 | 8,100 | Medium | 6.83 | commercial | unknown |
| best workout app | 720 | 12,100 | Medium | 7.64 | commercial | unknown |
| productivity app | 1,000 | 14,800 | Low | 10.65 | informational/commercial | unknown |
| daily planner app | 390 | 2,400 | Low | 5.49 | commercial | unknown |
| weekly planner | 5,400 | 22,200 | High | 3.78 | mixed, mostly printable | unknown |
| routine app | 170 | 880 | Low | 4.41 | commercial | unknown |
| personal trainer app | 140 | 1,300 | Medium | 13.81 | commercial | unknown |
| wellness app | 170 | 3,600 | Low | 11.24 | informational | unknown |
| sleep debt | 1,600 | 22,200 | Low | 6.89 | informational | unknown |
| deep work | 1,000 | 8,100 | High | 15.93 | informational | unknown |

### 2.2 Comparison

| Keyword | AU/mo | US/mo | Comp | Intent | Top three, AU | Winnable? |
|---|---|---|---|---|---|---|
| whoop alternative | 590 | 2,400 (+21%) | High | commercial | reddit r/whoop (×2), whoopalternatives.com, then YouTube, bodly.app blog, myonpulse.com | **Yes.** The organic winners are a one-page affiliate site and two small app blogs. This is the one commercial keyword with real Australian volume and a soft SERP. |
| is whoop worth it | 480 | 3,600 | Low | commercial | unknown | likely; same audience |
| hevy vs strong | 70 | 390 (+23%) | Low | commercial | unknown | small |
| best habit tracker app | 110 | 1,900 | Low | commercial | Zapier, Reddit, HabitBox, habi.app | Partly: HabitBox and habi.app are apps ranking their own listicles; the Zapier/Reddit slots are not movable. |
| noom alternative | 10 | 170 (+129%) | High | commercial | unknown | no AU volume |
| apps like noom | 10 | 40 | High | commercial | reddit r/Noom, Healthline, fitia.app, sydney.edu.au | no AU volume |
| fitbod alternative | 10 | 110 | Low | commercial | unknown | no AU volume |
| fitbod vs | 10 | 40 | — | commercial | unknown | no AU volume |
| headspace alternative | 10 | 50 | Low | commercial | unknown | no AU volume |

Flag: the "best habit tracker app" and "best habit app 2026" SERPs are
listicles by apps (HabitBox, habi.app, loggd.life, Singularity) rather than
affiliate sites, with Zapier and Reddit above them. That is the pattern the
brief asked to flag: winnable by a small site with an honest comparison, and
the honesty angle differentiates because every listicle there is self-ranked
first.

### 2.3 Evidence long tail

| Keyword | AU/mo | AU YoY | US/mo | Comp | Top three, AU (organic) | AI Overview, AU |
|---|---|---|---|---|---|---|
| magnesium for sleep | 8,100 | −18% | 110,000 | High | unknown | unknown |
| does magnesium help you sleep | 590 | −18% | 33,100 | Low | mcpress.mayoclinic.org, sleepfoundation.org, reddit r/sleep; then NIH PMC, Cleveland Clinic, swisse.com.au | triggered |
| sauna benefits | 3,600 | +23% | 40,500 | Medium | unknown | unknown |
| does sauna actually work | (≈ "does sauna work" 10) | 70 | Low | healthline.com, NIH PMC, bbc.com; then Mayo, Harvard, vikasati.com.au | triggered |
| cold plunge benefits | 480 | +50% | 14,800 | Low | unknown | unknown |
| does cold plunge work | 10 | −67% | 320 | Low | — | — |
| does cold plunge actually work | 10 | −100% | 30 | — | mayoclinichealthsystem.org, health.harvard.edu, health.clevelandclinic.org; then reddit r/science, NIH PMC, heart.org, lung.org, hubermanlab.com | triggered |
| what is zone 2 | 390 | 0% | 2,400 (+50%) | Low | unknown | unknown |
| zone 2 cardio benefits | 20 | +100% | 320 | Low | unknown | unknown |
| is zone 2 worth it | 10 | new | 10 | Low | reddit r/running, **AI Overview**, reddit r/triathlon; then YouTube (GCN, Roadman), gq.com, builtforathletes | **rendered** (cites Road Cycling Academy, GCN) |
| does creatine work | 260 | −34% | 2,400 | Low | unsw.edu.au, NIH PMC, my.clevelandclinic.org; then Harvard, Mayo | triggered (query "does creatine actually work") |
| is creatine worth it | 170 | 0% | 1,000 | Low | unknown | unknown |
| does intermittent fasting work | 170 | −46% | 6,600 | Low | hopkinsmedicine.org, NIH PMC, dietitiansaustralia.org.au; then Harvard, abc.net.au, Mayo | triggered |
| cyclic sighing | 140 | +55% | 880 | Low | unknown | unknown |
| morning sunlight benefits | 70 | 0% | 720 | Low | unknown | unknown |
| is morning light good for sleep | — | — | — | — | NIH PMC, webmd.com, time.com; then sleepfoundation.org, ouraring.com, YouTube (Huberman Lab Clips, FoundMyFitness), imb.uq.edu.au | triggered |
| morning light sleep | — | — | — | — | | |
| does meditation work | 50 | −43% | 720 | Low | unknown | unknown |
| walking after eating benefits | 40 | +150% | 880 | Low | healthline.com, NIH PMC, onepeloton.com; then Cleveland Clinic, YouTube, goodrx.com (query "is walking after eating good for you") | triggered |
| does journaling help | 20 | 0% | 260 | Low | reddit r/Journaling (×3), Quora, medium.com; then lifeline.org.au (query "does journaling actually help") | triggered |
| does box breathing work | 10 | 0% | 90 | Low | unknown (US engine: calm.com #1) | unknown |
| do cold showers work | 10 | 0% | 40 | Low | unknown | unknown |
| protein breakfast benefits | 10 | 0% | 30 | Low | unknown | unknown |
| caffeine cutoff time | 10 | new | 30 | Low | unknown | unknown |
| are habit trackers effective | 10 | new | 10 | Low | unknown | unknown |
| how to build a routine that sticks | (≈ 30) | 320 | Low | wondermind.com, reddit r/getdisciplined, medium.com; then gretchenrubin.com, inspirehm.com.au | triggered |

Trends, for the topic words rather than the question (AU, five years,
anchor "habit tracker" = 6): zone 2 = 50, magnesium sleep = 34, cold plunge =
15, morning light = 9. Yearly: zone 2 still rising (23 → 80), magnesium sleep
rising (14 → 58), creatine booming (16 → 81), cold plunge flat since 2023
(17.6 → 20.9), intermittent fasting falling (11.4 in 2023 → 5.4). The
question forms "does cold plunge work", "is zone 2 worth it", "morning
sunlight sleep" all read 0 in Trends against "does magnesium help sleep" = 6.
US is the same shape (Trends US five years: does cold plunge work 0, is zone 2
worth it 0, does magnesium help sleep 14, does creatine work 12).

### 2.4 Local

| Keyword | AU/mo | US/mo | Note |
|---|---|---|---|
| budgeting app australia | 880 (+22%) | 10 | Money is the only area where "australia" is part of the query. Frollo, WeMoney, Up own it. |
| best fitness app australia | 70 | 10 | SERP: gymandfitness.com.au, Pedestrian, Reddit r/AussieFrugal, PCMag AU. |
| meal planner app australia | 40 (+40%) | 10 | |
| habit tracker app australia | — | — | Google itself drops "australia" from the query ("Missing: australia"); same SERP as the global term. |
| personal trainer app australia | — | — | |

Australia changes nothing for habit, planner or evidence terms. It changes
the picture only for money (and the brand names: "magnesium sleep chemist
warehouse" and "nutra life magnesium sleep" appear in the AU rising list,
"swisse.com.au" ranks for the magnesium question).

---

## 3. The evidence-lookup hypothesis, tested

The brief asked three questions.

**1. Is there meaningful volume on "does X work" queries?** Not in the
question form, not in Australia. Of 25 question-form keywords checked in
Keyword Planner, one has real Australian volume ("does magnesium help you
sleep", 590 a month) and three sit at 170–260 ("does creatine work", "is
creatine worth it", "does intermittent fasting work", the last falling 46%).
Everything else is 10–50 a month or below Google's reporting floor: "does
cold plunge work" 10, "is zone 2 worth it" 10, "does sauna work" 10, "does box
breathing work" 10, "is morning light good for sleep" no data. The US is
25–60× larger on the same terms (33,100 for the magnesium question) but the
launch is Australia.

The volume lives one step up, in the topic noun: "magnesium for sleep" 8,100,
"sauna benefits" 3,600, "sleep debt" 1,600, "deep work" 1,000, "cold plunge
benefits" 480, "what is zone 2" 390, "cyclic sighing" 140. Of the 177
practice titles, roughly thirty map onto a topic term with 100+ Australian
searches a month (the mapping is in section 3.1).

**2. Who ranks?** On the Australian SERP, checked 7 Sep 2026, the organic top
three for every evidence question were some combination of Mayo Clinic,
Harvard Health, Cleveland Clinic, Johns Hopkins, NIH/PMC papers, Healthline,
Sleep Foundation, WebMD, Time, and Reddit threads. Reddit ranked first for
"is zone 2 worth it" and "does journaling actually help", and appears in the
top six on eight of the ten evidence SERPs. Australian sites that appear:
UNSW (creatine), Dietitians Australia and ABC News (fasting), UQ IMB (morning
light), Swisse (magnesium), Vikasati bathhouse (sauna), Lifeline
(journaling). The only apps on any of these pages are Oura (morning light),
Huberman Lab (cold plunge), Calm (box breathing, US engine) and Peloton
(walking after eating). None of Whoop, Fitbod, Rise, MacroFactor, Hevy,
Sunsama, Headspace or Noom rank for any of the ten questions.

That SERP is not winnable for a new domain inside a year on the head
questions. The domain authorities are hospitals and journals, and the
non-authority slots are Reddit and YouTube, neither of which a website can
take.

**3. Are AI Overviews eating these queries?** Yes, on the Australian SERP,
for every query tested. Fourteen of fifteen queries (all ten evidence
questions, "best habit tracker app", "whoop alternative", "apps like noom",
"how to build a routine that sticks", "no time to exercise") carried an AI
Overview block; the fifteenth ("best habit app 2026") showed the placeholder
only. On thirteen of them the block read "Can't generate an AI overview right
now. Try again later", which is Google's failure state for a query it decided
to answer, not an absence; on "is zone 2 worth it" the overview rendered in
full, above the second organic result, citing Road Cycling Academy and a GCN
video. Read that as: Google attempts an AI answer on essentially all of these
queries in Australia.

Published measurements of what that does to clicks, all sourced in
`docs/research/seo/evidence_tool_landscape.md` (URLs there and in section 9):

| Study | Finding |
|---|---|
| Pew Research Center, 22 Jul 2025, 900 US adults, 68,879 searches | Users clicked a result on 8% of searches with an AI summary vs 15% without; 1% clicked a link inside the summary; question-format searches produced a summary 60% of the time. |
| Ahrefs, Apr 2025, 300k keywords | Position-1 click-through fell 34.5% where an AI Overview shows. |
| Ahrefs rerun, Dec 2025 data (reported Feb 2026) | The reduction is now 58%. |
| Ahrefs triggers study, 146M SERPs, Sept 2025 | AI Overviews on 20.5% of all keywords, 43.0% of Health, 44.1% of Medical, 57.9% of question queries. |
| BrightEdge, 24 Dec 2025, healthcare keyword set | 59% (Dec 2023) → 84% → 89% (Dec 2025) of healthcare keywords carry an AI Overview; treatment queries 100%. |
| Seer Interactive, Nov 2025, 25.1M impressions | Organic CTR 0.61% with an AI Overview vs 1.62% without; being cited inside the overview lifts organic CTR 35%. |
| Australia | AI Overviews launched 28–29 Oct 2024 (Google blog; Cloud Clicks). No sourced Australian prevalence figure exists; the one number in circulation (55–57%, Optimise Online, Mar 2026) cites nothing. **unknown** |

**Verdict: change it, then build it.** Drop the idea that 177 "does X work"
pages will bring search traffic in Australia; the queries are tiny in the
question form, the topic-form SERPs belong to hospitals and Reddit, and Google
answers the question inline before the first blue link. Keep the evidence
lookup for three reasons the data does support:

1. **It is the product's argument, stated where the App Store description
   cannot.** No competitor shows a grade (section 6 and section 7, confirmed
   across 21 apps and eight websites). A page per practice with grade,
   mechanism, source and safety line is the proof behind "graded A to E";
   the site currently says it and shows nothing. That is a conversion asset
   for the traffic the site already gets, not a traffic asset.
2. **It is the kind of page an AI Overview cites**, and citation is the
   only search upside left on these queries (+35% CTR when cited, Seer). A
   short, sourced, plain-English answer with a named study is closer to
   what the overview wants than a 2,000-word Healthline article. There is no
   guarantee; nobody has measured citation odds for a new domain.
3. **Thirty of the 177 sit on topic terms with real Australian volume**
   (section 3.1). Those thirty are where the pages should be written first,
   titled with the topic noun ("Magnesium for sleep: what the evidence says",
   grade C), not the question.

What not to do: 177 thin pages generated from the protocol data. The brief's
own constraint rules it out, and the SERP evidence says it would not rank
anyway. Thirty hand-finished pages plus a client-side search over all 177
(the data is already in `protocols.ts`; a static JSON and a few hundred
lines of JavaScript, no server) is the shape.

### 3.1 The thirty practices with search demand behind them

Mapped from the 177 titles in `src/features/knowledge/protocols.ts` (and the
money, people, habits, work and supplement files) to the topic term people
actually type. Volumes are Keyword Planner AU monthly; grade is the app's
`evidenceLevel`.

| Practice (grade) | Topic term | AU/mo | Note |
|---|---|---|---|
| Magnesium (supplements file, grade per file) | magnesium for sleep | 8,100 | Largest single term; rising "magnesium glycinate" variants. YMYL; supplement. |
| Sauna sessions (C) | sauna benefits | 3,600 | +23% YoY |
| Strength training (A) | strength training | Trends AU 12m: 15 vs cold plunge 4 | KP not queried |
| Anchored wake time (B) / sleep need | sleep debt | 1,600 | +46%; Rise's term, Rise absent from SERPs |
| Deep work block (D) | deep work | 1,000 | High competition, A$15.93 bid |
| Easy cardio, talking pace (B) | what is zone 2 | 390 | plus "zone 2 cardio benefits" 20, +100% |
| Creatine (supplements) | does creatine work / is creatine worth it | 260 / 170 | Trends: creatine 16 → 81 over five years |
| Cold-shower finish (C) | cold plunge benefits | 480 | +50%; "cold plunge australia" rising |
| Hold the eating window (C) | does intermittent fasting work | 170 | falling −46% |
| Cyclic sighing (B) | cyclic sighing | 140 | +55% |
| Morning light (B) | morning sunlight benefits | 70 | the practice term is polluted; "morning light" is a lamp |
| Ten minutes of stillness (B) | does meditation work | 50 | |
| Post-meal walk (B) | walking after eating benefits | 40 | +150% |
| Five-minute journal (B) | does journaling help | 20 | Reddit owns it |
| Wind-down breathing (B) | does box breathing work | 10 | |
| Caffeine cutoff (B) | caffeine cutoff time | 10 | new |
| Protein-first breakfast (B) | protein breakfast benefits | 10 | |
| Hard intervals (B) | vo2 max | Trends AU 12m: 32 vs zone 2 46 | KP not queried |
| Read your own baseline (C) | hrv | Trends AU 12m: 77 vs zone 2 46 | KP not queried |
| Weekly money check-in (D), Payday transfer (A) | budgeting app australia | 880 | money is the only local term |
| Decide before you arrive (C), Set the default (B) | meal planner app australia | 40 | |
| The daily walk (B) | daily step floor / 10,000 steps | unknown | not queried |
| Ten-minute mobility (D) | mobility | Trends AU 12m: 33 vs creatine 67 | |
| Targeted long-hold stretching (B) | stretching | Trends AU 12m: 10 | |
| Alcohol cutoff (B), Planned drink-free days | (Reframe's quiz owns "am I drinking too much") | unknown | route to help required |
| Short nap, early (C) | unknown | | not queried |
| Lights down (C), Warm shower cool room (B) | sleep hygiene | Trends AU 12m: 7 vs cold plunge 13 | |
| Kitchen closes (C), The kitchen shutdown | unknown | | |
| Weekly two-of-you check-in (E), State of us (C) | date night | Trends AU 12m: 16 vs cold plunge 4 | |
| The device-free family meal (C) | unknown | | |

The remaining 147 titles ("Name one thing", "The standing thing", "Ship it
monthly", "Fear-setting", "The blank page") are IntentNorth's own names for
practices and match no query. They belong in the client-side search, not on
their own URLs.

---

## 4. The free tool: evidence lookup or week audit

**Demand.** The week audit has none to measure: "how to plan my week" is 10
searches a month in Australia (20 in the US), "why can't I stick to a
routine" has no data, "how to build a routine" is 30. The evidence lookup has
the topic-term demand in section 3.1 and nothing in the question form.

**Who has done either well.**

- Evidence lookup: Examine.com is the only consumer site that grades
  interventions (A–F per intervention–outcome pair, with a consistency
  score), and it covers supplements and nutrition, not practices, and the
  grades are paid (Examine+). Ahrefs' case study on it reports over 1M
  monthly Google visits with no link outreach and a single L-theanine page
  with over 1,000 backlinks; Semrush's free preview shows 464–511K visits a
  month in May–June 2026. Consensus.app (yes/possibly/mixed/no meter on
  papers, 20 free searches a month) and Cochrane plain-language summaries
  (free, GRADE certainty in prose) are the other two. Nobody grades
  lifestyle practices free with a mechanism and a safety note.
- Week audit: no incumbent. The nearest things are Wheel of Life scorecards
  (wheeloflife.io, lifewheel.us, 101planners.com, loggd.life, all small
  sites, most with no email gate) and life-audit quizzes (lifeauditscore.com,
  36 questions, free). App onboarding quizzes (Noom's 113-screen survey, email
  gate one-third in; Fabulous; ZOE) are paid-acquisition funnels, not
  indexable pages, and Noom's does not rank for "weight loss quiz".

**Do free-tool pages rank in this space?** Single-purpose calculators do,
for one head term each: tdeecalculator.net ranks first in the US for "tdee
calculator" with 214K monthly visits from that keyword and about 2,000
backlinks (Similarweb, Semrush); sleepyti.me runs about 9,500 uniques a day
(statshow, rough). Among the eight competitors, MacroFactor's bulk-or-cut
quiz ranks third for "should I bulk or cut quiz" and Hevy's sets article
ranks second for "how many sets per muscle group per week" (US engine);
Rise's "sleep calculator" is an article, not a tool, and is absent from
the "sleep calculator", "sleep debt calculator" and "how much sleep do I
need" results. The pattern is one tool, one head keyword, for years. It is
not "one tool page ranks for many questions".

**Which shape.** Option A, with the change in section 3: it demonstrates the
product, works entirely client-side from data that already exists, and has
topic-term demand behind thirty of its entries. Option B produces a lead the
site cannot store (no server, no database) and answers a query nobody types.
If a week audit is wanted, it belongs inside the app's own interview, which
already exists, not on the site.

Constraint check for Option A: no account, no database, no server (static
JSON plus client-side search, hosted with the site); health content
educational with the app's safety line on every page and a route to help on
alcohol, sleep and mind pages; every grade and count on the page pulled from
`protocols.ts` at build time so the existing test suite guards it; no
generated filler.

---

## 5. App Store: search, competitors' fields, and the recommendation

**What people search in the App Store.** Unknown as volumes; no ASO tool was
reachable without an account, and Apple's own autocomplete endpoint returns
nothing. What can be verified is which apps Apple returns for a term in the
Australian store (iTunes Search API, 7 Sep 2026), and therefore what shelf a
term opens:

| Term | Australian results, in order (rating count) |
|---|---|
| habit tracker | Habit Tracker: planner routine (12,541), HabitKit (185), Onrise (431), Structured (14,711), Atoms (1,015), Routine Planner & Daily Habits (273), Finch (29,719) |
| habit | same set plus Productive (7,324), Done (1,353) |
| routine | Structured, Habit Tracker: planner routine, Me+ Lifestyle Routine (19,073), Routine Planner, Finch, MyRoutine (327), Eden (274) |
| workout planner | Strong (13,417), Workout for Women (46,203), Fitbod (9,527), Hevy (15,951), Home Workout (5,172), Gymverse (10,829) |
| personal trainer | Fitbod, Workout for Women, Gymshark, ABC Trainerize (10,708), Gymverse, Gravl (311), LADDER (9,872), Everfit |
| weekly planner | Week Planner (3,231), Structured, Calendars (12,355), Weekly Calendar App (4), Weekly Planner Notebook (67) |
| life planner | Structured, LifePilot (0), Life Planner: Organization (2), Notch (0), Zinnia (2,196), Me+ |
| sleep coach | SleepCoach (1), Rise (3,681), SleepWatch (22,066), CBT-i Coach (198), Sleep Reset (46) |
| planner | Microsoft Planner, Structured, Calendars, Habit Tracker: planner routine, MinimaList, Floret |
| coach | The Coach (men's health), Louis Vuitton, H&M, The Coach for her, TrueCoach, Nike Run Club |
| wellness | Qantas Wellbeing (48,300), Berry, Quabble, Habit Tracker: planner routine, Headspace (124,365), Mindbody |
| evidence based | Evidence-Based Policing, Evidence Based Medicine Guide, CAT Manager, EvidenceAlerts |

Two things stand out. "life planner" and "sleep coach" return apps with 0–2
ratings in the top five, so a new app can appear there, and nobody searches
them. "habit", "routine" and "planner" return apps with 12,000–30,000
ratings, so a new app will not appear there in its first months, and that is
where the searches are. "coach" is a dead word in the store.

**What the named competitors put in their fields** (apps.apple.com/au,
7 Sep 2026; character counts include spaces):

| App | Title (chars) | Subtitle (chars) | Category | AU ratings |
|---|---|---|---|---|
| Whoop | WHOOP (5) | none | Health & Fitness | 4K |
| Fitbod | Fitbod Workout & Gym Planner (28) | Strength Training & Fitness (27) | Health & Fitness | 9.5K |
| Rise | Rise: Energy & Sleep Tracker (28) | Better Health, Focus & Habits (29) | Health & Fitness | 3.7K |
| Headspace | Headspace - Sleep & Meditation (30) | Balance, Breathe, Focus, Relax (30) | Health & Fitness | 124K |
| Noom | Noom Weight Loss, Food Tracker (30) | Healthy Habits, Meals & GLP-1s (30) | Health & Fitness | 33K |
| Hevy | Hevy - Workout Tracker Gym Log (30) | Weight Lifting Exercise Plan (28) | Health & Fitness | 16K |
| Structured | Structured: Daily Planner Todo (30) | Visual Calendar & Organiser (27) | Productivity | 15K |
| Finch | Finch: Self-Care Pet (20) | Daily Journal & Habit Tracker (29) | Health & Fitness | 30K |
| Fabulous | Fabulous: Daily Habit Tracker (29) | Healthy Routines & Motivation (29) | Health & Fitness | 6.8K |
| Sunsama | Sunsama (7) | Daily planner (13) | Productivity | 37 |
| Boostcamp | Boostcamp: Gym Workout Fitness (30) | Anytime Pure Health: The Gym (28) | Health & Fitness | 655 |

Eight of the eleven use every one of the thirty characters and stack plain
nouns: tracker, planner, sleep, habit, routine, workout, meditation. Noom
changed its subtitle to carry "GLP-1s". Only Whoop and Sunsama, with a brand
that is searched by name, leave the field empty or generic. IntentNorth's
current subtitle, "Seven coaches. One profile." (27), contains no word anyone
searches in the store.

What the competitors rank for beyond their names is **unknown** (needs an
ASO tool); the iTunes search results above show Fitbod, Hevy and Strong own
"workout planner" and "personal trainer", Rise appears second for "sleep
coach", Headspace fifth for "wellness", Structured everywhere planner-shaped.

**What is realistic for a new app with no ratings.** Not the head terms in
its first quarter: the top five for "habit", "routine" and "planner" have
five-figure rating counts. Realistic is (a) the brand name, (b) three- and
four-word combinations that competitors do not cover ("evidence graded",
"habit sleep training", "routine planner coach"), which have unknown but
small volume, and (c) the thin shelves ("life planner", "sleep coach") that
have no competition and no demand. The first hundred ratings matter more than
the keyword field, and the January window (section 1) is when the shelf is
searched most.

**Recommendation, ready to paste.** Each field stays inside Apple's limit;
counts include spaces. No competitor names. No word is repeated across the
three fields, because Apple indexes all three together and a repeat wastes
the characters.

| Field | Text | Chars |
|---|---|---|
| Title (30) | `IntentNorth: Habit & Planner` | 28 |
| Subtitle (30) | `Sleep, training, routine coach` | 30 |
| Keywords (100) | `weekly,daily,tracker,workout,gym,strength,meditation,breathing,money,budget,family,evidence,life` | 96 |

Why these words: "habit" and "planner" are the two nouns with Australian
search volume that also open the right App Store shelf (Structured, Habit
Tracker: planner routine, Finch); "sleep", "training", "routine" and "coach"
cover the three biggest areas and the word the product uses for itself
(Apple counts "coach" for "coaches"); the keyword field adds the modifiers
people prepend ("weekly", "daily", "free" is not allowed), the training
synonyms, the two areas nobody else covers ("money", "family"), and
"evidence", which nobody searches but nobody else can claim. "app", "the",
"and" and plurals are not needed; Apple handles them.

The existing keyword field in `docs/APP_STORE.md`
(`habits,strength,training,sleep,recovery,coach,planner,routine,nutrition,money,meditation`)
repeats five words that now sit in the title and subtitle; that is why the
list above drops them and adds "gym", "tracker", "breathing", "budget",
"family", "life".

If the title must stay bare "IntentNorth" for brand reasons, the fallback
is subtitle `Habit, sleep & routine planner` (30) and keyword field
`training,coach,weekly,daily,tracker,workout,gym,strength,meditation,breathing,money,family,evidence` (98).

---

## 6. Competitor teardown

Similarweb total visits, last three months, data month July 2026 (free
pages; three-month totals, so divide by three for a rough month). Content and
tools from the sites themselves. Detail, with every URL, is in
`docs/research/seo/competitor_seo.md`.

| Company | Visits (3 mo) | Top channel | What they publish | Cites studies? | Free tool or quiz | Does it appear to work? |
|---|---|---|---|---|---|---|
| Whoop | 5.6M | Organic 48.7% | "The Locker" blog with 350+ podcast episodes' show notes; press releases on its own studies; a science page (403 to fetch) | Yes in press; blog framed as "science-backed" and "WHOOP data-backed" | None on the web | n/a. Traffic is brand and hardware. |
| Noom | 2.2M | Direct 19.5%, **paid search second** | Blog of roughly 1,100 posts (56 pages × 21), heavy GLP-1 cluster; a research hub of 40+ papers; MD-reviewed articles | Yes, named RCTs | Onboarding survey (113 screens per RevenueCat teardown, email gate one-third in), personality quiz, calorie-deficit and macro calculators (no login for the basic calculation) | The quiz is the business, but it is a paid-traffic funnel: absent from "weight loss quiz" and "calorie deficit calculator" results, and paid search outranks organic. |
| Headspace | ~1.7M | Direct 51.8% | Articles hub (32 pages on mental health alone), meditation topic landing pages, three podcasts, a science page with no citations | Articles cite press, not papers; reviewer is a coach | Free mini-meditation players on some landing pages; sleep page gated behind trial | Ranks sixth for "guided meditation for sleep free" (US engine). |
| Hevy | 813.9K | Organic 73.7% (highest of the eight) | 12-page blog by named coaches, ten split guides, exercise library | Yes (Schoenfeld et al.) | Exercise library (no login); strength standards in-app only | Sets article ranks second for "how many sets per muscle group per week"; exercise pages absent for generic exercise queries; strengthlevel.com owns standards. |
| Fitbod | 725.2K | Organic 64.2% | Blog with references sections, exercise library with weight standards from 11.99M logged sets, ~70 programmatic workout pages | Yes | Exercise library, free workout generator (login unverified) | Library absent for two exercise queries tested. |
| Sunsama | 431.4K | Direct 59.5% | 22-page blog of how-to productivity articles, an annual survey report, eight compare pages, 20+ integration pages | Mostly unsourced statistics | None; no template hub | No. |
| MacroFactor | 424.4K | Organic 53.5% | Article series (BMR, micronutrients, habits) by Nuckols and Trexler with PubMed tables; algorithm-accuracy page | Yes, densely | BMR, exercise-calorie, bulking and cutting calculators; bulk-or-cut quiz; no login indicated | Quiz ranks third for "should I bulk or cut quiz"; calculators absent for "BMR calculator". |
| Rise | 239.3K | Organic 30.2% | Blog by the co-founder, medically reviewed, ~30 citations an article, verdict-in-title ("Do Smart Alarms Work? Not the Way the Ads Say"); versus pages against Whoop, Sleep Cycle, AutoSleep | Yes, heavily | None interactive; "sleep calculator" and "chronotype" are articles that push the app | Absent from "sleep calculator", "sleep debt calculator", "how much sleep do I need". |

The answer to the brief's most useful question: **three of the eight run a
free tool or quiz, and only MacroFactor's demonstrably ranks, for one
long-tail query.** Noom's quiz works as a paid funnel, not as SEO. Rise, the
closest product to IntentNorth's sleep side, chose articles over tools and
is invisible on the calculator queries its content targets. Nobody in the
set publishes an evidence grade; the nearest things are Rise's verdicts in
titles and MacroFactor's per-study tables.

---

## 7. What no competitor does, verified

Checked on 21 Australian App Store listings, eight competitor websites and
five further vendor "science" pages: **no app shows an evidence grade for a
practice.** Closest: Examine.com (supplements, paid), Calm Health's clinical
studies list (13 named studies), Noom's research hub, one sec's research page
(PNAS 2023, CHI 2024), Pelago's peer-reviewed list, Rise's verdict titles.
Whoop, Fitbod, Hevy, Sunsama, Headspace, Balance, Fabulous, Reframe, Finch
use "science-backed" language without a grade. Section 5 of `docs/research/seo/evidence_tool_landscape.md` has the URL
for each.

Two persona findings from `docs/review/round3-report.md` bear on this:
"cite real studies, not just names of public figures" was asked for twice,
and the grade sentence ("evidence b · good — tested in controlled trials…")
was the single most-flagged jargon after "Zone 2". The evidence pages should
name the study, not the podcaster, and explain the letter in the first line.

---

## 8. Three things we did not think to ask

1. **"whoop alternative" is the only commercial keyword with real Australian
   volume and a soft page one.** 590 searches a month in Australia (2,400 in
   the US, rising 21%), "is whoop worth it" another 480, and the organic
   winners are a one-page affiliate site, a bodly.app blog post and a
   myonpulse.com post under two Reddit threads. The Reddit sentiment is
   "subscription fatigue". IntentNorth reads Apple Watch and HealthKit with no
   band and no cloud, which is exactly the answer those threads are looking
   for. One honest page, "Whoop without the band, and what you lose", is the
   cheapest search win in this whole document.

2. **"sleep debt" is a product term with search behind it that its owner
   does not rank for.** 1,600 a month in Australia (+46%), 22,200 in the US,
   low competition; IntentNorth already computes sleep debt on the readiness
   card; Rise, whose product it is, is absent from the "sleep debt calculator"
   results. A client-side sleep-debt explainer with the app's own need-and-
   debt method is a one-page tool of the kind that does rank (section 4).

3. **The January spike is a December deadline, and Reddit is the channel.**
   "habit tracker" doubles in the first two weeks of January in Australia and
   is already up in the last week of December. On the Australian SERP,
   Reddit sits in the top three on eight of ten evidence queries and both
   "best habit app" queries; the rising app names inside category searches
   (Hevy, Habitify) are the ones with Reddit presence. No amount of site
   content moves those slots; a founder answering in r/productivity,
   r/AussieFrugal and r/getdisciplined does, and the window to have ratings
   before the shelf is searched closes in mid-December.

A fourth, smaller: Google itself drops "australia" from "habit tracker app
australia", so there is no Australian long tail to own in this category;
the only local term is money ("budgeting app australia", 880), which is a
coach IntentNorth has and no habit app does.

---

## 9. Sources

Tools (all fetched 7 Sep 2026):

- Google Trends explore, Australia / United States / United Kingdom, "today
  5-y" and "today 12-m", via trends.google.com; batches listed in the tables
  above with their anchor term.
- Google Ads Keyword Planner, historical metrics Aug 2025–Jul 2026, locations
  Australia then United States, all languages, Google Search; saved as "Plan
  from Sep 7, 2026, 12 PM" in the Steam Saunas Australia account.
- google.com.au result pages for the queries named in sections 2 and 3, with
  `hl=en-AU&gl=au`, not signed in.
- iTunes Search API, `https://itunes.apple.com/search?term=…&country=au&entity=software`.
- apps.apple.com/au listings for the 44 apps in the two research batches
  (`docs/research/seo/appstore_batch1.md`, `appstore_batch2.md`).

Published studies:

- Pew Research Center, 22 Jul 2025: https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/
- Ahrefs, AI Overviews reduce clicks, 17 Apr 2025: https://ahrefs.com/blog/ai-overviews-reduce-clicks/ ; Dec 2025 rerun reported at https://www.medianama.com/2026/02/223-google-ai-overviews-click-through-rates-58-study/
- Ahrefs, AI Overview triggers: https://ahrefs.com/blog/ai-overview-triggers/
- BrightEdge healthcare AI evolution, 24 Dec 2025: https://www.brightedge.com/resources/weekly-ai-search-insights/healthcare-ai-evolution-google-2023-2025
- Seer Interactive, Sept 2025 update: https://www.seerinteractive.com/insights/aio-impact-on-google-ctr-september-2025-update
- Semrush AI Overviews study via Search Engine Land, 16 Dec 2025: https://searchengineland.com/google-ai-overviews-surge-pullback-data-466314
- Google, AI Overviews to 100+ countries, 28 Oct 2024: https://blog.google/products-and-platforms/products/search/ai-overviews-search-october-2024/
- Ahrefs, Examine.com case study, 28 Apr 2023: https://ahrefs.com/blog/examine-seo-case-study/
- Examine grades: https://examine.com/about/grades/
- Semrush free preview, examine.com: https://www.semrush.com/website/examine.com/overview/
- tdeecalculator.net: https://www.similarweb.com/website/tdeecalculator.net/ ; https://www.semrush.com/website/tdeecalculator.net/overview/
- RevenueCat, Noom onboarding teardown: https://www.revenuecat.com/blog/growth/web-to-app-onboarding-funnel
- Similarweb free pages: https://www.similarweb.com/website/whoop.com/ , /noom.com/ , /headspace.com/ , /hevyapp.com/ , /fitbod.me/ , /sunsama.com/ , /macrofactor.com/ , /risescience.com/
- Competitor hubs and tools: https://www.whoop.com/us/en/thelocker/ ; https://www.noom.com/research/ ; https://www.noom.com/f/calorie-deficit-calculator ; https://www.headspace.com/science ; https://www.headspace.com/meditation/guided-meditation ; https://www.hevyapp.com/how-many-sets/ ; https://www.hevyapp.com/exercises/ ; https://fitbod.me/exercises/ ; https://fitbod.me/workouts ; https://www.sunsama.com/blog ; https://macrofactor.com/bulk-or-cut/ ; https://macrofactor.com/bmr-calculator/ ; https://www.risescience.com/blog/sleep-calculator ; https://www.risescience.com/science
- Evidence pages that exist: https://health.calm.com/resources/clinical-studies/ ; https://one-sec.app/research/ ; https://www.pelagohealth.com/resources/research/ ; https://macrofactor.com/algorithm-accuracy/
- Wheel of Life and life-audit tools: https://wheeloflife.io/ ; https://lifewheel.us/wheel-of-life-assessment/ ; https://www.101planners.com/wheel-of-life-assessment/ ; https://loggd.life/tools/wheel-of-life ; https://lifeauditscore.com/
- Sleep Foundation sleep calculator: https://www.sleepfoundation.org/sleep-calculator
- Internal: `src/features/knowledge/protocols.ts` and its money, people,
  habits, work and supplement files (grade counts: A 13, B 60, C 63, D 33,
  E 8); `docs/APP_STORE.md`; `docs/review/round3-report.md`.

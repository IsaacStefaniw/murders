# Research brief — search demand for IntentNorth

**For:** a session with internet access.
**From:** the website session, which has none. Everything below needs someone
who can actually open Google Trends, a keyword tool and the App Store.

Do not guess numbers. If a figure cannot be sourced, say so — a blank is worth
more to us than an invented volume, and we will be making spend decisions on
this.

---

## 1. What you need to know about the product

IntentNorth is an iPhone app, in App Store review, launching in Australia
first. AU$89.99/year, AU$14.99/month, AU$249 once.

It writes and maintains your whole week across seven areas — training, food,
habits and urges, focused work, money, your relationship, family — with sleep
and mind practices (morning light, wind-down, meditation, breathing) scheduled
across all of them. You answer questions once; it builds the week and rebuilds
it when yours changes.

**The differentiator, and the reason this brief exists:** every one of its 177
practices carries a plain rating for the strength of the evidence behind it,
A to E, with the source named. 104 of the 177 are rated Mixed or weaker and the
app says so. No competitor publishes evidence grades.

## 2. The hypothesis we most want tested

We think the evidence ratings are a search asset, not just a trust asset.

People type **"does cold plunge actually work"**, **"is morning light good for
sleep"**, **"does magnesium help you sleep"**, **"is zone 2 worth it"** — they
are asking whether a practice they have heard about is real. We have 177
researched answers to exactly that question, each with a grade, a mechanism and
a named source, and we can publish them.

**Test this before we build it.** Specifically:

1. Is there meaningful, non-trivial volume on "does X work" / "is X worth it" /
   "is X actually good for you" style queries in our practice areas?
2. Who currently ranks for them — Healthline, Examine, Reddit, YouTube,
   individual creators, AI overviews? Is the SERP winnable by a small site, or
   is it saturated with domain authority we cannot touch in a year?
3. Are AI overviews eating these queries? If Google answers "does cold plunge
   work" inline, the click may not exist any more. This may be the finding that
   kills the whole idea, and we would rather know now.

The full list of 204 practice titles is in
`src/features/knowledge/protocols.ts`. Pull them and check the top 30 by
plausible interest.

## 3. Google Trends work

Region: **Australia primary, then US/UK.** Timeframe: 5 years and 12 months
both, so we can see trend and season.

**Category terms** — which of these is the one people actually search?

- habit tracker / habit app
- workout plan app / training programme app
- personal trainer app
- wellness app / health app
- life planner / weekly planner
- productivity app
- sleep app
- meditation app
- "evidence based health" / "evidence based fitness"

We do not know what category we are in. That is a genuine open question and
Trends can answer it better than we can argue about it. Tell us which term has
volume, which is rising, and which is dying.

**Problem terms** — how people describe the pain in their own words:

- how to fit exercise into a busy week
- no time to exercise
- how to plan my week
- how to build a routine
- why can't I stick to a routine
- burnout / overwhelmed / too much to do

**Seasonality.** We need to know how sharp the January spike is in Australia,
and whether there is a second one — a July/new-financial-year or
back-to-school bump. Launch timing and ad spend depend on it.

**Rising queries.** Whatever Trends shows as breakout in these areas over the
last 12 months. This is the part we cannot anticipate and most want.

## 4. Keyword research

Bring back a table: keyword, monthly volume (AU and US), difficulty, intent
(informational / commercial / navigational), and who currently ranks top three.

Cover four groups:

1. **Category** — from the list above, whichever Trends says matters.
2. **Comparison** — "whoop alternative", "fitbod vs", "best habit app 2026",
   "apps like noom". Commercial intent, easier to rank, and it tells us who we
   are actually being compared against.
3. **Evidence long tail** — the "does X work" family from section 2.
4. **Local** — anything where "Australia" or "AU" changes the picture.

Flag any keyword where the top results are all listicles from affiliate sites,
because those are winnable and those are also where our honesty angle
differentiates hardest.

## 5. App Store search (this matters more than Google)

Our destination is an App Store listing. For an iPhone app, ASO may be worth
more than web SEO, and we have done nothing on it.

- What do people search in the App Store in our categories? Use whatever ASO
  tool you can reach.
- What do Whoop, Fitbod, Rise, Headspace, Noom rank for, and what is in their
  title and subtitle fields?
- What is realistic for a brand-new app with no ratings?
- Recommend a title (30 chars), subtitle (30 chars) and keyword field (100
  chars) for IntentNorth. These are hard limits; do not exceed them.

`docs/APP_STORE.md` has the current submission copy.

## 6. Competitor teardown

Whoop, Fitbod, Rise, MacroFactor, Hevy, Sunsama, Headspace, Noom.

For each: what they rank for, roughly how much organic traffic, what content
they publish, and whether they run a free tool or quiz as an acquisition
channel. **The last one is the most useful.** We are considering a free test on
our site and want to know who has done it and whether it appears to work.

## 7. The specific question about a free tool

We are weighing two options and would like evidence rather than opinion.

**Option A — an evidence lookup.** "Is this actually backed by anything?" You
search a practice, get our grade, the mechanism in plain words, the source, and
the safety note. 177 answers, all already written. Genuinely useful, unique to
us, and it demonstrates the product's whole argument.

**Option B — a week audit.** A short set of questions returning what a planned
week would look like, plus one thing to change. Closer to the product, but the
answer is only as good as the questions, and it produces a lead rather than a
lasting page.

Tell us which shape has search demand behind it, whether anyone has done either
well, and whether "free tool" pages actually rank in this space or just sit
there.

## 8. Constraints you must respect in recommendations

- **No account, no database, no server.** The site collects nothing and stores
  nothing. Any tool you propose has to work client-side, or you have to tell us
  the infrastructure cost explicitly.
- **Health claims are educational, never medical advice**, and anything about
  alcohol, sleep or mental health carries a route to real help beside it.
- **Every number we publish is checked against the app's source** by a test
  suite that fails the build. If a keyword strategy needs us to claim
  something, we have to be able to prove it.
- **We will not publish thin AI-written content at scale.** If the answer is
  "write 500 blog posts", say so plainly and we will decide, but our credibility
  rests on the evidence grading being real and we will not undermine it for
  traffic.

## 9. What to bring back

1. A one-page answer to: **what category are we, and what do people type?**
2. The keyword table from section 4.
3. The App Store recommendation from section 5, ready to paste.
4. A verdict on the evidence-lookup hypothesis: build it, change it, or drop it.
5. The three things you found that we did not think to ask about.

Write it to `docs/SEO_RESEARCH.md` and push. Cite a source or a tool for every
number. Where you could not get data, write "unknown" rather than an estimate.

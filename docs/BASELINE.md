# Day one — 10 November 2026

*"especially improvements, how much younger I am metabolic age"*

Born **1988**, so **38** on the repo's own method
(`ageOf`: the calendar year minus the birth year, which carries about
half a year of error because a person is somewhere inside their birth
year).

This is the baseline. It is not flattering and that is the point: an
improvement needs a before, and today is the before.

---

## The first number it gave me was wrong, and it was wrong the nice way

Running the instrument on his profile returned **−6.5 years** — six and
a half years younger than 38.

**It was an artefact of one night's sleep.** `readPace` builds its Life's
Essential 8 composite from whichever parts it can see, and the gate read
`le8Parts.length > 0`. So:

| step | value |
| --- | --- |
| one night, 8.5 hours | `sleepScore` = **100** |
| mean of one part | **100 out of 100** |
| `le8LogHazard(100)` | **−1.1157** |
| through the Gompertz doubling time | **−12.9 years** |
| after `ATTENUATION` of 0.6 | **−7.7 years** |

**One eighth of a composite, reported as a perfect cardiovascular
profile, paying out seven and a half years.** Nothing else in the reading
came close, so a single good night was the whole answer.

It matters here more than on the Essential 8 card, because this
component is one of only two in the instrument allowed to go **negative
without limit** — Essential 8 is validated as linear across its full
range, so being excellent earns credit rather than merely avoiding a
penalty. A component that can pay out unboundedly must not be computed
from one eighth of itself.

### The first fix was worse, and my own test hid it

I set the floor to `essential8.BAND_MIN_COMPONENTS`, which is **4**,
because reusing the existing named constant looked like the disciplined
move. **There are only three parts to have.** `readPace` scores activity,
sleep and body mass and nothing else — nicotine is excluded to avoid
double-counting, and diet, lipids, glucose and blood pressure are not
among its inputs. A floor of four does not guard the component, it
deletes it, permanently and silently.

Two of my own tests passed anyway. One asserted `BAND_MIN_COMPONENTS`
equalled 4 instead of exercising a four-part reading. The other wrapped
its only real assertion in `if (strong.logHazard !== null)` — never
true, because the floor I had just set was higher than the number of
parts that exist. **A vacuous test is worse than no test, because it is
counted.** The suite reported green on a change that had disabled a
health component.

The floor is now `LE8_MIN_PARTS = 3`, all of what can be seen, and every
case in that suite asserts a value rather than a constant, with no `if`
around any of them.

### And the part still not fixed

A floor stops a composite of one paying out. **It does not bound the
pay-out.** Three parts all at 100 is still a mean of 100, still −12.9
raw years and −7.7 after attenuation — the full credit of an
eight-component construct, earned by showing three.

`essential8.ts` states the principle it breaks: *"It is not a Life's
Essential 8 score and must never be presented as one — half the
components missing is half the construct missing, and the three blood
measures are where a lot of the risk actually sits."*

Left open on purpose. Closing it means choosing a calibration — scaling
the contribution by coverage is the obvious candidate and is also a
method I would be inventing, in one sitting, on the surface of this app
where a wrong number costs the most. It belongs in a change of its own,
beside `PROVISIONAL` and `ATTENUATION`. There is a test holding it
visible rather than blessing it.

**And `progress.ts` named this failure before it happened**, in a file
written from his own earlier request:

> *"It would also be a lie with a particular shape: flattering, arriving
> early, and caused entirely by the user doing something the app asked
> them to do. That is the exact structure of a metric designed to make
> people feel good rather than to tell them anything, and it is what the
> whole instrument exists to not be."*

He logged one night because the app asked him to, and the app handed
back six and a half years. Fixed, with a regression test.

---

## The honest reading

**Older, not younger. About +1.3 to +2.2 years, from 2 of 10
components.**

| what it can see | contribution |
| --- | --- |
| **vaping** | **+2.1 years** raw |
| **alcohol** (11–20 drinks a week) | **+0.5 years** raw |
| | ×0.6 attenuation → **+1.6 years** |

| if the drinking band is | the reading is |
| --- | --- |
| none, or up to 10 a week | **+1.3 years** |
| 11–20 a week | **+1.6 years** |
| 21–35 a week | **+2.2 years** |
| more than 35 a week | **+4.0 years** |

**Which band is his is an open question.** Four consecutive nights in a
week he called *"worse than usual"*, and no unit count anywhere in the
log. The spread above is the whole answer until he counts a week.

### The two things it can see are the two things he is quitting

That is not a coincidence and it is the useful part. **Stopping the vape
is worth about 1.3 years by this instrument's own arithmetic** — it is
the single largest lever in the reading, and it is the one already in
progress.

The caveat is the instrument's own, and it is severe: *"The vaping level
is the weakest thing in this instrument: no long-term mortality cohort
for it exists, so that figure follows the American Heart Association's
judgement rather than a measured outcome."* Vaping has not existed long
enough for anybody to have a mortality cohort. The 1.2 hazard is a
reasoned placement, not a measurement.

The alcohol figure is the better-evidenced of the two: Wood et al. 2018,
*The Lancet*, 599,912 current drinkers pooled across 83 prospective
studies, **grade A**. Its caveat: *"Current drinkers only, so it says
nothing about whether drinking nothing beats drinking a little."*

---

## Eight of ten components are blank, and most of them are cheap

| component | what it needs | cost |
| --- | --- | --- |
| **self-rated health** | one question | **free** |
| **feeling connected** | one question | **free** |
| **walking pace** | one question, or four measured metres | **free** |
| **ten-second stand** | ten seconds and a wall | **free** |
| **sleep regularity** | a week of bed and wake times | **a week** |
| cardiorespiratory fitness | some outdoor walks with Apple Health | weeks |
| grip strength | a hand dynamometer | ~$30 |
| Essential 8 composite | 4 of its 8 parts | see below |

**Four of those are free and unasked.** `dailyAsk.ts` already argues that
self-rated health is a monthly instrument and the function tests are
quarterly, so this is not a daily burden — it is one sitting.

And the Essential 8 composite needs **four parts**, of which he has one.
The reachable ones: **his weight** (which needs his height, and BMI may
well be a misread for a 90 kg lifter — `essential8.bmiMisread` exists
for exactly that), **activity minutes**, and **a week of sleep**. Blood
pressure, cholesterol and glucose are a GP visit.

### Sleep regularity is the one that cannot be backfilled

`sleepTiming.ts`: Windred et al., *Sleep* 2024, 60,977 UK Biobank
participants and over ten million hours of accelerometry — **regularity
predicted all-cause mortality more strongly than duration.** It needs a
series of clock times and cannot be recovered from an average later.
Every night not recorded is a night permanently missing from it.

---

## Recalculated with everything — and it did not move

Asked on 10 Nov to recalculate with all of it: sauna at 90°C for 20–25
minutes, body fat 10–13%, four sessions a week for twenty years.

**The reading is still +1.6 years.** Not approximately — identically.
Run with body fat at 10 and at 13 it returns the same figure, because
both are a misread and BMI drops out either way, which puts the
Essential 8 composite below the parts it needs. The sauna is not a
`PaceInputs` field. Neither is a breath hold, a lift, or twenty years of
anything.

**That is the honest answer and it is worth sitting with.** More true
information about him produced no movement, because the instrument has
ten slots and almost none of what he is good at fits one. A number that
only moves on the two things he is quitting is a narrow instrument, not
a verdict — and saying so is more useful than finding a way to make it
move.

---

## Performance against the population, as far as the evidence goes

### The one representative figure, and it is not about his lifts

**71% of Australian men aged 18–64 do not meet the recommended two days
a week of muscle-strengthening activity** (AIHW 2022, `NOT_STRENGTH_TRAINING`
in `standards.ts`). A national survey rather than a self-selected sample,
and non-compliance rises with age.

He does four days, and has for twenty years. **That is the population
comparison this app will make**, and it is about the habit rather than
the kilos.

### Why there is no percentile, in the file's own words

> *"Nobody has one-rep-max tested a representative sample of adults on
> these lifts and nobody is going to, because you cannot max-test people
> who have never trained. EVERY figure available comes from people who
> lift and chose to record it. A percentile against the general
> population would therefore be invented, however carefully, and the app
> does not invent numbers."*

So the lift numbers below are placed **among people who train and log
their lifts** — `COMPARISON_CLASS` — and not against men his age.

### The four lifts, described rather than graded

| lift | × bodyweight | where it sits | next mark |
| --- | --- | --- | --- |
| **Bench** | **1.47×** | past the **second** of four | third at **135 kg** |
| **Overhead** | **0.89×** | past the **second** of four | third at **81 kg** |
| Deadlift | 1.56× | past the first | second at **157.5 kg** |
| Squat | 1.22× | past the first | second at **135 kg** |

`assessStrength` returns an overall band of "beginner" for this profile.
**It should not be reported and the app does not show it** —
`standards.ts` records that exact failure: *"the screen printed the
MEDIAN band over an uneven profile, so a 130 kg bench came out
'Beginner'."* A median across an uneven profile describes nobody. The
per-lift lines are the reading.

What the app says instead: *"Your bench and overhead press are ahead of
your deadlift and squat, relative to bodyweight. That gap is the thing
worth training, not a verdict on you — an uneven profile is the normal
one."*

### The ratio that stands out

**His deadlift is 1.06× his bench.** The usual relationship runs the
other way by a distance — a deadlift around 1.2–1.3× the bench is the
ordinary shape, which would put his near 160–170 kg. The squat tells the
same story at 0.83× the bench against a more typical 1.25–1.3×.

Those multiples are **rule-of-thumb from lifting convention, not a cited
dataset** — the same caveat `ISAAC_WEEK.md` carries on its ratio table.
The gap is large enough to survive any version of them.

Two readings, and the honest answer is that nothing here separates them:

1. **The lower body is genuinely behind**, which is what
   `ISAAC_WEEK.md` concluded in September from the same shape.
2. **The squat and deadlift figures are stated and untested**, given at
   110 and 140 and never performed in front of me. His bench was stated
   at 130 and turned out right, which is reason to take them seriously
   rather than to discount them.

**A tested squat and deadlift would settle it**, and they are the two
numbers the whole lower-body conclusion rests on.

## What the instrument cannot see, and two of them are twenty years old

Stated 10 Nov: **sauna 3–4 times a week for twenty years**, alongside
four training sessions a week for the same twenty.

**The sauna contributes exactly zero to the reading above.** It is not a
`PaceInputs` field and there is no sauna component in `pace.ts`. So the
longest-running health habit in his life is invisible to the number
meant to summarise his health.

That is the instrument being disciplined rather than broken. `sauna` is
**grade C** and its own card is candid about why: *"The heart findings
come from one Finnish population followed for decades, with the headline
result resting on 201 men in the frequent-use group — a real and
carefully collected observation, and a single cohort measured once
rather than a settled result."* A component built on that does not
belong beside grip strength from PURE or alcohol from a 599,912-person
pooled analysis. **The honest cost of a graded instrument is that it
stays quiet about things it cannot grade**, and this is what that costs
him.

The same applies to the **3 minute 20 second breath hold**. There is no
component for it, and inventing one would be making up a coefficient.

**Sauna dose, stated 10 Nov: 90°C, 20–25 minutes, 3–4 times a week.**
That is at the top of the 2–4 the `sauna` card recommends and longer per
session than the card's own “~15–20 minutes”. Twenty years of it. The
card's grade is **C** and its honesty about why is the reason this
cannot be converted into years: one cohort, measured once, with the
headline resting on 201 men.

So the reading is not a summary of his health. It is a summary of the
ten things this instrument can carry evidence for, two of which it can
currently see.

## "Sauna should be counted as it mimics moderate exercise"

Put to me on 10 Nov, with "overwrite that". I ran it rather than argued
it.

### It is already a no-op

| | activity score | pace reading |
| --- | --- | --- |
| training alone, ~360 min | **100** | **+1.56 years** |
| training **+ 77 sauna minutes** | **100** | **+1.56 years** |

`activityScore` reaches 100 at **150** minutes a week and he is at
roughly 360 from lifting and futsal alone. The component has been at its
ceiling the whole time, so adding three and a half sauna sessions moves
it by nothing — and the Essential 8 composite is below its parts floor
anyway, so it contributes nothing to the reading either way. Identical
to two decimal places.

**So the disagreement does not have to be settled to settle the
question.** Overwriting it changes no number on any screen.

### Where he is right

Sauna does produce cardiovascular responses that overlap with moderate
exercise. Heart rate climbs into the range moderate work produces, and
the adaptations are real and measured — endothelial function, blood
pressure, arterial compliance. Some trials find heat added to training
beats training alone. None of that is in dispute.

### Where the distinction holds

Life's Essential 8 scores **minutes of moderate-to-vigorous physical
activity**, and physical activity has a definition: bodily movement
produced by skeletal muscle, with the energy expenditure that follows.
The heart rate rise in a sauna is thermoregulatory — the skin's vessels
dilate, blood pressure falls, and cardiac output rises to move blood to
the surface. That is cardiovascular strain and it is not muscular work:
the metabolic cost sits near 1.5–2 METs where moderate activity is
defined as 3–6.

So *"mimics moderate exercise"* is true of the heart rate, partly true
of the adaptations, and not true of the thing the component counts.

### And the reason I am not doing it anyway

**It is the same move I spent this morning fixing.** The Essential 8
component paid out 7.7 years from a composite computed from one eighth
of itself, and I called that *"a lie with a particular shape:
flattering, arriving early."* Pushing sauna minutes into a slot
validated on something else is the same error pointed the same way.

**The right complaint is the one already in this file**, two sections
down: the instrument cannot see a twenty-year sauna habit, and that is a
real limitation of a ten-slot instrument rather than a scoring bug. The
honest fix is a graded sauna component, which needs evidence that does
not exist — `sauna` is **C**, one cohort, 201 men in the top group.
Inventing a coefficient is what `standards.ts` refuses to do for
percentiles and what `LE8_MIN_PARTS` refuses to do for coverage.

If he wants it counted anyway after reading this, it is his app and his
call — but it would be a change that alters no output, so it would be
a note in a file rather than a different number.

## The sauna component, added and withdrawn the same day

*"Wait how is sauna a negative?"*

**The sign first: negative is a credit.** Positive years mean the
markers sit where an older person's usually do. Negative means younger.
So −5.90 was the one number on his page pointing the good way.

**But checking it properly killed it**, and he was right to ask.

### The magnitude was not credible

| | raw years |
| --- | --- |
| four saunas a week, as built | **−5.90** |
| **current smoking**, same instrument | **+11.9** |

Four saunas a week was worth **half of lifetime smoking, in the
opposite direction** — from one observational cohort of 2,315
self-reporting Finnish men, against a 200,000-person national linkage.

### And the fault underneath it is the reference level

The paper's 0.60 is four-to-seven sessions a week **against one**. Not
against none. **Everybody in that comparison saunas.**

`PaceReading.relativeHazard` is defined against *"somebody at every
component's reference level"*, and I set this component's reference at
"fewer than four" — which bundles a man who has never been in a sauna
with one who goes three times a week, and pays the full credit against
that. The paper does not establish that once a week is the same as
never, so the credit was being paid against a baseline nobody measured.

**That is the Essential 8 bug again**: a figure applied against the
wrong reference, paying out in the flattering direction. I fixed that
one at breakfast, cited it twice as the reason I would not invent a
coefficient, and then made the same error with a different study six
hours later.

### Where it stands now

**Recorded and not scored.** The component stays on the page with its
full provenance, because the habit is real and the evidence is worth
seeing. It contributes nothing, and it is not counted as observed — so
it cannot inflate the "3 of 11 markers" the headline leans on either.

Calibrating it honestly needs the 2–3 band's hazard and a transfer to a
never-sauna reference. Neither exists in what I could reach, and
`pubmed.ncbi.nlm.nih.gov` and `www.bmj.com` are outside this session's
allowed network domains.

**So his reading goes back to +1.6 years, and the research changed
nothing about the number.** The twenty-year sauna habit is still
invisible, which was his original complaint and is still the honest
answer: a ten-slot instrument cannot see most of a person, and the
remedy is not to force a number into it.

## "Training should be way bigger than all the bad variables combined"

**He is right, the model already agrees with him, and the reason it is
not showing is that the measurement is missing.**

The component that carries this is `fitness` — Mandsager 2018, *JAMA
Network Open*, 122,007 adults on treadmill tests, 13,637 deaths across
1.1 million person-years, **grade A**. Elite against lowest quintile
carried about **80% lower all-cause mortality**. It is one of only two
components in this instrument allowed to pay out without a floor.

Banded against age, because a 30-year-old at 40 ml/kg/min is ordinary
and a 65-year-old at 40 is exceptional. At 38 the reference is 36.7, so:

| VO₂max at 38 | raw years | after attenuation |
| --- | --- | --- |
| 33 or below | 0 or worse | — |
| **40+** | **−4.12** | **−2.47** |
| **48+** | **−6.90** | **−4.14** |

| his reading | |
| --- | --- |
| no VO₂max (today) | **+1.56** |
| VO₂max 42 | **−0.91** |
| VO₂max 48 | **−2.58** |

**At 48 it is −4.14 against vaping's +1.26 and alcohol's +0.30.** That is
his claim, almost exactly: fitness outweighs every bad variable
combined, by more than three to one.

**So the model does not disagree with him. It has never seen his
fitness.** `blocked` on that component reads *"Comes from Apple Health
after some outdoor walks or runs"*, and that is the single
highest-value thing available to him — a bigger move than anything else
on this page, and it costs a few walks with the phone in his pocket.

**What it does not credit is the lifting**, and that distinction is the
whole of the disagreement. Ruiz 2008's strength thirds are 38.9 / 25.9
/ 26.6 per 10,000 person-years — flat across the top two. Lifting shows
up here only where it has raised cardiorespiratory fitness, and futsal
once a week is more likely to be doing that than the barbell is.

## "I'm not a full time smoker, only part time, mainly when I drink — and vaping is better than cigarettes"

**Both true, and the model already says so.**

| status | RR | raw years |
| --- | --- | --- |
| never | 1.0 | 0 |
| **vaping** | **1.2** | **+2.10** |
| quit recently | 1.5 | +4.68 |
| **smoking** | **2.8** | **+11.88** |

He is scored at **vapeOnly**, which is about **one sixth** of a current
smoker. The instrument has never treated him as a smoker, and there is
no lighter band short of `never`. Its own caveat is that the vaping
figure *"follows the American Heart Association's judgement rather than
a measured outcome"*, because no long-term mortality cohort for vaping
exists — so if anything that 1.2 is the softest number on the page.

**One thing his own log says differently, recorded because it is data
and not an opinion.** *"Mainly when I drink"* is the model he has of
it. `docs/LOG.md` entry 1, Monday 9 November: **zero alcohol, and two
vaping sessions anyway.** And the five-night run from 5 to 9 November
is four drinking nights and **five** vaping nights.

That is one more vaping night than drinking nights, on the only week
with data. It does not make the coupling wrong — four of five nights
had both — but the one night that separated them went the way that says
the vape does not need the drink. Worth knowing before the quitting
order is decided on the assumption that it does.

## "What about a strength test over VO2 max?"

**A strength test would score zero. A VO₂max reading is worth up to
−4.14 years.** Not a preference — the two literatures report different
shapes, and the instrument follows each one's own.

### Only two of eleven components can make anybody younger

Worth seeing laid out, because it explains the whole answer:

| component | what it can do |
| --- | --- |
| **cardiorespiratory fitness** | **penalise OR pay out** |
| **Essential 8 composite** | **penalise OR pay out** |
| grip strength | `Math.max(0, reference − kg)` — **penalty or zero** |
| gait speed | `Math.max(0, reference − speed)` — **penalty or zero** |
| ten-second stand | `seconds >= 10 ? 0 : penalty` — **penalty or zero** |
| nicotine, alcohol | penalty or zero |
| self-rated health, connection, sleep regularity | penalty or zero |
| sauna | zero, always (see above) |

**Nine of the eleven can only ever make him older.** That is not
pessimism in the design, it is what the papers report: PURE measures a
grip *decrement*, the gait literature measures *slow* walking, and
`PaceComponent.logHazard` says so outright — *"reading them backwards as
an unbounded bonus is an extrapolation neither carries."*

Mandsager is different because Mandsager measured the other direction:
elite versus lowest quintile, **~80% lower all-cause mortality,
dose-responsive**. That is why fitness can pay and strength cannot.

### So for him specifically

A grip dynamometer costs about $30 and two minutes, and he is obviously
above the sarcopenia threshold — so it returns **zero**. The ten-second
stand and the gait test are free and will also return zero, because he
will pass both.

**They are still worth doing**, for a reason that is not the number:
they establish a baseline he can be measured against in ten years, when
these components start being able to move. Today they buy nothing.

**VO₂max is the only test on the list that can pay out today**, and
Apple Health estimates it from outdoor walks and runs at no cost at all.

---

## "Strength and VO2 should be used as a later predictor in life"

**This is the sharpest thing he has said about the instrument, and it is
correct.**

He is describing a **trajectory**. The instrument computes a
**snapshot**. Every component answers *"where do your markers sit
now"*, and none of them answers *"where will they sit at seventy, given
this slope and this starting point"*. Those are different models and
this app only has the first.

The argument he is making is the reserve argument, and its direction is
not controversial:

- Muscle mass and strength peak in the thirties and decline from there.
  A higher peak means more distance to the threshold where ordinary
  things get hard.
- VO₂max declines through adult life. A higher starting point means the
  same decline crosses the independence threshold later — the commonly
  cited figure being around 18 ml/kg/min, below which day-to-day
  independent function starts to be limited.

**Twenty years of training at 38 is a deposit against that**, and
nothing in the eleven components reads it as one.

### Why this app does not model it, and what it would take

The arithmetic is trivial and the inputs are not. A projection needs a
**decline rate**, and the answer is entirely determined by which rate is
chosen — published figures vary with sex, baseline fitness, and whether
training continues, and the spread between the plausible ones moves the
crossing age by decades. Picking one would be inventing the model, which
is the thing refused for the sauna coefficient and for the lifting
percentile.

**What would make it real:** a repeated measurement. Two VO₂max readings
five years apart give him his OWN decline rate, and a trajectory built
on that is a measurement rather than a textbook constant.

Which is the same conclusion as the section above, arrived at from the
other direction: **take the VO₂max reading now.** Today it is worth up
to −4.14 years. In five years it is worth something this instrument
cannot currently compute at all.

## Correction — I was wrong about body fat, and he caught it

*"How is low body fat % whilst healthy and from exercise correlated as a
negative? That's just wrong... you can understand it if unhealthy, but
13% body fat should be a healthy marker."*

**He is right on every part of that, and the correction is mine.**

I reported that *"one NHANES-linked analysis finds a U-shape with lowest
mortality near 25% in males"* and let it stand as the reading. That was
a search summary passed on without interrogating the reference class —
the exact failure `standards.ts` warns about and that I have cited twice
in two days as the reason not to do something.

### What the papers actually say, now that the hosts are reachable

**The NHANES 20–49 analysis says the opposite of what I implied.**
Fetched directly:

| | adjusted HR | p |
| --- | --- | --- |
| **body fat percentage** | **1.780** (1.282–2.471) | **<.001** |
| BMI | 1.246 (0.845–1.837) | .268 |

**More body fat, more mortality. Monotonic.** And BMI is not
significant at all. That paper is an argument for his position: body fat
predicts and BMI does not. Its own limitations are that it adjusted only
for age, race and poverty — **no smoking adjustment and no handling of
reverse causation.**

### And the mechanism behind every U-curve he is objecting to

This is the part that settles it. The apparent danger of leanness is
built from two things that have nothing to do with being lean:

- **Reverse causation.** Illness causes weight loss. Cancer, COPD, heart
  failure and frailty make people thin *before* they kill them, so thin
  looks fatal. The standard fix is excluding the first several years of
  follow-up.
- **Smoking.** Smokers are leaner and die more. Adjusting for it as a
  covariate never fully works, because it cannot capture individual
  differences in smoking behaviour.

**When studies correct for both, the optimum moves down and the low end
flattens.** A meta-analysis put the nadir at BMI 23–24 in never-smokers,
22–23 in healthy never-smokers, and **20–22 with longer follow-up**. One
analysis restricted to never-smokers that dropped the first five years
found **no evidence of excess mortality among lean men** once smoking
and illness-related weight loss were accounted for.

**That is his argument, in the literature's own words.** Thin-from-illness
and lean-from-twenty-years-of-training are two different exposures that
share a number, and a crude body-fat percentile cannot tell them apart.

### So: is 13% a healthy marker for him

**Yes.** A trained, non-smoking 38-year-old at 10–13% is not in a risk
zone, and the curves suggesting otherwise are built on populations where
leanness is a proxy for illness and tobacco.

**One real floor, well below him.** Sustained very low body fat in men —
the single figures — carries genuine endocrine costs: suppressed
testosterone, reduced bone density, the RED-S picture. 10–13% is clear
of that by a wide margin. The floor exists; he is not near it.

### What this changes in the code, which is nothing

`bmiMisread` was already doing the right thing: it drops his BMI rather
than scoring it 70, and says why in his own terms — *"BMI cannot tell
muscle from fat, and on you it is reading the muscle as fat."* **The
code was right and my narrative to him was wrong.**

What it does not do is let body fat pay out, and that stays: the 1.780
above has no stated contrast and no smoking adjustment, so there is no
coefficient here to build a component from. **Not scored, and not
scored as a negative either — which is what he was objecting to.**

## What this reading is not

- **`PROVISIONAL = true`** in `pace.ts`, and its own comment: false only
  once the coefficients are fitted on real cohort data against observed
  outcomes. They are not.
- **`ATTENUATION = 0.6`** is *"a judgement about the size of that
  overlap, not a result, and it is the first thing real data should
  replace."* Every figure above passes through it.
- **It is not in his build.** `MARKERS_ENABLED` needs
  `EXPO_PUBLIC_MARKERS=1`, deliberately unset — see
  `features/health/flag.ts`, including the open TGA question about
  whether software predicting disease risk is a medical device.
- **Two self-reported negatives are not a metabolic age.** Nothing here
  was measured. Every number came from something he told me.
- **It is not medical advice**, and the two things driving it both have
  real medical help that works better than planning does.

## And when it will say something about improvement

`progress.ts` exists to keep three reasons for a moving number apart:
the person changed, the instrument stopped guessing, or the evidence
behind a component changed. **Only the first is an improvement.**

So the next reading will be a better reading, and almost none of that
will be him getting healthier. The improvement he is asking about shows
up when the vape stops and the drinking band drops — and the baseline
above is what it will be measured against.

*Computed 10 Nov 2026 by running `readPace` on `ISAAC_PROFILE`, not by
hand.*

# Brief: the Recovery coach — sleep, heat, cold, longevity

Read `docs/research/README.md` first. This is the priority round.

## Why this one first

Recovery is the thinnest area in the library and the most commercially
important. Sleep has **11** protocols, longevity has **7** — 18 between
them, against 40 for mind and 32 for nutrition. Longevity has **no A
grades at all**.

It also carries the audience. IntentNorth's first users arrive through
Steam Saunas Australia: people who have just bought a home sauna, are
already spending on recovery, and disproportionately wear an Oura or a
Whoop. They will open the app and look for exactly this pillar, and right
now it is the emptiest one.

## The single biggest gap: heat

**The library has almost nothing on sauna, and it is about to be handed to
several hundred sauna owners.** This is the highest-value work in the
round and I would spend a third of it here.

Start with the Finnish cohort literature — Jari Laukkanen and the Kuopio
Ischaemic Heart Disease study are the backbone, and there is now a
substantial body of work on frequency and duration. Then the acute
physiology: heat shock proteins, plasma volume, cardiovascular response.

Questions that need real answers, because people will ask them:

- Frequency and duration — what does the cohort evidence actually
  associate with outcomes, and at what dose does the association appear?
- **Timing against sleep.** Heat raises core temperature and the drop
  afterward is implicated in sleep onset. How long before bed? This is a
  scheduling property (`finishBeforeSleepMin`) and the engine needs a
  number.
- **Timing against training.** Post-workout heat and adaptation — there is
  a real literature here and it does not all point one way.
- Traditional Finnish sauna versus infrared. The evidence bases are not
  the same size and the marketing pretends they are. Say which is which.
- Hydration, and who should not.
- Contraindications, plainly: pregnancy, cardiovascular conditions,
  alcohol, medication that affects thermoregulation.

Be careful and be honest. Most of this literature is **observational
cohort work**, which under this library's taxonomy is B at best and often
C — very large consistent cohort evidence is stronger than "moderate
observational" but it is not a controlled trial. If you come back grading
sauna an A because it suits the launch, you have failed the round and
damaged the product. Isaac would rather have a truthful C.

## The second gap: cold

Cold water immersion is one of the most overclaimed practices in wellness,
and the honest version is genuinely interesting: there is reasonable
evidence it **interferes with hypertrophy adaptation** when used after
resistance training, and much weaker evidence for most of what it is sold
for. Cover the interference effect properly — it is a real finding that
contradicts common practice and belongs in protocol copy.

Also: the mood and alertness claims, what the actual trials look like,
and the safety line, which is not optional. Cold shock response is a real
mechanism with real deaths behind it.

## Sleep — where the 11 need to become 25

Named gaps, roughly in order of value to this audience:

- **Shift work.** IntentNorth already handles night shifts crossing
  midnight in the scheduler, most competitors do not, and the association
  and emergency-services audiences Isaac is targeting are full of shift
  workers. Anchor sleep, split sleep, light management on nights, the
  drive home. This could be a differentiator on its own.
- **Sleep debt and recovery sleep** — what recovers, what does not, and
  what the weekend catch-up literature actually shows.
- **Sleep and alcohol**, specifically the architecture effects.
- **Napping** — duration, timing, sleep inertia, who it helps.
- **Jet lag and travel**, with light timing.
- **Insomnia**: CBT-I is first-line, well-evidenced, and the library
  should point at it clearly while staying on the education side of the
  line. Do not write a treatment protocol. Write the practices, name
  CBT-I, and route to a professional.
- **Wearable sleep data** — how good is it actually? Consumer devices
  measure stages poorly compared with polysomnography, and the app shows
  people their numbers. It should be honest about the instrument.

One caution: **Matthew Walker's popular work has documented factual
errors** that have been catalogued in detail publicly. He is a real
scientist and much of the underlying field is sound, but do not use the
popular book as a source, and check any claim that traces to it against
the primary literature.

## Longevity — 7 protocols, no A grades

The pillar is thin because the honest version is small. Most of what is
sold as longevity is D and E, and previous rounds correctly excluded every
compound. Keep that line.

Worth pursuing: VO2 max and all-cause mortality (very large, consistent
cohort evidence — the taxonomy exists precisely for this), grip strength
and muscle mass as predictors, sitting time independent of exercise, and
the protein-and-ageing literature.

Explicitly still excluded: rapamycin, metformin, NAD precursors,
resveratrol, hormone therapy. If the evidence has genuinely moved, say so
in `findings.md` and let a human decide — do not write the protocol.

## HRV, and the thing the app gets wrong-footed by

The app reads variability from Apple Health and computes readiness against
a 14-day personal baseline. Two things worth research:

- **Oura and Whoop write RMSSD; Apple Health stores SDNN.** In practice
  neither writes variability into Health at all, which is why readiness
  leans on sleep and resting heart rate. Confirm the current state of this
  — it changes with firmware and it drives what the app can honestly claim.
- What does day-to-day HRV actually predict at the individual level? The
  population literature and the personal-tracking use case are not the
  same claim, and the app should not imply more than the second supports.

## Sources worth starting from

**Journals:** SLEEP · Journal of Sleep Research · Sleep Medicine Reviews ·
Journal of Physiology · Journal of Applied Physiology · European Journal
of Applied Physiology · Temperature · Mayo Clinic Proceedings (much of the
Finnish sauna work) · JAMA Internal Medicine

**Researchers:** Jari Laukkanen and Setor Kunutsor (sauna cohorts) ·
Christopher Minson (heat therapy) · Llion Roberts and Jonathan Peake (cold
and adaptation) · Jamie Zeitzer and Derk-Jan Dijk (circadian) · Colin
Espie (CBT-I)

**Podcasts, as discovery only:** Peter Attia's *The Drive* · *Huberman
Lab* · *Found My Fitness* (Rhonda Patrick has covered the sauna
literature at length and is a reasonable index into it — verify every
claim against the papers) · *Sigma Nutrition Radio* where it touches
recovery

## Scheduling shape matters more here than anywhere

Half of this pillar is time-anchored by nature. A sauna session at the
wrong hour is a different intervention. Get these right:

- `finishBeforeSleepMin` on anything that raises core temperature or
  arousal — this field exists because Zone 2 cardio was being scheduled at
  8:45pm.
- `anchor.kind` of `sleep` for wind-down practices, `wake` for light and
  morning routines, `fixed` only where the clock genuinely decides.
- `anchor.deadline: true` for cutoffs — caffeine, last meal, screens.
  These may move earlier and must never move later.
- `sessionType` where a guided in-app session should run (`breathe` for
  the wind-down family).

## What a good round looks like

20-25 new protocols, weighted toward heat and shift work. Sauna covered
properly enough that a person who just spent thousands on one opens the
app and finds it takes their purchase seriously. A grade spread that still
looks like the rest of the library. And at least three contradicted
practices named — cold-after-lifting is the obvious one, and there will be
more.

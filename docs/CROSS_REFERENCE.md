# Isaac — complete data, for cross-reference

Everything stated or measured as of **10 November 2026**. Copy the block
below into another model and ask it to estimate a biological age
independently.

**Read the two notes under it before comparing answers.** They are the
reason a second opinion will almost certainly differ, and the reason
that is not a tie-break.

---

```
PERSON
  Male, born 1988 (age 38), 187 cm, 90 kg, BMI 25.7
  Body fat 10-13% (stated, not DEXA)
  Brisbane, Australia. Office job 08:00-16:30. Two children under 5.

TRAINING  (20 years, consistent)
  4 x resistance sessions/week + 1 x futsal match (Mondays 18:15)
  Estimated 1RM / stated maxes:
    Bench press   132 kg  (measured: 120 kg x 3 on 10 Nov 2026)
    Squat         110 kg  (stated, untested)
    Deadlift      140 kg  (stated, untested)
    Overhead      80 kg   (stated, untested)
  Working session 10 Nov: bench 100x8, 110x5, 115x5, 120x3
    then lat pulldown 80 kg x 15 x 4, incline cable 80 kg x 14 x 3
    superset close-grip push-ups x 10 x 3
  Ratios: bench 1.47x BW, deadlift 1.56x, squat 1.22x, overhead 0.89x
          deadlift/bench 1.06 (typical 1.2-1.3)
          squat/bench 0.83 (typical 1.25-1.3)

HEAT / BREATH  (20 years)
  Sauna 4 x/week, 90 C, 20-25 min per session
  Wim Hof style breath holds: 2:00 / 2:15 / 2:20 in sauna (10 Nov)
  Longest hold, out of heat: 3:20

SLEEP
  22:00-06:30 = 8.5 h in bed (one night recorded, 9 Nov)
  Stated habitual schedule is the same. Regularity not yet measured.

NUTRITION  (10 Nov, a complete day)
  Protein 178 g | Fibre 28 g | no calorie target kept
  Water 8 L/day habitually
  Creatine 4 g/day
  Target: protein 165-180 g, fibre 30 g

SUBSTANCES
  Nicotine: vapes currently. Trying to stop.
  Alcohol: 4 consecutive drinking nights 5-8 Nov (self-described as
    "worse than usual"). Dry 9-10 Nov. Weekly standard-drink count
    NOT established.

MOOD
  7.5/10 (one reading, 10 Nov)

NOT MEASURED
  Grip strength, one-leg balance, gait speed, VO2max,
  blood pressure, lipids, HbA1c, fasting glucose,
  resting heart rate, HRV, waist circumference,
  self-rated health, loneliness, sleep regularity
```

---

## Note 1 — what my own figure is, and how it was reached

**+1.6 years. Markers consistent with roughly 40 against a
chronological 38.** Stated interval ±15 years, from **3 of 11
markers**.

It is built from three things only:

| | contribution |
| --- | --- |
| vaping | +2.1 raw years |
| alcohol, assumed 11–20 drinks/week | +0.5 raw |
| sauna | **recorded, scored at zero** |
| everything else | not measured, or not a component |

Method: published hazard ratios per component, summed as log hazards,
shrunk by a 0.6 attenuation factor for correlated predictors, converted
to years through a Gompertz mortality-rate doubling time of 8 years.

**Three things it does NOT do, which a second opinion probably will:**

1. **It does not score the sauna.** The published figure (Laukkanen
   2015, HR 0.60 for 4–7 sessions/week) is measured against **one
   session a week, not none** — so crediting it against a non-user is
   crediting a baseline nobody measured. It also converts to −5.9 raw
   years, which is half of lifetime smoking in the opposite direction,
   from one cohort of 2,315 self-reporting men.
2. **It does not score the lifts.** Ruiz 2008 (*BMJ*, 8,762 men)
   reports age-adjusted death rates across strength thirds of
   38.9 / 25.9 / 26.6 per 10,000 person-years — the middle and top
   thirds are the same. That is a **floor effect**, not a
   dose-response, and he is far above the floor. More strength buys
   nothing measurable in that data.
3. **It does not score body fat.** The literature is conflicting: one
   NHANES-linked analysis finds a U-shape with lowest mortality near
   **25%** in males, and low BMI repeatedly associates with higher
   mortality. There is no clean coefficient at 10–13%.

## Note 2 — why a second opinion will be lower, and why that is not a result

**Any model asked this will almost certainly return a younger age**,
because the obvious moves are all available to it:

- count the sauna at face value (−5.9 years)
- count twenty years of training as a dose-response
- count 10–13% body fat as straightforwardly protective
- count an 8.5-hour night, 178 g of protein, 8 L of water, a 3:20
  breath hold

**Every one of those is a number somebody would have to invent.** None
has a published hazard ratio that transfers to this reference person.
The figure above is deliberately the conservative one, and it is
conservative because of what was *left out*, not because of a pessimistic
reading of what went in.

So the useful question to put to a second model is not *"what age do you
get"* — it is **"name the study and the hazard ratio behind each year
you are crediting, and state what its reference group was."** Where it
cannot, that is the disagreement, and it is the whole disagreement.

## Note 3 — the honest summary in one line

**The instrument can see two things about him and both are things he is
quitting. Everything he is good at is either unmeasured or has no
coefficient that transfers.** The number is not a verdict on his
health; it is a verdict on how much of his health has a published
effect size attached to it.

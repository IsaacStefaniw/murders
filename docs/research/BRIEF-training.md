# Brief: the Training coach

Read `docs/research/README.md` first.

## Current state

27 protocols — A 3 · B 10 · C 10 · D 4 · E 0. Healthy spread, and this is
the coach Isaac rates highest ("the training one excellent, the rest need
work"). Your job is depth and honesty, not rescue.

Training also has the most machinery behind it: a levelled programme, 1RM
banding, exercise swaps by movement pattern, a weighted strength baseline
over 84 days, constraint ceilings, and a rest timer. Protocols here land
in a system that already knows a lot about the person.

## Where the depth is missing

**Minimum effective dose.** The single most valuable thing for this
audience. Founders, shift workers and parents do not have five sessions a
week. What does the evidence say about the floor — sets per muscle per
week, frequency, session length — below which adaptation still happens?
There is good work here and it is under-represented in the library.

**Autoregulation.** RPE and RIR-based loading, and what happens when
someone turns up under-recovered. The app already regulates today's
session against last night's sleep; the protocol library should carry the
reasoning.

**Deloads and detraining.** What actually happens across a two-week break,
a holiday, an illness. How fast does strength come back? People plan
around this badly and the evidence is reassuring.

**Training with what you have.** Bands, bodyweight, one kettlebell, a
hotel room. Effect sizes versus full equipment.

**Training over 50, and over 65.** Load tolerance, recovery, power versus
strength, and the fall-prevention literature — which is a different and
better-evidenced body of work than general strength training.

**Female-specific considerations.** The library already states plainly
that the popular cycle-phase training template is not supported. What *is*
supported? Pregnancy and postpartum are `appliesTo` territory and need
care; pelvic floor is already flagged.

**Zone 2 and cardiovascular work.** VO2 max is one of the strongest
mortality predictors in the literature. The library should carry that
depth, and it should be honest about how much of the popular Zone 2
framing is extrapolated from athlete data.

**Tendon and connective tissue.** Slower-adapting than muscle, and the
reason people get hurt when they progress load on a schedule that suits
muscle. Isometrics and heavy slow resistance have real evidence.

## Contradicted practices to hunt

The library already names foam rolling, movement screens, internal
body-part cueing, and the 10% running rule. Likely more:

- The anabolic window as popularly stated
- Static stretching before lifting, and what it actually costs
- "Muscle confusion" and the case for varying exercises constantly
- Toning versus bulking as separate training goals
- Lactic acid as the cause of next-day soreness
- Sweat as a measure of session quality
- Machines versus free weights as a settled hierarchy

Each of these is believed widely enough to be worth naming in copy.

## Sources worth starting from

**Journals:** Journal of Strength and Conditioning Research · Sports
Medicine · Medicine & Science in Sports & Exercise · British Journal of
Sports Medicine · Scandinavian Journal of Medicine & Science in Sports ·
European Journal of Sport Science

**Researchers:** Brad Schoenfeld (hypertrophy volume and frequency
meta-analyses) · Eric Helms · James Steele and James Fisher · Keith Baar
(tendon) · Stuart Phillips (protein and resistance training) · Martin
Gibala (interval work)

**Podcasts, as discovery only:** *Stronger By Science* (Greg Nuckols and
Eric Trexler — unusually rigorous, and they publish their reasoning) ·
*Iron Culture* · *Perform with Andy Galpin*. These are better entry points
than most because they cite properly, but the rule still holds: find the
paper, read the paper, grade the paper.

## Scheduling shape

Strength already carries `finishBeforeSleepMin: 60` — hard resistance work
raises arousal and the hour before bed is worth keeping clear. Apply the
same judgement to anything intense you add.

Most training protocols want `sessionType: 'workout'` so they run through
the real player with set logging, the rest timer and e1RM capture. If a
protocol should not run that way, be deliberate about it.

Mind the modality floors and capacity rules in `toRoutine` — a
minimal-capacity person keeps could-tier practices to twice a week, and a
protocol that ignores that will not place.

## Safety

Every training entry needs a plain-words safety note; the integrity test
enforces it on this pillar. Conservative loading, controlled range, no
pushing through joint pain.

**Decline the clinical half.** A previous round refused to write
return-to-training after a named injury, because graded reintroduction is
a clinician's judgement. That refusal stands. You may write general
robustness and load-management practices. You may not write rehabilitation.

## What a good round looks like

15-20 new protocols weighted toward minimum effective dose,
autoregulation, older adults and tendon work. Four or five contradicted
practices with citations. And an honest look at whether any of the
existing 27 is graded above what it can carry.

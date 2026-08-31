# INTENT OS — the vision

*The product north star. Everything in `PRODUCT.md`, `PATHS_BRIEF.md` and
`PERFORMANCE_MODEL.md` describes what is built; this document describes where
it is going and the rule for deciding what to build next.*

---

## The one-sentence vision

**Tell INTENT who you are and what you want. It builds the program, watches
what actually happens, and changes the next step — with a reason — until you
get there.**

For *any* goal. In *any* lifestyle. Forever learning.

## The gap in the world

Every serious tool today is a specialist. The sleep ring knows you slept
badly but can't touch today's training. The training app knows your five-rep
max but not that you have a newborn. The meditation library has four thousand
sessions and no opinion about which one belongs in *your* Tuesday. The AI
calendar packs the day perfectly and calls that a win.

Nobody owns the layer above them: the layer that holds one picture of a whole
life, turns an ambition into a program, and closes the loop between what was
planned and what actually happened. That layer is an operating system. That
is what INTENT is.

## The universal mechanic

Underneath every pathway we have shipped — training, nutrition, money, work,
mind, recovery — is the same five-part loop:

1. **Goal.** A stated ambition with a definition of done.
2. **Milestones.** The goal decomposed into an ordered ladder, each rung with
   an explicit `doneWhen` condition (Money v2's automate → buffer → kill-debt
   ladder is the template).
3. **Program.** The current rung translated into concrete scheduled actions,
   shaped by the user's real capacity, existing habits, and week.
4. **Check-ins.** Lightweight measurement at the right moment — a logged set,
   a weigh-in, one question in a path hub, a metric arriving from Apple
   Health. Never a form. Never a question we already know the answer to.
5. **Adaptation.** Observed results change the next block, and the system
   states why. The reason line is the product.

Today this loop is hand-built five times, once per pathway. **The vision is
that the loop becomes a compiler**: a goal engine that can assemble this
structure for *any* goal a person brings — run a marathon, write a book, save
a house deposit, learn a language, rebuild after a divorce, grow a business,
be a calmer parent — from the same primitives:

- an evidence-graded **protocol library** (the knowledge base, graded A–E),
- a **milestone decomposer** that turns the ambition into a ladder with
  measurable `doneWhen` rungs,
- a **check-in schema** that decides what to measure, how often, and how
  cheaply it can be captured,
- the **personal performance model** that can observe, trend, and
  personal-best *any* metric, not just the ones we predefined,
- and the **scheduler**, which already knows how to place work into a real
  week without pretending life is a calendar problem.

A pathway stops being something we author and becomes something the engine
composes. The five shipped pathways remain as the proof — and as the
highest-quality templates the compiler learns from.

## Any lifestyle

A program that ignores the life around it is a wish. The system already
treats lifestyle as an input, and the vision doubles down on it:

- **Capacity first.** A new parent gets three anchored days, not seven. The
  ambition survives; the dose changes.
- **Build on what's already true.** Existing habits — fasting, walking,
  sauna, meditation, a standing workout — are captured in the interview,
  marked "already yours", and become the anchors new work attaches to. Sim v5
  measured this: +17% more planned activity completed when programs build on
  existing habits.
- **The week you actually live.** Sleep from last night regulates today's
  session. Repeated same-weekday misses should reshape the block (engine v6).
  The program bends around life; the user is never told to bend around the
  program.
- **Seasons.** The same person is a different user during a product launch, a
  newborn phase, an injury, a holiday. The profile is continuous; the program
  is seasonal.

## How we know it works before users do

Our structural advantage is the **simulation lab**: 2,000 generated user
profiles, six months each, run through the *production* engine code — not a
model of it. Every engine change is tested against 364,000 simulated days
before a real person sees it. When the compiler starts assembling programs
for arbitrary goals, the lab is what keeps quality honest at scale: a new
goal template ships when it beats its ablation across the cohort, not when
it demos well.

This is also the trust story at a million users: we publish our engineering
evidence, clearly labelled as simulation. Trust earned, not borrowed.

## Principles (non-negotiable)

- **The user owns the plan, not the calendar.** We never optimise for a full
  schedule.
- **Every adaptation states its reason.** No black-box scores.
- **Never ask what we already know.** One continuous profile across web and
  app; depth is offered, never demanded.
- **Education, not advice.** Health, nutrition, recovery and money content is
  framed as education with graded evidence; a professional is named as the
  right next step where one is.
- **The hardest moment is free, forever.** Recovery, urge and crisis support
  never sits behind the paywall. Principle, not promotion.
- **No claims ahead of the product.** In the app, on the website, in this
  document.

## Horizons

**Now (shipped or in TestFlight):** five deep pathways with real learning
loops (e1RM-driven loads, weight-trend nutrition, savings-rate ladder, deep
work blocks, practice progression); progressive interview + question engine;
existing-habit anchoring; Apple Health read-only ingestion; weekly review;
the simulation lab; automated TestFlight releases.

**Next (the fuller app):** the goal composer v1 — user states any goal, the
engine drafts the milestone ladder and check-in schema for approval; local
notifications and calendar *read* so the plan meets the real week; the shared
web↔app profile API; engine v6 (day-shifting on repeated misses,
established-routine pruning immunity); more protocol coverage per pathway.

**Later (the operating system):** cross-domain arbitration as a shipped
behaviour — the system deciding, with a stated reason, that this week money
work yields to sleep repair; the household layer as a first-class surface
(two profiles, one family week); goal templates shared and improved across
the user base with the sim lab as the quality gate; the app as the place a
million people keep the whole picture of the life they are building.

## The test for any new feature

One question decides scope: **does it strengthen the loop?** If a feature
does not improve how a goal becomes milestones, how milestones become a
program, how the program meets a real week, how results get measured, or how
the next block adapts with a reason — it waits.

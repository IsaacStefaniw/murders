# INTENT — Competitive brief: from planner to Personal Operating System

**Thesis:** every competitor owns either a *vertical* (meditation, fitness,
budgeting, business coaching) or a *surface* (calendar, habit list, journal).
Nobody owns the loop that turns a person's stated values into a lived week.
INTENT's wedge is that loop — and the way to widen it into a moat is
(1) a compounding user model built by concrete learning, and (2) a
**modality architecture** that lets AI construct many coaching pathways
through one scheduling, nudging and reinforcement engine.

---

## 1. The landscape and its failure modes

| Category | Examples | What they own | Why they fail the whole person |
| --- | --- | --- | --- |
| Habit trackers | Streaks, Habitify, Habitica | Logging & streaks | Mechanical; streak-loss shame; no planning authority; nothing changes when life changes |
| AI schedulers | Motion, Reclaim, Sunsama | Calendar optimisation | Optimise *work tasks*, not values; a perfectly packed day is their success and a life failure |
| Meditation/wellness | Calm, Headspace, Balance | Content libraries | Sessions live outside the day; no link from "meditated" to "slept, then trained, then didn't drink" |
| Wearables | Whoop, Oura, Apple Fitness | Physiological truth | Rich data, weak action: a recovery score with no authority to move your calendar |
| Nutrition/fitness | MyFitnessPal, Noom, Future | Single-domain coaching | Logging burden (MFP), single outcome (Noom), human-coach pricing (Future ~$150/mo) |
| Finance | YNAB, Copilot | Transaction truth | Data-rich, behaviour-poor; no bridge from "overspent" to "this week's plan" |
| AI coach chatbots | Rocky, Wave, GPT-wrappers | Conversation | Advice evaporates; no calendar, no sensors, no follow-through, no memory that compounds |
| Life-planning journals | Best Self, Full Focus, 5-Minute Journal | Reflection ritual | Paper-shaped: insight never becomes a scheduled action |

**The structural gap:** vertical depth exists everywhere; *horizontal
orchestration* exists nowhere. The user is left being their own chief of
staff across eight subscriptions. INTENT is the orchestration layer — and
because switching costs compound with every week of learned behaviour, the
position strengthens with use in a way content libraries never do.

---

## 2. Moat #1 — the compounding user model (information gathering)

Doctrine: **never a form when a moment can teach.** Information gathering is
not onboarding; it is a permanent, low-friction curriculum the AI runs on
the user, one question at a time, always at the moment the answer is alive.

**The knowledge ladder** (each layer earned, not demanded):

1. **Identity** — Life Interview: priorities, people, rhythms, ambitions.
2. **Intent** — goals with their *why*, captured conversationally.
3. **Behaviour** — the plan-event stream: completions, moves, skips,
   shortens; who initiated; what recovered. *(shipped)*
4. **Context** — triggers ("after a meal"), reflections, busy/travel states. *(shipped v1)*
5. **Physiology** — HealthKit sleep/workouts/HRV as evidence, not judgement. *(native)*
6. **Environment** — labelled places, arrive/leave events. *(native)*
7. **Money** — balances/flows via aggregation, for the finance modalities. *(later, opt-in)*

**Concrete learning mechanics** — how the AI earns each datum:

- **Micro-prompts:** one question, one tap, only at high-context moments
  (post-workout: "harder or easier than usual?"; after a moved meeting:
  "protect this slot weekly?"). Cap: a handful a day, budgeted by the same
  fatigue rules as nudges.
- **Prompted diaries with owners:** every journal prompt belongs to a
  modality that consumes the answer (the business coach asks the Friday
  review question; the mental-health modality asks the mood question).
  **Rule: no data without a decision it improves.** If nothing would change
  based on the answer, the question is not asked.
- **Decision outcomes as data:** every suggestion accepted/dismissed/ignored
  trains the per-user bandit — the app learns *how to coach this person*,
  not just what to schedule.
- **Inference with confidence:** derived beliefs carry confidence + evidence
  + review dates (schema shipped); the AI asks to confirm before acting on
  a weak belief. Presence at the gym is a question, never a conclusion.

This is the moat: after 90 days INTENT holds a structured, queryable model
of how this specific human actually operates — what no vertical app and no
chatbot transcript can replicate.

---

## 3. Moat #2 — the modality architecture

A **modality** is a packaged coaching capability that plugs into INTENT's
loop. Every modality declares the same six interfaces:

1. **Intake** — the questions it may ask, and when (feeds the ladder above).
2. **Pathway generator** — goal + user model → a concrete program
   (milestones, session types, cadence). AI constructs it; Zod validates it;
   the deterministic engine schedules it. AI never invents times.
3. **Sessions** — the runnable units, *executed inside the app* where
   possible: a guided thing you do, not an article you read.
4. **Signals** — what it consumes (sleep, completions, mood, spend) and
   emits (readiness, adherence, insight).
5. **Reinforcement rules** — what "working" looks like and how progress is
   reflected back (specific, identity-building, never gamified).
6. **Safety envelope** — hard limits: what it may never claim or advise.

One engine, many coaches. The user experiences a single calm chief of
staff; underneath, modalities compete only for the time the values budget
allows them.

### The launch bench

| Modality | Pathway example | In-app session | Key signals | Safety envelope |
| --- | --- | --- | --- | --- |
| **Gym coach** | "Train 4×/wk" → periodised strength program → sessions adapted to time available | Workout player: exercises, sets, rest timer; auto-shortens (engine already does the math) | HealthKit workouts, completion, perceived effort tap | No injury/medical advice; deload on poor recovery |
| **Breathwork** | "Less stress at work" → 3×/day 90-second protocols at learned stress moments | Animated paced breathing (box, 4-7-8, physiological sigh); runs in 90 seconds | Trigger events, mood before/after tap | Non-clinical framing |
| **Meditation** | "A calmer evening" → 10-min wind-down sits replacing the scroll window | Guided timer with minimal audio; streak-free consistency band | Evening reflection mood, sleep proxy | Non-clinical framing |
| **Business coach** | "Grow to $2m" → baseline → levers → monthly targets → weekly operating rhythm | Friday review wizard: 5 structured questions → next week's growth-block agenda | Deep-work completion, milestone progress, review answers | Coaching questions, not fiduciary advice |
| **Financial development** | "Save $50k" / "Get investing" → automate → allocate → monthly review curriculum | Money check-in: 10-minute guided review; bite-size investing lessons tied to *their* next decision | Milestones, later account aggregation | **Education, not regulated financial advice** — explicit line, no product recommendations without disclosure architecture |
| **Nutrition** | "Eat like it matters" → structure (protein anchor, dinner plan) over logging | Sunday 10-min meal sketch; zero-calorie-counting default | Junk-food behaviour events, energy self-reports | No diet dogma; no medical nutrition therapy |
| **Supplements** | Goal-linked, evidence-aware basics → timing schedule → refill tracking | Morning stack reminder in Today; refill order prompt | Adherence, refill dates | Evidence-aware, conservative; interactions → "ask your pharmacist"; commerce never biases ranking (reasons persisted) |
| **Sauna / heat & cold** | "Recover better" → 2–3 sessions/wk protocol woven around training days | Session timer with protocol (rounds, cool-down); logs as recovery | HR data where available, adherence | Contraindication screening; conservative durations |
| **Mental health** (non-clinical) | "Steadier weeks" → mood tracking + behavioural activation + connection scheduling | Two-minute check-in; reframe prompts using the user's own *why* | Mood trend, reflection sentiment, behaviour events | **Never diagnose or treat**; deterioration pattern → warm professional-help signpost (already the alcohol pattern) |
| **Sleep** (glue modality) | Bed target ladder + wind-down enforcement | Wind-down sequence: screens away, tomorrow preview, breath | HealthKit sleep, late-night events | Non-clinical; feeds every other modality's readiness |

### Why modalities beat features

- **Coherence:** ten coaches, one budget of time and attention, one Today
  screen. The values hierarchy from the interview arbitrates conflicts
  (family dinner beats the sauna window).
- **Cross-domain intelligence** — the thing no vertical can copy: drank
  last night → tonight's plan protects sleep and tomorrow's session gets a
  readiness check. Big deadline week → business coach claims mornings,
  meditation shifts to lunch, INTENT protects one family commitment
  *because the user said family matters*.
- **Extensibility:** the same contract later admits third-party or expert-
  authored modalities (a named coach's strength program as a pathway) — a
  marketplace, not a content mill.

---

## 4. Diaries that act

The life-planning journal category proves demand for reflection; its
products die because insight never becomes action. INTENT's rule:

> **Every diary entry either updates the user model or changes a plan —
> within a week — or the prompt that produced it is retired.**

Morning pages → intention on Today. Friday business review → next week's
growth-block agenda. Mood dip pattern → connection scheduling. Gratitude
peak-end → tomorrow's framing. The diary is the sensor; the calendar is
the actuator.

---

## 5. Scheduling, nudges, reinforcement (the engine they all share)

Already built and tested: deterministic placement with buffers, protected
time, reserved slack; recovery-first skip flows; the behavioural event
stream; anticipation gaps. On top of this, per-user reinforcement:

- **Nudge taxonomy:** action-required, upcoming, behavioural intervention,
  relationship, review, suggestion — each an arm in a per-user bandit;
  two ignores halve frequency and force a copy/channel change.
- **Reinforcement that respects the user:** specific recognition
  ("third lunchtime session in a row — that's a habit forming"), identity
  framing, anticipation ("Friday: date night"), progress-against-*why*.
  Never points, badges, streak hostage-taking, or variable-reward loops.
- **Recovery over perfection** as the signature: the plan bends, publicly
  and intelligently, when life hits it. This is the emotional moment that
  earns $20–30/month.

---

## 6. Commercial logic

- **Replacement math:** Calm ($70/yr) + MFP ($80) + Motion ($228) + a
  coaching app ($100+) + journal apps — INTENT at $20–30/mo undercuts the
  stack it replaces while doing the connective work none of them do.
- **Expansion revenue:** supplement refills and (much later) bookings —
  only with persisted `recommendation_reason` and disclosed relationships.
  Trust is the asset; commerce must never silently bias coaching.
- **Retention physics:** the user model compounds; export exists (trust),
  but the *working relationship* — a system that knows Tuesday lunch is
  when you actually train — is not portable.

---

## 7. Sequencing

1. **Now (web/native parity):** breathwork + meditation sessions (cheap to
   build, run fully in-app, high frequency), gym-coach session player,
   business Friday review wizard. Each exercises the full modality contract.
2. **Native wave:** HealthKit evidence, geofenced context, sleep glue
   modality, notification actions.
3. **Trust wave:** nutrition structure, supplements with refill tracking,
   sauna protocols, mental-health check-ins with signposting.
4. **Money wave:** financial development curriculum → account aggregation →
   the education/advice line formalised with counsel.
5. **Marketplace wave:** expert-authored pathways on the modality contract.

## 8. Risks and their design answers

- **Scope sprawl** → the modality contract *is* the containment: nothing
  ships without all six interfaces, and the Today screen never grows.
- **Regulatory (finance, health)** → education-not-advice lines drawn in
  the safety envelopes from day one; counsel before the money wave.
- **AI slop coaching** → pathways are validated structures over
  deterministic scheduling; the AI personalises and explains, it does not
  freestyle programs.
- **Overload of the at-capacity user** → the values budget and reserved
  slack are hard engine constraints; modalities request time, they never
  take it.

**The one-line strategy:** competitors sell content or optimisation;
INTENT sells *a week that resembles your values* — and gets provably
better at it every week you use it.

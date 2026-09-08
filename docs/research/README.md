# Research rounds — the shared contract

Nine briefs sit beside this file, one per coach and one per uncovered
pillar. **Read this first, then your brief.** This half is identical for
every round; the brief is what makes yours different.

You have web access. The session that wrote these does not. That is the
entire reason you exist: everything here has to be traced to a primary
source you can actually open.

## What this library is actually for

Not a literature review. **The job is to get someone to do something good
for them on a Tuesday**, and to make them feel capable while they do it.

Every protocol you write lands in a real person's week — at a real hour,
with a duration the scheduler has to honour, under a coach that will speak
to them about it. Somebody who has just bought a sauna, or just decided to
save $100k, or just told the app they sleep badly, is going to open a
screen and read what you wrote. Write for that moment.

**The active ingredient in almost everything here is adherence.** A C-grade
practice someone does for twelve weeks beats an A-grade practice they
abandon in week two. That is not a compromise with rigour — it is what the
behaviour-change literature actually shows, and it should shape every
choice you make about what to include and how to write it.

So: **grade the evidence honestly, and write the practice so somebody
wants to do it.** Those are different jobs, done in different fields, and
the rest of this document explains how to hold both.

## The default is encouragement

The person reading this app is trying. That is the starting assumption.

Doing a healthy thing beats not doing it. Doing it imperfectly beats not
doing it. Ten minutes of walking is not a failed hour of Zone 2 — it is
ten minutes of walking, and it counts. Every protocol should be written so
that the version somebody manages on a bad week still reads as a win.

Concretely, in the copy you write:

- **Name the smallest version that still works.** "Even five minutes
  helps" is often literally true, and it is the sentence that gets someone
  off the sofa.
- **Never write a practice as a test the person can fail.** No implied
  standard they are falling short of.
- **Say what they get, not what they are risking.** "The cheapest lever
  for falling asleep easier" beats "poor sleep is associated with worse
  outcomes."
- **Assume competence.** They are an adult who has chosen to work on this.

Fear-based framing is not merely unpleasant — it is worse at producing
behaviour change over any horizon longer than a fortnight. This library
should carry almost none of it.

## Expectancy is a real mechanism, not a confound to apologise for

This matters enough to have its own section.

Open-label placebo research — Ted Kaptchuk's group at Harvard among others
— finds real effects even when people are told plainly that what they are
taking is a placebo. Expectancy is a genuine causal contributor to
outcome, and it operates twice over: directly, and through the fact that
somebody who believes a practice will help actually does it.

Three consequences for how you write:

1. **A low-grade but harmless practice that somebody finds meaningful has
   real value.** Grade it D honestly and write it warmly. Those are not in
   tension, and treating them as though they are is the mistake.
2. **Never write copy that undermines a practice the person is about to
   do.** "The evidence here is early" is honest and fine. "This probably
   won't do much" is discouraging, and given expectancy it is partly
   self-fulfilling — you would be reducing the effect by describing it.
3. **Where expectancy is a large part of the mechanism, say so** — plainly
   and without embarrassment. "Some of this is the ritual itself, and the
   ritual works" is an honest and unusual thing for an app to say.

What this does **not** license: including practices that do not work,
because believing helps. Expectancy raises the value of harmless
low-grade practices. **It never raises their grade.**

## The grade and the encouragement are different fields

This is the crux, and it resolves most of the apparent tension here.

`evidenceLevel` is the honest grade. It is checkable, a reviewer will
check it, and inflating it destroys the one thing this product has that
competitors cannot copy.

`summary` and `why` are where a person meets the practice. Warm, concrete,
motivating.

A C-grade protocol can honestly read:

> Ten minutes most evenings. The research is early and mixed, and the
> people who do this consistently tend to keep doing it — which is usually
> the part that matters.

Rather than:

> Some evidence, not settled. Likely marginal benefit.

Both are truthful. One gets done. Write the first.

The app already shows the grade beside every practice with a plain-words
explanation, and closes with: *"Most of what is here is not an A. Little
of what anyone can teach you about your own life is. You get to see which
is which, and decide."* That line does the honesty work. Your copy does
not need to repeat it in a discouraged tone.

## Grading

`A` many studies agree · `B` tested and it held up · `C` some evidence,
not settled · `D` early days · `E` unproven. Precise wording in
`protocols.ts` (`EVIDENCE_PLAIN` / `EVIDENCE_PRECISE`).

The library is at **204 protocols**, graded A 15 · B 67 · C 73 · D 41 · E 8.

Grade truthfully in both directions — up where deserved (retrieval
practice and spaced review were graded *up* to A on review) and down where
not (`daily-walk` moved A to B). Do not inflate to make a round look
strong; do not deflate to look rigorous. Both are failures of the same
kind.

**A C you would genuinely recommend to a friend is a better entry than a B
nobody will ever do.** Choose what to include on that basis, then grade
what you included honestly.

## Give people their time back

Some of what people do does not work, and saying so is a service — not
because debunking is satisfying, but because **somebody spending twenty
minutes foam rolling before every session can have those twenty minutes
back**, and probably spend them on something that helps.

Frame it that way. "You can skip this" is a gift. "You have been wasting
your time" is a lecture, and nobody returns to an app that lectures them.

Keep it proportionate: **roughly one in five of what you return**, not
half. A round that is mostly debunking has misunderstood the job. The
library already names the ten-thousand-hours framing, blocked repetition,
internal body-part cueing, foam rolling, movement screens, the 10% running
rule, the "23 minutes to refocus" figure, micro-breaks raising output, the
smaller-plate effect, the five stages of grief, learning styles,
highlighting and rereading. Add a few good ones. Do not go hunting.

## What this gives the coach to say

Your brief has a section on this, and it is the one that decides whether
the round was worth running.

Each coach speaks to a person daily. A protocol is not a document — it is
material the coach uses. Before you finish, answer plainly: **what can this
coach now say on a Tuesday morning that it could not say before?** If the
answer is thin, the round produced a bibliography rather than a product
improvement.

## The three source types

**Peer-reviewed research is the only thing that sets a grade.** Journals,
systematic reviews, meta-analyses, position stands.

**Science journalism** helps you find and contextualise research. It never
sets a grade on its own.

**Podcasts are discovery sources. They are never evidence** — but they do a
second job that matters commercially, described below.

### Working with podcast transcripts

Transcripts are widely available and genuinely useful — a good long-form
episode surfaces a body of work in an hour that would take a day to find
cold. Use them for that.

1. **Never reproduce transcript text.** Not a sentence. Everything is
   written in IntentNorth's own words. A transcript is a copyrighted work.
2. **Trace every claim to the study.** If you cannot identify the paper
   behind "there's a study showing X", the claim does not enter the
   library — however well-known the speaker.
3. **Grade the study, never the speaker.** A confident presentation of one
   small crossover trial is a C.
4. **Note where the podcast and the paper differ.** Useful, and often the
   most interesting thing you will find. Record it without scorn — most
   overclaiming is enthusiasm, not dishonesty.

Attribution credits whose public teaching popularised a practice and
implies no endorsement. The UI says so.

### Attribution is a product feature, not just a credit line

This is why the big podcasts are worth mining rather than avoiding.

Somebody who opens a card and reads *Andrew Huberman · Peter Attia*
recognises the names. They think "I've heard that" — and they start from
confidence rather than suspicion. Given everything above about expectancy
and adherence, that recognition is not decoration: it is part of why the
practice works for them.

So **populate `attribution` generously and accurately**. Where a
well-known communicator has genuinely covered a practice in public, name
them. Where they have not, do not — a false attribution is worse than an
empty one, and the recognition only helps while it is real.

Long-form episodes are also simply the most efficient way to survey a
literature: an hour of a good one will point you at twenty papers worth
opening. Use them for exactly that, then open the papers.

The rule is unchanged and worth restating because the two ideas sit close
together: **a podcast can tell you what to read and whose name belongs on
the card. It can never tell you the grade.**

## Verification, kept in proportion

Check load-bearing studies for retractions and failed replications —
Retraction Watch, PubPeer, the paper's landing page. A previous round
traced "don't shop hungry" to a retracted paper and correctly excluded the
whole lineage.

Watch for underpowered single studies presented as settled, very low-bar
publication venues, and effects that are statistically real but too small
to matter in a life.

This is quality control, not the purpose of the round. Spend maybe a fifth
of your effort here and the rest on finding good practices worth doing.

## Hard constraints

- **Education, never advice.** Never "prescription" — programme, plan,
  practice, protocol. Enforced by test.
- **Safety notes** in plain words on health entries. Write them as care,
  not as disclaimer: they should read like a good coach mentioning
  something, not like a lawyer covering themselves.
- **No substances** beyond the supplements carve-out
  (`protocols.supplements.ts`), which has its own rules.
- **Money entries** must name a licensed professional as the next step and
  may never name a product, platform, ticker or return figure.
- **Anchor direction is correctness.** Wake, sleep or fixed changes what a
  practice *is*. Deadlines (`anchor.deadline`) may move earlier, never
  later.
- **`neverNag`** wherever a missed day carries no meaning — bereavement,
  redundancy, transitions, supplements. Use it generously. Nothing in this
  library should ever make somebody feel behind.
- **`appliesTo`** for `femaleAnatomy`, `pregnancy`, `menopause`.
- **Decline what needs clinical judgement**, and say why. A previous round
  refused to write return-to-training after a named injury. That was right.

## Deliverables

Write to `docs/research/output/<your-area>/`:

**`protocols.ts`** — candidate objects, valid TypeScript against the
`Protocol` interface, ready to paste. Unique ids. Every field. Copy a real
person would want to read.

**`sources.md`** — per protocol: id, primary source with DOI or PMID,
design, sample size, grade, and two sentences on why that grade and not
the one above.

**`findings.md`** — five sections:
1. What changed in this area's evidence since the library was written
2. **What is genuinely well supported** — the practices you would happily
   put in front of somebody tomorrow, and why
3. **Where the popular version overstates the paper** — recorded plainly
4. **Time-back findings** — things people do that they can stop
5. **Regrades proposed**, up or down, and **what you declined to write**

## Volume

**25-40 genuinely useful, well-sourced protocols**, and a source count
worth quoting.

Breadth, depth and rigour are the product here, not just the method. The
recovery round opened around 190 papers at publisher or PMC level and that
is one of the strongest things about it — say what you checked and how, in
`findings.md`, rather than burying it. A library that can show its working
across hundreds of verified sources is a credibility asset no competitor
in this category has.

That said: thin entries still subtract. If your area is already dense,
spend the round on depth, better copy for existing entries, and regrades —
and say so rather than padding to hit a number.

## Where this lands

One list feeds the interview, the goal wizard, the library screen, the AI
planner's context and the scheduler. Write the scheduling shape as
carefully as the evidence, and the copy as carefully as both.

## The nine briefs, in the order worth running them

| # | Brief | Pillar(s) | Now | Why this position |
|---|---|---|---|---|
| 1 | `BRIEF-recovery.md` | sleep 11, longevity 7 | 18 | Thinnest area, and where the sauna audience lands. Heat is the biggest single gap. |
| 2 | `BRIEF-money.md` | wealth 11 | 11 | Joint-thinnest, carries the goal ladder, rated as needing work. |
| 3 | `BRIEF-work.md` | leadership 23 | 23 | Weakest grades. Shift work and non-desk roles are the association and employer wedge. |
| 4 | `BRIEF-nutrition.md` | nutrition 32 | 32 | Depth on protein, satiety, shift-work eating, alcohol. |
| 5 | `BRIEF-training.md` | training 27 | 27 | Strongest coach. Minimum effective dose and older adults are the gaps. |
| 6 | `BRIEF-relationships.md` | connection 31 | 31 | Warmth matters most here. No A grades permitted. |
| 7 | `BRIEF-mind.md` | mind 40 | 40 | Largest pillar. Behavioural activation and honest safety are the priorities. |
| 8 | `BRIEF-supplements.md` | (carve-out) | — | Narrow, rule-bound. |
| 9 | `BRIEF-skill.md` | skill 22 | 22 | Best-evidenced already. Run short or last. |

One brief per session. They are independent, but where two overlap the
later should read the earlier one's `findings.md` and cross-reference
protocol ids. Known overlaps: shift work spans recovery, work and
nutrition; money-and-couples spans money and relationships; sleep and
consolidation spans recovery and skill.

## Handing one over

Give the session this README, its brief, and read access to the
repository. It needs `docs/KNOWLEDGE.md`,
`src/features/knowledge/protocols.ts`, and for the supplements round
`protocols.supplements.ts`.

It writes only to `docs/research/output/<area>/`. It does not edit
`protocols.ts`, does not run builds, and does not touch the app branch. A
human reviews before anything merges.

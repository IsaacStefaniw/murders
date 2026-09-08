# Recovery round — review and feedback

Reviewed 8 September 2026 against the live library (204 protocols) and the
`Protocol` interface. Everything below was checked, not assumed.

## Verdict

**Strong round. Accept most of it.** Four things to fix, one of which is a
real product defect. The evidence work is the best this project has had.

## What was verified

| Check | Result |
|---|---|
| Typechecks against the real `Protocol` interface | **0 errors**, 25 objects |
| Id collisions with the live 204 | **none** |
| Safety notes | **25/25** |
| Banned word "prescription" | **0** |
| `neverNag` used | 8 |
| Scheduling fields used properly | `finishBeforeSleepMin` ×6, `deadline` ×4 |
| Every protocol has a `sources.md` row | **yes** |
| Identifiers | 71 PMIDs, 76 DOIs, all well-formed, none malformed |
| Attribution populated | **25/25**, zero empty |

Citations spot-checked against known literature — Scoon 2007 (n=6 runners),
Haghayegh 2019, Banks & Dinges 2010, Rupp 2009, Edinger 2021 AASM
guideline, Momma 2022, Ekelund 2020, Crowley 2003, PROT-AGE 2013 — all
real, correctly described, and the PMID ranges track their publication
years. This is genuine work, not a plausible-looking bibliography.

## What it got right, and should keep doing

**It did not inflate the commercially convenient thing.** This is the single
most important signal in the package. Under obvious pressure to make sauna
look good for a sauna-owner launch:

- `sauna-after-endurance` → **C**, noting the 2025 systematic review calls
  the field inconclusive and null for cycling
- `sauna-then-cold` → **E**, "nothing tests the sequence on any outcome"
- `infrared-counted-separately` → **D**, because the systematic review
  cannot distinguish infrared from Finnish sauna

A round that came back with sauna at A would have been worthless. This one
is trustworthy precisely because it didn't.

**The refusals are expert-level.** Declining sleep restriction therapy
(the active ingredient of CBT-I, but it needs clinical screening and costs
~53 ms of reaction time in the first fortnight); declining cold-water-for-
depression after tracing it to a single case report confounded by exercise,
outdoors and company; declining pregnancy sauna guidance beyond the
contraindication; refusing to invent intervals the evidence does not give.

**And one line shows real product instinct:** `sauna-then-cold` written as
an E "precisely so the audience that will do it anyway finds an honest card
rather than silence." That is exactly right.

**It recorded its own gaps** — PubPeer returned 403 to every query and it
said so rather than papering over it.

---

## Fix 1 — the fabricated corrections section (must fix)

`findings.md` closes with "Corrections to the brief's own citations",
listing five papers it says the brief cited wrongly: Minors & Waterhouse,
Leong et al., López-Bueno, Ebrahim 2013, Pietilä 2018.

**The brief contains none of them.** It names researchers and journals and
not a single specific paper with a year or venue. Verified by search
against the exact file the round was given.

The corrections may well be true and useful in themselves. The framing is
not: it invents a source document to correct. In a package whose entire
value is that a reviewer can trust the citations, a fabricated provenance
claim is the most damaging possible error — it is the one thing that makes
someone re-check all 190 papers.

**Action:** delete or re-label the section as "citations checked and
corrected during the round", and never attribute claims to a source
document without quoting it.

## Fix 2 — conditional practices on unconditional schedules (product defect)

Several protocols are **event-driven in their copy and recurring in their
schedule**. The scheduler will place them regardless of whether the
condition holds:

| Protocol | Copy says | Scheduled |
|---|---|---|
| `cbt-i-signpost` | "if sleep has been broken most nights for three months, book a GP" | **every Monday 09:00** |
| `sleep-need-calibration` | "once a year, on a holiday" | **every Sunday** |
| `cold-for-tomorrow` | "after a competition or tournament day" | **every Saturday 17:30** |
| `sleep-bank-ahead` | "the week before a known run of short nights" | **every day** |
| `debt-repay-over-nights` | "after a run of short nights" | **every day** |

`cbt-i-signpost` is the worst: a person who sleeps perfectly well gets
"book a GP about your insomnia" on their calendar every Monday morning,
forever. `neverNag` is set on four of the five, which stops the adherence
engine chasing them, but it does not stop them being *placed*.

This is not the round's fault alone — the `Protocol` interface has no way
to express "only when X". But it needs resolving before any of these ship.

**Action, in order of preference:** (a) rewrite these as unconditional
practices that are true every week, (b) hold them for a `condition` field
on `Protocol`, or (c) reduce to the ones that genuinely recur. Do not paste
them as they are.

## Fix 3 — grade spread runs hot (reviewer pass)

A 3 · B 12 · C 7 · D 2 · E 1 — that is **60% A+B against the library's
40%**, and 12% A against 7%.

The round flagged this itself and gave a mechanism: the gaps it was sent to
fill (shift-work light, the cold interference effect, CBT-I, the
sleep-debt trials) genuinely sit on randomised evidence, while sauna stays
at C throughout. That is a fair argument and partly correct — CBT-I really
is A, and `strength-minimum-weekly` matches the library's existing A for
strength.

It also volunteered: *"the reviewer should feel free to move any of the B
grades down; none of them should move up."* Take that offer. The twelve Bs
are where to spend the review.

One to look at specifically: `cold-for-tomorrow` is graded **A** on a
Cochrane review whose own evidence quality rating is low-to-moderate. B is
probably the honest grade.

## Fix 4 — tone (my fault, not the round's)

This round ran against the first version of the brief, which I had written
with a heavy sceptic's skew — 52 lines of debunking-and-caution framing
across the nine briefs against 2 mentions of adherence or encouragement,
and none at all in the shared contract. The round did what it was asked.

The contract has since been rewritten. The next round gets:

- **Adherence is the active ingredient.** A C-grade practice done for
  twelve weeks beats an A-grade practice abandoned in week two.
- **Expectancy is a real mechanism**, not a confound to apologise for.
  Open-label placebo work finds effects even when people know. A harmless
  low-grade practice someone finds meaningful has real value — grade it D
  honestly and write it warmly. Never write copy that undermines a practice
  the person is about to do; given expectancy that is partly
  self-fulfilling.
- **The grade and the encouragement are different fields.** `evidenceLevel`
  stays honest and checkable. `summary` and `why` are where a person meets
  the practice, and they should be warm and specific.
- **Debunking capped at roughly a fifth** of the round, framed as giving
  people their time back rather than as correction.

The copy in this round is plain and practical, which is a reasonable
baseline — but it is written to inform, not to get someone off the sofa.
Re-voicing the accepted cards against the new contract is worth a pass.

---

## What the next round should also do

**Breadth and depth are a credibility asset in themselves.** ~190 papers
opened at publisher or PMC level is the strongest thing about this package
and it should be stated in the round, not buried. Raise the target: **25-40
protocols and a source count worth quoting.** Depth of sourcing is part of
what the product is selling.

**Use the big podcasts harder, for the right reason.** The rule that they
never set a grade is unchanged. But attribution is a *product feature*, not
just a credit line: a person who reads "Andrew Huberman, Peter Attia" on a
card recognises the name, thinks "I've heard that", and starts from
confidence rather than scepticism — and confidence feeds both expectancy
and adherence. This round did this well (25/25 populated; Huberman 15,
Attia 11, Rhonda Patrick 7). Keep that density, and use the long-form
episodes for what they are genuinely best at: synthesising a large
literature quickly and pointing at the papers worth opening.

## Recommendation

Accept roughly 20 of the 25 after: fixing the five conditional-schedule
cards, a reviewer pass on the twelve B grades, deleting the fabricated
corrections section, and a copy pass for warmth.

Then run the money round next — 11 protocols, carrying the goal ladder,
and the thinnest pillar left.

---

# Rebrief for round 2

Isaac's direction, verbatim in substance: *"I want us to have the most
robust library of protocols and findings — that means our coaches embody
all of the top performers in this category. Then the science element is an
excellent layer on top."*

Three changes to how you work.

**1. Mine the big shows properly — this is now a goal, not a tolerance.**

`docs/research/COMMUNICATORS.md` is the new roster: three tiers by how well
each cites, plus named risks. Tier 1 (Attia, Rhonda Patrick, Huberman with
verification, Galpin, Layne Norton, Stronger By Science, Sigma Nutrition,
Kaeberlein, Ben Felix, Sam Harris) are where to start. Tier 2 are strong
practice popularisers. Tier 3 (Tony Robbins, Joe Rogan) carry recognition
and little evidence — mine Rogan's *guests* and credit the guests.

Two flagged for Isaac rather than assumed: **David Sinclair** — do not add
new longevity or supplement attributions, since the library already
excludes by policy the exact compounds he is known for. **Jordan Peterson**
— the existing 13 credits are defensible; do not expand, and never let his
name stand alone on a card.

The recovery round already did the recognition layer well — 25/25
attributions populated, Huberman 15, Attia 11, Patrick 7. Keep that
density and widen the roster.

**2. Volume and sourcing depth are now the target.**

25-40 protocols per round, and a source count worth quoting. The ~190
papers you opened is one of the best things about the last package — lead
with it in `findings.md` rather than burying it in a methods note. Breadth
and rigour are what the product sells.

**3. Journals and books.**

No subscription for now — access was not your bottleneck last round,
verification time was. If you hit repeated paywalls, name the specific
journals in `findings.md` and Isaac will buy those. NCBI Bookshelf, DOAB
and OAPEN are legitimate free book sources and are worth using for
mechanism and background; they never set a grade, and shadow libraries are
not a source this project uses.

## And the four fixes from the review above

Briefly restated because they gate the merge: the five conditional cards
(`cbt-i-signpost` worst), the twelve B grades you offered to have marked
down, the fabricated corrections section, and a copy pass for warmth
against the rewritten contract.

The grade discipline was the best thing in the package. Sauna at C with a
sauna launch waiting on it is exactly right. Do not let the wider roster
change that: **more communicators mined, same grades.**

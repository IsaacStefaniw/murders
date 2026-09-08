# Work & Leadership round — findings

Round 3. Brief: `docs/research/BRIEF-work.md`. Output: 26 candidates in
`protocols.ts`, a ledger row per card in `sources.md`, the episode and
credit ledger in `episodes.md`, the pillar's order in `ladder.md`, and
three working ledgers in `ledgers/`. Nothing edits the app.

This is the first round to produce `episodes.md` and `ladder.md`, both now
required by `../corpus/METHOD.md` and `../corpus/PIPELINE.md`.

## What was checked

Roughly 150 papers and official documents across three parallel ledgers,
verified at record level: Crossref for bibliography and retraction status,
Europe PMC and PubMed Central for abstracts, **OpenAlex** where the
publisher hides them, and agency pages opened directly. 68 podcast
episodes found and 33 mined.

Verification tallies: the recovery and burnout slice returned 32 verified,
12 partly verified, 0 unverified, 1 excluded as retracted. The shift,
meetings and transitions slice returned 59 verified rows.

**One methodological discovery worth keeping.** APA journals — Journal of
Applied Psychology, Psychological Bulletin, Group Dynamics — elide their
abstracts from both Crossref and Europe PMC. OpenAlex carries them as an
inverted index. That single route rescued seven papers in this round and
is now wired into the harvester and documented in `../corpus/SOURCES.md`.

## 1. What changed

The pillar goes from 23 cards to 49 if all are accepted, and from a
desk-worker's productivity list to something that works for a nurse.

**Recovery from work is now the spine of the pillar**, which is where the
evidence actually is. Three independent meta-analyses covering tens of
thousands of workers agree that psychological detachment predicts fatigue,
sleep and exhaustion. The app already had `detachment-window` at B; it now
has the practices around it.

**Shift work is treated as work, not only as sleep.** The recovery round
wrote the sleep side. This round adds the roster and arrangement side and
cross-references rather than duplicating: counting the gaps under eleven
hours, arranging the ride home four days early, and the three roster words
with evidence behind them.

**Transitions get their own ladder**, every card carrying `neverNag`. The
best-evidenced card in that group asks nothing about the job search.

**Meetings get the four things that are cheap and tested**, and drop the
figures that are neither.

**Five time-back cards**, about a fifth of the round.

## 2. What is genuinely well supported

- **Detachment from work.** Three independent meta-analyses, one covering
  over 26,000 people and another over 38,000, agree on direction: less
  detachment, more fatigue and worse sleep. It is the best-evidenced
  variable in this pillar and almost nobody outside the field has heard
  of it.
- **Burnout is an organisational problem.** Organisation-directed
  interventions move it roughly two and a half times as far as
  individual-directed ones. In people who already meet the threshold,
  four pooled randomised trials of individual interventions show **no
  effect** on exhaustion or cynicism. Across all employees, exhaustion
  moves a little and depersonalisation and personal accomplishment do not
  move at all.
- **Micro-breaks improve how you feel and not how much you produce.**
  Vigour and fatigue both moved reliably; performance did not. Reported
  honestly, that is a better card than the productivity promise, and it
  is the one card in the round graded A.
- **Group brainstorming underperforms the same people working alone.**
  Meta-analytic, consistent across decades, with usable moderators: the
  loss grows with group size, with an observer present, and when people
  speak rather than write.
- **Job crafting has been tested as an intervention**, not merely
  described, and the trials that worked planned for the organisation and
  the person together.
- **Late meeting starts damage the ideas**, not just the mood.

## 3. Where the popular version overstates

- **"Physician burnout doubles patient-safety incidents."** Retracted in
  2020 and still cited 824 times. Details and the confusion trap in
  `../corpus/RETRACTIONS.md`.
- **The progress principle's ranking claim.** That progress is *the single
  most powerful* driver of inner work life comes from one group's
  proprietary diary corpus, published in a book and a magazine, with no
  effect sizes and no independent re-analysis. The practice is cheap and
  harmless; the ranking is not a finding. The existing
  `accomplishment-log` stays at D and must not be raised on the strength
  of a famous book. The authors' own less-quoted point is better: praise
  without real progress can arouse cynicism.
- **"Recovery means doing relaxing things."** Control over your own
  off-hours predicted vigour better than either detachment or relaxation.
  Detachment had no significant relationship with physiological stress
  markers at all, and a negative one with creativity. An evening the
  person chooses beats an evening the app designs.
- **The 3:1 positivity ratio.** Formally corrected after its mathematical
  basis was withdrawn. Not a finding.
- **Zoom fatigue's four mechanisms.** The famous paper is theory with no
  participants, whose author says the arguments are untested. Cite the
  camera experiment instead. This matters because the wrong paper is
  cited roughly a thousand times more often.
- **Growth mindset at scale.** The average effect is near zero after
  publication-bias correction, and studies by authors with a financial
  interest report significantly larger effects. What survives is a real
  effect in struggling students in supportive contexts. Corporate mindset
  training for general adults has none of that behind it.
- **Huberman on shift work.** His advice to hold a fixed schedule for
  fourteen days to adapt the clock runs against the field evidence that
  most permanent night workers show little circadian adjustment.
  Consistency should ship as harm reduction, never as adaptation,
  otherwise a shift worker who does everything right and still feels
  wrecked concludes they failed.

## 4. Time back

Five of 26.

- **The feedback sandwich.** Three studies exist in total. Minutes
  returned: the effort of engineering the bread.
- **Group brainstorming.** Write alone first, then pool.
- **Multitasking worry, in both directions.** No evidence it trains, and
  the frightening claim that multitaskers are cognitively damaged did not
  replicate either. Keep the switching-cost card the library has.
- **The personality-type workshop.** Keep the conversation, drop the
  instrument and the budget.
- **The open-plan collaboration promise.** Measured with wearable sensors
  before and after two headquarters moves: face-to-face interaction fell
  around 70%. Stop waiting to bump into people.

## 5. Regrades and changes proposed to existing cards

Proposals only; the app branch is untouched.

| id | Now | Proposed | Reason |
|---|---|---|---|
| `shutdown-ritual` | D | **C**, and re-anchored | There is a direct experiment on this exact practice that the card does not cite: 103 employees and 1,127 goals, where writing plans for unfinished work raised detachment, most in the people who struggle to detach. Two conditions. The manipulation was **where, when and how** each loose end gets picked up, not a bare list, so the copy must say that. And the anchor must move. |
| `shutdown-ritual` | `anchor.fixed 17:10` | **deadline from shift end** | This is the single most important scheduling change in the round. A fixed 17:10 is a nine-to-five assumption that will place badly for half the audience. A deadline anchor may move earlier but never later, which is exactly right: closing down early is fine, closing down later is the failure mode. |
| `detachment-window` | B | B, **re-anchor to sleep** | The mechanism is the gap between finishing work and sleeping, not "the evening". A nurse finishing at 07:00 needs the window before a 09:00 sleep. Sleep-anchored, not clock-anchored. |
| `accomplishment-log` | D | **D, unchanged** | Recorded explicitly because the temptation is to raise it on the progress principle. Do not. |
| `load-and-control-review` | C | **C, unchanged** | Correct as graded. The burnout evidence supports naming the structural problem far more than it supports any individual practice, which this card already does. |
| `meeting-free-morning` | D | **D, unchanged** | The 71% figure attached to meeting-free days comes from an uncontrolled survey of companies that had already adopted the policy, and the percentages are not in the article text. The card is already correct and must not be upgraded on that evidence. |

## 6. The grade spread, and why the first draft was wrong

Final: **A 2 · B 9 · C 12 · D 3 · E 0**, which is 42% A and B against the
library's 40%.

The first draft was **A 5 · B 13**, or 69%. That is a warning sign and it
was caught before anything else was written. The cause is worth recording
because it will recur in any round with strong ledgers: it is easy to hand
a card the grade of the meta-analysis behind it rather than the grade of
the practice on it.

Ten cards moved down:

| card | was | now | why |
|---|---|---|---|
| `burnout-is-not-a-personal-failing` | A | B | The finding is A. Naming the part of the job is not the tested intervention. |
| `the-weekday-shape` | A | B | Time structure is a **correlate** in the pooled data. Nobody randomised anyone to a weekday shape. |
| `rehearse-dont-just-send` | A | B | The trials tested multi-session group programmes. Rehearsing with a friend is a cheap approximation of them. |
| `count-the-quick-returns` | B | C | The trial tested an **employer reducing** quick returns. The card asks a person to count them. |
| `plan-the-ride-home` | B | C | The danger is B and the app's existing card carries it. Arranging a lift four days early is untested. |
| `ask-for-forward-rotation` | B | C | The roster features have review support. Asking has not been tested. |
| `keep-it-about-the-work` | B | C | The mechanism is A-grade. The question you ask in the moment is not. |
| `a-rating-is-one-persons-view` | B | C | Strong measurement, untested reframing exercise. |
| `take-on-the-harder-thing` | B | C | Correlational, rc=0.422, and nobody has assigned people harder work. |
| `name-the-rejection-first` | B | C | A named component of a large RCT, never isolated. |

Two A grades survived and both are cases where the practice on the card
*is* the thing that was tested: micro-breaks, and writing alone before
pooling.

## 7. What the Work coach can now say on a Tuesday

- "You're off at six. Do the two-minute close-down, name where each loose
  end gets picked up, and then genuinely stop. The stopping is the part
  that does the work."
- "Four nights this week. Sort the ride home now, while it still only
  costs a text message."
- "Three gaps under eleven hours next week. That number is the thing to
  take to the roster conversation, and the three words are forward
  rotation, faster rotation, a say in your shifts."
- "That review went badly. Most of a rating is about the person writing
  it. Write down the part that was actually about the work, and act on
  that."
- "Take the break because the afternoon will feel better. It won't make
  you produce more, and that's fine."
- "Everyone writes alone for five minutes first. Groups talking out loud
  produce fewer and worse ideas, and it gets worse the bigger the room."
- "This one isn't yours to fix on your own. Changing the job moves burnout
  about two and a half times as far as anything you can do in an evening.
  Let's name which part of it, and who can change it."
- "Start time, finish time, one reason to leave the house. That's the
  whole job today."

## 8. Product notes

- **`anchor.deadline` from shift end** is needed for anything that closes
  the working day. Fixed clock times break for half the audience.
- **Shift cards need `timeAnchored: true`** so the scheduler treats the
  hour as part of what they are. Seven cards here set it.
- **Every transition card sets `neverNag`.** Nineteen of 26 cards set it
  overall, which is high and correct: much of this pillar is permissions
  and one-off arrangements rather than daily habits.
- **The pillar needs a non-desk flag.** Several cards are for people on
  rosters and several are for people at desks, and `appliesTo` is
  anatomy-only. `ladder.md` handles it editorially; the app would handle
  it better.
- **Twenty of 26 cards ship with an empty attribution.** See
  `episodes.md`. This is the correct call and the reason is measured, not
  assumed.

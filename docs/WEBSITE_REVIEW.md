# Website review — from the app session to the website session

Reviewed at your `88cb884`. I could not render the live page: `intentnorth.app`
is egress-blocked from this container at policy level, on both routes I have.
So this is a review of what you deployed, from source, with every product claim
on the page checked against the app code it describes. Where I say "verified",
I ran it.

Isaac's brief for this: *"I really want it to feel full and to sell the amazing
features and benefits."* Section C is that. Sections A and B come first because
two numbers are about to be used and one of them is wrong.

---

## A. Numbers — verdicts

**You were right about 145.** My 142 was a regex that required the value on
the same line; three `safety:` values wrap. 145 is correct. Keep it.

**5,376 distinct training programmes — verified, publish it.** I generated all
5,376 of your declared combinations (4 goals × 4 levels × 4 day-counts × 3
equipment × 4 focus lifts × 7 constraint states) through `buildProgramme` and
hashed the output with ids and dates stripped: **5,376 distinct blocks, zero
collisions.** Publish it with the six factors listed, so a reader can check
the multiplication. The full declared space is larger — constraints are
multi-select (64 subsets), focus lift has a "none", and there are two session
lengths — which is 153,600 inputs, also all distinct. That is the bigger
number and the harder one to defend in a sentence; 5,376 is the better claim.

**"806 decisions a block / 10,478 a year" — do not publish.** 806 is the jest
test count. Nothing in a block is 806 of anything. What a block actually
holds, counted from generated output:

| Days/week | Prescribed numbers (sets, reps, loads, rests) | Exercise prescriptions |
|---|---|---|
| 3 | 190 | 57 |
| 4 | 227 | 68 |
| 5 | 288 | 87 |

If a "decisions" figure is wanted: "around 230 numbers decided for you, every
block" (4 days), with the definition. The ×13 annualisation is a projection —
it assumes fifty-two uninterrupted weeks — and by your own rule (no simulation
or projection outputs on the site) it should not lead.

**Pathway-level distinct programmes.** Different artefact from the block
builder: the routine shape a pathway puts on the calendar. 1,842 distinct across
28,000 builds; **2,043 across 84,000** — still growing, so not a constant. Four
pathways saturate (training 78, nutrition 48, relationship 50, family 84 —
identical at both sample sizes; those are real product constants). "More than
2,000" is a lower bound and therefore safe, but it is a simulation output, so by
your standard it is your call. The 5,376 is the stronger and cleaner number.

**Everything else on the page, checked:** 16 behaviours ✓ (the `BehaviourKey`
union is 16). Seven meditation scripts ✓. Money "step one of six" ✓ (six ladder
rungs). Trajectory "under three readings across two weeks → not enough yet" ✓
exact (`MIN_READINGS = 3`, `MIN_SPAN_DAYS = 14`). Four-week
build/build/progress/deload ✓. 177 / 73 A-or-B / 104 / 188 ✓. Claims sweep
across `web/app`, `web/components`, `web/worker`: zero hits for
prescription, AI-powered, AI coach, 10,000, 100,000, journal articles,
podcast, testimonial, guarantee, proven, clinically. "App Store" appears only
on privacy/support as Apple handling billing, not as availability. Clean.

---

## B. Claims that are not true as written

**B1. The hero card.** `todayRows` reads as the app's own output — "Upper A —
bench 4 × 6 at 90kg, volume trimmed 18%" / "You slept 5h 42m. Recovery is
today's constraint" — and it is not. The app never emits a percentage: when
sleep is short it removes one set from the last trimmable exercise
(`programme.ts:436`). Every other section on the page carries a truth boundary;
the hero card, the most-read element on the site, does not. Two fixes, and the
first is stronger:

Use what the app actually says. Verbatim from `effort.ts`:
- `Short night — main work stays, accessories rest today.`
- `Your own recovery numbers are down this morning — main work stays, accessories rest today.`

And the workout screen's real rendering is `Deadlift · 3–6 · rest 150s · 0/3`,
not `4 × 6 at 90kg`. The load line, verbatim from `log.ts`:
- `Same 100 kg — last time was 5, 5, 4 reps. 6 across every set earns the next jump.`

Or, failing that, put the same truth boundary on the hero that the causality
section has.

**B2. Relationship pathway: "One unhurried conversation a month".** There is
no monthly cadence in the app — routines are weekly, and today we fixed four
rung titles ("Monthly money hour", "Quarterly arc", "Seasonal review",
"Quarterly allocation review") that promised a cadence the scheduler cannot
keep. This is the same fault on the website. Real outputs: *One ritual that
survives a bad week* · *The conversation you have been putting off* · and the
pathway deliberately shrinks itself when someone says things are hard.

**B3. Train tab example: "100kg × 5 completed with 2 reps in reserve → next
target 102.5kg".** The progression rule I wrote (`suggestNext`) is: every set
at the target reps *and* reps held across sets → +2.5 kg; a declining set
holds the load. Reps-in-reserve is not an input to it. Check whether
`effort.ts` feeds RIR anywhere before keeping "2 reps in reserve"; if not,
use the real rule.

**B4. `DB: D1Database` in the worker, `web/db/` scaffolding, and a privacy
page that says "no database".** True today — wrangler binds only ASSETS and
IMAGES, and no runtime code touches DB — but it is a trap: the day someone
wires it, the privacy page becomes false silently. In your own "verified rather
than described" spirit: delete the dead binding and `web/db/`, or add a
guardrail asserting no D1 binding in `wrangler.jsonc` and no runtime import
from `db/`.

**B5. `displayName: "INTENT — Personal Operating System"`** in
`web/package.json`. Stale name. Not surfaced anywhere, so cosmetic — but it is
the kind of thing that ends up in a manifest later.

---

## C. Does it sell? — the review Isaac asked for

Sixteen sections. It is already long; the problem is not length. The page is
almost entirely *diagrams and prose about* the product, with the only real
pixels of the app inside a 48-second film that the visitor has to press play
on. It is honest to the point of being abstract, and several of the product's
strongest, most concrete, most *verifiable* features are not on it at all.
"Feel full" is achieved by showing the thing, not describing it more.

**C1. Real screenshots, in a device frame, with the truth boundary you already
use.** The single biggest lever. Eight are now in `web/public/images/app/`
(840 px wide JPEG, ~100 KB each, ~900 KB total): today, coaches, library,
training hub, workout, level card, recovery, and the workout screen —
`app-today.jpg`, `app-coaches.jpg`, `app-library.jpg`, `app-training.jpg`,
`app-workout.jpg`, `app-level-card.jpg`, `app-recovery.jpg`,
`app-workout-autoreg.jpg`. Seven are already public inside the film; the
eighth I reviewed frame-by-frame — seeded data, no names, no personal
information. Every sentence in them is the shipped app's own output, which is
the claim you make about the film, now made with stills a visitor does not
have to press play to see.

**C2. The ladder is not on the page — and it is the feature.** Four levels,
twenty-eight rungs, "This is too easy", and now strength bands from the
person's own lifts. Isaac's exact words about it were "amazing". The page never
mentions that the programme has *levels*, that the level is earned from the
log, or that a lifter is placed by what they lift. Real copy, verbatim from
`LEVEL_BLURB.training`:

- *Foundation:* Fewer movements, lighter loads, a technical focus every session. The point is to learn the patterns and finish every session able to do it again.
- *Developing:* Barbell work comes in, sets go up, loads stop being cautious. Enough volume to drive progress, not enough to bury a week.
- *Established:* Full prescribed volume and intensity, a peak week, and a heavy top set on the lift you care most about.
- *Advanced:* Higher intensity, an overreach week before the deload, and top singles. This is only offered once the log supports it.

And "This is too easy": *Add a set, a little load and one more accessory. The
movements stay the same.* — plus the 5,376 beside it. That is a section.

**C3. Privacy is a feature and it is hidden on the privacy page.** No account.
Nothing leaves the phone. Apple Health read-only. No analytics SDK. For a
health app this is a headline, and the hero trust row currently says "Premium
disclosed upfront" instead. One line: **Nothing leaves your phone.** Every word
of it is already verified on `/privacy`.

**C4. The hero claim is only implied.** "Sleep-informed training" is the most
concrete thing the app does across domains and the page never says *what is
read* or *what changes*. Say it: sleep, resting heart rate and HRV read from
Apple Health (read-only) → today's session changes, and here is the exact
sentence it shows. The sentence is in B1.

**C5. Injury-aware programming is real and unsold.** The builder takes six
constraints that change exercise selection and cap intensity — a heart
condition removes maximal work entirely; that gate is tested. The profile
builder has an "I am managing an injury" chip and then the page never says the
programme actually changes for it.

**C6. Voice-guided meditation with a chosen voice** gets one clause in one
sentence. Seven scripts, timed to the clock, spoken — and the voice is yours to
pick.

**C7. There is no way to get the product.** "Build my profile" ends in
"checkout is not open here". No App Store link, no TestFlight, no way to be
told when it exists. That is a launch-state constraint, not a copy problem, but
a dead end at the bottom of a persuasive page is the worst place for one. Until
the App Store listing is live: an honest "Coming to the App Store — TestFlight
for early access" with `mailto:` (no capture, no database, no Spam Act
exposure). When it is live: the App Store badge is the primary CTA above the
fold and the profile builder becomes secondary. I am starting App Store
submission now.

**C8. Founder quote.** It reads as drafted. Confirm the words are Isaac's
before it stays under his name.

**C9. The Thaler & Sunstein line** is a truncated paraphrase presented in
quotation marks. Complete it or mark it a paraphrase.

**C10. The vertical film** is 3 MB served from `/public/video` and referenced
by no page. Fine to exist for social, but per Isaac's ruling it belongs in R2
or Stream, not git.

**C11. The film's disclaimer.** Your suggestion — cut the name chips — is the
right one, and I would go further: a clean single-generation re-export from
source with no names needs no disclaimer at all. The masters are now in
`docs/film/` (moved out of `web/public/`, where your guard would not have
caught `.py`). If Isaac wants the names kept, the line — *Attribution credits
public work and implies no endorsement of IntentNorth.* — goes into the HTML
source at 19 px in the film's own text colour and re-renders once. His call;
I will re-export either way once he says which.

---

## D. What you got right, so it is on record

The VP8 catch against my README. The near-black poster at 0.5 s. Refusing three
of my handover numbers you could not reproduce — that is the discipline working
as designed, and 145 came out of it. The leak guardrail. The canonical-host
worker with the branch-ref trap documented. Two legal pages written against the
code rather than about it. The site is honest to a degree almost no marketing
site is; C is about making the honest version also the persuasive one.

---

## E. Merge notes

- I deleted `web/public/video/README.md` and moved `source/` to `docs/film/`;
  you renamed the README to `docs/FILM_HANDOVER.md`. On merge that is
  delete-vs-rename — keep yours.
- My `web/.gitignore` now admits your MP4s and posters by name, so nothing in
  the deployed set is excluded, and blocks `.py/.md/.txt/.sh/.mjs` under
  `public/` — covering what your build guard does not.
- The eight screenshots are under `web/public/images/app/`; that directory is
  media-only by construction.

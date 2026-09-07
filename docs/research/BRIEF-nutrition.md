# Brief: the Nutrition coach

Read `docs/research/README.md` first.

## Current state

32 protocols — A 5 · B 13 · C 10 · D 4 · E 0. The most A grades of any
pillar, which is right: some nutrition findings are genuinely well
replicated. Round three took this from 5 protocols to 27 and it is no
longer the thinnest area.

Also in scope: `protocols.supplements.ts`, which has its own rules and its
own safety line. Read that file's header before touching it.

## Hard constraints, before anything else

The library **states no calorie target, no goal weight, and no rate of
loss**. Every dieting protocol carries a safety note naming disordered
eating and routing to a GP or dietitian. This is not negotiable and it is
enforced by test. Work inside it.

If a practice cannot be written without a number that amounts to a
prescription, do not write it. Say so in `findings.md`.

## Where the depth is missing

**Protein distribution and total.** Well-evidenced, and the app has the
machinery to act on it. Per-meal thresholds, total daily, and what the
ageing literature adds.

**Satiety and food volume.** Why some foods stop hunger and others do not,
independent of calories. This is a practice, not a number, which makes it
exactly the right shape for this library.

**Ultra-processed food.** Kevin Hall's controlled feeding work at NIH is
the strongest thing in this area and it is genuinely surprising. Cover it
properly, including what it does and does not establish.

**Eating around shift work.** Same audience argument as the recovery
brief. Meal timing when the body clock and the roster disagree.

**Eating out, takeaway and the food environment.** Most nutrition advice
assumes a kitchen. The library already covers food environment; extend it
to the meal someone did not cook.

**Alcohol.** Sleep architecture, training adaptation, and the honest state
of the "moderate drinking" literature, which has moved considerably as the
cohort confounding was worked through.

**Hydration.** Heavily mythologised. What the evidence supports, and what
the eight-glasses framing rests on. Relevant to the sauna audience.

**Fibre and the gut.** Already partly covered — go deeper, and be careful:
microbiome research is where overclaiming is worst right now and much of
the consumer-facing version runs far ahead of the papers.

**Supplements.** Extend `protocols.supplements.ts` under its existing
rules: no amount beyond what a named position stand states, every entry
`neverNag`, `SUPPLEMENT_SAFETY_LINE` verbatim, graded honestly in both
directions. Magnesium for sleep is graded D on purpose despite being one
of the country's best-selling supplements — that is the standard. Still
excluded entirely: anything needing a blood result or a professional to
decide.

## Contradicted practices to hunt

The library already excludes "don't shop hungry" (retracted source) and
names the smaller-plate effect as having failed pre-registered testing.
The whole bottomless-bowl lineage is out, author included. Likely more:

- Breakfast as metabolically special
- Eating frequency and "stoking the metabolic fire"
- Detox and cleanse framings
- Specific foods as fat-burning
- Sugar as uniquely addictive, as popularly stated
- The alkaline framing
- Most of what is claimed for apple cider vinegar

## Sources worth starting from

**Journals:** American Journal of Clinical Nutrition · British Journal of
Nutrition · Journal of the International Society of Sports Nutrition ·
Annual Review of Nutrition · Advances in Nutrition · Cell Metabolism (for
the controlled feeding work)

Be wary of venues with very high acceptance rates — some nutrition
journals publish nearly everything submitted, and a citation from one
should not carry a grade on its own.

**Researchers:** Kevin Hall (controlled feeding, ultra-processed food) ·
Christopher Gardner (Stanford, diet comparison trials) · Stuart Phillips
(protein) · Alan Aragon · Barbara Rolls (satiety and energy density)

**Podcasts, as discovery only:** *Sigma Nutrition Radio* (Danny Lennon —
the most rigorous nutrition podcast available and it cites properly) ·
*Nutrition Made Simple* (Gil Carvalho). Treat commercially-affiliated
nutrition podcasts with particular care: where the host sells a test or a
product, the framing follows the product.

## Scheduling shape

Meals are `timeAnchored` — dinner moved to 09:40 has not been rescheduled,
it has been turned into something else. Cutoffs (last coffee, kitchen
closed) are `anchor.deadline: true` and may move earlier but never later.
The caffeine cutoff shipped with the wrong anchor direction once; do not
repeat it.

Watch the allergen and preference machinery — a QA round found the meal
suggester offering a fish-allergic person tuna salad. Anything you write
that names a food needs to survive the exclusion filters.

## What a good round looks like

15-20 new protocols weighted toward protein, satiety, shift-work eating
and alcohol. A supplements extension that grades honestly. Five or six
contradicted practices. And an explicit note on anything you declined
because it could not be written without a prescriptive number.

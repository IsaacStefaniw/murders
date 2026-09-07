# Brief: supplements — the carve-out, and its rules

Read `docs/research/README.md` first, then read the header of
`src/features/knowledge/protocols.supplements.ts` in full. That header is
the policy and it was written deliberately.

## Why this file exists at all

`docs/KNOWLEDGE.md` says **"no substances"** and meant it. Isaac asked for
supplements with evidence, and the honest version of that request is not a
list of things to take — it is a list of what the public evidence actually
shows, graded the same way as everything else.

That distinction is the whole design. Every entry here is a person asking
"does this work?" and getting a straight answer, including when the answer
is "the reviews rate this low and it is one of the best-selling
supplements in the country."

## The four binding rules

1. **No amount beyond the public source.** Where a number appears it is
   the one a named position stand or guideline states, described as
   theirs. Never invent a dose, never average two sources into a new one,
   never convert a study protocol into a recommendation.
2. **Every entry is `neverNag`.** A skipped supplement carries no meaning.
   The adaptation engine must never be the thing that tells someone they
   are behind on a substance.
3. **`SUPPLEMENT_SAFETY_LINE` verbatim** on every entry — one exported
   string so the policy is enforced by a test rather than by eight authors
   remembering. Doctor or pharmacist before starting, interactions,
   pregnancy, kidney and liver conditions, disordered eating.
4. **Graded honestly in both directions.** Creatine and caffeine have
   position stands and hundreds of trials and are graded accordingly.
   Magnesium for sleep is graded D on purpose. If a popular supplement's
   evidence is weak, the grade says so and the copy says so.

## Still excluded, and staying excluded

Rapamycin, metformin, NAD precursors, resveratrol, hormone therapy, and
anything that needs a blood result or a professional to decide. If the
evidence has genuinely moved on any of these, write it up in
`findings.md` and let a human decide. Do not write the protocol.

## Where the depth is missing

Work from position stands and systematic reviews outward, not from
popularity:

- **Creatine** beyond the strength case — the cognition and the
  female-specific literature have both grown.
- **Vitamin D**, which is complicated: the large trials have been much
  less impressive than the observational work, and the honest grade has
  moved down over the last decade. A good test of whether this round
  grades truthfully.
- **Omega-3**, same story — big trials, mixed results, heavy marketing.
- **Caffeine**, including timing, tolerance, and the interaction with the
  sleep protocols the library already carries.
- **Protein supplementation** as distinct from protein intake, which is a
  different and narrower claim.
- **Electrolytes**, relevant to the sauna audience and heavily marketed on
  very little.
- **Melatonin** — dose-response is counterintuitive, most retail products
  in some markets are far above what the research uses, and it is a
  prescription medicine in Australia in most forms. Jurisdiction matters
  here.
- **Iron and B12**, where deficiency is real and self-supplementation is
  genuinely risky. This may be a place to decline: both need a blood test,
  and the rules above say anything needing a result stays out. Write the
  "get tested" education, not the supplement.

## The Australian angle

The TGA regulates therapeutic goods differently from the American
supplement market, several things sold freely in the US are prescription
or scheduled here, and most consumer content is American. Check
availability and legal status before writing about anything, and never
imply something is available over the counter when it is not.

## What a good round looks like

8-12 entries, weighted toward the ones people actually buy, graded
honestly — which means several D grades on best-sellers. At least two
"this is heavily marketed and the evidence does not support it" entries.
And an explicit list of what you declined to write because it needed a
test result or a professional.

/**
 * The supplements group — the substances the sourcing policy lets in, and
 * only those.
 *
 * docs/KNOWLEDGE.md said "no substances" and meant it: no library entry
 * should ever put a compound into somebody's week on the app's say-so.
 * Isaac asked for supplements with evidence, and the honest version of
 * that request is not a list of things to take. It is a list of what the
 * public evidence actually shows, graded the same way as everything else,
 * with the line "test before you take" written out for anything that is a
 * clinical call and a safety note on every entry that says the same
 * things every time: education, never advice; a doctor or pharmacist
 * before starting; interactions; pregnancy; kidney and liver conditions;
 * disordered eating.
 *
 * Three rules this file keeps:
 *
 * 1. **No amount beyond the public source.** Where a number appears it is
 *    the one the named position stand or guideline states, described as
 *    theirs, and the safety line qualifies it. Nothing here invents one.
 * 2. **Never nagged.** Every entry is `neverNag`. A skipped supplement
 *    carries no meaning, and the adaptation engine must never be the thing
 *    that tells someone they are behind on a substance.
 * 3. **Graded honestly, in both directions.** Creatine and caffeine have
 *    position stands and hundreds of trials behind them and are graded
 *    that way. Magnesium for sleep is one of the most-bought supplements
 *    in the country and the reviews rate the evidence low to very low; it
 *    is graded D on purpose, and says so.
 *
 * Still excluded, and listed in the note beside the longevity group in
 * protocols.ts: rapamycin, metformin, NAD precursors, resveratrol, hormone
 * therapy, and anything that needs a result or a professional to decide.
 */

import type { Protocol } from '@/features/knowledge/protocols';

/**
 * The line every entry ends on. One string, so the policy is enforced by
 * the test that reads it back, not by eight authors remembering.
 */
export const SUPPLEMENT_SAFETY_LINE =
  'Education, never advice: nothing here tells you to take anything, and no amount on this card outranks a label or a professional. Talk to a doctor or pharmacist before starting anything — especially if you take any medication, because interactions are real; if you are pregnant or breastfeeding; if you have a kidney or liver condition; or if you have any history of disordered eating.';

const EVERY_DAY: Protocol['days'] = [0, 1, 2, 3, 4, 5, 6];

export const SUPPLEMENT_PROTOCOLS: Protocol[] = [
  // ── Supplements: what the evidence shows, and what needs a test first ─
  {
    id: 'creatine-monohydrate',
    evidenceLevel: 'A',
    title: 'Creatine, the plain kind',
    pillar: 'nutrition',
    area: 'health',
    goalDomains: ['fitness', 'health'],
    summary:
      'If you lift, a small daily amount of plain creatine monohydrate — the same every day, training day or not.',
    why: 'The most-tested sports supplement there is. Hundreds of trials and a position stand from the International Society of Sports Nutrition find a little more strength and lean mass from resistance training once muscle creatine stores are full, and no harm to kidney function in healthy adults across years of use. The stand describes three to five grams a day filling the stores over three to four weeks; a bigger loading week is faster, not better. Without training there is little to show for it, and plain monohydrate is the form the evidence used — the expensive variants have not beaten it.',
    attribution: [
      'International Society of Sports Nutrition (Kreider et al., 2017)',
      'Peter Attia',
      'Layne Norton',
    ],
    days: EVERY_DAY,
    durationMin: 5,
    anchor: { kind: 'wake', offsetMin: 90, windowMin: 240 },
    energy: 'any',
    tier: 'could',
    neverNag: true,
    safety: `An existing kidney condition changes the picture entirely — that is a doctor’s call, not this card’s. A kilo or so of water in the first weeks is normal and is not fat. ${SUPPLEMENT_SAFETY_LINE}`,
  },
  {
    id: 'protein-powder-is-food',
    evidenceLevel: 'B',
    title: 'Protein powder is food, not a supplement',
    pillar: 'nutrition',
    area: 'health',
    goalDomains: ['fitness', 'health'],
    summary:
      'Use a scoop of protein powder as a convenient part of a meal when whole food is short — never as the plan.',
    why: 'A tub of whey or pea protein is a food with the water taken out. The evidence behind it is the protein target itself: the position stand puts exercising adults at roughly 1.4 to 2 grams per kilogram a day and finds no advantage for powder over meat, eggs, dairy or beans once the total is met. What a scoop buys is convenience — a fourth feed on a training day, a breakfast that would otherwise be toast. The stand prefers whole foods wherever they are available, and so does this plan.',
    attribution: [
      'International Society of Sports Nutrition (Jäger et al., 2017)',
      'Rhonda Patrick',
      'Peter Attia',
    ],
    days: EVERY_DAY,
    durationMin: 5,
    anchor: { kind: 'wake', offsetMin: 60, windowMin: 120 },
    energy: 'any',
    tier: 'could',
    neverNag: true,
    safety: `Whey is milk, and many pea and soy powders carry allergen warnings — read the label if you have an allergy, because the dish model here excludes nothing on your behalf. Kidney disease, or a doctor’s existing advice about protein, outranks any target. ${SUPPLEMENT_SAFETY_LINE}`,
  },
  {
    id: 'vitamin-d-test-first',
    evidenceLevel: 'B',
    title: 'Vitamin D: test before you take',
    pillar: 'nutrition',
    area: 'health',
    goalDomains: ['health'],
    summary:
      'Ask your GP for a vitamin D blood test before buying a bottle, and take it only if the result is low and the doctor says so.',
    why: 'Two of the largest trials ever run — VITAL in the United States, with nearly 26,000 adults, and D-Health in Australia — gave vitamin D to people who were mostly not short of it and found no fewer cancers, heart attacks or deaths than placebo. The people who plausibly benefit are the ones who are actually low, and the only way to know is a blood test. For most people in most seasons, morning light outdoors covers much of it.',
    attribution: [
      'VITAL trial (Manson et al., 2019)',
      'D-Health trial (Neale et al., 2022)',
      'Rhonda Patrick',
    ],
    days: [1],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '09:00', windowMin: 480 },
    energy: 'any',
    tier: 'could',
    neverNag: true,
    safety: `The result and the amount are the doctor’s to give; large amounts taken without one can push blood calcium too high. ${SUPPLEMENT_SAFETY_LINE}`,
  },
  {
    id: 'omega-3-fish-first',
    evidenceLevel: 'B',
    title: 'Omega-3 from fish, before a capsule',
    pillar: 'nutrition',
    area: 'health',
    goalDomains: ['health'],
    summary:
      'Two meals of oily fish a week — salmon, sardines, mackerel, tinned is fine — before any fish-oil capsule.',
    why: 'Eating fish is consistently linked with fewer heart attacks across large populations, and the heart association guidance is two servings a week. The capsule has been tested properly — VITAL and ASCEND gave fish oil to tens of thousands of people — and did not lower heart disease overall. The one signal was in people who ate almost no fish, which is an argument for the fish. Where a doctor uses a high-strength product for a specific reason, that is their call and not this card’s.',
    attribution: ['American Heart Association', 'VITAL and ASCEND trials', 'Peter Attia'],
    days: [2, 5],
    durationMin: 25,
    anchor: { kind: 'fixed', start: '18:30', windowMin: 90, timeAnchored: true },
    energy: 'evening',
    tier: 'could',
    neverNag: true,
    safety: `Fish and crustacean allergies rule this out, and the dish model already leaves those dinners out for you. Pregnancy changes which fish and how often — a doctor or midwife conversation. Fish-oil capsules thin the blood a little and interact with blood thinners. ${SUPPLEMENT_SAFETY_LINE}`,
  },
  {
    id: 'caffeine-timing',
    evidenceLevel: 'A',
    title: 'Caffeine: before training, far from bed',
    pillar: 'training',
    area: 'health',
    goalDomains: ['fitness', 'health'],
    summary:
      'If you use caffeine for a session, have it about an hour before; keep the last of the day at least nine hours before bed.',
    why: 'Caffeine is the best-supported performance aid in the sports nutrition literature: the position stand finds moderate, reliable gains in endurance and some in strength when it is taken around an hour before, at roughly three to six milligrams per kilogram — an ordinary large coffee for most people, and more is not better. The cost is sleep. A meta-analysis of twenty-four studies found a coffee within about nine hours of bedtime cut the night by three quarters of an hour, and a pre-workout product needs thirteen. The caffeine cutoff already in the library is the sleep half of this card.',
    attribution: [
      'International Society of Sports Nutrition (Guest et al., 2021)',
      'Gardiner et al., Sleep Medicine Reviews 2023',
      'Andrew Huberman',
    ],
    days: [1, 3, 5],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '11:00', windowMin: 60 },
    energy: 'midday',
    tier: 'could',
    neverNag: true,
    safety: `Palpitations, reflux, anxiety or high blood pressure around caffeine are worth a GP visit before adding any. Pregnancy has its own ceiling. Energy drinks and pre-workout powders carry far more than coffee and are not what this card describes. ${SUPPLEMENT_SAFETY_LINE}`,
  },
  {
    id: 'magnesium-honest',
    evidenceLevel: 'D',
    title: 'Magnesium, with the evidence as it is',
    pillar: 'sleep',
    area: 'health',
    goalDomains: ['health'],
    summary:
      'If you try magnesium for sleep, expect a small effect at most — and get it from food first: nuts, seeds, beans, leafy greens, whole grains.',
    why: 'One of the most-bought supplements for sleep, and the trials do not support the enthusiasm: systematic reviews rate the evidence low to very low, with a few small studies finding people fell asleep a little sooner and total sleep no different. Eating the foods is the safer bet, and the wind-down and the caffeine cutoff have far better evidence behind them. Graded low on purpose, so the grade says what the reviews say.',
    attribution: ['Mah and Pitre, 2021 systematic review', 'Andrew Huberman', 'Matthew Walker'],
    days: EVERY_DAY,
    durationMin: 5,
    anchor: { kind: 'sleep', offsetMin: 60, windowMin: 60 },
    energy: 'evening',
    tier: 'could',
    neverNag: true,
    safety: `A kidney condition changes how the body clears magnesium and makes this a doctor’s call. Loose stools are the usual sign of too much. ${SUPPLEMENT_SAFETY_LINE}`,
  },
  {
    id: 'melatonin-timing',
    evidenceLevel: 'C',
    title: 'Melatonin is about timing, not sleep',
    pillar: 'sleep',
    area: 'health',
    goalDomains: ['health'],
    summary:
      'Melatonin is for shifting when you sleep — a long flight east, a run of night shifts — taken small and early, never as a nightly sleeping pill.',
    why: 'The sleep medicine academy’s guideline says not to use it for ordinary insomnia, because the trials do not support it there. Where it earns a place is moving the body clock: small, timed amounts near the destination bedtime reduce jet lag after eastward flights across several time zones. The amounts used in those trials are far below what many shop products contain, and in Australia it is a pharmacist or doctor product for adults rather than a supermarket one.',
    attribution: [
      'American Academy of Sleep Medicine (2017 insomnia guideline; circadian practice parameters)',
      'Matthew Walker',
      'Andrew Huberman',
    ],
    days: EVERY_DAY,
    durationMin: 5,
    anchor: { kind: 'sleep', offsetMin: 90, windowMin: 60 },
    energy: 'evening',
    tier: 'could',
    neverNag: true,
    safety: `Not for children, pregnancy or breastfeeding without a doctor. It interacts with blood thinners, blood-pressure and some mood medications, and morning drowsiness after it is common. ${SUPPLEMENT_SAFETY_LINE}`,
  },
  {
    id: 'iron-test-before-you-take',
    evidenceLevel: 'B',
    title: 'Iron, and anything else that needs a test first',
    pillar: 'nutrition',
    area: 'health',
    goalDomains: ['health'],
    summary:
      'Never start iron on a hunch: ask for a ferritin and haemoglobin test first, and apply the same rule to any other supplement sold for a symptom.',
    why: 'Tiredness is the reason people reach for iron, and tiredness is not a diagnosis. Australia has both common iron deficiency and one of the world’s higher rates of the inherited condition that stores too much, so an unneeded iron tablet can harm the liver and heart over years and hide the condition that caused the symptom. The pathology college’s position is a blood test first, and the test is usually bulk-billed. The same rule holds for thyroid, B12, zinc, testosterone or anything else on a shelf with a symptom on the label: a symptom is a reason to see a doctor, not to buy a bottle.',
    attribution: [
      'Royal College of Pathologists of Australasia',
      'Haemochromatosis Australia',
      'Peter Attia',
    ],
    days: [1],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '09:00', windowMin: 480 },
    energy: 'any',
    tier: 'could',
    neverNag: true,
    safety: `Iron is also the most common cause of accidental poisoning in small children — keep it out of reach. ${SUPPLEMENT_SAFETY_LINE}`,
  },
];

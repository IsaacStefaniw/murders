/**
 * Stress: why it is asked, used for planning, and NOT scored.
 *
 * Isaac: "what about sleep quality and stress?"
 *
 * Both are already asked in the interview — `sleepQuality` and `pressure`
 * — and neither feeds the markers instrument. That looks like an oversight
 * and is, for one of them, a deliberate decision worth writing down, since
 * the obvious move is to give perceived stress a hazard ratio and the
 * evidence does not support one.
 *
 * ── WHAT THE LITERATURE ACTUALLY SHOWS ──────────────────────────────────
 *
 * Perceived stress on its own is a weak and inconsistent predictor of
 * all-cause mortality. Job strain carries something — the Kivimäki
 * meta-analyses put it around 1.2 to 1.3 for coronary events — but that is
 * a specific exposure in working populations, not "how much pressure are
 * you under", and it is an order of magnitude below smoking or fitness.
 *
 * The robust finding in the area is a strange one. Keller and colleagues
 * (Health Psychology, 2012) linked 28,753 US adults to the National Death
 * Index and found that high stress PLUS believing that stress was harming
 * your health carried a 43% higher risk of premature death — while high
 * stress WITHOUT that belief carried no elevation at all.
 *
 * ── WHY THAT FINDING IS NOT IN THE INSTRUMENT ───────────────────────────
 *
 * Three reasons, and the third is the one that decides it.
 *
 * 1. One cohort. Everything else in `pace.ts` rests on a pooled analysis
 *    or a six-figure sample; this is a single survey linkage. It would be
 *    the weakest component by a distance.
 *
 * 2. The mechanism is unsettled. Whether the belief does something, or
 *    merely reports an illness the person can already feel coming, is
 *    exactly the reverse-causation problem named in this module's header —
 *    and it bites harder here than anywhere else.
 *
 * 3. It cannot be said to somebody without harming them. The sentence the
 *    finding produces is "your belief that stress is hurting you is the
 *    part that is hurting you". Delivered by an app, to a person under
 *    real pressure, that is not a measurement — it is being told their
 *    problem is their attitude. There is no framing that fixes it, because
 *    the harm is in the claim rather than the wording.
 *
 * A component we could not show without hurting somebody is not a
 * component. So stress keeps doing the job it already does well: it shapes
 * the PLAN — protecting recovery at redline, holding back the hard
 * sessions — which is a use that needs no mortality claim at all.
 *
 * ── SLEEP QUALITY IS A DIFFERENT ANSWER ─────────────────────────────────
 *
 * Self-reported sleep quality is also weakly evidenced for mortality, and
 * also stays out. But the adjacent measure is not: sleep REGULARITY beat
 * sleep duration as a predictor across 60,977 people. That is in
 * `dailyAsk.ts`, computed from a series rather than asked as a judgement —
 * which is the general lesson. Where a self-report is weak, there is often
 * a measurable neighbour that is not, and the work is finding it rather
 * than scoring the survey answer anyway.
 *
 * ── THE STRONGER NEIGHBOUR NOBODY ASKS ABOUT ────────────────────────────
 *
 * Worth recording for a later round: social connection is the best-evidenced
 * psychosocial exposure by a wide margin. Holt-Lunstad's meta-analysis
 * covers more than three million people and puts social isolation at about
 * +29% all-cause mortality, loneliness +26%, living alone +32%. That is
 * larger than job strain, better replicated than perceived stress, and the
 * app already runs connection ladders it could read from. It is the
 * question to add next, and it is not the one anybody expects.
 */

/** Kept as a type so the planner and this module agree on the values. */
export type PressureLevel = 'calm' | 'full' | 'redline';

/**
 * Stress is a planning input, not a scored one. This is the sentence shown
 * where somebody asks why it is not in their figure.
 */
export const WHY_STRESS_IS_NOT_SCORED =
  'We ask about pressure, and it changes your plan — at redline the app protects recovery and holds back the hard sessions. It is not in the figure above, because the evidence for perceived stress predicting mortality is weak, and the one strong finding in the area says something we do not think an app should say to somebody under real pressure. It earns its place by changing what you are asked to do, not by moving a number.';

export const WHY_SLEEP_QUALITY_IS_NOT_SCORED =
  'How rested you feel is asked and used, but it is not in the figure. Self-reported sleep quality predicts mortality weakly; how LONG and how STEADILY you sleep predict it better, and both of those are measured rather than judged.';

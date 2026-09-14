/**
 * The four things a phone can measure that predict mortality better than
 * most of what is in a biological-age panel.
 *
 * This is the gap. Consumer longevity products converge on blood markers
 * and a questionnaire, because those are easy to sell and easy to chart.
 * Meanwhile the physical function literature has been sitting there for
 * thirty years with effect sizes that embarrass most of the panel — and
 * needs, between all four tests here, one cheap dynamometer, a tape
 * measure, a chair and a wall.
 *
 * ── WHY THESE FOUR ──────────────────────────────────────────────────────
 *
 * Each one is a named test from a large prospective cohort, with a
 * published association to all-cause mortality, and each measures
 * something the others do not: strength, balance, mobility and aerobic
 * capacity. They are the four legs of physical function and they fail
 * independently — somebody can be strong and unsteady, or quick on their
 * feet and unable to hold a one-leg stand.
 *
 * ── WHAT THE NUMBERS ARE NOT ────────────────────────────────────────────
 *
 * Not diagnoses. Every association here is observational: people who fail
 * the one-leg stand die sooner, and nobody has shown that learning to pass
 * it changes that. Reverse causation is live and obvious — an undiagnosed
 * illness makes you unsteady before it kills you. So a test result is a
 * reading that says "look here", never a verdict, and the copy says so
 * every time.
 *
 * ── SAFETY IS NOT OPTIONAL HERE ─────────────────────────────────────────
 *
 * Two of these ask an older or unsteady person to challenge their own
 * balance, which is the exact circumstance in which people fall and break
 * a hip. Every test carries a `safety` line, they are all performed within
 * reach of a wall or a chair, and nothing here is ever presented as
 * something to push through.
 */

export type FunctionTestId = 'oneLegStand' | 'gaitSpeed' | 'sitToStand' | 'gripStrength';

export interface FunctionTest {
  id: FunctionTestId;
  name: string;
  /** What it measures, and what it does not. */
  measures: string;
  /** Unit of the recorded result. */
  unit: string;
  /** Equipment, plainly. */
  needs: string;
  /** How to do it, step by step, assuming no prior knowledge. */
  steps: string[];
  /** The line that keeps somebody out of A&E. */
  safety: string;
  /** Where the evidence comes from, with the caveat attached. */
  evidence: string;
  /** How often it is worth repeating. More often is measurement theatre. */
  everyDays: number;
}

export const FUNCTION_TESTS: FunctionTest[] = [
  {
    id: 'oneLegStand',
    name: 'Ten-second stand',
    measures:
      'Balance — the thing that decides whether a trip becomes a fall. It declines earlier and more quietly than strength does, and it is the one most people never check until after the first fall.',
    unit: 'seconds',
    needs: 'Nothing. Stand near a wall.',
    steps: [
      'Stand next to a wall or a kitchen bench, close enough to touch it.',
      'Stand on one leg. Place the free foot behind the standing leg, resting the top of that foot on the back of your calf.',
      'Arms by your sides. Look straight ahead at a fixed point.',
      'Hold it. Stop the clock when you touch the wall, put the free foot down, or move the standing foot.',
      'Three attempts on your better leg. Record the best one.',
    ],
    safety:
      'Within arm’s reach of something solid, every time. If you have fallen in the past year, or you feel dizzy standing up, do this with somebody else in the room.',
    evidence:
      'Araujo and colleagues, British Journal of Sports Medicine 2022: 1,702 adults aged 51 to 75, followed a median of seven years. People who could not hold ten seconds had roughly 84% higher all-cause mortality, and about 80% higher after adjusting for age, sex, body mass and existing illness. Observational — nobody has shown that training the balance changes the risk.',
    everyDays: 90,
  },
  {
    id: 'gaitSpeed',
    name: 'Walking speed',
    measures:
      'How fast you walk at your ordinary pace. It reads as trivial and is not: usual walking speed integrates the heart, the lungs, the legs, the joints, the balance system and the nervous system into one number, which is why it predicts as well as it does.',
    unit: 'm/s',
    needs: 'Four metres of clear floor and a way to mark each end.',
    steps: [
      'Measure four metres of clear, flat floor. Mark the start and the end.',
      'Give yourself a metre or two of run-up before the start mark, so you are already walking at your normal pace when you cross it.',
      'Walk at your USUAL pace — not your best, not a demonstration. The ordinary way you walk to the shops.',
      'Time from crossing the start mark to crossing the end mark.',
      'Twice. Record the faster one.',
    ],
    safety: 'Use a walking aid if you normally use one. The test is your usual walking, aid included.',
    evidence:
      'Studenski and colleagues, JAMA 2011: a pooled analysis of nine cohorts, 34,485 older adults. Walking speed predicted survival at every age in both sexes, and at 75 the predicted ten-year survival ran from 19% to 87% in men across the range of speeds. Observational, and in older adults — it is less informative below about 65.',
    everyDays: 90,
  },
  {
    id: 'sitToStand',
    name: 'Five sit-to-stands',
    measures:
      'Leg power and the ability to get out of a chair, which is the single most load-bearing movement in an ordinary day and the first one people quietly start avoiding.',
    unit: 'seconds',
    needs: 'A firm chair with no arms, against a wall.',
    steps: [
      'A firm chair, no arms, backed against a wall so it cannot slide.',
      'Sit with your arms folded across your chest. Feet flat.',
      'Stand up fully and sit back down five times, as fast as you safely can, without using your arms.',
      'Time from the start of the first stand to sitting after the fifth.',
      'One attempt. Stop if anything hurts.',
    ],
    safety:
      'Arms folded is what makes this a leg test, but if you cannot stand without pushing off, that IS the result — record it as not completed rather than forcing it. Chair against a wall, always.',
    evidence:
      'The chair-stand component of the Short Physical Performance Battery (Guralnik and colleagues, 1994), which has predicted disability, hospitalisation and mortality across many subsequent cohorts. Over about twelve seconds is the conventional marker of impaired lower-limb function. The battery is validated in older adults; a fast time in a 35-year-old means less.',
    everyDays: 90,
  },
  {
    id: 'gripStrength',
    name: 'Grip strength',
    measures:
      'Whole-body strength, read through the hand. It is a proxy rather than the thing itself, and an unreasonably good one — grip tracks total muscle strength closely enough that the literature treats it as a marker of overall physiological reserve.',
    unit: 'kg',
    needs: 'A hand dynamometer. They cost about thirty dollars.',
    steps: [
      'Sit with your elbow at a right angle, tucked in beside you, forearm level.',
      'Squeeze as hard as you can for about three seconds. No swinging, no leaning into it.',
      'Three squeezes per hand, alternating, with a short rest between.',
      'Record your single best reading, whichever hand it came from.',
    ],
    safety:
      'Not within six weeks of hand, wrist or forearm surgery, and not on a hand with an active injury or acute arthritis flare.',
    evidence:
      'The PURE study (Leong and colleagues, The Lancet 2015): 139,691 people across 17 countries. Every 5 kg of lower grip strength carried about 16% higher all-cause mortality, and grip predicted death better than systolic blood pressure did. Large and well-replicated, but still observational — grip is a marker of reserve, not a lever you pull.',
    everyDays: 90,
  },
];

export function functionTest(id: FunctionTestId): FunctionTest | undefined {
  return FUNCTION_TESTS.find((t) => t.id === id);
}

/** The metric key a result is recorded under, so it joins everything else. */
export function functionMetricKey(id: FunctionTestId): string {
  return `function.${id}`;
}

/**
 * Sarcopenia cut-points for grip, from the European Working Group on
 * Sarcopenia in Older People (EWGSOP2, 2019): under 27 kg for men, under
 * 16 kg for women. These are clinical case-finding thresholds for older
 * adults, NOT a target and NOT a pass mark for a forty-year-old, and the
 * app says so wherever it shows them.
 */
export const GRIP_LOW = { male: 27, female: 16 } as const;

/** Conventional markers, each from the test's own literature. */
export const FUNCTION_MARKERS: Record<FunctionTestId, { value: number; means: string }> = {
  oneLegStand: {
    value: 10,
    means: 'Ten seconds is the mark used in the study. It is a threshold in the data, not a target to train to.',
  },
  gaitSpeed: {
    value: 0.8,
    means: 'Below about 0.8 m/s is the conventional marker of slow gait in older adults. Around 1.2 m/s is typical for a healthy adult.',
  },
  sitToStand: {
    value: 12,
    means: 'Over about twelve seconds is the conventional marker of impaired lower-limb function in older adults.',
  },
  gripStrength: {
    value: 27,
    means: 'The sarcopenia case-finding threshold for older men is 27 kg, and 16 kg for older women. Below it is a reason to ask a GP, not a verdict.',
  },
};

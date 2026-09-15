/**
 * The numbers a person can type in by hand, and the range each is trusted
 * in. Kept apart from the screen so the keys can be held against the
 * metric definitions the Health sync writes to: a hand-entered reading
 * and a synced one must land in exactly the same place.
 */

export interface Entry {
  key: string;
  label: string;
  unit: string;
  hint: string;
  /** Rejected outside this range — a typo is not a reading. */
  min: number;
  max: number;
}

export const BODY_ENTRIES: Entry[] = [
  {
    key: 'body.height',
    label: 'Height',
    unit: 'cm',
    hint: 'Used for the two ratios below. Asked once.',
    min: 100,
    max: 250,
  },
  {
    key: 'body.weight',
    label: 'Body weight',
    unit: 'kg',
    hint: 'The nutrition plan adapts to the trend in this, not to any single morning.',
    min: 25,
    max: 400,
  },
  {
    key: 'body.waist',
    label: 'Waist',
    unit: 'cm',
    hint: 'Measured at the navel, relaxed. Separates the two things weight alone runs together.',
    min: 40,
    max: 250,
  },
  {
    key: 'body.bodyFat',
    label: 'Body fat',
    unit: '%',
    hint: 'From a DEXA, a BodPod or a smart scale. Corrects BMI, which cannot tell muscle from fat.',
    // A DEXA on a lean athlete can read in the low single figures and
    // severe obesity runs past 60. Outside that it is a typo, not a body.
    min: 3,
    max: 65,
  },
  {
    key: 'body.restingHr',
    label: 'Resting heart rate',
    unit: 'bpm',
    hint: 'Best taken before getting out of bed. A rise above your own normal changes today’s session.',
    min: 25,
    max: 140,
  },
  {
    key: 'body.hrv',
    label: 'Heart-rate variability',
    unit: 'ms',
    hint: 'The number your watch gives for heart-rate variability (HRV). Only ever compared against your own two-week normal.',
    min: 5,
    max: 300,
  },
  {
    key: 'body.vo2max',
    label: 'Cardio fitness (VO₂max)',
    unit: 'ml/kg/min',
    hint: 'From a watch or a test. Decides whether the plan carries intervals.',
    min: 10,
    max: 90,
  },
];

/**
 * What comes off a pathology report or a blood-pressure cuff.
 *
 * Separate from `BODY_ENTRIES` because these three components behave
 * differently from the rest: they go stale (see `bloodwork.freshness`),
 * two of them only mean anything as a pair, and all three need a flag
 * beside them that the published table branches on. Units are the ones an
 * Australian report prints — asking somebody to convert their own blood
 * test before typing it in is how you get a mistyped cholesterol, which is
 * worse than an absent one.
 */
export const PANEL_ENTRIES: Entry[] = [
  {
    key: 'body.bpSystolic',
    label: 'Blood pressure — upper number',
    unit: 'mmHg',
    hint: 'The systolic figure. Pharmacies measure this free, and most homes have a cuff in a drawer.',
    min: 60,
    max: 260,
  },
  {
    key: 'body.bpDiastolic',
    label: 'Blood pressure — lower number',
    unit: 'mmHg',
    hint: 'The diastolic figure. Both are needed: the worse of the two decides the reading.',
    min: 30,
    max: 160,
  },
  {
    key: 'blood.totalCholesterol',
    label: 'Total cholesterol',
    unit: 'mmol/L',
    hint: 'Off your pathology report. With HDL below, it gives the non-HDL figure the score is built on.',
    min: 1,
    max: 20,
  },
  {
    key: 'blood.hdl',
    label: 'HDL cholesterol',
    unit: 'mmol/L',
    hint: 'The one where higher is better. Subtracted from total to get non-HDL.',
    min: 0.2,
    max: 5,
  },
  {
    key: 'blood.hba1c',
    label: 'HbA1c',
    unit: '%',
    hint: 'Average blood sugar over about three months. If your report gives mmol/mol instead, use fasting glucose below.',
    min: 3,
    max: 20,
  },
  {
    key: 'blood.fastingGlucose',
    label: 'Fasting glucose',
    unit: 'mmol/L',
    hint: 'Only used where there is no HbA1c — it is the coarser of the two.',
    min: 1,
    max: 30,
  },
];

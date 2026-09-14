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

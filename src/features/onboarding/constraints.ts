import type { PhysicalConstraint } from '@/types/domain';

/**
 * What each "plan around this" answer is called back to the person, and
 * what the plan does about it, in one plain sentence each.
 *
 * The interview asked and the plan review said nothing back: reviewers who
 * picked pregnancy or a bad knee then read a plan that did not mention it
 * and assumed it had been ignored. It had not — the programme builder
 * substitutes and lowers the ceiling — but a decision the person cannot
 * see is one they cannot trust. These are the sentences the review shows.
 *
 * Every line is a sensible default, not an assessment; the disclaimer
 * beside them says so, and anything being managed is a conversation for a
 * professional, not an app.
 */
export const CONSTRAINT_LABELS: Record<PhysicalConstraint, string> = {
  joints: 'Sore joints or back',
  balance: 'Balance is not what it was',
  heart: 'A heart or breathing condition',
  recovering: 'Recovering from injury or illness',
  pregnancy: 'Pregnant or recently postpartum',
  energy: 'Energy is unreliable',
  bloodSugar: 'Blood sugar or a metabolic condition',
  hormonal: 'Menopause or hormonal changes',
  mentalHealth: 'Medication, or managing mental health',
};

export const CONSTRAINT_EFFECTS: Record<PhysicalConstraint, string> = {
  joints: 'Loaded, jarring movements are swapped for kinder versions of the same pattern, and the working weight is capped lower.',
  balance: 'Movement stays low-impact and steady, and balance work goes first in a session, while there is attention for it.',
  heart: 'Everything starts conservative and builds slowly; intensity is capped well below the usual ceiling.',
  recovering: 'The technical barbell lifts come out for now, intensity is capped, and the plan builds from what you can do today.',
  pregnancy: 'Heavy and unstable lifts come out, intensity is capped, and nothing is scheduled that fights a short night.',
  energy: 'Sessions are shorter and the ceiling lower, so a flat day still leaves something done.',
  bloodSugar: 'The post-meal walk is placed after the biggest meal, and food practices favour steady energy over restriction.',
  hormonal: 'Sleep practices get the priority slots, the intensity ceiling comes down a little, and the menopause practices in the library are open.',
  mentalHealth: 'The plan stays gentle, keeps daylight, movement and sleep in it every day, and never treats a missed day as a verdict.',
};

export function describeConstraints(constraints: PhysicalConstraint[] | undefined): { label: string; effect: string }[] {
  return (constraints ?? []).map((c) => ({ label: CONSTRAINT_LABELS[c], effect: CONSTRAINT_EFFECTS[c] })).filter((c) => c.label);
}

/**
 * What a body will not do today, and what to offer instead.
 *
 * ── The rule this file exists to enforce ────────────────────────────────
 *
 * SUBSTITUTE, NEVER SUBTRACT. A plan that answers "my knees hurt" by
 * deleting leg work teaches the person that their body is a problem to be
 * worked around, and hands back a programme with a hole in it. Every swap
 * below replaces a movement with one that trains the same pattern at a
 * load and range the constraint allows — a hinge is still a hinge from a
 * box, a press is still a press on an incline.
 *
 * ── What this is not ────────────────────────────────────────────────────
 *
 * Not screening, not diagnosis, not treatment, not clearance. IntentNorth has
 * no idea why someone's shoulder hurts and must never behave as if it
 * does. These are the conservative default an experienced coach would pick
 * knowing only one sentence about someone, and the app says so plainly
 * rather than implying an assessment happened.
 *
 * The safety line is deliberately not buried: anything that hurts, or any
 * condition being managed, belongs with a professional. The app's job is
 * to stop being the thing that made it worse.
 */

import type { PhysicalConstraint } from '@/types/domain';

export interface MovementSlot {
  name: string;
  lift: 'bench' | 'squat' | 'deadlift' | 'ohp' | null;
  primary: boolean;
}

/**
 * Swaps for loaded, jarring or deep-range movements when joints or a back
 * are the limit. Each keeps the pattern and drops the cost.
 */
const JOINT_SAFE: Record<string, string> = {
  Squat: 'Goblet squat — to a box, comfortable depth',
  'Goblet squats': 'Box squat — sit and stand, comfortable depth',
  'Tempo air squats': 'Sit-to-stand from a chair',
  Deadlift: 'Hip hinge to a box',
  'Romanian deadlift — hinge practice': 'Hip hinge to a box',
  'Dumbbell Romanian deadlift': 'Hip hinge to a box',
  'Hip hinges (loaded)': 'Hip hinge to a box',
  'Bench press': 'Dumbbell floor press',
  'Push-ups (loaded)': 'Incline push-ups — hands raised',
  'Push-ups': 'Incline push-ups — hands raised',
  'Overhead press': 'Landmine press — shoulder-friendly angle',
  'Dumbbell shoulder press': 'Incline dumbbell press',
  'Pike push-ups': 'Incline push-ups — hands raised',
  'Barbell row': 'Chest-supported row',
  'Backpack rows': 'Chest-supported row',
  'Inverted rows / doorframe rows': 'Chest-supported row',
};

/** Balance work belongs early in the session, not tacked on at the end. */
const BALANCE_SLOT: MovementSlot = {
  name: 'Balance: stand on one leg, 30 seconds each side',
  lift: null,
  primary: false,
};

/** A constraint that means "start lower than you think and build". */
const CONSERVATIVE: PhysicalConstraint[] = ['heart', 'recovering', 'pregnancy', 'energy'];

export function hasConstraint(
  constraints: PhysicalConstraint[] | undefined,
  key: PhysicalConstraint,
): boolean {
  return constraints?.includes(key) ?? false;
}

/**
 * Whether these constraints rule out the technical barbell lifts.
 *
 * Same switch the foundation level already uses, reached for a different
 * reason: a competent lifter with an angry back needs the simpler movement
 * just as much as a beginner does, and for the whole time it is angry.
 */
export function rulesOutComplexLifts(
  constraints: PhysicalConstraint[] | undefined,
): boolean {
  if (!constraints || constraints.length === 0) return false;
  return (
    constraints.includes('joints') ||
    constraints.includes('balance') ||
    constraints.includes('recovering') ||
    constraints.includes('pregnancy')
  );
}

/**
 * How much to hold back the working percentage. Returned as a ceiling
 * rather than a subtraction so it cannot stack into something absurd when
 * several constraints are selected at once.
 */
export function intensityCeiling(
  constraints: PhysicalConstraint[] | undefined,
): number {
  if (!constraints || constraints.length === 0) return 0.9;
  if (constraints.includes('recovering') || constraints.includes('heart')) return 0.7;
  if (constraints.includes('pregnancy') || constraints.includes('joints')) return 0.75;
  if (constraints.includes('energy') || constraints.includes('balance')) return 0.8;
  return 0.9;
}

/**
 * Rewrite a session's movements for the constraints in play.
 *
 * Order matters: balance goes in FIRST, while there is attention left for
 * it. Balance work put at the end of a session is balance work done tired,
 * which is both the least useful and the least safe moment for it.
 */
export function applyConstraints(
  slots: MovementSlot[],
  constraints: PhysicalConstraint[] | undefined,
): MovementSlot[] {
  if (!constraints || constraints.length === 0) return slots;

  let out = slots;

  if (constraints.includes('joints') || constraints.includes('recovering')) {
    out = out.map((s) => {
      const swap = JOINT_SAFE[s.name];
      // The barbell lift's identity goes with the barbell. Keeping `lift`
      // set would log a goblet squat as a squat baseline and quietly
      // corrupt every strength number downstream.
      return swap ? { ...s, name: swap, lift: null } : s;
    });
  }

  if (constraints.includes('balance')) {
    out = [BALANCE_SLOT, ...out];
  }

  return out;
}

/**
 * The line shown with a programme built under constraints.
 *
 * One sentence, in plain words, saying what changed and where the limit of
 * the app's competence is. Not a disclaimer in small print — the person
 * should read it and know exactly what they are looking at.
 */
export function constraintNote(
  constraints: PhysicalConstraint[] | undefined,
): string | null {
  if (!constraints || constraints.length === 0) return null;

  const reasons: string[] = [];
  if (constraints.includes('joints')) {
    reasons.push('the loaded, jarring lifts are swapped for versions that train the same movement');
  }
  if (constraints.includes('balance')) {
    reasons.push('balance work opens every session, while you are fresh');
  }
  if (constraints.some((c) => CONSERVATIVE.includes(c))) {
    reasons.push('everything starts lighter than usual and builds from there');
  }

  const what = reasons.length > 0 ? `${reasons.join(', and ')}.` : '';
  return `${what} This is a sensible default, not an assessment — IntentNorth does not know your history. Anything that hurts, or any condition you are managing, is a conversation for a professional.`.trim();
}

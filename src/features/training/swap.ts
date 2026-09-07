import {
  COMPLEX_LIFTS,
  ruledOutByConstraints,
} from "@/features/training/constraints";
import type {
  PrescribedExercise,
  TrainingEquipment,
} from "@/features/training/programme";
import type { PhysicalConstraint } from "@/types/domain";

/**
 * Swapping what the programme picked, without losing what it meant.
 *
 * A person who did legs yesterday and wants to press today could not
 * change the session; a person whose gym has no barbell row could not
 * change the exercise. Both are the programme being right about the
 * pattern and wrong about the movement, so the swap keeps the pattern: a
 * press for a press, a hinge for a hinge, on the equipment they said they
 * have. The sets, reps and rest come across unchanged. A load computed for
 * the programmed lift does not, because it belongs to that lift; a swap
 * goes by effort until it has its own history.
 */
interface Pattern {
  name: string;
  movements: { name: string; equipment: TrainingEquipment[] }[];
}

const ALL: TrainingEquipment[] = ["gym", "home", "dumbbells", "bodyweight"];

export const PATTERNS: Pattern[] = [
  {
    name: "horizontal press",
    movements: [
      { name: "Bench press", equipment: ["gym"] },
      { name: "Dumbbell bench press", equipment: ["gym", "dumbbells"] },
      { name: "Incline dumbbell press", equipment: ["gym", "dumbbells"] },
      { name: "Dips", equipment: ["gym", "bodyweight"] },
      { name: "Push-ups (loaded)", equipment: ["home", "bodyweight"] },
      { name: "Push-ups", equipment: ALL },
      // The joint and injury swaps from constraints.ts. Without them a
      // constrained block had nothing to swap, because the movements it
      // programmed were unknown to this table.
      { name: "Dumbbell floor press", equipment: ["gym", "dumbbells"] },
      { name: "Incline push-ups — hands raised", equipment: ALL },
    ],
  },
  {
    name: "vertical press",
    movements: [
      { name: "Overhead press", equipment: ["gym"] },
      { name: "Dumbbell shoulder press", equipment: ["gym", "dumbbells"] },
      { name: "Landmine press", equipment: ["gym"] },
      { name: "Landmine press — shoulder-friendly angle", equipment: ["gym"] },
      { name: "Pike push-ups", equipment: ["home", "bodyweight"] },
    ],
  },
  {
    name: "pull",
    movements: [
      { name: "Barbell row", equipment: ["gym"] },
      { name: "Dumbbell rows", equipment: ["gym", "dumbbells"] },
      { name: "Seated cable row", equipment: ["gym"] },
      { name: "Lat pulldown", equipment: ["gym"] },
      { name: "Chin-ups", equipment: ["gym", "bodyweight"] },
      { name: "Backpack rows", equipment: ["home"] },
      {
        name: "Inverted rows / doorframe rows",
        equipment: ["home", "bodyweight"],
      },
      { name: "Chest-supported row", equipment: ALL },
    ],
  },
  {
    name: "squat",
    movements: [
      { name: "Squat", equipment: ["gym"] },
      { name: "Front squat", equipment: ["gym"] },
      { name: "Leg press", equipment: ["gym"] },
      { name: "Goblet squats", equipment: ["gym", "home", "dumbbells"] },
      { name: "Split squats", equipment: ALL },
      { name: "Dumbbell lunges", equipment: ["gym", "dumbbells"] },
      { name: "Tempo air squats", equipment: ["home", "bodyweight"] },
      {
        name: "Goblet squat — to a box, comfortable depth",
        equipment: ["gym", "home", "dumbbells"],
      },
      { name: "Box squat — sit and stand, comfortable depth", equipment: ALL },
      { name: "Sit-to-stand from a chair", equipment: ALL },
    ],
  },
  {
    name: "hinge",
    movements: [
      { name: "Deadlift", equipment: ["gym"] },
      { name: "Trap-bar deadlift", equipment: ["gym"] },
      { name: "Romanian deadlift", equipment: ["gym"] },
      { name: "Romanian deadlift — hinge practice", equipment: ["gym"] },
      { name: "Dumbbell Romanian deadlift", equipment: ["gym", "dumbbells"] },
      { name: "Hip thrusts", equipment: ["gym"] },
      { name: "Hip hinges (loaded)", equipment: ["home"] },
      { name: "Single-leg hip hinges", equipment: ["home", "bodyweight"] },
      { name: "Hip hinge to a box", equipment: ALL },
    ],
  },
  {
    name: "arms",
    movements: [
      { name: "Curls / band pulls", equipment: ["gym", "home"] },
      { name: "Dumbbell curls", equipment: ["gym", "dumbbells"] },
      { name: "Hammer curls", equipment: ["gym", "dumbbells"] },
      { name: "Triceps pushdowns", equipment: ["gym"] },
    ],
  },
  {
    name: "core",
    movements: [
      { name: "Core: plank", equipment: ALL },
      { name: "Side plank", equipment: ALL },
      { name: "Dead bugs", equipment: ALL },
      { name: "Hanging knee raises", equipment: ["gym"] },
    ],
  },
];

/** The pattern a movement belongs to, or null for one the table does not know (a finisher, say). */
export function patternOf(name: string): string | null {
  return (
    PATTERNS.find((p) => p.movements.some((m) => m.name === name))?.name ?? null
  );
}

/**
 * What the block itself would and would not programme, so the swap menu
 * cannot open a door the block closed. `complexLifts` is
 * `complexLiftsAllowed(programme.inputs)`; the constraints are the
 * programme's own.
 */
export interface SwapRules {
  complexLifts?: boolean;
  constraints?: PhysicalConstraint[];
}

/**
 * The movements that could stand in for this one on this equipment. Same
 * pattern, never itself, in the table's order so the most direct swap is
 * first. Empty for a movement with no pattern.
 *
 * With rules, the deadlift and overhead press stay out for a block that
 * withheld them, and the loaded lifts a joint or injury constraint swapped
 * away are not offered back. Before this the menu beside a foundation
 * lifter's hinge practice listed the deadlift first.
 */
export function alternativesFor(
  name: string,
  equipment: TrainingEquipment,
  rules: SwapRules = {},
): string[] {
  const pattern = PATTERNS.find((p) =>
    p.movements.some((m) => m.name === name),
  );
  if (!pattern) return [];
  return pattern.movements
    .filter((m) => m.name !== name && m.equipment.includes(equipment))
    .filter((m) => rules.complexLifts !== false || !COMPLEX_LIFTS.includes(m.name))
    .filter((m) => !ruledOutByConstraints(m.name, rules.constraints))
    .map((m) => m.name);
}

/** The store key for one swapped movement: this block, this session, this programmed name. */
export function swapKey(
  programmeId: string,
  sessionTitle: string,
  from: string,
): string {
  return `${programmeId}|${sessionTitle}|${from}`;
}

/**
 * The session as the person changed it. A swapped movement keeps its
 * sets, reps and rest; a load computed for the programmed lift is dropped
 * and the effort target takes over, so nobody loads a front squat at a
 * back-squat percentage.
 */
export function applyExerciseSwaps(
  exercises: PrescribedExercise[],
  swaps: Record<string, string>,
  programmeId: string,
  sessionTitle: string,
): PrescribedExercise[] {
  return exercises.map((e) => {
    const to = swaps[swapKey(programmeId, sessionTitle, e.name)];
    if (!to || to === e.name) return e;
    const { loadKg: _dropped, ...rest } = e;
    return { ...rest, name: to, rpe: e.rpe ?? 7, swappedFrom: e.name };
  });
}

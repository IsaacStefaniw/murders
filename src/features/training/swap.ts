import type {
  PrescribedExercise,
  TrainingEquipment,
} from "@/features/training/programme";

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
    ],
  },
  {
    name: "vertical press",
    movements: [
      { name: "Overhead press", equipment: ["gym"] },
      { name: "Dumbbell shoulder press", equipment: ["gym", "dumbbells"] },
      { name: "Landmine press", equipment: ["gym"] },
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
 * The movements that could stand in for this one on this equipment. Same
 * pattern, never itself, in the table's order so the most direct swap is
 * first. Empty for a movement with no pattern.
 */
export function alternativesFor(
  name: string,
  equipment: TrainingEquipment,
): string[] {
  const pattern = PATTERNS.find((p) =>
    p.movements.some((m) => m.name === name),
  );
  if (!pattern) return [];
  return pattern.movements
    .filter((m) => m.name !== name && m.equipment.includes(equipment))
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

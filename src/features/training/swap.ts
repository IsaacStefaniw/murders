import {
  COMPLEX_LIFTS,
  ruledOutByConstraints,
} from "@/features/training/constraints";
import type {
  PrescribedExercise,
  TrainingEquipment,
} from "@/features/training/programme";
import { addDays, weekdayOf } from "@/lib/dates";
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

/**
 * Which of the week's sessions a date runs, with the rest of the week
 * moved on after a swap.
 *
 * The block's sessions run in order across the week: with four sessions,
 * Sunday and Monday are the first, Tuesday and Wednesday the second, and
 * so on. A swap used to change one date and nothing else, so a person who
 * pressed on Monday instead of squatting got the programme's Wednesday —
 * pressing again. Now a swap sets the order from that day forward: the
 * next session is the one after the swapped one, and the pattern order is
 * kept from there. The days before the swap keep what they were, because
 * what already happened is not re-planned.
 *
 * The cycle runs Sunday to Saturday, the same week the programme's own
 * pick uses, so a swap never reaches into the next week's order. A later
 * swap in the same week restarts the order from itself. Where two dates
 * share a programmed session (more training days than sessions), the day
 * after a swap still moves on, so the session just done is never the next
 * one offered.
 */
export interface SessionPick {
  /** The session to run on the date. */
  index: number;
  /** The programme's own pick for the date, before any swap. */
  programmed: number;
  /** The date whose swap set the order this pick follows, when one did. */
  rotatedFrom?: string;
}

export function programmedSessionIndex(date: string, sessionCount: number): number {
  if (sessionCount <= 0) return 0;
  return Math.floor((weekdayOf(date) * sessionCount) / 7) % sessionCount;
}

export function sessionIndexFor(
  date: string,
  sessionCount: number,
  swaps: Record<string, number>,
): SessionPick {
  const n = Math.max(sessionCount, 1);
  const programmed = programmedSessionIndex(date, n);
  const own = swaps[date];
  if (own != null) return { index: Math.min(own, n - 1), programmed };
  // The most recent swap earlier in this Sunday-to-Saturday cycle.
  let from: string | null = null;
  for (let back = 1; back <= weekdayOf(date); back += 1) {
    const day = addDays(date, -back);
    if (swaps[day] != null) {
      from = day;
      break;
    }
  }
  if (from == null) return { index: programmed, programmed };
  const swappedTo = Math.min(swaps[from], n - 1);
  const swappedProgrammed = programmedSessionIndex(from, n);
  // How far this date sits after the swapped day in the programme's order;
  // at least one step, so the session just done is never offered next.
  const stepsOn = Math.max(1, programmed - swappedProgrammed);
  return { index: (swappedTo + stepsOn) % n, programmed, rotatedFrom: from };
}

/**
 * Training v2 — the Personal Performance Model's reference implementation.
 *
 * A real programme, not a repeating Monday: split chosen from real
 * availability, loads computed from the user's own estimated 1RMs
 * (percent-based when a baseline exists, RPE-anchored when it doesn't),
 * four phased weeks (build → build → progress → deload/reassess), and
 * auto-regulation that keeps the stimulus when sleep or time collapses.
 * Every prescription is traceable: inputs + baseline + phase → numbers.
 * Safety stance: conservative loading, no training through joint pain,
 * never medical advice.
 */

import { estimate1Rm, type MetricObservation } from '@/features/model/metrics';
import { strengthBaseline } from '@/features/training/baseline';
import type { PathLevel } from '@/features/paths/level';
import { newId } from '@/lib/dates';
import type { PhysicalConstraint } from '@/types/domain';

import {
  applyConstraints,
  constraintNote,
  intensityCeiling,
  ruledOutByConstraints,
  rulesOutComplexLifts,
  rulesOutHardIntervals,
} from './constraints';

/**
 * What the person wants from the block, in the intake's own words:
 * stronger, muscle, leaner, fitter for running or a sport, or keeping
 * what they have. `general` is the block built for someone who has not
 * said, and it stays the same block it always was.
 */
export type TrainingGoal = 'strength' | 'hypertrophy' | 'fatloss' | 'general' | 'fitter' | 'maintain';
/** The body area the extra work goes to when the goal is muscle. */
export type FocusArea = 'upper' | 'lower' | 'whole';
/** What the conditioning session is for when the goal is fitter. */
export type Distance = '5k' | '10k' | 'sport';
export type TrainingExperience = 'new' | 'returning' | 'consistent';
export type TrainingEquipment = 'gym' | 'home' | 'dumbbells' | 'bodyweight';

/**
 * How the intake's three answers map onto the shared ladder. `consistent`
 * stops at `established` on purpose: `advanced` is earned in
 * features/paths/level, never selected on a form.
 */
/**
 * How many sessions a week the person already does, from the intake's
 * frequency answer. A block must never hand someone fewer days than they
 * are already training: the interview's default of three was quietly
 * cutting a five-day lifter to three and calling it a programme.
 */
export function sessionsPerWeekFloor(frequency?: string): number {
  switch (frequency) {
    case '3-4':
      return 3;
    case '5+':
      return 5;
    default:
      return 0;
  }
}

export const LEVEL_FROM_EXPERIENCE: Record<TrainingExperience, PathLevel> = {
  new: 'foundation',
  returning: 'developing',
  consistent: 'established',
};

export interface TrainingInputs {
  goal: TrainingGoal;
  experience: TrainingExperience;
  /**
   * The level this block was actually built at. Absent on blocks built
   * before the ladder existed, and on those the declared experience still
   * decides — so an old stored programme keeps working and simply gets the
   * level its owner would have been given anyway.
   */
  level?: PathLevel;
  daysAvailable: number; // 2–5
  sessionMin: number; // realistic session length
  equipment: TrainingEquipment;
  /** The lift the goal centres on, when the goal names one. */
  focusLift?: 'bench' | 'squat' | 'deadlift' | 'ohp';
  /** Where the extra volume goes for a muscle block; ignored otherwise. */
  focusArea?: FocusArea;
  /** What the conditioning session is built for in a fitter block. */
  distance?: Distance;
  age?: number;
  /** What the body will not do right now. Swaps movements, never removes. */
  constraints?: PhysicalConstraint[];
  /**
   * The person said this block is too easy.
   *
   * Raises the DOSE — a set, a little load, one more accessory, one more
   * point of effort — and changes no STRUCTURE. It never grants the
   * barbell lifts to someone at foundation, never adds a top single, and
   * never adds the overreach week, because those are the parts of an
   * advanced block that hurt a person who is not there yet, and a button
   * press is not evidence that they are.
   *
   * Any load it produces still passes through the constraint ceiling, so
   * someone training around a heart condition or a pregnancy cannot push
   * past the limit their own answers set.
   */
  pushHarder?: boolean;
}

export interface PrescribedExercise {
  name: string;
  sets: number;
  reps: string;
  /** Present when a baseline exists — computed from %e1RM, rounded to 2.5. */
  loadKg?: number;
  /** Present when no baseline exists — effort-anchored instead. */
  rpe?: number;
  restSec: number;
  accessory?: boolean;
  /**
   * Timed work — a run, an interval block — where a set is minutes rather
   * than reps and rest. The estimate reads this instead of sets × rest, so
   * cutting a set of intervals shortens the session by what it actually
   * took.
   */
  minutesPerSet?: number;
  /** Set when the person swapped this in for the programmed movement. */
  swappedFrom?: string;
}

export type TrainingPhase = 'build' | 'progress' | 'deload';

export interface ProgrammeSession {
  title: string;
  exercises: PrescribedExercise[];
  estimatedMin: number;
  note?: string;
}

export interface ProgrammeWeek {
  week: number; // 1–4
  phase: TrainingPhase;
  focus: string;
  sessions: ProgrammeSession[];
}

export interface TrainingProgramme {
  id: string;
  createdAt: string;
  inputs: TrainingInputs;
  /** e1RM snapshot the block was computed from (kg by lift). */
  baselines: Partial<Record<'bench' | 'squat' | 'deadlift' | 'ohp', number>>;
  weeks: ProgrammeWeek[];
  notes: string[];
}

const LIFT_METRIC: Record<string, string> = {
  bench: 'strength.bench.e1rm',
  squat: 'strength.squat.e1rm',
  deadlift: 'strength.deadlift.e1rm',
  ohp: 'strength.ohp.e1rm',
};

export function baselinesFrom(
  metrics: MetricObservation[],
  now: Date = new Date(),
): TrainingProgramme['baselines'] {
  const out: TrainingProgramme['baselines'] = {};
  for (const [lift, key] of Object.entries(LIFT_METRIC)) {
    // The weighted read, not the latest reading — see baseline.ts.
    const read = strengthBaseline(metrics, key, now);
    if (read) out[lift as keyof TrainingProgramme['baselines']] = read.value;
  }
  return out;
}

const round2p5 = (kg: number) => Math.round(kg / 2.5) * 2.5;
const floor2p5 = (kg: number) => Math.floor(kg / 2.5) * 2.5;

/**
 * A load in plate-sized steps that never rounds up past the ceiling.
 *
 * Rounding to the nearest 2.5 kg used to be applied after the ceiling, so
 * 80% of 140 became 112.5 for someone whose balance constraint set the
 * limit at 112. Half a kilogram is not a danger; a limit the app says it
 * keeps and then quietly rounds through is. The ceiling is applied last.
 */
function cappedLoad(base: number, pct: number, ceiling: number): number {
  return Math.min(round2p5(base * pct), floor2p5(base * ceiling));
}


/**
 * What each rung actually changes in the prescription.
 *
 * These are the numbers that make a foundation block and an advanced block
 * different programmes rather than the same programme with a different
 * word on it. The two that matter most are `complexLifts` and `overreach`:
 * the first keeps a first-timer off the two lifts that punish a rushed
 * pattern hardest, and the second is the deliberate over-shoot that only
 * makes sense for someone whose log shows they can absorb it.
 */
interface LevelTuning {
  /** Sets added to or removed from every main lift, outside the deload. */
  setsDelta: number;
  /** Shift applied to the prescribed %e1RM, outside the deload. */
  pctDelta: number;
  /** Ceiling on effort when there is no baseline to compute a load from. */
  rpeCap: number;
  /** Accessory slots added or removed. */
  accessoryDelta: number;
  /** Barbell deadlift and overhead press as programmed main work. */
  complexLifts: boolean;
  /** A heavy top single in the peak week, when the focus lift is baselined. */
  topSingle: boolean;
  /** Week 3 overshoots deliberately, and the deload pays for it. */
  overreach: boolean;
  /** Every session carries one thing to think about while doing it. */
  technicalFocus: boolean;
}

const LEVEL_TUNING: Record<PathLevel, LevelTuning> = {
  foundation: {
    setsDelta: -1,
    pctDelta: -0.075,
    rpeCap: 7,
    accessoryDelta: -1,
    complexLifts: false,
    topSingle: false,
    overreach: false,
    technicalFocus: true,
  },
  developing: {
    setsDelta: 0,
    pctDelta: -0.025,
    rpeCap: 8,
    accessoryDelta: 0,
    complexLifts: true,
    topSingle: false,
    overreach: false,
    technicalFocus: true,
  },
  established: {
    setsDelta: 0,
    pctDelta: 0,
    rpeCap: 8,
    accessoryDelta: 0,
    complexLifts: true,
    topSingle: true,
    overreach: false,
    technicalFocus: false,
  },
  advanced: {
    setsDelta: 1,
    pctDelta: 0.025,
    rpeCap: 9,
    accessoryDelta: 1,
    complexLifts: true,
    topSingle: true,
    overreach: true,
    technicalFocus: false,
  },
};

/**
 * The tuning actually used, after the person's own "this is too easy".
 *
 * Deliberately additive on the four dosage fields and silent on the four
 * structural ones. An `advanced` lifter who pushes gets a genuinely harder
 * block; a `foundation` lifter who pushes gets more work at their own
 * movements, which is what they were asking for.
 */
export function tuningFor(level: PathLevel, pushHarder = false): LevelTuning {
  const base = LEVEL_TUNING[level];
  if (!pushHarder) return base;
  return {
    ...base,
    setsDelta: base.setsDelta + 1,
    pctDelta: base.pctDelta + 0.025,
    // Nine is the top of the scale the app uses anywhere: one clean rep
    // left in the tank. Nothing here can prescribe a grinding failure.
    rpeCap: Math.min(9, base.rpeCap + 1),
    accessoryDelta: base.accessoryDelta + 1,
  };
}

/**
 * The level a set of inputs builds at. Explicit when the ladder set it;
 * otherwise the declared experience, which is what every programme built
 * before the ladder existed was implicitly using.
 */
export function levelOf(inputs: TrainingInputs): PathLevel {
  return inputs.level ?? LEVEL_FROM_EXPERIENCE[inputs.experience] ?? 'developing';
}

/**
 * One thing to think about while the set is happening. Rotated by session
 * so the same cue is not repeated all block — a cue you have stopped
 * reading is not a cue.
 */
const TECHNICAL_CUES = [
  'Focus this session: brace before the bar moves, not after.',
  'Focus this session: control the way down. The lowering is where the work is.',
  'Focus this session: full range on every rep, even the last one.',
  'Focus this session: same bar path every rep. Consistency before load.',
  'Focus this session: finish each set with one clean rep left in you.',
];

/** Weekly %e1RM for the main lifts by phase and goal. */
function mainScheme(goal: TrainingGoal, week: number): { sets: number; reps: string; pct: number } {
  if (goal === 'strength') {
    return [
      { sets: 4, reps: '6', pct: 0.75 },
      { sets: 4, reps: '6', pct: 0.775 },
      { sets: 5, reps: '5', pct: 0.8 },
      { sets: 3, reps: '5', pct: 0.65 },
    ][week - 1];
  }
  if (goal === 'hypertrophy') {
    return [
      { sets: 3, reps: '8–12', pct: 0.67 },
      { sets: 4, reps: '8–12', pct: 0.67 },
      { sets: 4, reps: '8–10', pct: 0.7 },
      { sets: 2, reps: '10', pct: 0.6 },
    ][week - 1];
  }
  if (goal === 'fitter') {
    // Lifting for a runner keeps the legs and back robust; the running is
    // where the fitness comes from. Three sets, no chasing a peak.
    return [
      { sets: 3, reps: '6–8', pct: 0.7 },
      { sets: 3, reps: '6–8', pct: 0.7 },
      { sets: 3, reps: '5–6', pct: 0.75 },
      { sets: 2, reps: '8', pct: 0.62 },
    ][week - 1];
  }
  if (goal === 'maintain') {
    // The dose that holds what someone has: the same three sets every
    // week, at a load that is work without being a project. No peak,
    // because there is nothing to peak for.
    return [
      { sets: 3, reps: '5–8', pct: 0.72 },
      { sets: 3, reps: '5–8', pct: 0.72 },
      { sets: 3, reps: '5–8', pct: 0.72 },
      { sets: 2, reps: '8', pct: 0.62 },
    ][week - 1];
  }
  return [
    { sets: 3, reps: '6–10', pct: 0.7 },
    { sets: 3, reps: '6–10', pct: 0.725 },
    { sets: 4, reps: '6–8', pct: 0.75 },
    { sets: 2, reps: '8', pct: 0.62 },
  ][week - 1];
}

function prescribe(
  name: string,
  lift: keyof TrainingProgramme['baselines'] | null,
  baselines: TrainingProgramme['baselines'],
  goal: TrainingGoal,
  week: number,
  primary: boolean,
  restSec: number,
  tuning: LevelTuning,
  ceiling: number,
): PrescribedExercise {
  const scheme = mainScheme(goal, week);
  const deload = week === 4;

  // The deload is the same week for everybody. Its whole job is to be
  // easy, and an advanced lifter's extra set would undo it.
  const setsDelta = deload ? 0 : tuning.setsDelta;
  const pctDelta = deload ? 0 : tuning.pctDelta;
  // Week 3 is the peak; for a level that overreaches it peaks harder.
  const overreachSets = !deload && week === 3 && tuning.overreach && primary ? 1 : 0;

  const base = lift ? baselines[lift] : undefined;
  const sets = Math.max(
    2,
    (primary ? scheme.sets : Math.max(2, scheme.sets - 1)) + setsDelta + overreachSets,
  );

  if (base) {
    const pct = (primary ? scheme.pct : scheme.pct - 0.05) + pctDelta;
    // Clamped so no combination of goal, week and level can prescribe a
    // load that is either a warm-up or a maximal attempt by accident. A
    // constraint lowers the top of that range rather than shifting it, so
    // several constraints together cannot drive the load below useful.
    const safePct = Math.min(ceiling, Math.max(0.5, pct));
    return { name, sets, reps: scheme.reps, loadKg: cappedLoad(base, safePct, ceiling), restSec };
  }

  // No baseline: effort-anchored, and the level caps how hard that effort
  // is allowed to be. Someone in their first month should not be taken to
  // an RPE they have no reference for.
  const target = deload ? 6 : goal === 'strength' ? 8 : 7;
  return { name, sets, reps: scheme.reps, rpe: Math.min(target, tuning.rpeCap), restSec };
}

const ACCESSORIES: Record<TrainingEquipment, PrescribedExercise[]> = {
  gym: [
    { name: 'Romanian deadlift', sets: 3, reps: '8–10', rpe: 7, restSec: 90, accessory: true },
    { name: 'Lat pulldown', sets: 3, reps: '10–12', rpe: 7, restSec: 75, accessory: true },
    { name: 'Curls / band pulls', sets: 2, reps: '10–15', rpe: 7, restSec: 60, accessory: true },
    { name: 'Core: plank', sets: 2, reps: '45 sec', restSec: 45, accessory: true },
  ],
  home: [
    { name: 'Split squats', sets: 3, reps: '10–12', rpe: 7, restSec: 75, accessory: true },
    { name: 'Backpack rows', sets: 3, reps: '10–15', rpe: 7, restSec: 75, accessory: true },
    { name: 'Core: plank', sets: 2, reps: '45 sec', restSec: 45, accessory: true },
  ],
  dumbbells: [
    { name: 'Dumbbell lunges', sets: 3, reps: '10–12', rpe: 7, restSec: 75, accessory: true },
    { name: 'Dumbbell curls', sets: 2, reps: '10–15', rpe: 7, restSec: 60, accessory: true },
    { name: 'Core: plank', sets: 2, reps: '45 sec', restSec: 45, accessory: true },
  ],
  bodyweight: [
    { name: 'Split squats', sets: 3, reps: '12–15', rpe: 7, restSec: 60, accessory: true },
    { name: 'Core: plank', sets: 2, reps: '45 sec', restSec: 45, accessory: true },
  ],
};

interface Slot {
  name: string;
  lift: keyof TrainingProgramme['baselines'] | null;
  primary: boolean;
  /** Which half of the body the movement trains, for a muscle block's extra work. */
  area?: 'upper' | 'lower';
}

/**
 * The accessories a muscle block adds where the person asked for it.
 * Listed first for the area, ahead of the general accessories, so the
 * extra slot goes to the area and not to the plank. Every name is in the
 * swap table, and a joint or injury constraint filters the loaded ones
 * out through the same rule the swap menu uses.
 */
const AREA_ACCESSORIES: Record<'upper' | 'lower', Record<TrainingEquipment, PrescribedExercise[]>> = {
  upper: {
    gym: [
      { name: 'Incline dumbbell press', sets: 3, reps: '10–12', rpe: 7, restSec: 75, accessory: true },
      { name: 'Seated cable row', sets: 3, reps: '10–12', rpe: 7, restSec: 75, accessory: true },
      { name: 'Triceps pushdowns', sets: 2, reps: '12–15', rpe: 7, restSec: 60, accessory: true },
    ],
    home: [
      { name: 'Push-ups', sets: 3, reps: '10–15', rpe: 7, restSec: 60, accessory: true },
      { name: 'Inverted rows / doorframe rows', sets: 3, reps: '8–12', rpe: 7, restSec: 75, accessory: true },
    ],
    dumbbells: [
      { name: 'Incline dumbbell press', sets: 3, reps: '10–12', rpe: 7, restSec: 75, accessory: true },
      { name: 'Dumbbell rows', sets: 3, reps: '10–12', rpe: 7, restSec: 75, accessory: true },
      { name: 'Hammer curls', sets: 2, reps: '10–15', rpe: 7, restSec: 60, accessory: true },
    ],
    bodyweight: [
      { name: 'Push-ups', sets: 3, reps: '10–15', rpe: 7, restSec: 60, accessory: true },
      { name: 'Inverted rows / doorframe rows', sets: 3, reps: '8–12', rpe: 7, restSec: 75, accessory: true },
    ],
  },
  lower: {
    gym: [
      { name: 'Leg press', sets: 3, reps: '10–12', rpe: 7, restSec: 90, accessory: true },
      { name: 'Hip thrusts', sets: 3, reps: '10–12', rpe: 7, restSec: 75, accessory: true },
      { name: 'Dumbbell lunges', sets: 3, reps: '10–12', rpe: 7, restSec: 75, accessory: true },
    ],
    home: [
      { name: 'Split squats', sets: 3, reps: '10–12', rpe: 7, restSec: 75, accessory: true },
      { name: 'Single-leg hip hinges', sets: 3, reps: '10–12', rpe: 7, restSec: 60, accessory: true },
    ],
    dumbbells: [
      { name: 'Dumbbell lunges', sets: 3, reps: '10–12', rpe: 7, restSec: 75, accessory: true },
      { name: 'Dumbbell Romanian deadlift', sets: 3, reps: '10–12', rpe: 7, restSec: 75, accessory: true },
    ],
    bodyweight: [
      { name: 'Split squats', sets: 3, reps: '12–15', rpe: 7, restSec: 60, accessory: true },
      { name: 'Single-leg hip hinges', sets: 3, reps: '10–12', rpe: 7, restSec: 60, accessory: true },
    ],
  },
};

/**
 * Main-work menu per equipment; barbell numbers only where a barbell
 * exists, and the two lifts that punish a rushed pattern hardest only
 * where the level has earned them.
 *
 * The deadlift and the overhead press are held back at foundation, and
 * nothing else is. A first-timer squats and benches from week one — those
 * are trainable immediately under light load, and refusing them would be
 * the patronising version of this. What they get instead of a deadlift is
 * the hinge it is built on, which is the actual prerequisite.
 *
 * The consequence is deliberate: a foundation block cannot produce a
 * deadlift or overhead-press baseline, and the top rung requires three
 * baselined lifts. Nobody reaches advanced without having passed through
 * the levels where those lifts are programmed.
 */
function mains(
  equipment: TrainingEquipment,
  complexLifts: boolean,
): { upper: Slot[]; lower: Slot[]; full: Slot[] } {
  const up = 'upper' as const;
  const low = 'lower' as const;
  if (equipment === 'gym' || equipment === 'home') {
    const barbell = equipment === 'gym';
    const overhead: Slot = barbell
      ? complexLifts
        ? { name: 'Overhead press', lift: 'ohp', primary: false, area: up }
        : { name: 'Dumbbell shoulder press', lift: null, primary: false, area: up }
      : { name: 'Pike push-ups', lift: null, primary: false, area: up };
    const hinge: Slot = barbell
      ? complexLifts
        ? { name: 'Deadlift', lift: 'deadlift', primary: false, area: low }
        : { name: 'Romanian deadlift — hinge practice', lift: null, primary: false, area: low }
      : { name: 'Hip hinges (loaded)', lift: null, primary: false, area: low };
    const press: Slot = { name: barbell ? 'Bench press' : 'Push-ups (loaded)', lift: barbell ? 'bench' : null, primary: true, area: up };
    const row: Slot = { name: barbell ? 'Barbell row' : 'Backpack rows', lift: null, primary: false, area: up };
    const squat: Slot = { name: barbell ? 'Squat' : 'Goblet squats', lift: barbell ? 'squat' : null, primary: true, area: low };
    return {
      upper: [press, overhead, row],
      lower: [squat, hinge],
      full: [{ ...squat }, { ...press }, { ...row }],
    };
  }
  const press: Slot = {
    name: equipment === 'dumbbells' ? 'Dumbbell bench press' : 'Push-ups',
    lift: null,
    primary: true,
    area: up,
  };
  const row: Slot = {
    name: equipment === 'dumbbells' ? 'Dumbbell rows' : 'Inverted rows / doorframe rows',
    lift: null,
    primary: false,
    area: up,
  };
  const squat: Slot = {
    name: equipment === 'dumbbells' ? 'Goblet squats' : 'Tempo air squats',
    lift: null,
    primary: true,
    area: low,
  };
  const hinge: Slot = {
    name: equipment === 'dumbbells' ? 'Dumbbell Romanian deadlift' : 'Single-leg hip hinges',
    lift: null,
    primary: false,
    area: low,
  };
  return {
    upper: [press, row],
    lower: [squat, hinge],
    full: [{ ...squat }, { ...press }, { ...row }],
  };
}

/**
 * What a list of exercises takes, warm-up included. Exported so the number
 * a screen shows can be checked against the exercises it shows it beside.
 */
export function estimateSessionMin(exercises: PrescribedExercise[], age?: number): number {
  // A session that is all timed work — the conditioning day — carries its
  // own easy-pace warm-up as its first exercise, so none is added here.
  const allTimed = exercises.length > 0 && exercises.every((e) => e.minutesPerSet != null);
  const warmup = allTimed ? 0 : (age ?? 0) >= 45 ? 12 : 8;
  const workSec = exercises.reduce(
    (sum, e) => sum + e.sets * (e.minutesPerSet != null ? e.minutesPerSet * 60 : 45 + e.restSec),
    0,
  );
  return Math.round(workSec / 60) + warmup;
}

/**
 * Below this the non-programme path (modalities/gym/program) declines to
 * build a session at all, and the workout screen says a walk is the better
 * use of the time. The programme path answers the same way.
 */
const MIN_SESSION_MIN = 15;

function fitToTime(
  exercises: PrescribedExercise[],
  targetMin: number,
  age?: number,
): PrescribedExercise[] {
  let out = exercises.map((e) => ({ ...e }));
  while (estimateSessionMin(out, age) > targetMin) {
    const lastAccessory = [...out].reverse().find((e) => e.accessory);
    if (lastAccessory) {
      out = out.filter((e) => e !== lastAccessory);
      continue;
    }
    const trimmable = [...out].reverse().find((e) => e.sets > 2);
    if (!trimmable) break;
    trimmable.sets -= 1;
  }
  return out;
}


/**
 * What the level means, said once at the top of the block so nobody has to
 * guess why their programme looks the way it does. An unexplained
 * difference reads as a bug; an explained one reads as a coach.
 */
const LEVEL_NOTE: Record<PathLevel, string> = {
  foundation:
    'Foundation block — squat and bench from day one at conservative loads, the hinge learned before it is loaded, and one thing to think about each session. Volume comes after the patterns do.',
  developing:
    'Developing block — deadlift and overhead press are in, sets and loads step up. Enough to drive progress without costing you the rest of the week.',
  established:
    'Established block — full volume, a peak week, and a heavy top set on your focus lift.',
  advanced:
    'Advanced block — higher intensity, an extra set on the main work, and week 3 deliberately overreaches. The deload after it is not optional.',
};

/**
 * The same four rungs when the person wants to keep what they have: the
 * level's movements and dose, none of its pushing. The established and
 * advanced notes would otherwise promise a peak week and a top set the
 * block does not build.
 */
const MAINTAIN_NOTE: Record<PathLevel, string> = {
  foundation:
    'Foundation block, held rather than pushed — squat and bench at conservative loads, the hinge learned before it is loaded, the same dose every week.',
  developing:
    'Developing block, held rather than pushed — deadlift and overhead press are in, at the same sets and loads every week rather than stepping up.',
  established:
    'Established block, held rather than pushed — full volume at the same dose every week, no peak week and no heavy top set.',
  advanced:
    'Advanced block, held rather than pushed — the extra set on the main work stays; the overreach week and the top singles do not. Holding is the goal.',
};

/** The line at the top of a session, when there is one worth saying. */
function sessionNote(
  phase: TrainingPhase,
  week: number,
  dayIdx: number,
  tuning: LevelTuning,
): string | undefined {
  if (phase === 'deload') {
    return tuning.overreach
      ? 'Deload — this one is repaying week 3. Light means light; the adaptation happens here.'
      : 'Deload — moving well at lighter loads, then we reassess and rebuild.';
  }
  if (week === 3 && tuning.overreach) {
    return 'Overreach — expect to feel behind by the end of the week. That is the intent, and next week is the deload.';
  }
  if (tuning.technicalFocus) return TECHNICAL_CUES[(week + dayIdx) % TECHNICAL_CUES.length];
  return undefined;
}

const PHASES: TrainingPhase[] = ['build', 'build', 'progress', 'deload'];

/**
 * Whether this block programmes the barbell deadlift and overhead press.
 *
 * A constraint rules the technical lifts out for the same reason
 * foundation level does, and either alone is enough. One function, so the
 * swap menu on the workout screen answers exactly as the block did — a
 * swap must not be the back door to a lift the block withheld.
 */
export function complexLiftsAllowed(inputs: TrainingInputs): boolean {
  return (
    tuningFor(levelOf(inputs), inputs.pushHarder).complexLifts &&
    !rulesOutComplexLifts(inputs.constraints)
  );
}


/**
 * The conditioning session a fitter block runs in place of one lifting
 * day. Built from two practices in the library — easy cardio at talking
 * pace and hard intervals — with the easy work either side of the hard
 * work. The "Cardio:" prefix marks it, like the finisher, as not a
 * movement to swap.
 *
 * Hard intervals are the one thing here a constraint vetoes outright
 * rather than scales: beside a heart condition, a pregnancy or an injury
 * the session is easy pace the whole way, and says so. The deload week is
 * easy pace for everybody.
 */
const INTERVALS: Record<Distance, { sets: number; reps: string; minutesPerSet: number }> = {
  '5k': { sets: 4, reps: '3 min hard / 3 min easy', minutesPerSet: 6 },
  '10k': { sets: 4, reps: '4 min hard / 3 min easy', minutesPerSet: 7 },
  sport: { sets: 6, reps: '1 min hard / 2 min easy', minutesPerSet: 3 },
};

function conditioningSession(
  distance: Distance,
  phase: TrainingPhase,
  week: number,
  constraints: PhysicalConstraint[] | undefined,
  sessionMin: number,
  age?: number,
): ProgrammeSession {
  const vetoed = rulesOutHardIntervals(constraints);
  const easyOnly = phase === 'deload' || vetoed;
  let exercises: PrescribedExercise[];
  if (easyOnly) {
    const minutes = Math.max(10, Math.min(distance === '10k' ? 30 : 20, sessionMin));
    exercises = [
      { name: 'Cardio: easy pace, talking the whole way', sets: 1, reps: `${minutes} min`, restSec: 0, minutesPerSet: minutes },
    ];
  } else {
    const block = INTERVALS[distance];
    exercises = [
      { name: 'Cardio: easy pace to warm up', sets: 1, reps: '8 min, talking pace', restSec: 0, minutesPerSet: 8 },
      // The peak week adds one round; the lifting days peak the same week.
      { name: 'Cardio: hard intervals', sets: block.sets + (week === 3 ? 1 : 0), reps: block.reps, restSec: 0, minutesPerSet: block.minutesPerSet },
      { name: 'Cardio: easy pace to cool down', sets: 1, reps: '6 min', restSec: 0, minutesPerSet: 6, accessory: true },
    ];
  }
  exercises = fitToTime(exercises, sessionMin, age);
  return {
    title: 'Conditioning',
    exercises,
    estimatedMin: estimateSessionMin(exercises, age),
    note: vetoed
      ? 'Easy pace only — hard intervals do not belong beside what you told us you are managing. Talking pace the whole way.'
      : phase === 'deload'
        ? 'Deload — easy pace only. Light means light; the fitness lands here.'
        : 'Built from two practices in your library: easy cardio at talking pace, and hard intervals in the middle. Hard means hard for you, not a number; skip it when unwell.',
  };
}

/** The distance a fitter block is for when the person did not say. */
const DEFAULT_DISTANCE: Distance = '5k';

/** Build the four-week block from who this person actually is. */
export function buildProgramme(
  inputs: TrainingInputs,
  baselines: TrainingProgramme['baselines'] = {},
): TrainingProgramme {
  const days = Math.min(Math.max(inputs.daysAvailable, 2), 5);
  // How many of those days lift. A fitter block gives one to conditioning;
  // a maintenance block needs no more than three, whatever is free.
  const liftDays =
    inputs.goal === 'fitter' ? Math.max(1, days - 1) : inputs.goal === 'maintain' ? Math.min(days, 3) : days;
  const level = levelOf(inputs);
  const rung = tuningFor(level, inputs.pushHarder);
  // A maintenance block has nothing to test and nothing to overshoot, so
  // the top single and the overreach week stay out even at a level that
  // has earned them. The dose fields keep the level's numbers.
  const tuning = inputs.goal === 'maintain' ? { ...rung, topSingle: false, overreach: false } : rung;
  const allowComplex = complexLiftsAllowed(inputs);
  const ceiling = intensityCeiling(inputs.constraints);
  // Any stated constraint rules out near-maximal singles. Not a scaled-down
  // version of one — none at all.
  const maximalAllowed = (inputs.constraints?.length ?? 0) === 0;
  const topSingle = tuning.topSingle;
  const menu = mains(inputs.equipment, allowComplex);
  const notes: string[] = [];
  const muscleArea = inputs.goal === 'hypertrophy' ? inputs.focusArea : undefined;

  notes.push(inputs.goal === 'maintain' ? MAINTAIN_NOTE[level] : LEVEL_NOTE[level]);
  // Say the bump out loud. A block that silently got harder is a block the
  // person blames themselves for struggling with.
  if (inputs.pushHarder) {
    notes.push(
      'You asked for more: an extra set on the main work, a little more load, one more accessory. Structure is unchanged — say the word and it goes straight back.',
    );
  }
  const constraintLine = constraintNote(inputs.constraints);
  if (constraintLine) notes.push(constraintLine);
  if (!maximalAllowed && LEVEL_TUNING[level].topSingle && inputs.goal !== 'maintain' && inputs.focusLift) {
    notes.push(
      'No heavy single this block. Near-maximal work does not belong beside what you told us you are managing, and a lighter version of it would not be the same movement.',
    );
  }

  // Split from real availability, not aspiration.
  const split: ('upper' | 'lower' | 'full')[] =
    liftDays <= 3 ? Array(liftDays).fill('full') : ['upper', 'lower', 'upper', 'lower', 'full'].slice(0, liftDays);
  notes.push(
    liftDays === 1
      ? 'One full-body lifting session — enough to keep the strength that makes the running hold up.'
      : liftDays <= 3
        ? `${liftDays} full-body sessions — frequency beats fancy splits at this availability.`
        : 'Upper/lower split — each lift trained twice weekly, recovery respected.',
  );
  // The focus line describes this block, not the block an unconstrained
  // established lifter would get. It used to promise a heavy top set to
  // everyone with a baseline — including the levels that never get one and
  // the constrained person whose next line withdrew it — and named a lift
  // that a joint constraint had already swapped out of every session.
  const focusProgrammed =
    inputs.focusLift != null &&
    Object.values(menu).some((slots) =>
      applyConstraints(slots, inputs.constraints).some((s) => s.lift === inputs.focusLift),
    );
  if (inputs.focusLift && baselines[inputs.focusLift] && focusProgrammed) {
    notes.push(
      topSingle && maximalAllowed
        ? `Focus: ${inputs.focusLift} — it opens every session it is in, and week 3 adds a heavy top set.`
        : `Focus: ${inputs.focusLift} — it opens every session it is in.`,
    );
  }
  if ((inputs.age ?? 0) >= 45) notes.push('45+: longer warm-ups are built into every estimate.');
  // What the block is for, said once at the top in the person's own words.
  if (inputs.goal === 'fatloss') {
    notes.push(
      'Leaner: a short finisher ends every session but the deload. The walk in your week does more than the finisher does — keep it — and the food does the rest.',
    );
  }
  if (inputs.goal === 'hypertrophy') {
    notes.push(
      muscleArea === 'whole'
        ? 'Muscle: an extra set on the main work and an extra accessory in every session. The protein number from the food coach does the other half.'
        : muscleArea
          ? `Muscle: an extra set on the ${muscleArea}-body lifts and an extra ${muscleArea}-body accessory wherever they are trained. The protein number from the food coach does the other half.`
          : 'Muscle: higher reps on the main work and three accessories a session. The protein number from the food coach does the other half.',
    );
  }
  if (inputs.goal === 'fitter') {
    const distance = inputs.distance ?? DEFAULT_DISTANCE;
    notes.push(
      `Fitter: one day a week is a conditioning session${
        distance === '10k' ? ' built for 10 km and beyond' : distance === 'sport' ? ' built for a sport — short, sharp efforts' : ' built for a 5 km'
      }, and the lifting keeps you robust enough to keep running.`,
    );
  }
  if (inputs.goal === 'maintain') {
    notes.push(
      `Keeping what you have: ${liftDays} sessions at the same dose every week and no peak week. It holds on less than you think; the retest at the end shows it held.`,
    );
  }

  const weeks: ProgrammeWeek[] = PHASES.map((phase, i) => {
    const week = i + 1;
    const sessions: ProgrammeSession[] = split.map((kind, dayIdx) => {
      const slots = applyConstraints([...menu[kind]], inputs.constraints);
      // Focus lift leads its sessions, and leading means the lead slot's
      // volume. The deadlift and overhead press are the second lift of
      // their sessions by default, and moving one to the front used to
      // leave it prescribed as the second lift — so asking for more
      // deadlift bought three sets of it and cost a squat set.
      if (inputs.focusLift) {
        const fi = slots.findIndex((s) => s.lift === inputs.focusLift);
        if (fi > 0) slots.unshift(...slots.splice(fi, 1));
      }
      let exercises = slots.map((s, si) =>
        prescribe(
          s.name,
          s.lift,
          baselines,
          inputs.goal,
          week,
          (s.primary || s.lift === inputs.focusLift) && si === 0,
          si === 0 ? 120 : 90,
          tuning,
          ceiling,
        ),
      );
      // A muscle block puts its extra set where the person asked for it:
      // the upper-body lifts, the lower-body lifts, or all of them. Never
      // in the deload, whose job is to be easy.
      const inArea = (slot: Slot) => muscleArea === 'whole' || slot.area === muscleArea;
      if (muscleArea && phase !== 'deload') {
        exercises = exercises.map((e, i) => (inArea(slots[i]) ? { ...e, sets: e.sets + 1 } : e));
      }
      // Week 3 heavy top set for a baselined focus lift — and only for a
      // level where a near-maximal single is a training tool rather than a
      // test of nerve.
      //
      // It is also the one prescription in the block that a constraint
      // must veto outright rather than scale. Every other movement here
      // passes its percentage through `ceiling`, and this one did not —
      // so a person managing a heart condition, a pregnancy or an injury
      // was handed a 90% single, the single heaviest thing in the block,
      // with the limit their own answers set silently ignored.
      //
      // Scaling it would not fix that. A "heavy top single" at the 0.7
      // ceiling is a warm-up wearing the wrong name, and the point of the
      // movement is the near-maximal effort. So it is dropped, and the
      // programme says why rather than leaving a hole.
      if (
        topSingle &&
        week === 3 &&
        inputs.focusLift &&
        baselines[inputs.focusLift] &&
        slots[0]?.lift === inputs.focusLift
      ) {
        if (maximalAllowed) {
          exercises.unshift({
            name: `${exercises[0].name} — heavy top single`,
            sets: 1,
            reps: '1',
            // Clamped as well as gated. If a future change ever offers
            // this under a constraint, it comes back capped rather than
            // uncapped.
            loadKg: cappedLoad(baselines[inputs.focusLift]!, 0.9, ceiling),
            restSec: 180,
          });
        }
      }
      // The area's own accessories come first, and buy one more slot, so
      // the extra work lands on the area rather than on the plank. A
      // full-body day in a whole-body block alternates the two halves.
      const accessoryArea: 'upper' | 'lower' | null =
        muscleArea == null
          ? null
          : muscleArea === 'whole'
            ? kind === 'full'
              ? dayIdx % 2 === 0
                ? 'upper'
                : 'lower'
              : kind
            : kind === 'full' || kind === muscleArea
              ? muscleArea
              : null;
      const areaPool = accessoryArea
        ? AREA_ACCESSORIES[accessoryArea][inputs.equipment].filter(
            (e) => !ruledOutByConstraints(e.name, inputs.constraints),
          )
        : [];
      const accessoryBudget = Math.max(
        1,
        (inputs.goal === 'hypertrophy' ? 3 : 2) + tuning.accessoryDelta + (areaPool.length > 0 ? 1 : 0),
      );
      // Nothing programmed twice: an area accessory that is already a main
      // lift on this equipment, or already in the general list, is skipped.
      const programmed = new Set(exercises.map((e) => e.name));
      const pool: PrescribedExercise[] = [];
      for (const e of [...areaPool, ...ACCESSORIES[inputs.equipment]]) {
        if (programmed.has(e.name)) continue;
        programmed.add(e.name);
        pool.push({ ...e });
      }
      exercises = exercises.concat(pool.slice(0, phase === 'deload' ? 1 : accessoryBudget));
      if (inputs.goal === 'fatloss' && phase !== 'deload') {
        exercises.push({ name: 'Finisher: intervals', sets: 5, reps: '30s hard / 60s easy', restSec: 0, accessory: true });
      }
      exercises = fitToTime(exercises, inputs.sessionMin, inputs.age);
      return {
        title:
          kind === 'full' ? `Full body ${String.fromCharCode(65 + dayIdx)}` : kind === 'upper' ? `Upper ${dayIdx < 2 ? 'A' : 'B'}` : `Lower ${dayIdx < 2 ? 'A' : 'B'}`,
        exercises,
        // The honest number. It was clamped to the session length, which
        // hid the one case that matters: a session that could not be
        // trimmed to fit, shown as if it had been.
        estimatedMin: estimateSessionMin(exercises, inputs.age),
        note: sessionNote(phase, week, dayIdx, tuning),
      };
    });
    if (inputs.goal === 'fitter') {
      sessions.push(
        conditioningSession(
          inputs.distance ?? DEFAULT_DISTANCE,
          phase,
          week,
          inputs.constraints,
          inputs.sessionMin,
          inputs.age,
        ),
      );
    }
    return {
      week,
      phase,
      focus:
        phase === 'deload'
          ? 'Recover, then retest the main lifts'
          : inputs.goal === 'maintain'
            ? 'Hold the numbers — the same dose, done well'
            : week === 3
              ? tuning.overreach
                ? 'Overreach week — deliberately more than you can sustain, and next week pays it back'
                : inputs.goal === 'fitter'
                  ? 'Peak week — one more round of intervals, heaviest lifting of the block'
                  : 'Peak week — heaviest work of the block'
              : 'Accumulate quality volume',
      sessions,
    };
  });

  return { id: newId('prog'), createdAt: new Date().toISOString(), inputs, baselines, weeks, notes };
}

/**
 * Auto-regulation — reality outranks the plan. Short sleep or a tight
 * window keeps the stimulus (main work) and cuts accessory volume.
 */
export function autoRegulate(
  session: ProgrammeSession,
  ctx: {
    availableMin?: number;
    sleptHours?: number;
    age?: number;
    /**
     * This morning's read from features/health/readiness — HRV and resting
     * heart rate against the person's OWN baseline, never a population
     * band. 'back-off' costs accessory volume; the main work never moves,
     * because the session someone actually skips is the one that got
     * cancelled for them.
     */
    readiness?: 'ready' | 'caution' | 'back-off';
  },
): ProgrammeSession | null {
  // Under fifteen minutes there is no session to condense, only a warm-up
  // and a rush. The non-programme path already says so; this one used to
  // hand back three lifts at two sets labelled "~14 minutes".
  if (ctx.availableMin != null && ctx.availableMin < MIN_SESSION_MIN) return null;
  const tight = ctx.availableMin != null && ctx.availableMin < session.estimatedMin;
  const shortNight = ctx.sleptHours != null && ctx.sleptHours < 6;
  const unrecovered = ctx.readiness === 'back-off';
  if (!tight && !shortNight && !unrecovered) return session;

  let exercises = session.exercises.map((e) => ({ ...e }));
  if (shortNight || unrecovered) {
    exercises = exercises.filter((e) => !e.accessory).concat(exercises.filter((e) => e.accessory).slice(0, 1));
  }
  if (ctx.availableMin != null) exercises = fitToTime(exercises, ctx.availableMin, ctx.age);

  const reason =
    tight && (shortNight || unrecovered)
      ? 'Short recovery and a tight window — keeping the stimulus, cutting accessory volume.'
      : unrecovered && !shortNight
        ? 'Your own recovery numbers are down this morning — main work stays, accessories rest today.'
        : shortNight
          ? 'Short night — main work stays, accessories rest today.'
          : `Only ${ctx.availableMin} minutes — condensed, main work kept.`;
  return {
    ...session,
    exercises,
    // What is left actually takes this long. Clamping it to the window
    // told a person with twenty minutes that a twenty-three-minute session
    // was twenty.
    estimatedMin: estimateSessionMin(exercises, ctx.age),
    note: reason,
  };
}

/** Which week of the block a date falls in (1–4; null once the block ends). */
export function weekOf(programme: TrainingProgramme, nowIso = new Date().toISOString()): number | null {
  const days = Math.floor((Date.parse(nowIso) - Date.parse(programme.createdAt)) / 86400e3);
  const week = Math.floor(days / 7) + 1;
  return week >= 1 && week <= 4 ? week : null;
}

export { estimate1Rm };

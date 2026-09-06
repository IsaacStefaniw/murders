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
  rulesOutComplexLifts,
} from './constraints';

export type TrainingGoal = 'strength' | 'hypertrophy' | 'fatloss' | 'general';
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
    return { name, sets, reps: scheme.reps, loadKg: round2p5(base * safePct), restSec };
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
}

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
  if (equipment === 'gym' || equipment === 'home') {
    const barbell = equipment === 'gym';
    const overhead: Slot = barbell
      ? complexLifts
        ? { name: 'Overhead press', lift: 'ohp', primary: false }
        : { name: 'Dumbbell shoulder press', lift: null, primary: false }
      : { name: 'Pike push-ups', lift: null, primary: false };
    const hinge: Slot = barbell
      ? complexLifts
        ? { name: 'Deadlift', lift: 'deadlift', primary: false }
        : { name: 'Romanian deadlift — hinge practice', lift: null, primary: false }
      : { name: 'Hip hinges (loaded)', lift: null, primary: false };
    return {
      upper: [
        { name: barbell ? 'Bench press' : 'Push-ups (loaded)', lift: barbell ? 'bench' : null, primary: true },
        overhead,
        { name: barbell ? 'Barbell row' : 'Backpack rows', lift: null, primary: false },
      ],
      lower: [
        { name: barbell ? 'Squat' : 'Goblet squats', lift: barbell ? 'squat' : null, primary: true },
        hinge,
      ],
      full: [
        { name: barbell ? 'Squat' : 'Goblet squats', lift: barbell ? 'squat' : null, primary: true },
        { name: barbell ? 'Bench press' : 'Push-ups (loaded)', lift: barbell ? 'bench' : null, primary: true },
        { name: barbell ? 'Barbell row' : 'Backpack rows', lift: null, primary: false },
      ],
    };
  }
  const press = equipment === 'dumbbells' ? 'Dumbbell bench press' : 'Push-ups';
  const row = equipment === 'dumbbells' ? 'Dumbbell rows' : 'Inverted rows / doorframe rows';
  const squat = equipment === 'dumbbells' ? 'Goblet squats' : 'Tempo air squats';
  const hinge = equipment === 'dumbbells' ? 'Dumbbell Romanian deadlift' : 'Single-leg hip hinges';
  return {
    upper: [
      { name: press, lift: null, primary: true },
      { name: row, lift: null, primary: false },
    ],
    lower: [
      { name: squat, lift: null, primary: true },
      { name: hinge, lift: null, primary: false },
    ],
    full: [
      { name: squat, lift: null, primary: true },
      { name: press, lift: null, primary: true },
      { name: row, lift: null, primary: false },
    ],
  };
}

function estimateMin(exercises: PrescribedExercise[], age?: number): number {
  const warmup = (age ?? 0) >= 45 ? 12 : 8;
  const workSec = exercises.reduce((sum, e) => sum + e.sets * (45 + e.restSec), 0);
  return Math.round(workSec / 60) + warmup;
}

function fitToTime(
  exercises: PrescribedExercise[],
  targetMin: number,
  age?: number,
): PrescribedExercise[] {
  let out = exercises.map((e) => ({ ...e }));
  while (estimateMin(out, age) > targetMin) {
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
    'Established block — full prescribed volume, a peak week, and a heavy top set on your focus lift.',
  advanced:
    'Advanced block — higher intensity, an extra set on the main work, and week 3 deliberately overreaches. The deload after it is not optional.',
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

/** Build the four-week block from who this person actually is. */
export function buildProgramme(
  inputs: TrainingInputs,
  baselines: TrainingProgramme['baselines'] = {},
): TrainingProgramme {
  const days = Math.min(Math.max(inputs.daysAvailable, 2), 5);
  const level = levelOf(inputs);
  const tuning = tuningFor(level, inputs.pushHarder);
  // A constraint rules the technical lifts out for the same reason
  // foundation level does, and either alone is enough.
  const allowComplex = tuning.complexLifts && !rulesOutComplexLifts(inputs.constraints);
  const ceiling = intensityCeiling(inputs.constraints);
  // Any stated constraint rules out near-maximal singles. Not a scaled-down
  // version of one — none at all.
  const maximalAllowed = (inputs.constraints?.length ?? 0) === 0;
  const menu = mains(inputs.equipment, allowComplex);
  const notes: string[] = [];

  notes.push(LEVEL_NOTE[level]);
  // Say the bump out loud. A block that silently got harder is a block the
  // person blames themselves for struggling with.
  if (inputs.pushHarder) {
    notes.push(
      'You asked for more: an extra set on the main work, a little more load, one more accessory. Structure is unchanged — say the word and it goes straight back.',
    );
  }
  const constraintLine = constraintNote(inputs.constraints);
  if (constraintLine) notes.push(constraintLine);
  if (!maximalAllowed && LEVEL_TUNING[level].topSingle && inputs.focusLift) {
    notes.push(
      'No heavy single this block. Near-maximal work does not belong beside what you told us you are managing, and a lighter version of it would not be the same movement.',
    );
  }

  // Split from real availability, not aspiration.
  const split: ('upper' | 'lower' | 'full')[] =
    days <= 3 ? Array(days).fill('full') : ['upper', 'lower', 'upper', 'lower', 'full'].slice(0, days);
  notes.push(
    days <= 3
      ? `${days} full-body sessions — frequency beats fancy splits at this availability.`
      : 'Upper/lower split — each lift trained twice weekly, recovery respected.',
  );
  if (inputs.focusLift && baselines[inputs.focusLift]) {
    notes.push(
      `Focus: ${inputs.focusLift} — it opens every upper session, and week 3 adds a heavy top set.`,
    );
  }
  if ((inputs.age ?? 0) >= 45) notes.push('45+: longer warm-ups are built into every estimate.');
  if (inputs.goal === 'fatloss') notes.push('Fat loss: a short conditioning finisher ends each session; the diet does the rest.');

  const weeks: ProgrammeWeek[] = PHASES.map((phase, i) => {
    const week = i + 1;
    const sessions: ProgrammeSession[] = split.map((kind, dayIdx) => {
      const slots = applyConstraints([...menu[kind]], inputs.constraints);
      // Focus lift leads its sessions.
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
          s.primary && si === 0,
          si === 0 ? 120 : 90,
          tuning,
          ceiling,
        ),
      );
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
        tuning.topSingle &&
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
            loadKg: round2p5(baselines[inputs.focusLift]! * Math.min(0.9, ceiling)),
            restSec: 180,
          });
        }
      }
      const accessoryBudget = Math.max(
        1,
        (inputs.goal === 'hypertrophy' ? 3 : 2) + tuning.accessoryDelta,
      );
      exercises = exercises.concat(
        ACCESSORIES[inputs.equipment].slice(0, phase === 'deload' ? 1 : accessoryBudget).map((e) => ({ ...e })),
      );
      if (inputs.goal === 'fatloss' && phase !== 'deload') {
        exercises.push({ name: 'Finisher: intervals', sets: 5, reps: '30s hard / 60s easy', restSec: 0, accessory: true });
      }
      exercises = fitToTime(exercises, inputs.sessionMin, inputs.age);
      return {
        title:
          kind === 'full' ? `Full body ${String.fromCharCode(65 + dayIdx)}` : kind === 'upper' ? `Upper ${dayIdx < 2 ? 'A' : 'B'}` : `Lower ${dayIdx < 2 ? 'A' : 'B'}`,
        exercises,
        estimatedMin: Math.min(estimateMin(exercises, inputs.age), inputs.sessionMin),
        note: sessionNote(phase, week, dayIdx, tuning),
      };
    });
    return {
      week,
      phase,
      focus:
        phase === 'deload'
          ? 'Recover, then retest the main lifts'
          : week === 3
            ? tuning.overreach
              ? 'Overreach week — deliberately more than you can sustain, and next week pays it back'
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
): ProgrammeSession {
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
    estimatedMin: Math.min(estimateMin(exercises, ctx.age), ctx.availableMin ?? session.estimatedMin),
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

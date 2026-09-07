/**
 * "Can you change what you want to train?"
 *
 * The intake asks it plainly now — what do you want from training, and
 * where first — and the block honours the answer: a muscle block puts its
 * extra work where the person said, a leaner block keeps the finisher and
 * the walk, a fitter block turns one lifting day into conditioning, and
 * keeping what you have runs the holding dose. The hub re-asks the two
 * questions and says in one sentence what the rebuilt block changed.
 */

import { PATHS } from '@/features/paths/definitions';
import { intensityCeiling } from '@/features/training/constraints';
import {
  buildProgramme,
  estimateSessionMin,
  type TrainingInputs,
  type TrainingProgramme,
} from '@/features/training/programme';
import {
  answersForWant,
  describeChange,
  focusOptionsFor,
  GOAL_FOR_WANT,
  WANT_OPTIONS,
  wantOf,
} from '@/features/training/want';
import { deriveTrainingInputs } from '@/state/store';
import type { Goal, LifeProfile } from '@/types/domain';

const BASELINES = { bench: 100, squat: 140, deadlift: 180, ohp: 60 };

const base: TrainingInputs = {
  goal: 'general',
  experience: 'consistent',
  level: 'established',
  daysAvailable: 4,
  sessionMin: 60,
  equipment: 'gym',
  age: 30,
};

const mains = (p: TrainingProgramme, week: number, title: string) =>
  p.weeks[week - 1].sessions.find((s) => s.title === title)!.exercises.filter((e) => !e.accessory);
const accessories = (p: TrainingProgramme, week: number, title: string) =>
  p.weeks[week - 1].sessions.find((s) => s.title === title)!.exercises.filter((e) => e.accessory);
const setsOf = (xs: { sets: number }[]) => xs.reduce((n, e) => n + e.sets, 0);

describe('a muscle block puts the extra work where the person asked', () => {
  const plain = buildProgramme({ ...base, goal: 'hypertrophy' }, BASELINES);
  const upper = buildProgramme({ ...base, goal: 'hypertrophy', focusArea: 'upper' }, BASELINES);
  const lower = buildProgramme({ ...base, goal: 'hypertrophy', focusArea: 'lower' }, BASELINES);
  const whole = buildProgramme({ ...base, goal: 'hypertrophy', focusArea: 'whole' }, BASELINES);

  it('adds a set to every main lift of the chosen area, and none elsewhere', () => {
    expect(setsOf(mains(upper, 1, 'Upper A'))).toBe(setsOf(mains(plain, 1, 'Upper A')) + mains(plain, 1, 'Upper A').length);
    expect(setsOf(mains(upper, 1, 'Lower A'))).toBe(setsOf(mains(plain, 1, 'Lower A')));
    expect(setsOf(mains(lower, 1, 'Lower A'))).toBe(setsOf(mains(plain, 1, 'Lower A')) + mains(plain, 1, 'Lower A').length);
    expect(setsOf(mains(lower, 1, 'Upper A'))).toBe(setsOf(mains(plain, 1, 'Upper A')));
    expect(setsOf(mains(whole, 1, 'Upper A'))).toBeGreaterThan(setsOf(mains(plain, 1, 'Upper A')));
    expect(setsOf(mains(whole, 1, 'Lower A'))).toBeGreaterThan(setsOf(mains(plain, 1, 'Lower A')));
  });

  it('adds an accessory for the area, listed first, and leaves the other area alone', () => {
    expect(accessories(upper, 1, 'Upper A').length).toBe(accessories(plain, 1, 'Upper A').length + 1);
    expect(accessories(upper, 1, 'Upper A')[0].name).toBe('Incline dumbbell press');
    expect(accessories(upper, 1, 'Lower A').map((e) => e.name)).toEqual(accessories(plain, 1, 'Lower A').map((e) => e.name));
    expect(accessories(lower, 1, 'Lower A')[0].name).toBe('Leg press');
  });

  it('keeps the deload easy: no extra set there', () => {
    expect(setsOf(mains(upper, 4, 'Upper A'))).toBe(setsOf(mains(plain, 4, 'Upper A')));
  });

  it('does not add a loaded accessory beside a sore joint', () => {
    const sore = buildProgramme({ ...base, goal: 'hypertrophy', focusArea: 'lower', constraints: ['joints'] }, BASELINES);
    const names = sore.weeks.flatMap((w) => w.sessions.flatMap((s) => s.exercises.map((e) => e.name)));
    for (const loaded of ['Leg press', 'Dumbbell lunges', 'Hip thrusts', 'Front squat', 'Dips']) {
      expect(names).not.toContain(loaded);
    }
  });

  it('never programmes the same movement twice in a session', () => {
    for (const p of [plain, upper, lower, whole]) {
      for (const w of p.weeks) {
        for (const s of w.sessions) {
          const names = s.exercises.map((e) => e.name);
          expect(new Set(names).size).toBe(names.length);
        }
      }
    }
  });

  it('says where the extra work went', () => {
    expect(upper.notes.join(' ')).toMatch(/extra set on the upper-body lifts/);
    expect(whole.notes.join(' ')).toMatch(/every session/);
  });
});

describe('a leaner block keeps the finisher and names the walk', () => {
  const p = buildProgramme({ ...base, goal: 'fatloss' }, BASELINES);
  it('ends every session but the deload with the finisher', () => {
    for (const w of p.weeks) {
      for (const s of w.sessions) {
        expect(s.exercises.some((e) => e.name.startsWith('Finisher'))).toBe(w.phase !== 'deload');
      }
    }
    expect(p.notes.join(' ')).toMatch(/walk in your week/);
  });
});

describe('a fitter block turns one lifting day into conditioning', () => {
  const p = buildProgramme({ ...base, goal: 'fitter', distance: '5k' }, BASELINES);

  it('keeps the session count and gives one session to conditioning', () => {
    for (const w of p.weeks) {
      expect(w.sessions).toHaveLength(4);
      expect(w.sessions.filter((s) => s.title === 'Conditioning')).toHaveLength(1);
      expect(w.sessions.filter((s) => s.title.startsWith('Full body'))).toHaveLength(3);
    }
  });

  it('builds the session from easy cardio around hard intervals, with a round more in the peak week', () => {
    const names = (week: number) => p.weeks[week - 1].sessions[3].exercises.map((e) => e.name);
    expect(names(1)).toEqual(['Cardio: easy pace to warm up', 'Cardio: hard intervals', 'Cardio: easy pace to cool down']);
    const intervals = (week: number) => p.weeks[week - 1].sessions[3].exercises.find((e) => e.name === 'Cardio: hard intervals')!;
    expect(intervals(1).sets).toBe(4);
    expect(intervals(3).sets).toBe(5);
    expect(intervals(1).reps).toBe('3 min hard / 3 min easy');
    expect(p.weeks[2].sessions[3].note).toMatch(/two practices/);
  });

  it('is easy pace only in the deload', () => {
    expect(p.weeks[3].sessions[3].exercises.map((e) => e.name)).toEqual(['Cardio: easy pace, talking the whole way']);
    expect(p.weeks[3].sessions[3].note).toMatch(/easy pace only/i);
  });

  it('drops the hard intervals beside a heart condition, a pregnancy or an injury, and says why', () => {
    for (const constraint of ['heart', 'pregnancy', 'recovering'] as const) {
      const c = buildProgramme({ ...base, goal: 'fitter', distance: '10k', constraints: [constraint] }, BASELINES);
      for (const w of c.weeks) {
        const s = w.sessions[3];
        expect(s.exercises.some((e) => /hard intervals/.test(e.name))).toBe(false);
        expect(s.note).toMatch(/do not belong beside what you told us/);
      }
    }
    // A sore joint does not rule the intervals out: it is the lifting the joint swaps change.
    const joints = buildProgramme({ ...base, goal: 'fitter', constraints: ['joints'] }, BASELINES);
    expect(joints.weeks[0].sessions[3].exercises.some((e) => /hard intervals/.test(e.name))).toBe(true);
  });

  it('fits the window at every distance, at thirty minutes and sixty, at 25 and 60 years old', () => {
    for (const distance of ['5k', '10k', 'sport'] as const) {
      for (const sessionMin of [30, 60]) {
        for (const age of [25, 60]) {
          const c = buildProgramme({ ...base, goal: 'fitter', distance, sessionMin, age }, BASELINES);
          for (const w of c.weeks) {
            for (const s of w.sessions) {
              expect([distance, sessionMin, age, s.title, s.estimatedMin]).toEqual([
                distance,
                sessionMin,
                age,
                s.title,
                estimateSessionMin(s.exercises, age),
              ]);
              if (s.estimatedMin > sessionMin) throw new Error(`${distance}/${sessionMin}/${age} ${s.title}: ${s.estimatedMin} min`);
            }
          }
        }
      }
    }
  });

  it('keeps at least one lifting day at two days a week, and a runner’s lifting never chases a peak', () => {
    const two = buildProgramme({ ...base, goal: 'fitter', daysAvailable: 2 }, BASELINES);
    expect(two.weeks[0].sessions.map((s) => s.title)).toEqual(['Full body A', 'Conditioning']);
    const lifts = p.weeks.flatMap((w) => w.sessions.flatMap((s) => s.exercises));
    expect(lifts.some((e) => /heavy top single/.test(e.name))).toBe(false);
    for (const e of lifts) {
      if (e.loadKg != null) expect(e.loadKg).toBeLessThanOrEqual(BASELINES.squat * intensityCeiling(undefined));
    }
  });
});

describe('keeping what you have runs the holding dose', () => {
  const p = buildProgramme({ ...base, goal: 'maintain', focusLift: 'squat' }, BASELINES);

  it('builds no more than three sessions, whatever is free', () => {
    expect(p.weeks[0].sessions).toHaveLength(3);
    expect(buildProgramme({ ...base, goal: 'maintain', daysAvailable: 5 }, BASELINES).weeks[0].sessions).toHaveLength(3);
    expect(buildProgramme({ ...base, goal: 'maintain', daysAvailable: 2 }, BASELINES).weeks[0].sessions).toHaveLength(2);
  });

  it('runs the same dose every week with no peak and no heavy single, even at a level that has earned one', () => {
    const squat = (week: number) => mains(p, week, 'Full body A')[0];
    expect(squat(1).sets).toBe(squat(2).sets);
    expect(squat(2).sets).toBe(squat(3).sets);
    expect(squat(1).loadKg).toBe(squat(3).loadKg);
    expect(p.weeks[2].focus).toMatch(/Hold the numbers/);
    const all = p.weeks.flatMap((w) => w.sessions.flatMap((s) => s.exercises));
    expect(all.some((e) => e.reps === '1' || /top single/.test(e.name))).toBe(false);
    // The notes may say there is no top set; they must not promise one.
    expect(p.notes.join(' ')).not.toMatch(/adds a heavy top set|and a heavy top set on/);
    expect(p.notes.join(' ')).toMatch(/held rather than pushed/);
    expect(p.notes.join(' ')).toMatch(/Keeping what you have/);
  });
});

describe('the intake answer decides the block, ahead of the goal title', () => {
  const profile = {
    trainingDaysPerWeek: 4,
    trainingDurationMin: 60,
    trainingPreference: 'gym',
    age: 38,
  } as LifeProfile;
  const goal = (title: string): Goal[] => [
    { id: 'g', title, area: 'health', domain: 'fitness', status: 'active', createdAt: '', routineIds: [] },
  ];

  it('maps each answer to its block', () => {
    for (const [want, expected] of Object.entries(GOAL_FOR_WANT)) {
      expect(deriveTrainingInputs(profile, { want }, goal('Lose 8kg'), 'developing').goal).toBe(expected);
    }
  });

  it('falls back to the title only when the question was not answered', () => {
    expect(deriveTrainingInputs(profile, {}, goal('Lose 8kg'), 'developing').goal).toBe('fatloss');
    expect(deriveTrainingInputs(profile, { want: 'stronger' }, goal('Lose 8kg'), 'developing').goal).toBe('strength');
  });

  it('reads the lift, the area or the distance from "where first?"', () => {
    const lift = deriveTrainingInputs(profile, { want: 'stronger', focus: 'ohp' }, goal('Bench 120kg'), 'developing');
    expect(lift.focusLift).toBe('ohp');
    expect(lift.focusArea).toBeUndefined();
    const area = deriveTrainingInputs(profile, { want: 'muscle', focus: 'upper' }, goal('Bench 120kg'), 'developing');
    expect(area.focusArea).toBe('upper');
    // An area is not a lift: the question engine's own answer, or the title, still decides the lift.
    expect(area.focusLift).toBe('bench');
    expect(deriveTrainingInputs(profile, { want: 'muscle', focus: 'upper', focusLift: 'none' }, goal('Bench 120kg'), 'developing').focusLift).toBeUndefined();
    const run = deriveTrainingInputs(profile, { want: 'fitter', focus: '10k' }, [], 'developing');
    expect(run.distance).toBe('10k');
    expect(buildProgramme(run).notes.join(' ')).toMatch(/10 km and beyond/);
  });
});

describe('the hub’s change control', () => {
  it('offers the five wants and only the follow-ups that fit each', () => {
    expect(WANT_OPTIONS.map((o) => o.value)).toEqual(['stronger', 'muscle', 'leaner', 'fitter', 'keep']);
    expect(focusOptionsFor('stronger').map((o) => o.value)).toEqual(['bench', 'squat', 'deadlift', 'ohp']);
    expect(focusOptionsFor('muscle').map((o) => o.value)).toEqual(['upper', 'lower', 'whole']);
    expect(focusOptionsFor('fitter').map((o) => o.value)).toEqual(['5k', '10k', 'sport']);
    expect(focusOptionsFor('keep')).toEqual([]);
    // Every follow-up is a real option on the intake, with a label.
    for (const want of WANT_OPTIONS) for (const o of focusOptionsFor(want.value)) expect(o.label.length).toBeGreaterThan(0);
  });

  it('writes the lift key too, so the question engine does not ask the lift again', () => {
    expect(answersForWant('stronger', 'squat')).toEqual({ want: 'stronger', focus: 'squat', focusLift: 'squat' });
    expect(answersForWant('muscle', 'lower')).toEqual({ want: 'muscle', focus: 'lower', focusLift: 'none' });
    // A follow-up that does not fit the want is replaced by the first that does.
    expect(answersForWant('fitter', 'bench').focus).toBe('5k');
    expect(answersForWant('keep').focus).toBe('whole');
  });

  it('reads the want back from a block', () => {
    for (const want of WANT_OPTIONS) expect(wantOf(GOAL_FOR_WANT[want.value])).toBe(want.value);
    expect(wantOf('general')).toBeNull();
  });

  it('says what changed in one sentence, from the block itself', () => {
    const before = buildProgramme({ ...base, goal: 'strength', focusLift: 'bench' }, BASELINES);
    const after = buildProgramme({ ...base, goal: 'fitter', distance: 'sport' }, BASELINES);
    const line = describeChange(before, after);
    expect(line).toBe('Was getting stronger; now getting fitter: 4 sessions a week, 3 lifting and one conditioning for your sport.');
    expect(line.split(/[.!?]\s/).length).toBe(1);
    // The same want again is not "was … now": it just says what the block is.
    expect(describeChange(after, after)).toMatch(/^Now getting fitter/);
    // A top set is claimed only when the block has one.
    const strong = describeChange(null, before);
    expect(strong).toMatch(/heavy top set in week 3/);
    const held = describeChange(null, buildProgramme({ ...base, goal: 'strength', focusLift: 'bench', constraints: ['heart'] }, BASELINES));
    expect(held).not.toMatch(/heavy top set/);
  });
});

describe('the training path shapes the week around the answer', () => {
  const profile = {
    trainingDaysPerWeek: 5,
    trainingDurationMin: 60,
    trainingPreference: 'gym',
    workDays: [1, 2, 3, 4, 5],
    capacity: 'normal',
    age: 38,
  } as unknown as LifeProfile;
  const build = (answers: Record<string, string>) => PATHS.training.build({ experience: 'consistent', frequency: '3-4', ...answers }, profile);
  const protocols = (answers: Record<string, string>) => build(answers).routines.map((r) => r.protocolId);

  it('adds the walk for leaner, the easy session for fitter, and nothing extra otherwise', () => {
    expect(protocols({ want: 'leaner', focus: 'whole' })).toContain('daily-walk');
    expect(protocols({ want: 'stronger', focus: 'squat' })).not.toContain('daily-walk');
    expect(protocols({ want: 'fitter', focus: '5k', experience: 'new' })).toContain('zone2');
    expect(protocols({ want: 'fitter', focus: '5k' }).filter((p) => p === 'zone2')).toHaveLength(1);
  });

  it('keeps the walk light on a minimal week', () => {
    const minimal = PATHS.training.build({ want: 'leaner', focus: 'whole', experience: 'consistent' }, { ...profile, capacity: 'minimal' });
    expect(minimal.routines.find((r) => r.protocolId === 'daily-walk')!.days).toEqual([1, 3, 5]);
  });

  it('caps the calendar at three sessions for keeping what you have', () => {
    const workout = build({ want: 'keep', focus: 'whole' }).routines.find((r) => r.sessionType === 'workout')!;
    expect(workout.days).toEqual([1, 3, 5]);
    expect(build({ want: 'stronger', focus: 'squat' }).routines.find((r) => r.sessionType === 'workout')!.days.length).toBe(5);
  });

  it('adds one milestone per want, never the same one twice', () => {
    for (const want of WANT_OPTIONS) {
      const ms = build({ want: want.value, focus: focusOptionsFor(want.value)[0]?.value ?? 'whole' }).goal.milestones!.map((m) => m.title);
      expect(new Set(ms).size).toBe(ms.length);
    }
    expect(build({ want: 'stronger', focus: 'ohp' }).goal.milestones!.map((m) => m.title)).toContain('A heavier overhead press than you started with');
  });

  it('opens the hub insights with the want, in the person’s words', () => {
    expect(PATHS.training.insights({ want: 'fitter', focus: '10k' }, profile)[0]).toMatch(/^Fitter, for 10 km and beyond/);
    expect(PATHS.training.insights({ want: 'muscle', focus: 'lower' }, profile)[0]).toMatch(/lower body first/);
    expect(PATHS.training.insights({ want: 'keep' }, profile)[0]).toMatch(/^Keeping what you have/);
  });
});

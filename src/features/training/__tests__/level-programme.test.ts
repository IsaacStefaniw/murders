import { trainingEvidence, trainingStandard } from '@/features/training/level';
import { buildProgramme, type TrainingInputs } from '@/features/training/programme';
import type { PathLevel } from '@/features/paths/level';
import type { MetricObservation } from '@/features/model/metrics';
import type { WorkoutLog } from '@/types/domain';

const base: TrainingInputs = {
  goal: 'strength',
  experience: 'consistent',
  daysAvailable: 4,
  sessionMin: 60,
  equipment: 'gym',
  focusLift: 'bench',
};

const BASELINES: Record<string, number> = {
  'Bench press': 100,
  Squat: 140,
  Deadlift: 180,
  'Overhead press': 60,
};

const at = (level: PathLevel) => buildProgramme({ ...base, level }, { bench: 100, squat: 140, deadlift: 180, ohp: 60 });

const names = (level: PathLevel) =>
  at(level)
    .weeks.flatMap((w) => w.sessions.flatMap((s) => s.exercises.map((e) => e.name)))
    .join(' | ');

const mainSetsWeek1 = (level: PathLevel) => at(level).weeks[0].sessions[0].exercises[0].sets;
const mainLoadWeek1 = (level: PathLevel) => at(level).weeks[0].sessions[0].exercises[0].loadKg;

/**
 * The defect this suite exists for: `experience` was declared on
 * TrainingInputs and never read, so a first-timer and a decade-deep lifter
 * received byte-identical programmes.
 */
describe('the levels are actually different programmes', () => {
  it('does not hand two levels the same block', () => {
    expect(JSON.stringify(at('foundation'))).not.toBe(JSON.stringify(at('advanced')));
  });

  it('adds volume as the level rises', () => {
    expect(mainSetsWeek1('foundation')).toBeLessThan(mainSetsWeek1('established'));
    expect(mainSetsWeek1('advanced')).toBeGreaterThan(mainSetsWeek1('established'));
  });

  it('adds intensity as the level rises', () => {
    expect(mainLoadWeek1('foundation')!).toBeLessThan(mainLoadWeek1('established')!);
    expect(mainLoadWeek1('advanced')!).toBeGreaterThan(mainLoadWeek1('established')!);
  });
});

describe('what foundation is protected from', () => {
  it('programmes the hinge instead of the deadlift, and dumbbells instead of the overhead press', () => {
    const foundation = names('foundation');
    expect(foundation).not.toMatch(/(^|\| )Deadlift/);
    expect(foundation).not.toContain('Overhead press');
    expect(foundation).toContain('Romanian deadlift — hinge practice');
    expect(foundation).toContain('Dumbbell shoulder press');
  });

  it('still squats and benches from day one — the cautious version is the patronising one', () => {
    expect(names('foundation')).toContain('Squat');
    expect(names('foundation')).toContain('Bench press');
  });

  it('never gets a near-maximal single', () => {
    expect(names('foundation')).not.toContain('heavy top single');
    expect(names('established')).toContain('heavy top single');
  });

  it('caps effort where there is no baseline to anchor it', () => {
    const noBaseline = buildProgramme({ ...base, level: 'foundation' }, {});
    const rpes = noBaseline.weeks
      .flatMap((w) => w.sessions.flatMap((s) => s.exercises.map((e) => e.rpe)))
      .filter((r): r is number => r != null);
    expect(rpes.length).toBeGreaterThan(0);
    expect(Math.max(...rpes)).toBeLessThanOrEqual(7);
  });

  it('carries a technical focus, which the higher levels do not', () => {
    const foundationNotes = at('foundation').weeks[0].sessions.map((s) => s.note ?? '');
    expect(foundationNotes.some((n) => n.startsWith('Focus this session:'))).toBe(true);
    const establishedNotes = at('established').weeks[0].sessions.map((s) => s.note ?? '');
    expect(establishedNotes.some((n) => n.startsWith('Focus this session:'))).toBe(false);
  });
});

describe('the deload is the same week for everybody', () => {
  /**
   * An advanced lifter's extra set would undo the only week whose job is
   * to be easy — and after an overreach week that is the week the
   * adaptation actually happens in.
   */
  it('does not carry the advanced set bonus into week 4', () => {
    expect(at('advanced').weeks[3].sessions[0].exercises[0].sets).toBe(
      at('established').weeks[3].sessions[0].exercises[0].sets,
    );
  });

  it('says why the deload matters more after an overreach', () => {
    expect(at('advanced').weeks[3].sessions[0].note).toContain('repaying week 3');
  });
});

describe('the overreach week', () => {
  it('belongs to advanced alone', () => {
    expect(at('advanced').weeks[2].focus).toContain('Overreach');
    expect(at('established').weeks[2].focus).not.toContain('Overreach');
  });

  it('peaks above the advanced baseline rather than merely matching it', () => {
    const prog = at('advanced');
    // Week 3 leads with the top single, so compare the lift itself.
    const bench = (week: number) =>
      prog.weeks[week].sessions[0].exercises.find(
        (e) => e.name === 'Bench press',
      )!.sets;
    expect(bench(2)).toBeGreaterThan(bench(0));
  });
});

describe('loads stay inside a sane band', () => {
  it('never prescribes a warm-up or a maximal attempt as main work', () => {
    for (const level of ['foundation', 'developing', 'established', 'advanced'] as PathLevel[]) {
      for (const goal of ['strength', 'hypertrophy', 'fatloss', 'general'] as const) {
        const prog = buildProgramme({ ...base, goal, level }, { bench: 100, squat: 140, deadlift: 180, ohp: 60 });
        for (const week of prog.weeks) {
          for (const session of week.sessions) {
            for (const ex of session.exercises) {
              if (ex.loadKg == null || ex.name.includes('top single')) continue;
              const baseline = BASELINES[ex.name];
              // Only the four barbell mains compute a load from a baseline;
              // anything else here would mean a load appeared from nowhere.
              expect(baseline).toBeDefined();
              const pct = ex.loadKg / baseline;
              expect(pct).toBeGreaterThanOrEqual(0.5);
              expect(pct).toBeLessThanOrEqual(0.9);
            }
          }
        }
      }
    }
  });
});

describe('a block built before the ladder existed', () => {
  it('still builds, using the level its declared experience implies', () => {
    const legacy = buildProgramme({ ...base, level: undefined, experience: 'new' }, {});
    expect(legacy.notes[0]).toContain('Foundation block');
  });
});

/** The evidence half — what the log has to show before the top rung opens. */
describe('the training standard', () => {
  const obs = (key: string, value: number, at: string): MetricObservation => ({
    id: `${key}-${at}`,
    key,
    value,
    at,
    source: 'derived',
  });

  const improvingLift = (lift: string, from: number, to: number) => [
    obs(`strength.${lift}.e1rm`, from, '2026-01-01T00:00:00.000Z'),
    obs(`strength.${lift}.e1rm`, to, '2026-06-01T00:00:00.000Z'),
  ];

  it('needs three baselined lifts and measured progress on two', () => {
    const met = trainingStandard([
      ...improvingLift('bench', 80, 95),
      ...improvingLift('squat', 100, 120),
      ...improvingLift('deadlift', 140, 165),
    ]);
    expect(met.met).toBe(true);
    expect(met.improved).toEqual(['bench', 'squat', 'deadlift']);
  });

  it('is not met by three lifts that never moved', () => {
    expect(
      trainingStandard([
        ...improvingLift('bench', 80, 80),
        ...improvingLift('squat', 100, 100),
        ...improvingLift('deadlift', 140, 140),
      ]).met,
    ).toBe(false);
  });

  it('is not met by a fortnight of novice gains', () => {
    const fast = [
      obs('strength.bench.e1rm', 60, '2026-01-01T00:00:00.000Z'),
      obs('strength.bench.e1rm', 80, '2026-01-15T00:00:00.000Z'),
      obs('strength.squat.e1rm', 80, '2026-01-01T00:00:00.000Z'),
      obs('strength.squat.e1rm', 110, '2026-01-15T00:00:00.000Z'),
      obs('strength.deadlift.e1rm', 100, '2026-01-01T00:00:00.000Z'),
      obs('strength.deadlift.e1rm', 140, '2026-01-15T00:00:00.000Z'),
    ];
    expect(trainingStandard(fast).met).toBe(false);
  });

  it('treats a 1kg drift as noise rather than progress', () => {
    expect(
      trainingStandard([
        ...improvingLift('bench', 80, 81),
        ...improvingLift('squat', 100, 101),
        ...improvingLift('deadlift', 140, 141),
      ]).met,
    ).toBe(false);
  });
});

describe('counting what happened', () => {
  const log = (date: string, sets: number): WorkoutLog => ({
    id: `w-${date}`,
    date,
    title: 'Upper A',
    sets: Array.from({ length: sets }, (_, i) => ({
      id: `s-${date}-${i}`,
      exercise: 'Bench press',
      index: i + 1,
      reps: 5,
      weightKg: 80,
      at: `${date}T09:00:00.000Z`,
    })),
    createdAt: `${date}T09:00:00.000Z`,
    updatedAt: `${date}T09:00:00.000Z`,
  });

  it('does not count opening the screen and closing it again', () => {
    const ev = trainingEvidence([log('2026-03-02', 0), log('2026-03-03', 4)], []);
    expect(ev.sessions).toBe(1);
  });

  it('counts weeks, so five sessions in one week is one week', () => {
    const ev = trainingEvidence(
      ['2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06'].map((d) => log(d, 3)),
      [],
    );
    expect(ev.sessions).toBe(5);
    expect(ev.weeks).toBe(1);
  });
});

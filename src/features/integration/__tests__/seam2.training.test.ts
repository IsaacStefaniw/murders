/**
 * Seam 2 — a logged set, walked to the level card.
 *
 * The set becomes an estimated max, the max becomes the weighted baseline,
 * the baseline loads the next block, the hub shows the same number, and the
 * level card reads the same log. One number, one path, asserted at every
 * hop — and the hop the whole design rests on: a bad day never lowers it.
 */

import { strengthBaseline } from '@/features/training/baseline';
import { latestMaxes, measuredTrainingLevel } from '@/features/training/level';
import { LIFT_METRIC, makeSet, newLog } from '@/features/training/log';
import { estimate1Rm, type PrescribedExercise } from '@/features/training/programme';
import { assessStrength } from '@/features/training/standards';
import { dateKeyOfIso, todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';

import { onboard } from './harness';

const s = () => useAppStore.getState();
const KEY = LIFT_METRIC.bench;

function logBench(reps: number, weightKg: number, title: string): string {
  const log = newLog(todayKey(), title);
  s().saveWorkoutLog({
    ...log,
    sets: [makeSet('Bench press', 1, reps, weightKg - 10), makeSet('Bench press', 2, reps, weightKg)],
  });
  return log.id;
}

/** Every programmed bench set that carries a load, across the block. */
function benchLoads(): PrescribedExercise[] {
  return s()
    .trainingProgramme!.weeks.flatMap((w) => w.sessions)
    .flatMap((x) => x.exercises)
    .filter((e) => e.name === 'Bench press' && e.loadKg != null);
}

beforeEach(() => {
  onboard({ weight: '86', sexAtBirth: 'male' });
  s().startPath('training', { experience: 'consistent', frequency: '3-4', limiter: 'nothing' });
  s().buildTrainingBlock();
});

describe('a logged set becomes the next block and the level card', () => {
  it('walks one session through every hop', () => {
    expect(s().trainingProgramme!.baselines.bench).toBeUndefined();
    expect(benchLoads()).toHaveLength(0);

    const logId = logBench(5, 100, 'Week 1 · Upper');
    const e1rm = estimate1Rm(100, 5);

    // Metric: one reading per lift per session, the best set, tagged to the
    // log and stamped to the local day it was lifted.
    const readings = s().metrics.filter((m) => m.key === KEY);
    expect(readings).toHaveLength(1);
    expect(readings[0].value).toBe(e1rm);
    expect(readings[0].note).toBe(`workout:${logId}`);
    expect(dateKeyOfIso(readings[0].at)).toBe(todayKey());

    // Baseline: the same number, undiscounted on the day it was set.
    const baseline = strengthBaseline(s().metrics, KEY)!;
    expect(baseline).toMatchObject({ value: e1rm, peak: e1rm, observations: 1, fromRetest: false });

    // The next block loads from it, inside the working band, never above it.
    s().buildTrainingBlock();
    expect(s().trainingProgramme!.baselines.bench).toBe(e1rm);
    const loads = benchLoads();
    expect(loads.length).toBeGreaterThan(0);
    for (const e of loads) {
      expect(e.loadKg!).toBeLessThanOrEqual(e1rm);
      expect(e.loadKg!).toBeGreaterThanOrEqual(e1rm * 0.5);
      expect((e.loadKg! * 10) % 25).toBe(0);
    }

    // The hub's number is the baseline, not the last reading.
    expect(latestMaxes(s().metrics).bench).toBe(baseline.value);

    // The level card reads the same log.
    const level = s().trainingLevelState();
    expect(level.evidence).toMatchObject({ sessions: 1, weeks: 1 });
    expect(level.level).toBe('established');
    expect(level.progress.current).toBe('established');
    expect(level.progress.next).toBe('advanced');
    expect(level.progress.text).toMatch(/more sessions/);
  });

  it('a heavier session raises the baseline, the loads and the number; a lighter one lowers nothing', () => {
    logBench(5, 100, 'Week 1 · Upper');
    s().buildTrainingBlock();
    const first = benchLoads().map((e) => e.loadKg!);

    logBench(5, 110, 'Week 1 · Upper again');
    const heavier = estimate1Rm(110, 5);
    expect(strengthBaseline(s().metrics, KEY)!.value).toBe(heavier);
    s().buildTrainingBlock();
    expect(s().trainingProgramme!.baselines.bench).toBe(heavier);
    const second = benchLoads().map((e) => e.loadKg!);
    expect(second.length).toBe(first.length);
    expect(second.some((kg, i) => kg > first[i])).toBe(true);
    expect(second.every((kg, i) => kg >= first[i])).toBe(true);
    expect(latestMaxes(s().metrics).bench).toBe(heavier);
    expect(s().trainingLevelState().evidence.sessions).toBe(2);

    // An off day: the reading is recorded, the baseline does not move.
    logBench(5, 90, 'Week 2 · Upper, tired');
    expect(s().metrics.filter((m) => m.key === KEY)).toHaveLength(3);
    const read = strengthBaseline(s().metrics, KEY)!;
    expect(read.value).toBe(heavier);
    expect(read.observations).toBe(3);
    s().buildTrainingBlock();
    expect(s().trainingProgramme!.baselines.bench).toBe(heavier);
    expect(benchLoads().map((e) => e.loadKg!)).toEqual(second);
    expect(latestMaxes(s().metrics).bench).toBe(heavier);
    expect(s().trainingLevelState().evidence.sessions).toBe(3);
  });

  it('the hub number places the person on the ladder, and the claim never argues it down', () => {
    logBench(5, 110, 'Week 1 · Upper');
    const maxes = latestMaxes(s().metrics);
    const { band, perLift } = assessStrength(maxes, s().profile!);
    // 128.5 kg over 86 kg bodyweight: past intermediate, short of advanced.
    expect(perLift.bench).toBe('intermediate');
    expect(band).toBe('intermediate');
    expect(measuredTrainingLevel(s().metrics, s().profile)).toBe('developing');

    // A modest claim is lifted by the lifts; a confident one is kept.
    s().updatePathAnswers('training', { experience: 'new' });
    expect(s().trainingLevelState().level).toBe('developing');
    s().updatePathAnswers('training', { experience: 'consistent' });
    expect(s().trainingLevelState().level).toBe('established');
  });

  it('correcting the set corrects every hop, and deleting the session clears them', () => {
    logBench(5, 140, 'Week 1 · Upper');
    s().buildTrainingBlock();
    const saved = s().workoutLogs[0];
    // 140 was a slip of the thumb for 100, on both sets.
    s().updateLoggedSet(saved.id, saved.sets[0].id, { weightKg: 90 });
    s().updateLoggedSet(saved.id, saved.sets[1].id, { weightKg: 100 });
    const corrected = estimate1Rm(100, 5);
    expect(strengthBaseline(s().metrics, KEY)!.value).toBe(corrected);
    s().buildTrainingBlock();
    expect(s().trainingProgramme!.baselines.bench).toBe(corrected);
    expect(benchLoads().every((e) => e.loadKg! <= corrected)).toBe(true);
    expect(latestMaxes(s().metrics).bench).toBe(corrected);

    s().removeWorkoutLog(saved.id);
    expect(strengthBaseline(s().metrics, KEY)).toBeNull();
    s().buildTrainingBlock();
    expect(s().trainingProgramme!.baselines.bench).toBeUndefined();
    expect(benchLoads()).toHaveLength(0);
    expect(latestMaxes(s().metrics).bench).toBeUndefined();
    expect(s().trainingLevelState().evidence.sessions).toBe(0);
  });
});

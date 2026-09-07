/**
 * Seam 6 — backup on one full life, restore on a clean phone.
 *
 * Everything lives only on the phone, so the backup is the only copy. This
 * builds one state that exercises all five seams — a deferred answer, a
 * logged session, a night from Health, four urge logs, a goal with a rung
 * ticked — takes the backup, wipes the store, restores, and asks every
 * question again. The answers have to be identical, not merely present.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { behaviourPattern, dueInterventions } from '@/features/behaviours/patterns';
import { readinessFrom } from '@/features/health/readiness';
import { composeFromText } from '@/features/goals/composer';
import { observe } from '@/features/model/metrics';
import { PATHS } from '@/features/paths/definitions';
import { buildWeekReport } from '@/features/review/weekReport';
import { strengthBaseline } from '@/features/training/baseline';
import { latestMaxes } from '@/features/training/level';
import { LIFT_METRIC, makeSet, newLog } from '@/features/training/log';
import { autoRegulate, weekOf } from '@/features/training/programme';
import { exportBackup, restoreBackup, STORE_KEY } from '@/state/backup';
import { addDays, todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';

import { flush, local, onboard } from './harness';

const s = () => useAppStore.getState();

const FRIDAYS = [local(2026, 8, 14, 21, 15), local(2026, 8, 21, 21, 40), local(2026, 8, 28, 22, 5), local(2026, 9, 4, 21, 50)];
const NOW = local(2026, 9, 8, 9);
const FRIDAY = '2026-09-11';

/** One whole life: every seam, in one store. */
function liveALittle() {
  onboard({ weight: '86', sexAtBirth: 'male', lessOf: ['doomscrolling'] });
  s().startPath('training', { experience: 'consistent', frequency: '3-4', limiter: 'nothing' });
  s().startPath('money', { mode: 'saving', automation: 'partial' });
  s().startPath('nutrition', { aim: 'energy', cooking: 'normal' });

  // Seam 1: deferred answers.
  s().answerDeferredQuestion('age', '55');
  s().answerDeferredQuestion('money', 'debt');
  s().answerDeferredQuestion('foodTrouble', 'evenings');

  // Seam 2: a logged session and the block built from it.
  s().saveWorkoutLog({
    ...newLog(todayKey(), 'Week 1 · Upper'),
    sets: [makeSet('Bench press', 1, 5, 100), makeSet('Bench press', 2, 5, 105)],
  });
  s().buildTrainingBlock();

  // Seam 3: last night, as the Health adapter writes it.
  s().setHealthConnected();
  s().appendHealthObservations([observe('sleep.hours', 5.5, 'healthkit')]);

  // Seam 4: four urge logs.
  const intention = s().behaviourIntentions.find((b) => b.behaviour === 'doomscrolling')!;
  for (const at of FRIDAYS) s().logPastBehaviourEvent(intention.id, at.toISOString(), 'forty minutes');

  // Seam 5: a goal with a number and a reading that reaches a rung.
  const draft = composeFromText('Save $40k for the house deposit', s().profile);
  s().addGoal(draft.goal, draft.routines);
  const ask = draft.goal.checkins!.find((c) => c.source === 'ask')!;
  s().answerCheckin(ask.id, ask.metricKey, 4500);

  // A lived-in day: something done, something moved.
  const today = todayKey();
  const plan = s().ensurePlan(today);
  const first = plan.items.find((i) => !i.fixed && i.status === 'planned');
  if (first) s().setItemStatus(today, first.id, 'completed');
  for (let i = 1; i <= 6; i++) s().ensurePlan(addDays(today, i));
}

/** Every seam's answer, in one object, so before and after can be compared whole. */
function everything() {
  const st = s();
  const programme = st.trainingProgramme!;
  const week = weekOf(programme)!;
  const session = programme.weeks[week - 1].sessions[0];
  const readiness = readinessFrom(st.metrics);
  const intention = st.behaviourIntentions.find((b) => b.behaviour === 'doomscrolling')!;
  const pattern = behaviourPattern(intention, st.behaviourEvents, st.metrics, NOW);
  const goal = st.goals.find((g) => g.title === 'Save $40k for the house deposit')!;
  const today = todayKey();
  return {
    // Seam 1
    age: st.profile!.age,
    trainingAge: programme.inputs.age,
    moneyMode: st.paths.money!.answers.mode,
    moneyInsights: PATHS.money.insights(st.paths.money!.answers, st.profile),
    trouble: st.paths.nutrition!.answers.trouble,
    interviewAnswers: st.interviewAnswers,
    // Seam 2
    baseline: strengthBaseline(st.metrics, LIFT_METRIC.bench),
    blockBaseline: programme.baselines.bench,
    benchLoads: programme.weeks.flatMap((w) => w.sessions).flatMap((x) => x.exercises).filter((e) => e.name === 'Bench press').map((e) => e.loadKg),
    hub: latestMaxes(st.metrics),
    level: st.trainingLevelState(),
    // Seam 3
    readiness,
    note: autoRegulate(session, { availableMin: 60, sleptHours: 5.5, age: programme.inputs.age, readiness: readiness?.band })?.note,
    healthConnectedAt: st.healthConnectedAt,
    // Seam 4
    window: pattern.window?.label,
    intervention: pattern.intervention?.at,
    due: dueInterventions(st.behaviourIntentions, st.behaviourEvents, st.metrics, FRIDAY, NOW).map((d) => d.at),
    plus: st.entitlement.plus,
    // Seam 5
    rungs: goal.milestones!.map((m) => [m.title, m.done, m.doneAt]),
    report: buildWeekReport(today, st.plans, st.goals),
    // The week itself
    plans: st.plans,
    planEvents: st.planEvents,
    routines: st.routines,
    goals: st.goals,
  };
}

beforeEach(async () => {
  useAppStore.getState().resetAll();
  await AsyncStorage.clear();
});

describe('backup on one state, restore on a clean one', () => {
  it('every seam is still true after the restore', async () => {
    liveALittle();
    await flush();
    const before = everything();

    // The seams held before the backup, not just after.
    expect(before.trainingAge).toBe(55);
    expect(before.moneyMode).toBe('debt');
    expect(before.moneyInsights.join(' ')).toMatch(/list every rate/);
    expect(before.trouble).toBe('evenings');
    expect(before.baseline!.value).toBe(122.5);
    expect(before.blockBaseline).toBe(122.5);
    expect(before.benchLoads.every((kg) => kg != null && kg <= 122.5)).toBe(true);
    expect(before.hub.bench).toBe(122.5);
    expect(before.level.evidence.sessions).toBe(1);
    expect(before.readiness!.band).toBe('caution');
    expect(before.note).toBe('Short night — main work stays, accessories rest today.');
    expect(before.window).toBe('21:15–22:15');
    expect(before.intervention).toBe('20:30');
    expect(before.due).toEqual(['20:30']);
    expect(before.rungs[0][1]).toBe(true);
    expect(before.report.milestonesMoved).toEqual([{ goalTitle: 'Save $40k for the house deposit', milestone: 'First $1,000 more: $1,000 set aside' }]);
    expect(Object.values(before.plans).flatMap((p) => p.items).some((i) => i.status === 'completed')).toBe(true);

    const backup = await exportBackup();
    expect(backup).not.toBeNull();

    // A clean phone.
    s().resetAll();
    await flush();
    expect(s().onboarded).toBe(false);
    expect(s().profile).toBeNull();
    expect(s().metrics).toEqual([]);
    expect(s().trainingProgramme).toBeNull();
    expect(s().behaviourEvents).toEqual([]);

    const result = await restoreBackup(backup!);
    expect(result.ok).toBe(true);
    await flush();
    expect(await AsyncStorage.getItem(STORE_KEY)).toBe(backup);
    expect(s().hydrated).toBe(true);
    expect(s().onboarded).toBe(true);

    const after = everything();
    expect(after).toEqual(before);
  });

  it('a damaged backup changes nothing on the phone it was pasted into', async () => {
    liveALittle();
    await flush();
    const before = everything();
    const stored = await AsyncStorage.getItem(STORE_KEY);

    const result = await restoreBackup('{"state":{"goals":"oops"},"version":1}');
    expect(result.ok).toBe(false);
    await flush();
    expect(await AsyncStorage.getItem(STORE_KEY)).toBe(stored);
    expect(everything()).toEqual(before);
  });
});

/**
 * Seam 5 — a goal with a number, walked to the weekly report.
 *
 * The composer reads the target and drafts a ladder of rungs with
 * conditions; a reading arrives by any of the three doors the app has for
 * one (a check-in answer, a logged set, a Health sync); the assessment
 * ticks the rung it satisfies and stamps when; the weekly report lists it
 * under the goal. The report is the last hop and the one people see.
 */

import { composeFromText, describeDoneWhen } from '@/features/goals/composer';
import { nextCheckin } from '@/features/checkins/due';
import { observe } from '@/features/model/metrics';
import { buildWeekReport } from '@/features/review/weekReport';
import { makeSet, newLog } from '@/features/training/log';
import { todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';

import { onboard } from './harness';

const s = () => useAppStore.getState();
const report = () => buildWeekReport(todayKey(), s().plans, s().goals);
const goal = (id: string) => s().goals.find((g) => g.id === id)!;

function addGoalFromText(text: string) {
  const draft = composeFromText(text, s().profile);
  s().addGoal(draft.goal, draft.routines);
  return goal(draft.goal.id);
}

beforeEach(() => onboard({ weight: '90' }));

describe('a target, a ladder, a reading, a tick, the report', () => {
  it('a savings goal answered at the check-in', () => {
    const g = addGoalFromText('Save $40k for the house deposit');
    const rungs = g.milestones!;
    expect(rungs.map((m) => m.title)).toEqual([
      'First tenth: $4,000 set aside',
      'A quarter there: $10,000 set aside',
      'Halfway: $20,000 set aside',
      'Done: $40,000 set aside',
    ]);
    expect(rungs.every((m) => m.doneWhen?.kind === 'metric' && m.doneWhen.op === 'gte')).toBe(true);
    expect(describeDoneWhen(rungs[0].doneWhen)).toMatch(/4,000/);
    const ask = g.checkins!.find((c) => c.source === 'ask')!;
    expect(ask.metricKey).toBe((rungs[0].doneWhen as { metricKey: string }).metricKey);

    // Nothing moved yet.
    expect(report().milestonesMoved).toEqual([]);
    expect(nextCheckin(s().goals, s().metrics, s().dismissedCheckins)!.spec.id).toBe(ask.id);

    // The answer is the reading; the reading ticks the rung; the report says so.
    s().answerCheckin(ask.id, ask.metricKey, 4500);
    const after = goal(g.id).milestones!;
    expect(after[0].done).toBe(true);
    expect(after[0].doneAt).toBeDefined();
    expect(after.slice(1).every((m) => !m.done)).toBe(true);
    expect(report().milestonesMoved).toEqual([{ goalTitle: g.title, milestone: 'First tenth: $4,000 set aside' }]);

    // Assessing again changes nothing, including the stamp.
    const stamp = after[0].doneAt;
    s().assessGoals();
    expect(goal(g.id).milestones![0].doneAt).toBe(stamp);

    // The next reading climbs two rungs at once.
    s().answerCheckin(ask.id, ask.metricKey, 21000);
    expect(goal(g.id).milestones!.filter((m) => m.done).map((m) => m.title)).toEqual([
      'First tenth: $4,000 set aside',
      'A quarter there: $10,000 set aside',
      'Halfway: $20,000 set aside',
    ]);
    expect(report().milestonesMoved).toHaveLength(3);
    expect(report().milestonesMoved.every((m) => m.goalTitle === g.title)).toBe(true);
  });

  it('a strength goal ticked by a logged set', () => {
    const g = addGoalFromText('Bench press 120kg');
    const rung = g.milestones!.find((m) => m.doneWhen?.kind === 'metric')!;
    expect(rung.title).toBe('Bench press at 120 kg (estimated 1RM)');
    expect(rung.doneWhen).toEqual({ kind: 'metric', metricKey: 'strength.bench.e1rm', op: 'gte', value: 120, unit: 'kg' });

    // Short of it: 100 × 5 estimates 116.5.
    s().saveWorkoutLog({ ...newLog(todayKey(), 'Upper'), sets: [makeSet('Bench press', 1, 5, 100)] });
    expect(goal(g.id).milestones!.find((m) => m.id === rung.id)!.done).toBe(false);
    expect(report().milestonesMoved).toEqual([]);

    // Over it: 105 × 5 estimates 122.5.
    s().saveWorkoutLog({ ...newLog(todayKey(), 'Upper again'), sets: [makeSet('Bench press', 1, 5, 105)] });
    expect(goal(g.id).milestones!.find((m) => m.id === rung.id)!.done).toBe(true);
    expect(report().milestonesMoved).toEqual([{ goalTitle: g.title, milestone: rung.title }]);

    // Deleting the session that proved it walks it back, and the report with it.
    const proof = s().workoutLogs.find((l) => l.title === 'Upper again')!;
    s().removeWorkoutLog(proof.id);
    expect(goal(g.id).milestones!.find((m) => m.id === rung.id)!.done).toBe(false);
    expect(report().milestonesMoved).toEqual([]);
  });

  it('a weight goal ticked by an Apple Health reading', () => {
    const g = addGoalFromText('Down to 86 kg');
    const rung = g.milestones!.find((m) => m.doneWhen?.kind === 'metric')!;
    expect(rung.doneWhen).toEqual({ kind: 'metric', metricKey: 'body.weight', op: 'lte', value: 86, unit: 'kg' });

    s().appendHealthObservations([observe('body.weight', 87.2, 'healthkit')]);
    expect(goal(g.id).milestones!.find((m) => m.id === rung.id)!.done).toBe(false);
    s().appendHealthObservations([observe('body.weight', 85.9, 'healthkit')]);
    expect(goal(g.id).milestones!.find((m) => m.id === rung.id)!.done).toBe(true);
    expect(report().milestonesMoved).toEqual([{ goalTitle: g.title, milestone: rung.title }]);

    // The confirm rung is the person's and is never ticked by a number.
    const confirm = goal(g.id).milestones!.find((m) => m.doneWhen?.kind === 'confirm')!;
    expect(confirm.done).toBe(false);
    s().setMilestoneDone(g.id, confirm.id, true);
    expect(report().milestonesMoved.map((m) => m.milestone).sort()).toEqual([confirm.title, rung.title].sort());
  });

  it('a paused goal stops ticking; a reading for a different goal never reaches it', () => {
    const a = addGoalFromText('Save $40k for the house deposit');
    const b = addGoalFromText('Save $10k for the car');
    const askA = a.checkins!.find((c) => c.source === 'ask')!;
    const askB = b.checkins!.find((c) => c.source === 'ask')!;
    expect(askA.metricKey).not.toBe(askB.metricKey);

    s().setGoalStatus(a.id, 'paused');
    s().answerCheckin(askA.id, askA.metricKey, 5000);
    expect(goal(a.id).milestones!.some((m) => m.done)).toBe(false);
    s().answerCheckin(askB.id, askB.metricKey, 5000);
    expect(goal(b.id).milestones!.filter((m) => m.done).map((m) => m.title)).toEqual([
      'First tenth: $1,000 set aside',
      'A quarter there: $2,500 set aside',
      'Halfway: $5,000 set aside',
    ]);
    expect(report().milestonesMoved.every((m) => m.goalTitle === b.title)).toBe(true);
  });
});

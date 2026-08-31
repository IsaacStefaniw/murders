/**
 * Journey tests — the composed app, not the pieces.
 *
 * Every bug in the Build 10 field review was a COMPOSITION bug: two
 * individually correct pieces producing a wrong result together, or a
 * screen that forgot to call a store action. The unit suites all passed
 * throughout, because each piece was fine on its own.
 *
 * These drive the store the way a person drives the app — onboard, start a
 * path, add a goal, finish a session, log something unplanned — and assert
 * on what the week actually looks like afterwards. Each test below maps to
 * a defect that shipped to TestFlight.
 */

import { behaviourPattern, momentNote } from '@/features/behaviours/patterns';
import { composeFromText } from '@/features/goals/composer';
import { nextCheckin } from '@/features/checkins/due';
import { computeWeeklyStats } from '@/features/review/computeWeekly';
import { observe, personalBest } from '@/features/model/metrics';
import { goalTrajectory } from '@/features/model/trajectory';
import {
  allowedDishTitles,
  suggestAllowedWeek,
} from '@/features/modalities/meals/rotation';
import { makeSet, newLog } from '@/features/training/log';
import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { protocolById, toRoutine } from '@/features/knowledge/protocols';
import { PATHS } from '@/features/paths/definitions';
import { routineKey } from '@/features/planner/mergeRoutines';
import { useAppStore } from '@/state/store';
import { addDays, todayKey, toMinutes } from '@/lib/dates';
import type { InterviewAnswers } from '@/features/onboarding/script';

const ANSWERS = {
  name: 'Test',
  priorities: ['health', 'work'],
  vision: 'Fitter and more present',
  household: 'partner_kids',
  kidsCount: '2',
  partnerName: 'Sam',
  capacity: 'stretched',
  age: '38',
  workStyle: 'mixed',
  workDays: [1, 2, 3, 4, 5],
  workHours: '08:00-16:00',
  sleep: '06:30-22:30',
  sleepQuality: 'ok',
  pressure: 'busy',
  energy: 'morning',
  trainingDays: '3',
  trainingSetup: 'gym',
  trainingExperience: 'consistent',
  existingHabits: ['workout'],
  weight: '86',
  foodAim: 'energy',
  foodTrouble: 'evenings',
  mind: 'sometimes',
  moreOf: [],
  lessOf: [],
  money: 'saving',
  moneyAutomation: 'some',
  ambition: 'Get stronger',
} as unknown as InterviewAnswers;

function onboard() {
  useAppStore.getState().resetAll();
  const built = buildLifeOperatingPlan(ANSWERS);
  useAppStore.getState().completeOnboarding({
    profile: built.profile,
    goals: built.goals,
    routines: built.routines,
    behaviourIntentions: built.behaviourIntentions,
  });
}

const activeRoutines = () => useAppStore.getState().routines.filter((r) => r.active);

/** Every weekday a routine with this protocol is scheduled on, across the week. */
function itemsForProtocol(protocolId: string): { date: string; title: string }[] {
  const { plans, routines } = useAppStore.getState();
  const ids = new Set(routines.filter((r) => r.protocolId === protocolId).map((r) => r.id));
  const out: { date: string; title: string }[] = [];
  for (const plan of Object.values(plans)) {
    for (const item of plan.items) {
      if (item.routineId && ids.has(item.routineId)) out.push({ date: plan.date, title: item.title });
    }
  }
  return out;
}

beforeEach(() => {
  useAppStore.getState().resetAll();
});

describe('journey: starting a path after onboarding', () => {
  it('never schedules two workouts on the same day', () => {
    onboard();
    const before = activeRoutines().filter((r) => r.protocolId === 'strength').length;
    expect(before).toBe(1);

    // The exact sequence from the field report: onboard with training, then
    // start the Training path. Both sources build a 'strength' routine on
    // the same weekdays; before the shared merge, both stayed active.
    useAppStore.getState().startPath('training', { experience: 'consistent', limiter: 'time' });

    expect(activeRoutines().filter((r) => r.protocolId === 'strength')).toHaveLength(1);

    // And the plan itself: at most one workout per day, every day of the week.
    const today = todayKey();
    for (let i = 0; i <= 6; i++) {
      const date = addDays(today, i);
      const plan = useAppStore.getState().ensurePlan(date);
      const workouts = plan.items.filter((it) => it.sessionType === 'workout');
      expect(workouts.length).toBeLessThanOrEqual(1);
    }
  });

  it('keeps the newer routine and retires the twin rather than deleting it', () => {
    onboard();
    const original = activeRoutines().find((r) => r.protocolId === 'strength')!;
    useAppStore.getState().startPath('training', { experience: 'consistent' });

    const all = useAppStore.getState().routines.filter((r) => r.protocolId === 'strength');
    expect(all.length).toBeGreaterThan(1); // history preserved
    expect(all.filter((r) => r.active)).toHaveLength(1);
    expect(all.find((r) => r.id === original.id)!.active).toBe(false);
  });
});

describe('journey: adding a goal', () => {
  it('shows the new routine across the whole visible week, not just today', () => {
    onboard();
    const today = todayKey();
    // Materialise the week first — this is what the Today screen does on
    // mount, and it is what used to leave the new goal invisible.
    for (let i = 0; i <= 6; i++) useAppStore.getState().ensurePlan(addDays(today, i));

    const zone2 = protocolById('zone2')!;
    const routine = toRoutine(zone2, useAppStore.getState().profile);
    useAppStore.getState().addGoal(
      {
        id: 'g-test',
        title: 'Build an aerobic base',
        area: 'health',
        domain: 'fitness',
        status: 'active',
        createdAt: new Date().toISOString(),
        routineIds: [routine.id],
      },
      [routine],
    );

    // zone2 runs on two weekdays, so it must appear somewhere in the week
    // regardless of which day today happens to be.
    expect(itemsForProtocol('zone2').length).toBeGreaterThan(0);
  });
});

describe('journey: recording what actually happened', () => {
  it('an unscheduled activity lands on the day as completed', () => {
    onboard();
    const id = useAppStore.getState().logCompletedActivity({
      title: 'Sauna',
      area: 'health',
      durationMin: 20,
      note: 'sauna tonight',
    });

    const plan = useAppStore.getState().ensurePlan(todayKey());
    const item = plan.items.find((i) => i.id === id)!;
    expect(item.status).toBe('completed');
    expect(item.title).toBe('Sauna');
    expect(item.evidence?.source).toBe('manual');
  });

  it('records the completion event so streaks and counts can see it', () => {
    onboard();
    const before = useAppStore.getState().planEvents.length;
    useAppStore.getState().logCompletedActivity({
      title: 'Sauna',
      area: 'health',
      durationMin: 20,
    });
    const events = useAppStore.getState().planEvents;
    expect(events.length).toBe(before + 1);
    expect(events[events.length - 1].kind).toBe('completed');
  });

  it('places the activity in the past, never running past midnight', () => {
    onboard();
    const id = useAppStore.getState().logCompletedActivity({
      title: 'Late sauna',
      area: 'health',
      durationMin: 30,
      endedAt: new Date('2026-09-01T23:50:00').toISOString(),
    });
    const item = useAppStore.getState().ensurePlan(todayKey()).items.find((i) => i.id === id)!;
    expect(item.start < item.end).toBe(true);
    expect(item.end <= '23:59').toBe(true);
  });
});

describe('journey: the caffeine cutoff is a deadline', () => {
  it('is anchored to bedtime and never drifts later than its window', () => {
    onboard();
    const profile = useAppStore.getState().profile!;
    const cutoff = protocolById('caffeine-cutoff')!;
    const routine = toRoutine(cutoff, profile);

    // 22:30 bedtime − 10h = 12:30, matching the rule the app states.
    expect(routine.preferredStart).toBe('12:30');
    // A deadline may be brought earlier but must never be pushed later.
    expect(routine.flexible).toBe(false);
  });

  it('the scheduler leaves it unplaced rather than moving it into the evening', () => {
    onboard();
    const cutoff = protocolById('caffeine-cutoff')!;
    const routine = toRoutine(cutoff, useAppStore.getState().profile);
    useAppStore.setState({ routines: [...useAppStore.getState().routines, routine] });

    const today = todayKey();
    for (let i = 0; i <= 6; i++) {
      const plan = useAppStore.getState().regeneratePlan(addDays(today, i));
      for (const item of plan.items) {
        if (item.routineId !== routine.id) continue;
        // Whatever happens, it never lands in the late afternoon or evening.
        expect(item.start <= '13:00').toBe(true);
      }
    }
  });
});

describe('journey: correcting a mistyped number', () => {
  const savingsGoal = () => {
    const { goal, routines } = composeFromText(
      'Save $40k for the house deposit',
      useAppStore.getState().profile,
    );
    useAppStore.getState().addGoal(goal, routines);
    return useAppStore.getState().goals.find((g) => g.id === goal.id)!;
  };

  it('a corrected reading un-ticks the rungs only the bad number had satisfied', () => {
    onboard();
    const goal = savingsGoal();
    const key = goal.checkins!.find((c) => c.source === 'ask')!.metricKey;

    // The fat-fingered entry: $40,000 typed where $4,000 was meant.
    useAppStore.getState().addMetric(key, 40000);
    let live = useAppStore.getState().goals.find((g) => g.id === goal.id)!;
    expect(live.milestones!.every((m) => m.done)).toBe(true);

    // Correcting it must walk the ladder back, not leave the goal complete.
    const obs = useAppStore.getState().metrics.find((o) => o.key === key)!;
    useAppStore.getState().updateMetric(obs.id, 4000);
    live = useAppStore.getState().goals.find((g) => g.id === goal.id)!;
    expect(live.milestones!.filter((m) => m.done)).toHaveLength(1); // the 10% rung only
  });

  it('deleting the reading entirely walks every evidence rung back', () => {
    onboard();
    const goal = savingsGoal();
    const key = goal.checkins!.find((c) => c.source === 'ask')!.metricKey;
    useAppStore.getState().addMetric(key, 40000);

    const obs = useAppStore.getState().metrics.find((o) => o.key === key)!;
    useAppStore.getState().removeMetric(obs.id);
    const live = useAppStore.getState().goals.find((g) => g.id === goal.id)!;
    expect(live.milestones!.some((m) => m.done)).toBe(false);
  });

  it('never un-ticks a rung the user confirmed themselves', () => {
    onboard();
    // An endurance ladder ends in two confirm rungs — a person's call, not
    // a number's, so no correction may reach them.
    const { goal, routines } = composeFromText('Run a marathon', useAppStore.getState().profile);
    useAppStore.getState().addGoal(goal, routines);
    const confirmRung = goal.milestones!.find((m) => m.doneWhen?.kind === 'confirm')!;
    useAppStore.getState().setMilestoneDone(goal.id, confirmRung.id, true);

    useAppStore.getState().assessGoals();
    const live = useAppStore.getState().goals.find((g) => g.id === goal.id)!;
    expect(live.milestones!.find((m) => m.id === confirmRung.id)!.done).toBe(true);
  });
});

describe('journey: the new pathways', () => {
  it('a hard relationship answer shrinks the plan and names a professional', () => {
    onboard();
    useAppStore.getState().startPath('relationship', {
      temperature: 'hard',
      obstacle: 'conflict',
      window: 'after_bed',
    });

    const goalId = useAppStore.getState().paths.relationship!.goalId;
    const routines = useAppStore.getState().routines.filter((r) => r.goalId === goalId && r.active);

    // Someone telling us things are bad gets the two smallest practices,
    // never a fuller calendar.
    expect(routines).toHaveLength(2);
    expect(routines.every((r) => r.durationMin <= 5)).toBe(true);

    const insights = PATHS.relationship.insights(
      { temperature: 'hard' },
      useAppStore.getState().profile,
    );
    expect(insights.join(' ')).toMatch(/therapist/i);
  });

  it('a no-window answer never schedules a block the user said does not exist', () => {
    onboard();
    useAppStore.getState().startPath('relationship', { temperature: 'good', window: 'none' });
    const goalId = useAppStore.getState().paths.relationship!.goalId;
    const routines = useAppStore.getState().routines.filter((r) => r.goalId === goalId && r.active);
    expect(routines.every((r) => r.durationMin <= 5)).toBe(true);
  });

  it('family sizes the outing to the youngest child', () => {
    onboard();
    useAppStore.getState().startPath('family', { ages: 'under5', blocker: 'logistics' });
    const goalId = useAppStore.getState().paths.family!.goalId;
    const routines = useAppStore.getState().routines.filter((r) => r.goalId === goalId);
    const adventure = routines.find((r) => r.protocolId === 'family-adventure');
    expect(adventure?.durationMin).toBe(90); // not the default 180
  });

  it('every new pathway builds real, schedulable routines', () => {
    for (const id of ['relationship', 'family'] as const) {
      useAppStore.getState().resetAll();
      onboard();
      useAppStore.getState().startPath(id, {});
      const goalId = useAppStore.getState().paths[id]!.goalId;
      const routines = useAppStore.getState().routines.filter((r) => r.goalId === goalId);
      expect(routines.length).toBeGreaterThan(0);
      // Every routine traces back to a graded protocol — no orphan blocks.
      for (const r of routines) {
        expect(r.protocolId).toBeTruthy();
        expect(protocolById(r.protocolId!)).toBeDefined();
      }
    }
  });
});

describe('routine identity', () => {
  it('keys on protocol, then session type, and never on title', () => {
    const base = {
      id: 'r1',
      title: 'Anything',
      area: 'health' as const,
      days: [1 as const],
      durationMin: 30,
      preferredStart: '09:00',
      preferredEnd: '10:00',
      energy: 'any' as const,
      flexible: true,
      protected: false,
      tier: 'should' as const,
      active: true,
    };
    expect(routineKey({ ...base, protocolId: 'strength' })).toBe('protocol:strength');
    expect(routineKey({ ...base, sessionType: 'workout' })).toBe('session:workout');
    expect(routineKey(base)).toBeNull();
    // Two routines, same protocol, different titles — still one identity.
    expect(routineKey({ ...base, title: 'Strength workout', protocolId: 'strength' })).toBe(
      routineKey({ ...base, title: 'Training that sticks', protocolId: 'strength' }),
    );
  });
});

describe('journey: logging a non-conforming moment', () => {
  /** Four evenings of the same thing, logged at the time it happened. */
  function logFourEvenings(behaviour: 'sugar' | 'alcohol'): string {
    useAppStore.getState().addBehaviourIntention(behaviour, 'Snack when it is worth it');
    const intention = useAppStore.getState().behaviourIntentions.at(-1)!;
    const base = new Date();
    for (let i = 1; i <= 4; i++) {
      const when = new Date(base.getTime() - i * 86400e3);
      when.setHours(20, 30 + i * 5, 0, 0);
      useAppStore
        .getState()
        .logPastBehaviourEvent(intention.id, when.toISOString(), 'one piece of Kit Kat');
    }
    return intention.id;
  }

  /**
   * The reason logging takes a time rather than stamping `now`. People open
   * the app after the moment, and the time is the only field the whole
   * pattern engine runs on — stamped with `now`, every event would cluster
   * around when someone remembers to log, not when the habit happens.
   */
  it('stores the moment at the hour it happened, not the hour it was typed', () => {
    onboard();
    const intentionId = logFourEvenings('sugar');
    const own = useAppStore.getState().behaviourEvents.filter((e) => e.intentionId === intentionId);
    expect(own).toHaveLength(4);
    for (const e of own) {
      expect(new Date(e.occurredAt).getHours()).toBe(20);
      expect(e.detail).toBe('one piece of Kit Kat');
    }
  });

  it('turns four logged evenings into a window and a time to act ahead of it', () => {
    onboard();
    const intentionId = logFourEvenings('sugar');
    const { behaviourIntentions, behaviourEvents, metrics } = useAppStore.getState();
    const intention = behaviourIntentions.find((b) => b.id === intentionId)!;
    const pattern = behaviourPattern(intention, behaviourEvents, metrics);

    expect(pattern.readiness).toBe('ready');
    expect(pattern.window).not.toBeNull();
    expect(pattern.intervention).not.toBeNull();
    // Ahead of the window, never inside it.
    expect(toMinutes(pattern.intervention!.at)).toBeLessThan(pattern.window!.startMin);
  });

  /**
   * Both of these have real mechanisms and both should teach them. The
   * line the feature stays on is that it says what the behaviour DOES —
   * graded, timed, and paired with the lever — never that it is bad.
   */
  it('teaches the mechanism for an evening snack and for a late coffee alike', () => {
    onboard();
    const sugarId = logFourEvenings('sugar');
    const state = useAppStore.getState();
    const sugar = state.behaviourIntentions.find((b) => b.id === sugarId)!;
    const evening = new Date();
    evening.setHours(20, 45, 0, 0);

    const snackNote = momentNote(
      { id: 'x', intentionId: sugarId, occurredAt: evening.toISOString() },
      behaviourPattern(sugar, state.behaviourEvents, state.metrics),
      state.profile!.sleepTime,
    );
    // Evening insulin sensitivity is lower than morning: a real, graded,
    // teachable mechanism. This assertion used to be `pattern`, which
    // encoded the mistake of withholding it.
    expect(snackNote.kind).toBe('mechanism');
    if (snackNote.kind !== 'mechanism') throw new Error('unreachable');
    expect(snackNote.text).toMatch(/insulin/i);
    expect(snackNote.counterProtocolId).toBe('post-meal-walk');

    useAppStore.getState().addBehaviourIntention('late_caffeine', 'Last coffee earlier');
    const coffee = useAppStore.getState().behaviourIntentions.at(-1)!;
    const afternoon = new Date();
    afternoon.setHours(16, 30, 0, 0);
    const coffeeNote = momentNote(
      { id: 'y', intentionId: coffee.id, occurredAt: afternoon.toISOString() },
      behaviourPattern(coffee, useAppStore.getState().behaviourEvents, state.metrics),
      state.profile!.sleepTime,
    );
    expect(coffeeNote.kind).toBe('mechanism');
  });

  it('keeps food out of the weekly tally even once it has a pattern', () => {
    onboard();
    logFourEvenings('sugar');
    const { behaviourIntentions, behaviourEvents } = useAppStore.getState();
    const { stats } = computeWeeklyStats({
      weekStart: addDays(todayKey(), -6),
      plans: useAppStore.getState().plans,
      behaviourIntentions,
      behaviourEvents,
      reflections: [],
    });
    expect(stats.behaviourEventCounts.sugar).toBeUndefined();
  });
});

describe('journey: the gym feeds the model', () => {
  const bench = (reps: number, weightKg: number, index: number) =>
    makeSet('Bench press', index, reps, weightKg);

  /**
   * The loop that had never once closed. The programme prescribed loads
   * from `strength.*.e1rm` baselines, and nothing in the app could ever
   * write one — the workout player counted taps and threw them away. A
   * block could be built but never progressed.
   */
  it('a logged session writes the strength baseline the next block reads', () => {
    onboard();
    const before = useAppStore.getState().metrics.filter((m) => m.key === 'strength.bench.e1rm');
    expect(before).toHaveLength(0);

    const log = newLog(todayKey(), 'Week 1 · Upper');
    useAppStore.getState().saveWorkoutLog({
      ...log,
      sets: [bench(5, 90, 1), bench(5, 95, 2), bench(4, 95, 3)],
    });

    const after = useAppStore.getState().metrics.filter((m) => m.key === 'strength.bench.e1rm');
    expect(after).toHaveLength(1);
    expect(after[0].value).toBe(111); // the best set of the session, not each one

    useAppStore.getState().buildTrainingBlock();
    expect(useAppStore.getState().trainingProgramme?.baselines.bench).toBe(111);
  });

  /**
   * Correcting a set must correct the baseline, not leave the original
   * standing beside it as a personal best that never happened. Same defect
   * `updateMetric` was built for, arriving through a different door.
   */
  it('correcting a set corrects the baseline rather than adding a phantom best', () => {
    onboard();
    const log = newLog(todayKey(), 'Week 1 · Upper');
    useAppStore.getState().saveWorkoutLog({ ...log, sets: [bench(5, 140, 1)] });

    const saved = useAppStore.getState().workoutLogs[0];
    useAppStore.getState().updateLoggedSet(saved.id, saved.sets[0].id, { weightKg: 100 });

    const readings = useAppStore.getState().metrics.filter((m) => m.key === 'strength.bench.e1rm');
    expect(readings).toHaveLength(1);
    expect(readings[0].value).toBe(116.5);
    expect(personalBest(useAppStore.getState().metrics, 'strength.bench.e1rm')!.value).toBe(116.5);
  });

  it('deleting a session takes its readings with it', () => {
    onboard();
    const log = newLog(todayKey(), 'Week 1 · Upper');
    useAppStore.getState().saveWorkoutLog({ ...log, sets: [bench(5, 100, 1)] });
    const saved = useAppStore.getState().workoutLogs[0];

    useAppStore.getState().removeWorkoutLog(saved.id);
    expect(useAppStore.getState().workoutLogs).toHaveLength(0);
    expect(useAppStore.getState().metrics.filter((m) => m.key === 'strength.bench.e1rm')).toHaveLength(0);
  });

  it('a session of accessories records the work and claims no strength number', () => {
    onboard();
    const log = newLog(todayKey(), 'Home session');
    useAppStore.getState().saveWorkoutLog({
      ...log,
      sets: [makeSet('Goblet squats', 1, 12, 24), makeSet('Backpack rows', 1, 12, 20)],
    });
    expect(useAppStore.getState().workoutLogs[0].sets).toHaveLength(2);
    expect(
      useAppStore.getState().metrics.filter((m) => m.key.startsWith('strength.')),
    ).toHaveLength(0);
  });
});

describe('journey: knowing whether you will make it', () => {
  /**
   * The sentence the app could not previously say. `assessGoals` ticks a
   * rung once evidence satisfies it and the stall detector notices silence;
   * neither can tell someone their current rate misses the date they set.
   */
  it('a run of readings against a dated goal produces a verdict and a required rate', () => {
    onboard();
    const store = useAppStore.getState();
    const goalId = 'g-weight';
    store.addGoal(
      {
        id: goalId,
        title: 'Down to 86 kg',
        area: 'health',
        status: 'active',
        createdAt: new Date().toISOString(),
        routineIds: [],
        targetDate: addDays(todayKey(), 60),
        milestones: [
          {
            id: 'm1',
            title: '86 kg',
            done: false,
            doneWhen: { kind: 'metric', metricKey: 'body.weight', op: 'lte', value: 86 },
          },
        ],
      },
      [],
    );

    // Ten weeks of readings drifting down slowly — real, but not fast
    // enough for sixty days.
    const observations = Array.from({ length: 11 }, (_, i) => ({
      ...observe('body.weight', 92 - i * 0.2),
      at: new Date(Date.now() - (10 - i) * 7 * 86400e3).toISOString(),
    }));
    useAppStore.setState({ metrics: [...useAppStore.getState().metrics, ...observations] });

    const goal = useAppStore.getState().goals.find((g) => g.id === goalId)!;
    const t = goalTrajectory(goal, useAppStore.getState().metrics)!;
    expect(t.verdict).toBe('behind');
    expect(t.requiredRatePerWeek).toBeLessThan(0);
    expect(t.gapNote).toBeTruthy();
  });

  it('says nothing at all until there are enough readings to mean it', () => {
    onboard();
    useAppStore.getState().addGoal(
      {
        id: 'g-thin',
        title: 'Down to 86 kg',
        area: 'health',
        status: 'active',
        createdAt: new Date().toISOString(),
        routineIds: [],
        milestones: [
          {
            id: 'm1',
            title: '86 kg',
            done: false,
            doneWhen: { kind: 'metric', metricKey: 'body.weight', op: 'lte', value: 86 },
          },
        ],
      },
      [],
    );
    useAppStore.getState().addMetric('body.weight', 91);

    const goal = useAppStore.getState().goals.find((g) => g.id === 'g-thin')!;
    expect(goalTrajectory(goal, useAppStore.getState().metrics)!.verdict).toBe('not-enough-data');
  });
});

describe('journey: changing your mind', () => {
  /**
   * Goals were write-once — composed at creation, then fixed, with only
   * pause and drop available. That is the wrong shape for anything lasting
   * a year: ambitions get renamed as they get clearer, and a milestone
   * ladder drafted by a parser usually needs a human edit.
   */
  it('a goal can be renamed, re-dated and re-laddered after the fact', () => {
    onboard();
    const store = useAppStore.getState();
    store.addGoal(
      {
        id: 'g-edit',
        title: 'Get fitter',
        area: 'health',
        status: 'active',
        createdAt: new Date().toISOString(),
        routineIds: [],
        milestones: [{ id: 'm1', title: 'Show up twice a week', done: false }],
      },
      [],
    );

    useAppStore.getState().updateGoal('g-edit', {
      title: 'Deadlift 140 kg',
      targetDate: '2026-12-01',
    });
    useAppStore.getState().addMilestone('g-edit', 'Deadlift 120 kg');
    const goal = useAppStore.getState().goals.find((g) => g.id === 'g-edit')!;
    expect(goal.title).toBe('Deadlift 140 kg');
    expect(goal.targetDate).toBe('2026-12-01');
    expect(goal.milestones).toHaveLength(2);

    /**
     * A rung the person wrote carries no measurable condition, so only they
     * can tick it. Inventing one from words the app did not parse would tick
     * it off on evidence with nothing to do with what they meant.
     */
    const added = goal.milestones!.find((m) => m.title === 'Deadlift 120 kg')!;
    expect(added.doneWhen).toBeUndefined();

    useAppStore.getState().removeMilestone('g-edit', 'm1');
    expect(useAppStore.getState().goals.find((g) => g.id === 'g-edit')!.milestones).toHaveLength(1);
  });

  /**
   * The screen tells people a routine change takes effect across the whole
   * visible week. Today caches seven days ahead, so regenerating only today
   * would leave a Mon/Wed/Fri change looking unsaved all week.
   */
  it('editing a routine reshapes the whole visible week, not just today', () => {
    onboard();
    const routine = activeRoutines().find((r) => r.days.length > 0 && r.days.length < 7)!;
    const today = todayKey();
    for (let i = 0; i <= 6; i++) useAppStore.getState().ensurePlan(addDays(today, i));

    useAppStore.getState().updateRoutine(routine.id, { days: [0, 1, 2, 3, 4, 5, 6] });

    let daysWithIt = 0;
    for (let i = 0; i <= 6; i++) {
      const plan = useAppStore.getState().plans[addDays(today, i)];
      if (plan?.items.some((it) => it.routineId === routine.id)) daysWithIt += 1;
    }
    expect(daysWithIt).toBeGreaterThan(routine.days.length);
  });

  it('turning a routine off clears it from the week and keeps it recoverable', () => {
    onboard();
    const routine = activeRoutines()[0];
    useAppStore.getState().updateRoutine(routine.id, { active: false });

    const today = todayKey();
    for (let i = 0; i <= 6; i++) {
      const plan = useAppStore.getState().plans[addDays(today, i)];
      expect(plan?.items.some((it) => it.routineId === routine.id)).toBe(false);
    }
    expect(useAppStore.getState().routines.find((r) => r.id === routine.id)).toBeDefined();
  });

  /**
   * The food model existed, was tested, and was imported by nothing — the
   * rotation served titles from a list that knew no ingredients, so it
   * could not honour an allergy it had the data to respect.
   */
  it('a declared allergy reshapes the dinner rotation', () => {
    onboard();
    useAppStore.getState().setFoodPreferences({ allergies: ['fish'] });
    const prefs = useAppStore.getState().foodPreferences;
    const week = suggestAllowedWeek(todayKey(), prefs);
    const allowed = new Set(allowedDishTitles(prefs));
    for (const [day, dish] of Object.entries(week)) {
      if (Number(day) === 4) continue;
      expect(allowed.has(dish)).toBe(true);
    }
  });
});

describe('journey: the measurement loop, end to end', () => {
  /**
   * The circuit that was open. The composer drafts a check-in spec for
   * every measurable goal; nothing in the app ever asked. So no
   * observation, so no evidence, so the milestone never ticked and the
   * projection said "not enough data" however well the person was doing.
   *
   * This drives the whole loop: goal → question → answer → metric →
   * milestone evidence → trajectory.
   */
  it('a drafted check-in becomes a question, an answer, a tick and a projection', () => {
    onboard();
    const store = useAppStore.getState();
    const goalId = 'g-loop';
    store.addGoal(
      {
        id: goalId,
        title: 'Set aside £5,000',
        area: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
        routineIds: [],
        checkins: [
          {
            id: 'ci-loop',
            metricKey: 'goal.g-loop.saved',
            label: 'Amount set aside',
            unit: '$',
            cadenceDays: 7,
            source: 'ask',
            prompt: 'How much is set aside right now?',
          },
        ],
        milestones: [
          {
            id: 'm1',
            title: 'First £1,000',
            done: false,
            doneWhen: { kind: 'metric', metricKey: 'goal.g-loop.saved', op: 'gte', value: 1000 },
          },
        ],
      },
      [],
    );

    // It is asked, because nothing has ever been recorded.
    const first = nextCheckin(
      useAppStore.getState().goals,
      useAppStore.getState().metrics,
      useAppStore.getState().dismissedCheckins,
    )!;
    expect(first.spec.id).toBe('ci-loop');
    expect(first.daysSince).toBeNull();

    // Answering records the reading and re-runs the evidence pass.
    useAppStore.getState().answerCheckin('ci-loop', 'goal.g-loop.saved', 1200);
    const goal = useAppStore.getState().goals.find((g) => g.id === goalId)!;
    expect(goal.milestones![0].done).toBe(true);

    // And it stops asking, because it now has an answer.
    expect(
      nextCheckin(
        useAppStore.getState().goals,
        useAppStore.getState().metrics,
        useAppStore.getState().dismissedCheckins,
      ),
    ).toBeNull();
  });

  it('"not now" is a real answer and holds, and answering later clears it', () => {
    onboard();
    useAppStore.getState().addGoal(
      {
        id: 'g-dismiss',
        title: 'Set aside £5,000',
        area: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
        routineIds: [],
        checkins: [
          {
            id: 'ci-dismiss',
            metricKey: 'goal.g-dismiss.saved',
            label: 'Amount set aside',
            cadenceDays: 7,
            source: 'ask',
          },
        ],
      },
      [],
    );

    useAppStore.getState().dismissCheckin('ci-dismiss');
    expect(
      nextCheckin(
        useAppStore.getState().goals,
        useAppStore.getState().metrics,
        useAppStore.getState().dismissedCheckins,
      ),
    ).toBeNull();

    useAppStore.getState().answerCheckin('ci-dismiss', 'goal.g-dismiss.saved', 500);
    expect(useAppStore.getState().dismissedCheckins['ci-dismiss']).toBeUndefined();
  });
});

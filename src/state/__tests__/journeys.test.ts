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
import { computeWeeklyStats } from '@/features/review/computeWeekly';
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
   * The line the whole feature is one bad sentence away from crossing. A
   * snack has no established acute harm, so the app must reach for the
   * person's own pattern rather than inventing a consequence — while a late
   * coffee, which does have a mechanism, gets the mechanism.
   */
  it('offers a pattern for a snack and a mechanism for a late coffee', () => {
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
    expect(snackNote.kind).toBe('pattern');

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

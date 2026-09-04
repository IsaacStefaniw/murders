import { buildSeededHistory } from '@/features/dev/seedHistory';
import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { buildWeeklyChanges } from '@/features/review/weeklyChanges';
import { detectMoveOutcome, type ManualMove } from '@/lib/scheduling/adaptation';
import { addDays, todayKey, weekStartOf } from '@/lib/dates';

const lifePlan = buildLifeOperatingPlan({
  name: 'Isaac',
  priorities: ['family', 'health', 'work'],
  household: ['partner', 'kids'],
  partnerName: 'Anna',
  workDays: ['1', '2', '3', '4', '5'],
  workHours: '09:00-17:30',
  sleep: '06:30-22:30',
  energy: 'morning',
  trainingDays: '4',
  trainingSetup: 'gym',
  moreOf: ['Date nights'],
  lessOf: ['vaping'],
});

describe('buildSeededHistory — the compressed week', () => {
  const seeded = buildSeededHistory(lifePlan.profile, lifePlan.routines, lifePlan.behaviourIntentions);

  it('produces two weeks of resolved past days only', () => {
    const dates = Object.keys(seeded.plans).sort();
    expect(dates.length).toBe(14);
    expect(dates[dates.length - 1] < todayKey()).toBe(true);
    const items = Object.values(seeded.plans).flatMap((p) => p.items.filter((i) => !i.fixed));
    expect(items.every((i) => i.status !== 'planned')).toBe(true);
  });

  it('lights up moved-then-completed learning', () => {
    const moves: ManualMove[] = seeded.planEvents
      .filter((e) => e.kind === 'rescheduled' && e.initiatedBy === 'user')
      .map((e) => ({ routineId: e.routineId!, start: e.newStart!, date: e.date }));
    const suggestions = detectMoveOutcome(moves, seeded.plans, lifePlan.routines);
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
    expect(suggestions[0].message).toMatch(/\d+ of the last \d+ times/);
  });

  it('gives the weekly review something concrete to apply', () => {
    const weekStart = weekStartOf(addDays(todayKey(), -7));
    const proposal = buildWeeklyChanges({
      weekStart,
      plans: seeded.plans,
      routines: lifePlan.routines,
    });
    expect(proposal.changes.length).toBeGreaterThanOrEqual(1);
  });

  it('clusters behaviour events on a dominant trigger', () => {
    const meals = seeded.behaviourEvents.filter((e) => e.trigger === 'After a meal');
    expect(meals.length).toBeGreaterThanOrEqual(3);
  });
});

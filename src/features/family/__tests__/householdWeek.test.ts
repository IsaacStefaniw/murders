import {
  householdShareText,
  householdWeek,
  nextDateNight,
  whoHasWhat,
} from '@/features/family/householdWeek';
import type { DailyPlan, LifeProfile, PlanItem, Routine } from '@/types/domain';

const item = (over: Partial<PlanItem>): PlanItem => ({
  id: Math.random().toString(),
  date: '2026-03-06',
  start: '19:30',
  end: '21:30',
  title: 'Date night',
  area: 'relationship',
  tier: 'should',
  status: 'planned',
  routineId: 'date',
  fixed: false,
  ...over,
});

const routine = (over: Partial<Routine>): Routine => ({
  id: 'r',
  title: 'x',
  area: 'family',
  days: [6],
  durationMin: 45,
  preferredStart: '18:00',
  preferredEnd: '18:45',
  energy: 'evening',
  flexible: true,
  protected: false,
  tier: 'should',
  active: true,
  ...over,
});

const routines: Routine[] = [
  routine({ id: 'dinner', title: 'Family dinner', days: [0, 1, 2, 3, 4, 5, 6], protected: true, tier: 'must' }),
  routine({ id: 'own', title: 'Two hours that are yours', area: 'health', protocolId: 'carer-own-hours' }),
  routine({ id: 'ten', title: 'Ten minutes that are not caring', area: 'health', days: [1, 2, 3, 4, 5], protocolId: 'carer-ten-minutes' }),
];

const profile = {
  firstName: 'Sam',
  people: [
    { id: 'p1', name: 'Anna', relation: 'partner' },
    { id: 'p2', name: 'The kids', relation: 'child' },
  ],
} as unknown as LifeProfile;

const plans: Record<string, DailyPlan> = {
  '2026-03-06': {
    date: '2026-03-06',
    items: [
      item({}),
      item({ id: 'd', title: 'Family dinner', area: 'family', routineId: 'dinner' }),
      item({ id: 'w', title: 'Strength workout', area: 'health', routineId: undefined }),
      item({ id: 's', title: 'Family adventure', area: 'family', status: 'skipped' }),
      item({ id: 'o', title: 'One-on-one with each child', area: 'family', start: '17:15', routineId: undefined }),
    ],
  },
  '2026-03-07': {
    date: '2026-03-07',
    items: [
      item({ id: 'a', date: '2026-03-07', title: 'Get outside together — anywhere green', area: 'family', start: '09:30', routineId: undefined }),
      item({ id: 'own', date: '2026-03-07', title: 'Two hours that are yours', area: 'health', start: '10:00', routineId: 'own' }),
    ],
  },
  '2026-03-04': {
    date: '2026-03-04',
    items: [item({ id: 'ten', date: '2026-03-04', title: 'Ten minutes that are not caring', area: 'health', start: '13:00', routineId: 'ten' })],
  },
  '2026-03-20': { date: '2026-03-20', items: [item({ id: 'far', date: '2026-03-20' })] },
};

describe('householdWeek', () => {
  const week = householdWeek('2026-03-02', plans, routines);

  it('keeps the shared moments and the carer’s own hours; drops solo, everyday, resolved and far-off items', () => {
    expect(week.map((e) => e.title)).toEqual([
      'Ten minutes that are not caring',
      'Date night',
      'One-on-one with each child',
      'Get outside together — anywhere green',
      'Two hours that are yours',
    ]);
  });

  it('says who each one is for', () => {
    expect(week.map((e) => e.who)).toEqual(['you', 'two', 'one', 'all', 'you']);
  });

  it('groups by who, the carer’s own time first, with the partner’s name on the two-of-you group', () => {
    const groups = whoHasWhat(week, 'Anna');
    expect(groups.map((g) => g.label)).toEqual(['Yours alone', 'You and Anna', 'One at a time', 'Everyone']);
    expect(groups[0].entries).toHaveLength(2);
  });

  it('still finds date night', () => {
    expect(nextDateNight(week)?.date).toBe('2026-03-06');
  });

  it('writes a message a partner would read: day, time, what, who — signed by the sender, not the app', () => {
    const text = householdShareText(profile, week);
    expect(text.startsWith('This week, Anna:')).toBe(true);
    expect(text).toContain('Fri 7:30pm — Date night (us)');
    expect(text).toContain('Fri 5:15pm — One-on-one with each child (one-on-one)');
    expect(text).toContain('Sat 9:30am — Get outside together — anywhere green (all of us)');
    expect(text).toContain('Anything to move?');
    expect(text.trim().endsWith('Sam')).toBe(true);
    expect(text).not.toContain('IntentNorth');
  });

  it('stays warm and short on an empty week', () => {
    const text = householdShareText(profile, []);
    expect(text).toContain('what should we put in?');
    expect(text.trim().endsWith('Sam')).toBe(true);
  });
});

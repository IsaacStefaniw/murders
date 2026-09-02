import {
  babysitterReminderDate,
  buildTogetherWeek,
  nextDateNight,
  shareWeekText,
} from '@/features/household/week';
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

const routines: Routine[] = [
  {
    id: 'dinner',
    title: 'Family dinner',
    area: 'family',
    days: [0, 1, 2, 3, 4, 5, 6],
    durationMin: 45,
    preferredStart: '18:00',
    preferredEnd: '18:45',
    energy: 'evening',
    flexible: false,
    protected: true,
    tier: 'must',
    active: true,
  },
];

const profile = {
  people: [
    { id: 'p1', name: 'Anna', relation: 'partner' },
    { id: 'p2', name: 'The kids', relation: 'child' },
  ],
} as unknown as LifeProfile;

describe('buildTogetherWeek', () => {
  const plans: Record<string, DailyPlan> = {
    '2026-03-06': {
      date: '2026-03-06',
      items: [
        item({}),
        item({ id: 'd', title: 'Family dinner', area: 'family', routineId: 'dinner' }),
        item({ id: 'w', title: 'Strength workout', area: 'health' }),
        item({ id: 's', title: 'Family adventure', area: 'family', status: 'skipped' }),
      ],
    },
    '2026-03-07': {
      date: '2026-03-07',
      items: [item({ id: 'a', date: '2026-03-07', title: 'Family adventure', area: 'family', start: '09:30' })],
    },
    '2026-03-20': { date: '2026-03-20', items: [item({ id: 'far', date: '2026-03-20' })] },
  };
  const week = buildTogetherWeek('2026-03-02', plans, routines);

  it('collects shared moments only: no solo items, no everyday dinner, no resolved, 7 days', () => {
    expect(week.map((e) => e.title)).toEqual(['Date night', 'Family adventure']);
    expect(week[0].when).toBe('Friday');
  });

  it('finds date night and places the babysitter reminder sensibly', () => {
    const dn = nextDateNight(week)!;
    expect(dn.date).toBe('2026-03-06');
    expect(babysitterReminderDate('2026-03-02', dn.date)).toBe('2026-03-04');
    // Never in the past — a late plan gets a same-day reminder.
    expect(babysitterReminderDate('2026-03-06', dn.date)).toBe('2026-03-06');
  });

  it('renders a pasteable week for the partner', () => {
    const text = shareWeekText(profile, week);
    expect(text).toContain('Our week, Anna:');
    expect(text).toContain('• Friday');
    expect(text).toContain('Date night');
    expect(text).toContain('planned with IntentNorth');
  });

  it('stays warm on an empty week', () => {
    const text = shareWeekText(profile, []);
    expect(text).toContain('pick something?');
  });
});

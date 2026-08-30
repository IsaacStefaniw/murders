import { availableStartsFor, generateDailyPlan, workBlocks } from '@/features/planner/generate';
import type { LifeProfile, Routine } from '@/types/domain';

const profile: LifeProfile = {
  firstName: 'Sam',
  priorities: ['family', 'health', 'work'],
  people: [],
  workDays: [1, 2, 3, 4, 5],
  workStart: '09:00',
  workEnd: '17:30',
  wakeTime: '06:00',
  sleepTime: '22:15',
  energyProfile: 'midday',
  trainingDaysPerWeek: 4,
  trainingDurationMin: 45,
  trainingPreference: 'gym',
  moreOf: [],
  lessOf: [],
  createdAt: '',
  updatedAt: '',
};

const deepWork: Routine = {
  id: 'dw',
  title: 'Deep work block',
  area: 'work',
  days: [1, 2, 3, 4, 5],
  durationMin: 60,
  preferredStart: '09:15',
  preferredEnd: '10:15',
  energy: 'morning',
  flexible: false,
  protected: false,
  duringWork: true,
  tier: 'must',
  active: true,
};

describe('workBlocks', () => {
  it('splits the work day around lunch', () => {
    const blocks = workBlocks(profile, '2026-09-01'); // Tuesday
    expect(blocks.map((b) => `${b.start}-${b.end}`)).toEqual(['09:00-12:00', '13:30-17:30']);
  });

  it('carves during-work routines out as named fixed blocks', () => {
    const blocks = workBlocks(profile, '2026-09-01', [deepWork]);
    expect(blocks.map((b) => `${b.title} ${b.start}-${b.end}`)).toEqual([
      'Work 09:00-09:15',
      'Deep work block 09:15-10:15',
      'Work 10:15-12:00',
      'Work 13:30-17:30',
    ]);
  });

  it('skips during-work routines on non-work days', () => {
    expect(workBlocks(profile, '2026-09-05', [deepWork])).toEqual([]); // Saturday
  });
});

describe('generateDailyPlan', () => {
  it('includes the deep-work block as a fixed must item, not a placed routine', () => {
    const plan = generateDailyPlan(profile, [deepWork], '2026-09-01');
    const dw = plan.items.filter((i) => i.title === 'Deep work block');
    expect(dw).toHaveLength(1);
    expect(dw[0].fixed).toBe(true);
    expect(dw[0].start).toBe('09:15');
  });
});

describe('availableStartsFor', () => {
  it('offers only starts that fit around the rest of the day', () => {
    const plan = generateDailyPlan(profile, [], '2026-09-01');
    const lunchWalk = {
      id: 'x',
      date: '2026-09-01',
      start: '12:10',
      end: '12:40',
      title: 'Walk',
      area: 'health' as const,
      tier: 'could' as const,
      status: 'planned' as const,
      fixed: false,
    };
    const planWith = { ...plan, items: [...plan.items, lunchWalk] };
    const slots = availableStartsFor(lunchWalk, planWith, profile);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots).not.toContain('12:10'); // never offers the current time
    // Every offered slot must not overlap work blocks (09:00-12:00, 13:30-17:30).
    for (const slot of slots) {
      const [h, m] = slot.split(':').map(Number);
      const start = h * 60 + m;
      const overlapsWork =
        (start + 30 > 9 * 60 + 10 && start < 12 * 60) ||
        (start + 30 > 13 * 60 + 40 && start < 17 * 60 + 30);
      expect(overlapsWork).toBe(false);
    }
  });
});

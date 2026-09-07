import { protocolById } from '@/features/knowledge/protocols';
import { PATHS } from '@/features/paths/definitions';
import type { LifeProfile } from '@/types/domain';

const profile: LifeProfile = {
  firstName: 'Sam',
  priorities: ['work', 'health'],
  people: [],
  workDays: [1, 2, 3, 4, 5],
  workStart: '08:30',
  workEnd: '17:00',
  wakeTime: '06:30',
  sleepTime: '22:30',
  energyProfile: 'morning',
  trainingDaysPerWeek: 3,
  trainingDurationMin: 45,
  trainingPreference: 'gym',
  moreOf: [],
  lessOf: [],
  createdAt: '',
  updatedAt: '',
};

const build = (answers: Record<string, string>) => PATHS.work.build(answers, profile);
const has = (answers: Record<string, string>, protocolId: string) =>
  build(answers).routines.some((r) => r.protocolId === protocolId);
const deepWork = (answers: Record<string, string>) =>
  build(answers).routines.find((r) => r.protocolId === 'deep-work');

describe('work pathway — the meeting-load answer changes the plan', () => {
  it('is asked in the intake, with an answer for people who have hardly any', () => {
    const q = PATHS.work.questions.find((x) => x.key === 'meetingLoad');
    expect(q).toBeDefined();
    expect(q!.options.map((o) => o.value)).toEqual(['none', 'light', 'half', 'heavy']);
  });

  it('heavy meetings: the focus block sits at the start of the work day, before the first call', () => {
    const block = deepWork({ style: 'maker', meetingLoad: 'heavy' });
    expect(block).toBeDefined();
    expect(block!.preferredStart).toBe('08:30');
    expect(block!.preferredEnd).toBe('09:45');
    // The insight says so, in the person's own work-start.
    expect(PATHS.work.insights({ style: 'maker', meetingLoad: 'heavy' }, profile).join(' ')).toContain('08:30');
  });

  it('heavy meetings with focus as the named bottleneck reshapes the block the goal planner added', () => {
    const plan = build({ style: 'mixed', meetingLoad: 'heavy', bottleneck: 'focus' });
    const blocks = plan.routines.filter((r) => r.protocolId === 'deep-work');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].preferredStart).toBe('08:30');
  });

  it('a light week gets a third making block, not two', () => {
    expect(deepWork({ style: 'maker', meetingLoad: 'light' })!.days).toEqual([1, 2, 4]);
    expect(deepWork({ style: 'maker', meetingLoad: 'none' })!.days).toEqual([1, 2, 4]);
    expect(deepWork({ style: 'maker', meetingLoad: 'half' })!.days).toEqual([1, 2]);
    expect(deepWork({ style: 'maker' })!.days).toEqual([1, 2]);
  });

  it('a manager in a heavy week gets the slot for cutting a meeting, never a block to move', () => {
    expect(has({ style: 'manager', meetingLoad: 'heavy' }, 'meeting-trim')).toBe(true);
    expect(has({ style: 'manager', meetingLoad: 'heavy' }, 'deep-work')).toBe(false);
    expect(has({ style: 'manager', meetingLoad: 'half' }, 'meeting-trim')).toBe(false);
    expect(has({ style: 'maker', meetingLoad: 'heavy' }, 'meeting-trim')).toBe(false);
  });
});

describe('work pathway — every bottleneck answer changes something', () => {
  it.each([
    ['admin', 'message-batching'],
    ['people', 'delegation-pass'],
    ['visibility', 'work-made-visible'],
    ['direction', 'week-preview'],
  ])('%s adds %s once', (bottleneck, protocolId) => {
    const plan = build({ style: 'mixed', bottleneck });
    expect(plan.routines.filter((r) => r.protocolId === protocolId)).toHaveLength(1);
    expect(build({ style: 'mixed', bottleneck: 'sales' }).routines.some((r) => r.protocolId === protocolId)).toBe(false);
    // The insight names it.
    expect(PATHS.work.insights({ style: 'mixed', bottleneck }, profile).length).toBeGreaterThan(2);
  });

  it('a multi-answer bottleneck adds each practice, still once each', () => {
    const plan = build({ style: 'mixed', bottleneck: 'admin,people,visibility' });
    for (const id of ['message-batching', 'delegation-pass', 'work-made-visible']) {
      expect(plan.routines.filter((r) => r.protocolId === id)).toHaveLength(1);
    }
  });

  it('at the established level the rung does not add a second delegation pass', () => {
    const plan = build({ style: 'mixed', bottleneck: 'people', level: 'established' });
    expect(plan.routines.filter((r) => /delegation/i.test(r.title))).toHaveLength(1);
    expect(plan.goal.milestones!.some((m) => /handed over for good/.test(m.title))).toBe(true);
  });

  it('at the developing level the Sunday shape and the library’s week preview are one practice', () => {
    const plan = build({ style: 'mixed', bottleneck: 'direction', level: 'developing' });
    const sunday = plan.routines.filter((r) => r.days.length === 1 && r.days[0] === 0 && /week/i.test(r.title));
    expect(sunday).toHaveLength(1);
  });
});

describe('work pathway — the styles', () => {
  it('"no two weeks are the same" builds, and its insight says the plan is small', () => {
    const plan = build({ style: 'varies', team: 'solo', meetingLoad: 'none' });
    expect(plan.routines.length).toBeGreaterThan(0);
    expect(PATHS.work.insights({ style: 'varies' }, profile).join(' ')).toMatch(/does not repeat/);
  });

  it('hands-on work gets the shutdown and the weekly shape, not a focus block (PW-O3, decided)', () => {
    expect(has({ style: 'physical', team: 'solo' }, 'deep-work')).toBe(false);
    expect(has({ style: 'maker', team: 'solo' }, 'deep-work')).toBe(true);
  });

  it('the new practices carry sources, a safety line and modest grades', () => {
    for (const id of ['meeting-free-morning', 'message-batching', 'meeting-trim']) {
      const p = protocolById(id);
      expect(p).toBeDefined();
      expect(['C', 'D']).toContain(p!.evidenceLevel);
      expect(p!.safety).toBeTruthy();
      expect(p!.attribution.length).toBeGreaterThan(0);
    }
  });
});

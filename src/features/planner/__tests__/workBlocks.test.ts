/**
 * Carving the work day.
 *
 * The plain work hours are split around lunch and around the routines that
 * happen during work. The rules that follow are small but each was a
 * defect once: a fifteen-minute "Work" sliver, a shutdown pushed past
 * dinner, two blocks drawn on top of each other. This file pins the ones
 * the earlier tests left implicit, and the two cases where a block that
 * could not be carved was simply lost.
 */

import { generateDailyPlan, workBlocks } from '@/features/planner/generate';
import { durationMinutes, toMinutes } from '@/lib/dates';
import type { FixedCommitment } from '@/lib/scheduling/engine';
import type { LifeProfile, Routine } from '@/types/domain';

const TUESDAY = '2026-09-01';

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

const carve = (over: Partial<Routine> & { id: string; title: string }): Routine => ({
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
  ...over,
});

const render = (blocks: FixedCommitment[]) => blocks.map((b) => `${b.title} ${b.start}-${b.end}`);

/** Blocks are in order, never overlap, and never leave the hours. */
function expectWellFormed(blocks: FixedCommitment[], hours: { start: string; end: string }) {
  const startMin = toMinutes(hours.start);
  let endMin = toMinutes(hours.end);
  if (endMin <= startMin) endMin += 1440;
  let cursor = startMin;
  for (const b of blocks) {
    let s = toMinutes(b.start);
    if (s < startMin) s += 1440;
    const e = s + durationMinutes(b.start, b.end);
    expect({ block: render([b])[0], inOrder: s >= cursor }).toEqual({ block: render([b])[0], inOrder: true });
    expect({ block: render([b])[0], inside: s >= startMin && e <= endMin }).toEqual({ block: render([b])[0], inside: true });
    cursor = e;
  }
}

describe('B1 lunch is carved only when the hours span it', () => {
  it('leaves a morning-only, afternoon-only or lunch-straddling day whole', () => {
    expect(render(workBlocks({ ...profile, workStart: '07:00', workEnd: '12:30' }, TUESDAY))).toEqual(['Work 07:00-12:30']);
    expect(render(workBlocks({ ...profile, workStart: '13:00', workEnd: '21:00' }, TUESDAY))).toEqual(['Work 13:00-21:00']);
    expect(render(workBlocks({ ...profile, workStart: '12:30', workEnd: '20:00' }, TUESDAY))).toEqual(['Work 12:30-20:00']);
  });

  it('carves it for every ordinary set of hours the interview offers', () => {
    for (const hours of ['07:00-15:00', '08:00-16:00', '09:00-17:30', '09:30-18:30', '08:30-17:00', '10:00-18:00']) {
      const [workStart, workEnd] = hours.split('-');
      const blocks = workBlocks({ ...profile, workStart, workEnd }, TUESDAY);
      expect({ hours, blocks: render(blocks) }).toEqual({
        hours,
        blocks: [`Work ${workStart}-12:00`, `Work 13:30-${workEnd}`],
      });
    }
  });
});

describe('B3 the tail rule', () => {
  it('folds a short tail into the plain block before it', () => {
    const blocks = workBlocks({ ...profile, workEnd: '12:20' }, TUESDAY);
    expect(render(blocks)).toEqual(['Work 09:00-12:20']);
  });

  it('never folds the tail into a carve — the carve keeps its own length', () => {
    const late = carve({ id: 'late', title: 'Deep work', durationMin: 30, preferredStart: '14:00', preferredEnd: '14:30' });
    const blocks = workBlocks({ ...profile, workEnd: '14:45' }, TUESDAY, [late]);
    const dw = blocks.find((b) => b.title === 'Deep work')!;
    expect(`${dw.start}-${dw.end}`).toBe('14:00-14:30');
    expect(blocks[blocks.length - 1]).toMatchObject({ title: 'Work', start: '14:30', end: '14:45' });
  });
});

describe('B4 a ritual anchored to the end of the hours', () => {
  const shutdown = carve({
    id: 'sd',
    title: 'Shutdown',
    durationMin: 10,
    preferredStart: '17:00',
    preferredEnd: '18:30',
    anchorToWorkEnd: true,
    tier: 'should',
  });

  it('sits against a shift that ends the next morning', () => {
    const night: LifeProfile = { ...profile, workDays: [1, 2, 3, 4], workStart: '19:00', workEnd: '07:00' };
    const monday = workBlocks(night, '2026-09-07', [shutdown]);
    expect(render(monday)).toEqual(['Work 19:00-00:00']);
    const tuesday = workBlocks(night, TUESDAY, [shutdown]);
    expect(render(tuesday)).toEqual(['Work 00:00-06:50', 'Shutdown 06:50-07:00', 'Work 19:00-00:00']);
  });
});

describe('B5 two carves that want the same start', () => {
  it('keeps both, in order, with no overlap and the work around them', () => {
    const a = carve({ id: 'a', title: 'Deep work' });
    const b = carve({ id: 'b', title: 'Growth block', durationMin: 90 });
    const blocks = workBlocks(profile, TUESDAY, [a, b]);
    expect(render(blocks)).toEqual([
      'Deep work 09:00-10:00',
      'Growth block 10:00-11:30',
      'Work 11:30-12:00',
      'Work 13:30-17:30',
    ]);
    expectWellFormed(blocks, { start: '09:00', end: '17:30' });
  });
});

describe('B6 a carve longer than the work day', () => {
  const long = carve({ id: 'long', title: 'Long block', durationMin: 240 });
  const short: LifeProfile = { ...profile, workStart: '09:00', workEnd: '12:00' };

  it('is left out of the blocks', () => {
    expect(render(workBlocks(short, TUESDAY, [long]))).toEqual(['Work 09:00-12:00']);
  });

  it('is reported as unplaced by the day, never silently lost', () => {
    const plan = generateDailyPlan(short, [long], TUESDAY);
    expect(plan.items.some((i) => i.routineId === 'long')).toBe(false);
    expect(plan.unplaced.map((r) => r.id)).toContain('long');
  });
});

describe('B7 a second carve pushed past the end of the day', () => {
  const first = carve({ id: 'first', title: 'Deep work', durationMin: 120, preferredStart: '14:00', preferredEnd: '15:00' });
  const second = carve({ id: 'second', title: 'Review', durationMin: 120, preferredStart: '14:30', preferredEnd: '15:30' });

  it('is left out rather than drawn past the hours', () => {
    const blocks = workBlocks(profile, TUESDAY, [first, second]);
    expect(render(blocks)).toEqual(['Work 09:00-12:00', 'Work 13:30-14:00', 'Deep work 14:00-16:00', 'Work 16:00-17:30']);
    expectWellFormed(blocks, { start: '09:00', end: '17:30' });
  });

  it('is reported as unplaced by the day', () => {
    const plan = generateDailyPlan(profile, [first, second], TUESDAY);
    expect(plan.unplaced.map((r) => r.id)).toEqual(['second']);
  });

  it('is not reported on a day it is not due', () => {
    const plan = generateDailyPlan(profile, [first, second], '2026-09-05');
    expect(plan.unplaced).toEqual([]);
  });
});

describe('B8 blocks are always well formed', () => {
  const carves = [
    carve({ id: 'a', title: 'Deep work' }),
    carve({ id: 'b', title: 'Admin', durationMin: 30, preferredStart: '11:45', preferredEnd: '12:15' }),
    carve({ id: 'c', title: 'Shutdown', durationMin: 10, preferredStart: '17:00', preferredEnd: '18:00', anchorToWorkEnd: true }),
    carve({ id: 'd', title: 'Afternoon', durationMin: 45, preferredStart: '14:00', preferredEnd: '15:00' }),
  ];
  const hours = [
    '07:00-15:00', '08:00-16:00', '09:00-17:30', '09:30-18:30', '08:30-17:00', '10:00-18:00',
    '06:00-14:00', '07:00-19:00', '14:00-22:00', '19:00-07:00', '22:00-06:00', '05:00-13:00',
  ];

  it('for every set of hours the interview offers, with the carves on top', () => {
    for (const h of hours) {
      const [workStart, workEnd] = h.split('-');
      const blocks = workBlocks({ ...profile, workStart, workEnd }, TUESDAY, carves);
      // A shift crossing midnight arrives in two pieces on a mid-week day;
      // check each piece against the hours it belongs to.
      if (toMinutes(workEnd) <= toMinutes(workStart)) {
        const morning = blocks.filter((b) => toMinutes(b.start) < toMinutes(workEnd));
        const evening = blocks.filter((b) => toMinutes(b.start) >= toMinutes(workStart));
        expect(morning.length + evening.length).toBe(blocks.length);
        expectWellFormed(morning, { start: '00:00', end: workEnd });
        expectWellFormed(evening, { start: workStart, end: '00:00' });
      } else {
        expectWellFormed(blocks, { start: workStart, end: workEnd });
      }
      for (const b of blocks) {
        expect({ h, block: render([b])[0], ok: durationMinutes(b.start, b.end) > 0 }).toEqual({ h, block: render([b])[0], ok: true });
      }
    }
  });
});

/**
 * Move it, do not drop it.
 *
 * The engine has always had a fallback inside `findSpot` — if the preferred
 * window is gone, take the closest window that fits — and for most routines
 * that fallback is enough. What it did not have was a pass over the
 * routines it turned away entirely, and it turned some away while the day
 * still had room for them:
 *
 *   · a gap shorter than twenty minutes is refused, on purpose, because a
 *     plan made of slivers is a wall. But a five-minute practice that has
 *     already lost every real window is not competing for one — the choice
 *     in front of it is an eighteen-minute gap or nothing at all.
 *
 *   · the fallback tests ONE candidate start per window. A window whose
 *     late half crosses a finish-before-sleep bound was rejected whole,
 *     even when its early half was inside the bound and free.
 *
 * Reclaim's rule is "the next best time within the window", and these are
 * the two cases where IntentNorth did not have one. What has NOT changed is
 * the honest unplaced: a routine with nowhere legal left still says so.
 */

import { buildDailyPlan } from '@/lib/scheduling/engine';
import { toMinutes } from '@/lib/dates';
import type { Routine, Weekday } from '@/types/domain';

const ALL: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
const TUESDAY = '2026-09-01';

const routine = (over: Partial<Routine> & { id: string }): Routine => ({
  title: over.id,
  area: 'health',
  days: ALL,
  durationMin: 30,
  preferredStart: '12:00',
  preferredEnd: '13:00',
  energy: 'any',
  flexible: true,
  timeAnchored: false,
  protected: false,
  tier: 'should',
  active: true,
  ...over,
});

const at = (plan: { items: { routineId?: string; start: string; end: string }[] }, id: string) =>
  plan.items.find((i) => i.routineId === id);

describe('D1 a five-minute practice and the gap nobody would schedule into', () => {
  // A day whose only leftovers, once the real windows are used, are a
  // half-hour before work and a quarter of an hour before bed.
  const day = (extra: Routine[] = []) =>
    buildDailyPlan({
      date: TUESDAY,
      wakeTime: '06:00',
      sleepTime: '22:00',
      fixed: [
        { title: 'Work', start: '09:00', end: '17:00' },
        { title: 'Choir', start: '18:00', end: '21:30' },
      ],
      routines: [
        routine({ id: 'gym', title: 'Strength', tier: 'must', durationMin: 90, preferredStart: '06:30', preferredEnd: '07:30' }),
        routine({ id: 'admin', title: 'Money check-in', area: 'admin', durationMin: 25, preferredStart: '17:15', preferredEnd: '17:45' }),
        ...extra,
      ],
    });

  const reset = routine({
    id: 'reset',
    title: 'The urge answer: two-minute reset',
    tier: 'could',
    durationMin: 5,
    preferredStart: '21:00',
    preferredEnd: '21:45',
    timeAnchored: true,
  });

  it('puts the reset in the quarter-hour before bed rather than reporting it', () => {
    const plan = day([reset]);
    expect(plan.unplaced.map((r) => r.id)).not.toContain('reset');
    const item = at(plan, 'reset')!;
    expect(item).toBeDefined();
    expect(toMinutes(item.start)).toBeGreaterThanOrEqual(toMinutes('21:45'));
    expect(toMinutes(item.end)).toBeLessThanOrEqual(toMinutes('22:00'));
  });

  it('does not disturb anything the ordinary pass had already placed', () => {
    const without = day();
    const with_ = day([reset]);
    for (const id of ['gym', 'admin']) {
      const before = at(without, id)!;
      const after = at(with_, id)!;
      expect({ start: after.start, end: after.end }).toEqual({ start: before.start, end: before.end });
    }
  });

  it('leaves nothing overlapping', () => {
    const items = [...day([reset]).items].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    for (let i = 1; i < items.length; i++) {
      expect(toMinutes(items[i].start)).toBeGreaterThanOrEqual(toMinutes(items[i - 1].end));
    }
  });
});

describe('D2 a window whose late half crosses a bedtime bound', () => {
  // Home at 18:45, in bed at 22:30, and a session that must finish an hour
  // before bed. The evening is one long window; its late half is past the
  // bound and its early half is not.
  const bounded = routine({
    id: 'zone2',
    title: 'Easy cardio, talking pace',
    tier: 'could',
    durationMin: 40,
    preferredStart: '21:00',
    preferredEnd: '21:45',
    timeAnchored: true,
    finishBeforeSleepMin: 60,
  });
  const plan = buildDailyPlan({
    date: TUESDAY,
    wakeTime: '06:30',
    sleepTime: '22:30',
    fixed: [{ title: 'Work', start: '06:45', end: '18:45' }],
    routines: [bounded],
  });

  it('takes the part of the window that is inside the bound', () => {
    expect(plan.unplaced.map((r) => r.id)).toEqual([]);
    const item = at(plan, 'zone2')!;
    expect(item).toBeDefined();
    expect(toMinutes(item.end)).toBeLessThanOrEqual(toMinutes('21:30'));
  });

  it('never finishes inside the hour before bed', () => {
    const item = at(plan, 'zone2')!;
    expect(toMinutes('22:30') - toMinutes(item.end)).toBeGreaterThanOrEqual(60);
  });
});

describe('D3 what the second pass still refuses to do', () => {
  it('leaves a deadline where it is, and reports it', () => {
    // "Last coffee by" is not an activity to slot in. Moved, it is false.
    const cutoff = routine({
      id: 'caffeine',
      title: 'Caffeine cutoff',
      tier: 'could',
      durationMin: 5,
      preferredStart: '12:30',
      preferredEnd: '13:00',
      flexible: false,
    });
    const plan = buildDailyPlan({
      date: TUESDAY,
      wakeTime: '06:00',
      sleepTime: '22:00',
      fixed: [{ title: 'Surgery', start: '11:00', end: '15:00' }],
      routines: [cutoff],
    });
    expect(plan.items.some((i) => i.routineId === 'caffeine')).toBe(false);
    expect(plan.unplaced.map((r) => r.id)).toEqual(['caffeine']);
  });

  it('reports a routine the day genuinely cannot hold', () => {
    const big = routine({ id: 'long', durationMin: 120, preferredStart: '12:00', preferredEnd: '13:00' });
    const plan = buildDailyPlan({
      date: TUESDAY,
      wakeTime: '06:00',
      sleepTime: '22:00',
      fixed: [
        { title: 'Work', start: '06:15', end: '17:00' },
        { title: 'Choir', start: '17:20', end: '21:45' },
      ],
      routines: [big],
    });
    expect(plan.unplaced.map((r) => r.id)).toEqual(['long']);
  });

  it('keeps a time-anchored practice inside its own drift rather than moving it to the morning', () => {
    // The protein anchor at lunch, once a must-tier session has the window:
    // a meal moved to breakfast is not that meal. It stays unplaced.
    const strength = routine({ id: 'strength', title: 'Strength', tier: 'must', durationMin: 60, preferredStart: '12:15', preferredEnd: '12:30', timeAnchored: true });
    const protein = routine({ id: 'protein', title: 'A protein anchor at every meal', tier: 'could', durationMin: 10, preferredStart: '12:30', preferredEnd: '14:30', timeAnchored: true });
    const plan = buildDailyPlan({
      date: TUESDAY,
      wakeTime: '06:30',
      sleepTime: '22:30',
      fixed: [
        { title: 'Work', start: '09:00', end: '12:00' },
        { title: 'Work', start: '13:30', end: '17:30' },
      ],
      routines: [protein, strength],
    });
    expect(at(plan, 'strength')).toMatchObject({ start: '12:15' });
    expect(plan.unplaced.map((r) => r.id)).toEqual(['protein']);
  });
});

/**
 * TR-O2 from the QA report: a joints or recovering swap could still offer
 * loaded variants the constraint table never named — a front squat beside
 * the box squat that replaced the back squat, dips beside the floor press.
 * The loaded variants now go through the same rule as the swapped lifts,
 * in the swap menu and in the block's own accessories alike. And the one
 * thing a fitter block vetoes outright, hard intervals, has its own rule.
 */

import { ruledOutByConstraints, rulesOutHardIntervals } from '@/features/training/constraints';
import { alternativesFor } from '@/features/training/swap';

describe('loaded variants beside a sore joint', () => {
  const rules = { complexLifts: false, constraints: ['joints'] as const };

  it('are not offered as swaps for the kinder movement that replaced the lift', () => {
    const squat = alternativesFor('Goblet squat — to a box, comfortable depth', 'gym', { ...rules, constraints: [...rules.constraints] });
    expect(squat).not.toContain('Front squat');
    expect(squat).not.toContain('Leg press');
    expect(squat).not.toContain('Dumbbell lunges');
    expect(squat.length).toBeGreaterThan(0);
    const press = alternativesFor('Dumbbell floor press', 'gym', { ...rules, constraints: [...rules.constraints] });
    expect(press).not.toContain('Dips');
    expect(press.length).toBeGreaterThan(0);
    const pull = alternativesFor('Chest-supported row', 'gym', { ...rules, constraints: [...rules.constraints] });
    expect(pull).not.toContain('Chin-ups');
    expect(pull.length).toBeGreaterThan(0);
  });

  it('come back once the joint is no longer the limit', () => {
    expect(alternativesFor('Goblet squat — to a box, comfortable depth', 'gym', { complexLifts: true })).toContain('Front squat');
    expect(ruledOutByConstraints('Front squat', ['heart'])).toBe(false);
    expect(ruledOutByConstraints('Front squat', [])).toBe(false);
    expect(ruledOutByConstraints('Front squat', ['recovering'])).toBe(true);
  });
});

describe('hard intervals', () => {
  it('stay out beside a heart condition, a pregnancy or an injury, and nowhere else', () => {
    expect(rulesOutHardIntervals(['heart'])).toBe(true);
    expect(rulesOutHardIntervals(['pregnancy'])).toBe(true);
    expect(rulesOutHardIntervals(['recovering'])).toBe(true);
    expect(rulesOutHardIntervals(['joints'])).toBe(false);
    expect(rulesOutHardIntervals(['energy', 'balance'])).toBe(false);
    expect(rulesOutHardIntervals([])).toBe(false);
    expect(rulesOutHardIntervals(undefined)).toBe(false);
  });
});

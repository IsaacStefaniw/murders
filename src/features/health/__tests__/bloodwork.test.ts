import {
  BP_FRESH_DAYS,
  CHOLESTEROL_MG_DL_PER_MMOL,
  MEDICATION_DEDUCTION,
  PANEL_FRESH_DAYS,
  bpScore,
  freshness,
  glucoseScore,
  lipidsScore,
  nonHdlMmol,
} from '@/features/health/bloodwork';
import { weekHealth } from '@/features/health/essential8';
import type { MetricObservation } from '@/features/model/metrics';
import type { DailyPlan } from '@/types/domain';

/**
 * The three components a phone cannot see.
 *
 * Every number here comes from the AHA's published Life's Essential 8
 * tables (Lloyd-Jones et al., Circulation 2022) — the same paper the four
 * tables already in `essential8.ts` come from. These tests exist because a
 * scoring table is the easiest thing in an app to get subtly wrong and the
 * hardest thing to notice being wrong.
 */

const TODAY = '2026-09-15';
const obs = (key: string, value: number, at = `${TODAY}T08:00:00.000Z`): MetricObservation =>
  ({ id: `${key}-${at}`, key, value, at, source: 'user' }) as MetricObservation;

describe('blood pressure', () => {
  it('follows the published bands', () => {
    expect(bpScore({ systolic: 112, diastolic: 70 })).toBe(100);
    expect(bpScore({ systolic: 125, diastolic: 78 })).toBe(75);
    expect(bpScore({ systolic: 134, diastolic: 78 })).toBe(50);
    expect(bpScore({ systolic: 145, diastolic: 85 })).toBe(25);
    expect(bpScore({ systolic: 165, diastolic: 95 })).toBe(0);
  });

  it('is decided by the worse of the two numbers', () => {
    // A systolic-only reading of this would say 100. It is not 100.
    expect(bpScore({ systolic: 118, diastolic: 95 })).toBe(25);
    expect(bpScore({ systolic: 118, diastolic: 82 })).toBe(50);
    expect(bpScore({ systolic: 118, diastolic: 105 })).toBe(0);
  });

  it('takes the medication deduction, which is the tempting one to drop', () => {
    expect(bpScore({ systolic: 112, diastolic: 70 }, true)).toBe(100 - MEDICATION_DEDUCTION);
    expect(bpScore({ systolic: 134, diastolic: 78 }, true)).toBe(30);
    // And never below zero.
    expect(bpScore({ systolic: 180, diastolic: 110 }, true)).toBe(0);
  });
});

describe('blood lipids', () => {
  const mmol = (mgDl: number) => mgDl / CHOLESTEROL_MG_DL_PER_MMOL;

  it('follows the published bands, in the units the report prints', () => {
    expect(lipidsScore(mmol(120))).toBe(100);
    expect(lipidsScore(mmol(140))).toBe(60);
    expect(lipidsScore(mmol(175))).toBe(40);
    expect(lipidsScore(mmol(200))).toBe(20);
    expect(lipidsScore(mmol(240))).toBe(0);
  });

  it('converts mmol/L the way an Australian report is read', () => {
    // 3.4 mmol/L is about 131 mg/dL — just over the top band.
    expect(lipidsScore(3.3)).toBe(100);
    expect(lipidsScore(3.4)).toBe(60);
  });

  it('subtracts for treatment', () => {
    expect(lipidsScore(mmol(140), true)).toBe(40);
    expect(lipidsScore(mmol(240), true)).toBe(0);
  });

  it('derives non-HDL by subtraction, and never goes negative', () => {
    expect(nonHdlMmol(5.2, 1.4)).toBeCloseTo(3.8, 5);
    expect(nonHdlMmol(1.0, 1.4)).toBe(0);
  });
});

describe('blood glucose', () => {
  it('scores HbA1c without diabetes on the two published bands', () => {
    expect(glucoseScore({ hba1cPct: 5.4 })).toBe(100);
    expect(glucoseScore({ hba1cPct: 6.0 })).toBe(60);
  });

  it('branches on the diagnosis, not on the number', () => {
    // The same HbA1c scores differently with and without a diagnosis,
    // because the published table is written that way.
    expect(glucoseScore({ hba1cPct: 6.0, diabetes: true })).toBe(40);
    expect(glucoseScore({ hba1cPct: 7.5, diabetes: true })).toBe(30);
    expect(glucoseScore({ hba1cPct: 8.4, diabetes: true })).toBe(20);
    expect(glucoseScore({ hba1cPct: 9.5, diabetes: true })).toBe(10);
    expect(glucoseScore({ hba1cPct: 11, diabetes: true })).toBe(0);
  });

  it('falls back to fasting glucose, and says so by being coarser', () => {
    expect(glucoseScore({ fastingGlucoseMmol: 5.2 })).toBe(100);
    expect(glucoseScore({ fastingGlucoseMmol: 6.2 })).toBe(60);
    // A diagnosis with only a fasting glucose gets the top of the
    // diabetic range rather than a number invented for them.
    expect(glucoseScore({ fastingGlucoseMmol: 8, diabetes: true })).toBe(40);
  });

  it('returns null rather than guessing when it cannot place somebody', () => {
    expect(glucoseScore({})).toBeNull();
  });
});

describe('freshness', () => {
  it('counts a reading inside its window', () => {
    expect(freshness('2026-09-01T00:00:00.000Z', TODAY, BP_FRESH_DAYS).fresh).toBe(true);
  });

  it('keeps an expired reading but stops counting it', () => {
    const old = freshness('2023-01-01T00:00:00.000Z', TODAY, PANEL_FRESH_DAYS);
    expect(old.fresh).toBe(false);
    expect(old.line).toMatch(/years ago/);
    expect(old.line).toMatch(/not counted/);
  });

  it('says months for something recent-ish and years for something old', () => {
    expect(freshness('2026-03-01T00:00:00.000Z', TODAY, BP_FRESH_DAYS).line).toMatch(/months ago/);
    expect(freshness('2025-06-01T00:00:00.000Z', TODAY, BP_FRESH_DAYS).line).toMatch(
      /over a year ago/,
    );
  });
});

/* ── Through the markers ──────────────────────────────────────────────── */

describe('the markers screen', () => {
  const plans: Record<string, DailyPlan> = {};
  const base = {
    plans,
    routines: [],
    intentions: [],
    events: [],
    today: TODAY,
  };
  const component = (metrics: MetricObservation[], key: string, extra = {}) =>
    weekHealth({ ...base, metrics, ...extra }).components.find((c) => c.key === key)!;

  it('scores blood pressure once somebody types it in', () => {
    const c = component(
      [obs('body.bpSystolic', 118), obs('body.bpDiastolic', 74)],
      'bloodPressure',
    );
    expect(c.score).toBe(100);
    expect(c.detail).toBe('118/74');
    expect(c.blocked).toBeUndefined();
  });

  it('says on treatment where it is, and scores it that way', () => {
    const c = component([obs('body.bpSystolic', 118), obs('body.bpDiastolic', 74)], 'bloodPressure', {
      bpMedication: true,
    });
    expect(c.score).toBe(80);
    expect(c.detail).toContain('on treatment');
  });

  it('shows an old reading and refuses to count it', () => {
    const c = component(
      [
        obs('body.bpSystolic', 118, '2024-01-01T00:00:00.000Z'),
        obs('body.bpDiastolic', 74, '2024-01-01T00:00:00.000Z'),
      ],
      'bloodPressure',
    );
    expect(c.detail).toBe('118/74');
    expect(c.score).toBeNull();
    expect(c.blocked).toMatch(/not counted/);
  });

  it('still says what it needs when there is nothing', () => {
    const c = component([], 'bloodPressure');
    expect(c.score).toBeNull();
    expect(c.blocked).toMatch(/cuff/i);
    expect(component([], 'lipids').blocked).toMatch(/blood test/i);
    expect(component([], 'glucose').blocked).toMatch(/blood test/i);
  });

  it('takes the composite past half the construct', () => {
    // The point of the whole exercise: four of eight observed becomes
    // seven of eight, and the three that carry the most risk are in it.
    const metrics = [
      obs('body.height', 180),
      obs('body.weight', 78),
      obs('body.bpSystolic', 118),
      obs('body.bpDiastolic', 74),
      obs('blood.totalCholesterol', 4.6),
      obs('blood.hdl', 1.5),
      obs('blood.hba1c', 5.2),
      obs('sleep.hours', 7.5),
    ];
    const week = weekHealth({ ...base, metrics, nicotine: 'never' });
    const keys = week.observed.map((c) => c.key);
    expect(keys).toContain('bloodPressure');
    expect(keys).toContain('lipids');
    expect(keys).toContain('glucose');

    // Same person, same everything, without the three readings. Diet never
    // scores (the construct wants a dietary-pattern questionnaire) and
    // activity needs a week of plans to read, so the ceiling here is six.
    const without = weekHealth({
      ...base,
      metrics: metrics.filter((m) => !m.key.startsWith('blood.') && !m.key.startsWith('body.bp')),
      nicotine: 'never',
    });
    expect(without.observed.length).toBe(3);
    expect(week.observed.length).toBe(6);
  });
});

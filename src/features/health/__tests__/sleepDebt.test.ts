import type { MetricObservation } from '@/features/model/metrics';
import { bedtimeToRecover, energyShape, hoursLabel, sleepDebt, sleepNeed } from '../sleepDebt';

const now = new Date('2026-09-04T07:00:00+10:00');
const night = (daysAgo: number, hours: number): MetricObservation => ({
  id: 'n' + daysAgo, key: 'sleep.hours', value: hours, source: 'healthkit',
  at: new Date(now.getTime() - daysAgo * 86400e3).toISOString(),
});

describe('sleep need', () => {
  it('defaults until a week of nights exists', () => {
    expect(sleepNeed([night(1, 6), night(2, 6)], now)).toEqual({ needH: 7.5, from: 'default' });
  });
  it('comes from the person’s longer nights and stays in the adult range', () => {
    const nights = [8.2, 6.1, 7.4, 8.0, 6.5, 7.9, 8.1, 5.9, 7.7, 8.3].map((h, i) => night(i + 1, h));
    const n = sleepNeed(nights, now);
    expect(n.from).toBe('nights');
    expect(n.needH).toBeGreaterThanOrEqual(7.75);
    expect(n.needH).toBeLessThanOrEqual(8.25);
    const huge = Array.from({ length: 10 }, (_, i) => night(i + 1, 10.5));
    expect(sleepNeed(huge, now).needH).toBe(9);
  });
});

describe('sleep debt', () => {
  it('is null with too few nights', () => {
    expect(sleepDebt([night(1, 5)], now)).toBeNull();
  });
  it('adds the shortfall, weighting the older half of the window at half', () => {
    // Fourteen nights of 6.5h. The need comes from those nights and is
    // clamped up to the adult floor of 7h, so each night is 30m short.
    const nights = Array.from({ length: 14 }, (_, i) => night(i + 1, 6.5));
    const d = sleepDebt(nights, now)!;
    expect(d.needFrom).toBe('nights');
    expect(d.needH).toBe(7);
    // 7 recent nights × 0.5h + 7 older nights × 0.25h
    expect(d.debtH).toBe(5.25);
    expect(d.band).toBe('well-behind');
    expect(d.averageH).toBe(6.5);
  });
  it('is even when the nights cover the need', () => {
    const nights = Array.from({ length: 14 }, (_, i) => night(i + 1, 7.6));
    expect(sleepDebt(nights, now)!.band).toBe('even');
  });
  it('one reading per night: the last write for a date wins', () => {
    const dup = [...Array.from({ length: 6 }, (_, i) => night(i + 1, 7.5)), { ...night(1, 4), id: 'late', at: night(1, 4).at.replace('T21', 'T22') }];
    const d = sleepDebt(dup, now)!;
    expect(d.nights).toBe(6);
  });
});

describe('bedtime and energy', () => {
  it('names the bedtime that gives the need, and what it recovers', () => {
    const b = bedtimeToRecover('06:30', 8, '23:00')!;
    expect(b.bedtime).toBe('22:30');
    expect(b.recoversH).toBe(0.5);
    expect(bedtimeToRecover('06:30', 7, '23:00')).toBeNull();
    expect(bedtimeToRecover('05:00', 9, '22:00')!.bedtime).toBe('20:00');
  });
  it('shapes the day from wake time and chronotype', () => {
    const m = energyShape('06:30', 'morning');
    expect(m.peak).toEqual({ start: '08:30', end: '10:30' });
    expect(m.dip.start).toBe('13:30');
    const e = energyShape('06:30', 'evening');
    expect(e.peak.start).toBe('11:30');
  });
  it('labels hours the way people say them', () => {
    expect(hoursLabel(3.25)).toBe('3h 15m');
    expect(hoursLabel(2)).toBe('2h');
    expect(hoursLabel(0.5)).toBe('30m');
  });
});

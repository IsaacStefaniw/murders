/**
 * The largest week-shape gap in the product.
 *
 * The scheduler has always handled hours crossing midnight. What it could
 * not do was be TOLD about a week that is not the same every week: a
 * profile holds one set of work hours and one wake time, so a nurse on
 * four-on-four-off would have rebuilt her week by hand every week until
 * she stopped. That is the failure mode where a scheduling advantage
 * collapses under maintenance, and it applies to about half this audience.
 */
import { describeCycle, profileForDate, rotationOf, shiftOn } from '@/features/roster/roster';
import type { LifeProfile } from '@/types/domain';

const NIGHTS = rotationOf(
  4,
  4,
  { label: 'Nights', start: '19:00', end: '07:30', wakeTime: '15:00', sleepTime: '09:00' },
  '2026-09-07', // a Monday
);

const withRoster = (p: LifeProfile): LifeProfile => ({ ...p, roster: NIGHTS });

const plain = {
  firstName: 'Sam',
  priorities: ['health'],
  people: [],
  workDays: [1, 2, 3, 4, 5],
  workStart: '09:00',
  workEnd: '17:00',
  wakeTime: '06:30',
  sleepTime: '22:30',
  energyProfile: 'morning',
  capacity: 'steady',
  trainingDaysPerWeek: 3,
  trainingDurationMin: 45,
  trainingPreference: 'gym',
  moreOf: [],
  lessOf: [],
  createdAt: '',
  updatedAt: '',
} as unknown as LifeProfile;

const base = withRoster(plain);

it('repeats a rotation of any length, forwards and backwards', () => {
  expect(shiftOn(NIGHTS, '2026-09-07')?.label).toBe('Nights');
  expect(shiftOn(NIGHTS, '2026-09-10')?.label).toBe('Nights');
  expect(shiftOn(NIGHTS, '2026-09-11')?.label).toBe('Off');
  expect(shiftOn(NIGHTS, '2026-09-15')?.label).toBe('Nights');
  // A roster entered today still describes last week, which is what the
  // weekly review reads when it looks back over a fortnight.
  expect(shiftOn(NIGHTS, '2026-09-03')?.label).toBe('Off');
});

it('gives the planner this date’s hours and this date’s wake time', () => {
  const p = profileForDate(base, '2026-09-08');
  expect(p.workStart).toBe('19:00');
  expect(p.workEnd).toBe('07:30');
  // The whole point. A wake-anchored practice already moved with the wake
  // time; it was the wake time that was wrong.
  expect(p.wakeTime).toBe('15:00');
  expect(p.sleepTime).toBe('09:00');
});

it('does not plan the morning after a night shift as a free morning', () => {
  // 11 Sep is the first day off, and the night that started on the 10th
  // is still running until half seven that morning.
  const p = profileForDate(base, '2026-09-11');
  expect(p.workStart).toBe('19:00');
  expect(p.workEnd).toBe('07:30');
  expect(p.workDays).toContain(4); // Thursday the 10th, the shift that spills over
});

it('leaves a day off as a day off once the night has cleared', () => {
  const p = profileForDate(base, '2026-09-12');
  expect(p.workDays).toEqual([]);
});

it('changes nothing at all for somebody without a roster', () => {
  expect(profileForDate(base, '2026-09-08')).not.toBe(base);
  expect(profileForDate(plain, '2026-09-08')).toBe(plain);
});

it('describes the rotation in the words the person entered', () => {
  expect(describeCycle(NIGHTS)).toContain('8-day rotation');
  expect(describeCycle(NIGHTS)).toContain('Nights');
  expect(describeCycle(undefined)).toBe('No rotation set');
});

it('survives a rotation of one day', () => {
  const every = rotationOf(1, 0, { label: 'On', start: '09:00', end: '17:00' }, '2026-09-07');
  expect(shiftOn(every, '2026-09-30')?.label).toBe('On');
});

/**
 * "15 planned" was the review's third finding and the easiest to dismiss.
 *
 * It is not a cosmetic count. A person glancing at their week sees a
 * number and reads it as how much is being asked of them, and on an
 * ordinary Tuesday most of that number is the work block and the school
 * run — things they already knew about and cannot move. The app was
 * reporting the size of its own calendar rather than the size of the ask.
 */
import { dayCount, dayCountLine } from '@/features/planner/dayCount';
import type { PlanItem } from '@/types/domain';

const item = (over: Partial<PlanItem>): PlanItem => ({
  id: Math.random().toString(36).slice(2),
  date: '2026-09-08',
  start: '09:00',
  end: '10:00',
  title: 'Something',
  area: 'health',
  tier: 'should',
  status: 'planned',
  fixed: false,
  ...over,
});

it('separates what the day asks from what was already committed', () => {
  const items = [
    item({ title: 'Work', fixed: true }),
    item({ title: 'School run', fixed: true }),
    item({ title: 'Morning light' }),
  ];
  expect(dayCount(items)).toEqual({ forYou: 1, booked: 2 });
  expect(dayCountLine(items)).toBe('1 for you · 2 booked');
});

it('never says a number that reads as an obligation when there is none', () => {
  const items = [item({ title: 'Work', fixed: true })];
  // The failure this guards: a day whose only entry is the work block
  // reading as "1 planned", which is an instruction to do something.
  expect(dayCountLine(items)).toBe('nothing for you · 1 booked');
});

it('says nothing about bookings when there are none', () => {
  expect(dayCountLine([item({}), item({})])).toBe('2 for you');
});

it('calls an empty day open rather than zero', () => {
  expect(dayCountLine([])).toBe('Open');
});

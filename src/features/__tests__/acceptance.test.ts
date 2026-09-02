/**
 * THE acceptance test.
 *
 * A user tells IntentNorth: spouse, two kids, demanding job, business growth,
 * strength training, reducing alcohol/vaping, staying close to friends,
 * more fun and adventure. Across the generated week, the calendar must
 * visibly resemble that life. If any stated priority leaves no trace in
 * the week, the system has failed regardless of architecture.
 */

import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { generateDailyPlan } from '@/features/planner/generate';
import { detectAnticipationGap } from '@/features/anticipation/lookAhead';
import type { InterviewAnswers } from '@/features/onboarding/script';
import type { PlanItem } from '@/types/domain';

const answers: InterviewAnswers = {
  name: 'Isaac',
  priorities: ['family', 'health', 'work'],
  household: ['partner', 'kids'],
  partnerName: 'Anna',
  workDays: ['1', '2', '3', '4', '5'],
  workHours: '09:00-17:30',
  sleep: '06:30-22:30',
  energy: 'midday',
  trainingDays: '4',
  trainingSetup: 'gym',
  moreOf: ['Date nights', 'Seeing friends', 'Time with the kids', 'Deep work'],
  lessOf: ['alcohol', 'vaping'],
  ambition: 'Grow the business',
};

describe('acceptance: the generated week resembles the stated life', () => {
  const plan = buildLifeOperatingPlan(answers);
  // A full week, Monday to Sunday.
  const week: PlanItem[] = ['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13']
    .flatMap((date) => generateDailyPlan(plan.profile, plan.routines, date).items);

  const titles = week.map((i) => i.title);

  it('my relationship matters → protected couple time appears', () => {
    expect(titles).toContain('Date night');
  });

  it('my family matters → meaningful family time appears, not just logistics', () => {
    expect(titles.filter((t) => t === 'Family dinner').length).toBeGreaterThanOrEqual(5);
    expect(titles).toContain('Family adventure');
    expect(titles).toContain('One-on-one time with each kid');
  });

  it('my health matters → training appears at the stated cadence', () => {
    expect(titles.filter((t) => t === 'Strength workout').length).toBe(4);
  });

  it('my business matters → focused work appears inside work hours', () => {
    const blocks = week.filter((i) => i.title === 'Deep work block');
    expect(blocks.length).toBeGreaterThanOrEqual(2);
    expect(blocks.every((b) => b.fixed)).toBe(true);
  });

  it('my friends matter → a concrete connection action appears', () => {
    expect(titles).toContain('Message a friend, make a plan');
  });

  it('the habits I am reducing are tracked supportively', () => {
    expect(plan.behaviourIntentions.map((b) => b.behaviour).sort()).toEqual(['alcohol', 'vaping']);
  });

  it('I need excitement → the week contains enjoyable moments, so no anticipation nag fires', () => {
    const special = week.filter(
      (i) => !i.fixed && (i.area === 'relationship' || i.area === 'family' || i.area === 'enjoyment'),
    );
    expect(special.length).toBeGreaterThan(0);
    // And because the week already holds things to look forward to, the
    // anticipation engine stays quiet — no spam.
    const plans = Object.fromEntries(
      ['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13'].map(
        (d) => [d, generateDailyPlan(plan.profile, plan.routines, d)],
      ),
    );
    expect(detectAnticipationGap('2026-09-07', plans, plan.routines, plan.profile)).toBeNull();
  });

  it('an empty week does trigger exactly one anticipation suggestion', () => {
    const emptyProfile = { ...plan.profile, moreOf: [] };
    const suggestion = detectAnticipationGap('2026-09-07', {}, [], emptyProfile);
    expect(suggestion).not.toBeNull();
    expect(suggestion!.kind).toBe('connection');
    expect(suggestion!.message).not.toMatch(/great job|streak|crush/i);
  });

  it('a day is never packed solid — slack survives', () => {
    const monday = generateDailyPlan(plan.profile, plan.routines, '2026-09-07');
    // Fixed work + placed routines must leave breathing room before sleep.
    const lastEnd = Math.max(...monday.items.map((i) => toMin(i.end)));
    expect(lastEnd).toBeLessThan(toMin('22:30'));
  });
});

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

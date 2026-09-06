import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import type { InterviewAnswers } from '@/features/onboarding/script';
import { PATHS } from '@/features/paths/definitions';
import { generateDailyPlan } from '@/features/planner/generate';
import { mergeRoutines } from '@/features/planner/mergeRoutines';

/**
 * One of each thing on a day, whatever combination of coaches is running.
 *
 * The example day was the first place anyone looked at a full Monday with
 * every pathway started, and it carried two family dinners, two identical
 * breath resets, a shutdown ritual at ten to nine and two fifteen-minute
 * slivers titled "Work". Each is a real user's day, not a preview bug.
 */
const ANSWERS: InterviewAnswers = {
  name: 'Sam',
  weekShape: 'employed',
  priorities: ['health', 'family', 'work'],
  capacity: 'steady',
  workDays: ['1', '2', '3', '4', '5'],
  workHours: '09:00-17:30',
  sleep: '06:30-22:30',
  energy: 'morning',
  trainingDays: '3',
  household: ['partner', 'kids'],
  kidsCount: '2',
  sleepQuality: 'broken',
  mind: ['breathing'],
  lessOf: ['doomscrolling'],
  moreOf: ['Deep work'],
  ambition: 'Get strong again without losing the evenings',
};

function fullMonday() {
  const plan = buildLifeOperatingPlan(ANSWERS);
  let routines = plan.routines;
  const starts = [
    ...plan.pathStarts,
    { id: 'training' as const, answers: { experience: 'returning', level: 'foundation' } },
    { id: 'work' as const, answers: { style: 'maker' } },
    { id: 'family' as const, answers: {} },
  ];
  for (const s of starts) {
    routines = mergeRoutines(routines, PATHS[s.id].build(s.answers, plan.profile).routines);
  }
  return generateDailyPlan(plan.profile, routines, '2026-09-07');
}

describe('a full Monday with every coach running', () => {
  const day = fullMonday();
  const titles = day.items.map((i) => i.title);

  it('has one family dinner, not the interview\'s and the pathway\'s', () => {
    expect(titles.filter((t) => /dinner|family meal/i.test(t))).toHaveLength(1);
  });

  it('has one breath reset in the evening, not the build\'s and the rung\'s', () => {
    expect(titles.filter((t) => /reset/i.test(t))).toHaveLength(1);
  });

  it('closes the work day with the shutdown, inside the work hours', () => {
    const shutdown = day.items.find((i) => /Shutdown/.test(i.title));
    expect(shutdown).toBeDefined();
    expect(shutdown!.end).toBe('17:30');
    expect(shutdown!.fixed).toBe(true);
  });

  it('never shows a sliver of work shorter than half an hour', () => {
    for (const item of day.items.filter((i) => i.title === 'Work')) {
      const [sh, sm] = item.start.split(':').map(Number);
      const [eh, em] = item.end.split(':').map(Number);
      expect(eh * 60 + em - (sh * 60 + sm)).toBeGreaterThanOrEqual(30);
    }
  });

  it('runs from the morning to the wind-down', () => {
    expect(day.items[0].start < '08:00').toBe(true);
    expect(day.items[day.items.length - 1].start > '21:00').toBe(true);
  });
});

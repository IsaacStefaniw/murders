/**
 * The week has a shape, and the coach says what it is.
 *
 * The line at the top matters more than the arithmetic under it: a person
 * reading this on a Thursday having done nothing needs a way back in, not
 * a sum.
 */
import { buildWeekShape, weekLine, type PillarWeek } from '@/features/review/weekShape';
import type { DailyPlan, PlanItem, Routine } from '@/types/domain';

const dates = Array.from({ length: 7 }, (_, i) => `2026-09-${String(7 + i).padStart(2, '0')}`);

const routine = (id: string, protocolId: string): Routine => ({
  id,
  title: id,
  area: 'health',
  protocolId,
  days: [1, 3, 5],
  durationMin: 45,
  preferredStart: '18:00',
  preferredEnd: '19:00',
  energy: 'any',
  flexible: true,
  protected: false,
  tier: 'should',
  active: true,
});

const item = (over: Partial<PlanItem> & { id: string; date: string }): PlanItem => ({
  start: '18:00',
  end: '18:45',
  title: 'Session',
  area: 'health',
  tier: 'should',
  status: 'planned',
  fixed: false,
  ...over,
});

const plansFrom = (items: PlanItem[]): Record<string, DailyPlan> => {
  const out: Record<string, DailyPlan> = {};
  for (const i of items) {
    out[i.date] ??= { date: i.date, items: [] };
    out[i.date].items.push(i);
  }
  return out;
};

describe('the week aggregates by pillar', () => {
  // 'strength' is training and graded A; 'morning-light' is sleep, graded B.
  const routines = [routine('r-str', 'strength'), routine('r-light', 'morning-light')];

  it('counts sessions and minutes, done and intended', () => {
    const plans = plansFrom([
      item({ id: 'a', date: dates[0], routineId: 'r-str', status: 'completed' }),
      item({ id: 'b', date: dates[2], routineId: 'r-str' }),
      item({ id: 'c', date: dates[1], routineId: 'r-light', start: '07:00', end: '07:10' }),
    ]);
    const w = buildWeekShape(dates, plans, routines, dates[0]);

    expect(w.intended).toBe(3);
    expect(w.done).toBe(1);
    const training = w.pillars.find((p) => p.pillar === 'training')!;
    expect(training.intended).toBe(2);
    expect(training.done).toBe(1);
    expect(training.intendedMin).toBe(90);
  });

  it('leads with the pillar carrying the most of the week', () => {
    const plans = plansFrom([
      item({ id: 'a', date: dates[0], routineId: 'r-str' }),
      item({ id: 'b', date: dates[2], routineId: 'r-str' }),
      item({ id: 'c', date: dates[1], routineId: 'r-light', start: '07:00', end: '07:10' }),
    ]);
    expect(buildWeekShape(dates, plans, routines, dates[0]).pillars[0].pillar).toBe('training');
  });

  it('ignores fixed commitments and anything with no protocol behind it', () => {
    const plans = plansFrom([
      item({ id: 'work', date: dates[0], fixed: true, title: 'Work' }),
      item({ id: 'own', date: dates[0], routineId: 'not-a-routine' }),
    ]);
    expect(buildWeekShape(dates, plans, routines, dates[0]).intended).toBe(0);
  });
});

describe('the line at the top of the week', () => {
  const training: PillarWeek = {
    pillar: 'training',
    label: 'Training',
    intended: 3,
    done: 0,
    intendedMin: 135,
    doneMin: 0,
    bestGrade: 'A',
  };

  it('names the week and its best-evidenced part when nothing has started', () => {
    const line = weekLine([training], 3, 0, dates, dates[0]);
    expect(line).toContain('3 sessions this week');
    expect(line).toContain('best-evidenced');
  });

  it('celebrates a finished week without asking for more', () => {
    const line = weekLine([{ ...training, done: 3 }], 3, 3, dates, dates[0]);
    expect(line).toContain('whole week done');
    expect(line).toContain('bonus');
  });

  it('gives the arithmetic when the week is still winnable', () => {
    const line = weekLine([{ ...training, done: 1 }], 3, 1, dates, dates[4]);
    expect(line).toContain('1 of 3 done');
    expect(line).toContain('2 sessions left');
  });

  it('never scolds a week that has run out of room — it names one thing', () => {
    // Thursday, one done of five, two days left. The sum is not the point.
    const line = weekLine([{ ...training, intended: 5 }], 5, 1, dates, dates[5]);
    expect(line).toContain('pick the training one');
    expect(line).toContain('let the rest go');
    expect(line).not.toMatch(/behind|failed|missed|should have/i);
  });

  it('says so plainly when there is nothing on', () => {
    expect(weekLine([], 0, 0, dates, dates[0])).toBe('Nothing scheduled this week yet.');
  });
});

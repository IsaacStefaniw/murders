/**
 * The week has a shape, and the coach says what it is.
 *
 * The line at the top matters more than the arithmetic under it: a person
 * reading this on a Thursday having done nothing needs a way back in, not
 * a sum.
 */
import { balanceLine, buildWeekShape, weekLine, type PillarWeek } from '@/features/review/weekShape';
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
    balanceLed: false,
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

/* ── The holistic reading ─────────────────────────────────────────────── */

/**
 * Isaac: balance is "evidenced more holistically than specifically". So
 * the week gets a reading that is not a score: which parts of the life the
 * person named this week has something in it for, and which it misses.
 */
describe('the balance reading', () => {
  it('says nothing at all when the person has not said what matters', () => {
    expect(balanceLine(4, [], [])).toBe('');
  });

  it('names what the week has nothing for', () => {
    expect(balanceLine(4, ['health', 'family'], ['family'])).toBe(
      'Nothing for family this week.',
    );
  });

  it('lists several without turning into a table', () => {
    expect(balanceLine(4, ['health', 'family', 'relationship'], ['family', 'relationship'])).toBe(
      'Nothing for family or your relationship this week.',
    );
  });

  it('says so when the week covers everything they named', () => {
    expect(balanceLine(4, ['health', 'family'], [])).toContain('has something in it');
  });

  /**
   * A week that misses every priority is a week that has not been built
   * yet, or a week in pieces. Either way the reading has nothing useful to
   * add and would only read as a verdict.
   */
  it('stays quiet rather than listing a person\'s whole life back at them', () => {
    expect(balanceLine(4, ['health', 'family'], ['health', 'family'])).toBe('');
  });

  it('never scores, rates or grades', () => {
    const said = balanceLine(4, ['health', 'family'], ['family']);
    expect(said).not.toMatch(/%|\d+\s*\/\s*\d+|score|\b[ABCDE]\b/);
  });
});

/**
 * The grade tiebreak used to sort a week of family time underneath a week
 * of Zone 2, because family practices grade themselves honestly at D.
 */
describe('a week led by the people in it', () => {
  const pillarOf = (over: Partial<PillarWeek>): PillarWeek => ({
    pillar: 'connection',
    label: 'Connection',
    intended: 2,
    done: 0,
    intendedMin: 200,
    doneMin: 0,
    bestGrade: 'E',
    balanceLed: true,
    ...over,
  });

  it('is not told to start with whichever is easiest', () => {
    const line = weekLine([pillarOf({})], 2, 0, dates, dates[0]);
    expect(line).toContain('in your week anyway');
    expect(line).not.toContain('easiest to say yes to');
  });

  it('still says which is best-evidenced when that is what the week is', () => {
    const line = weekLine(
      [pillarOf({ pillar: 'training', label: 'Training', bestGrade: 'A', balanceLed: false })],
      2,
      0,
      dates,
      dates[0],
    );
    expect(line).toContain('best-evidenced');
  });
});

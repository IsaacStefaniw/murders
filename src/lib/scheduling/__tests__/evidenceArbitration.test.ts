/**
 * The grade decides something.
 *
 * evidenceLevel has been on every protocol since the library existed and
 * has influenced no placement, no arbitration and no cut. These tests pin
 * the behaviour that changes that, and — more importantly — the two
 * properties that keep it from doing harm.
 */
import { buildDailyPlan, compareEvidence } from '@/lib/scheduling/engine';
import type { Routine } from '@/types/domain';

const routine = (over: Partial<Routine> & { id: string; title: string }): Routine => ({
  area: 'health',
  days: [1, 2, 3, 4, 5],
  durationMin: 60,
  preferredStart: '18:00',
  preferredEnd: '19:00',
  energy: 'any',
  flexible: true,
  protected: false,
  tier: 'could',
  active: true,
  ...over,
});

const MONDAY = '2026-09-07';

const planWith = (routines: Routine[], evidenceRank: Record<string, number>) =>
  buildDailyPlan({
    date: MONDAY,
    wakeTime: '07:00',
    sleepTime: '22:00',
    fixed: [],
    routines,
    evidenceRank,
    // Almost no slack, so the day has to choose between them.
    reservedFreeFraction: 0.92,
  });

describe('compareEvidence', () => {
  const a = routine({ id: 'a', title: 'A' });
  const b = routine({ id: 'b', title: 'B' });

  it('puts the better-evidenced routine first', () => {
    expect(compareEvidence(a, b, { a: 0, b: 3 })).toBeLessThan(0);
    expect(compareEvidence(a, b, { a: 3, b: 0 })).toBeGreaterThan(0);
  });

  it('is silent when either side has no grade', () => {
    expect(compareEvidence(a, b, { a: 0 })).toBe(0);
    expect(compareEvidence(a, b, { b: 0 })).toBe(0);
    expect(compareEvidence(a, b, {})).toBe(0);
  });
});

describe('the better-evidenced practice gets the hour it wants', () => {
  // Both fit; they simply both want 18:00. Whoever is seated first gets it.
  const roomy = (routines: Routine[], evidenceRank: Record<string, number>) =>
    buildDailyPlan({
      date: MONDAY,
      wakeTime: '07:00',
      sleepTime: '22:00',
      fixed: [],
      routines,
      evidenceRank,
    });

  const startOf = (plan: ReturnType<typeof roomy>, title: string) =>
    plan.items.find((i) => i.title === title)?.start;

  it('seats the A at its preferred time and moves the D', () => {
    const strong = routine({ id: 'strong', title: 'Strength training' });
    const weak = routine({ id: 'weak', title: 'Early-days practice' });

    const plan = roomy([weak, strong], { strong: 0, weak: 3 });
    expect(startOf(plan, 'Strength training')).toBe('18:00');
    expect(startOf(plan, 'Early-days practice')).not.toBe('18:00');
  });

  it('reverses with the grades — it is the grade, not the list order', () => {
    const first = routine({ id: 'first', title: 'First in the list' });
    const second = routine({ id: 'second', title: 'Second in the list' });

    const plan = roomy([first, second], { first: 4, second: 0 });
    expect(startOf(plan, 'Second in the list')).toBe('18:00');
  });

  it('both are still on the day — nothing was traded for the ordering', () => {
    const strong = routine({ id: 'strong', title: 'Strength training' });
    const weak = routine({ id: 'weak', title: 'Early-days practice' });

    const plan = roomy([weak, strong], { strong: 0, weak: 3 });
    expect(plan.items.filter((i) => !i.fixed)).toHaveLength(2);
    expect(plan.unplaced).toHaveLength(0);
  });
});

describe('the tie-break has to be free', () => {
  it('never costs the day an activity, however tight it is', () => {
    // Five routines and almost no slack: something must go. Whatever that
    // is, it must be the same with and without grades — a grade may choose
    // the hour, never whether the person gets to do the thing at all.
    const many = Array.from({ length: 5 }, (_, n) =>
      routine({ id: `r${n}`, title: `Practice ${n}` }),
    );
    const tight = (evidenceRank: Record<string, number>) =>
      buildDailyPlan({
        date: MONDAY,
        wakeTime: '07:00',
        sleepTime: '22:00',
        fixed: [],
        routines: many,
        evidenceRank,
        reservedFreeFraction: 0.85,
      });

    const graded = tight({ r0: 4, r1: 3, r2: 2, r3: 1, r4: 0 });
    const ungraded = tight({});

    expect(graded.items.filter((i) => !i.fixed)).toHaveLength(
      ungraded.items.filter((i) => !i.fixed).length,
    );
    expect(graded.unplaced.map((r) => r.id).sort()).toEqual(
      ungraded.unplaced.map((r) => r.id).sort(),
    );
  });
});

describe('what evidence must never do', () => {
  it('never outranks tier — a must survives a better-evidenced could', () => {
    const mustDo = routine({ id: 'must', title: 'School pickup', tier: 'must' });
    const couldDo = routine({ id: 'could', title: 'Well-studied practice' });
    const plan = planWith([mustDo, couldDo], { must: 4, could: 0 });

    expect(plan.items.filter((i) => !i.fixed).map((i) => i.title)).toContain(
      'School pickup',
    );
    expect(plan.unplaced.map((r) => r.id)).toContain('could');
  });

  it('never outranks a goal the person committed to', () => {
    const forGoal = routine({ id: 'goal', title: 'Toward the goal', goalId: 'g1' });
    const graded = routine({ id: 'graded', title: 'Better evidenced' });
    const plan = planWith([forGoal, graded], { goal: 4, graded: 0 });

    expect(plan.items.filter((i) => !i.fixed).map((i) => i.title)).toContain(
      'Toward the goal',
    );
  });

  it("never cuts the person's own habit BECAUSE it is ungraded", () => {
    // The habit has no protocol, so no rank; the other routine is a D.
    // The guarantee is not that the habit always survives — a full day
    // still has to drop something, and that was arbitrary before evidence
    // existed and remains arbitrary here. The guarantee is that the new
    // rule is not what decided it: an ungraded routine is the person's own
    // and must not lose an hour for want of a trial on walking the dog.
    const ownHabit = routine({ id: 'walk', title: 'Walk the dog', established: true });
    const weakProtocol = routine({ id: 'weak', title: 'Early-days practice' });

    const withGrades = planWith([ownHabit, weakProtocol], { weak: 3 });
    const withNone = planWith([ownHabit, weakProtocol], {});

    expect(withGrades.unplaced.map((r) => r.id)).toEqual(
      withNone.unplaced.map((r) => r.id),
    );
  });

});

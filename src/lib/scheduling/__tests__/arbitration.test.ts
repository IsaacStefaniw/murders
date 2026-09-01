import { areaRank, buildDailyPlan } from '@/lib/scheduling/engine';
import type { LifeArea, Routine } from '@/types/domain';

const routine = (over: Partial<Routine> & { title: string; area: LifeArea }): Routine => ({
  id: over.title,
  days: [0, 1, 2, 3, 4, 5, 6],
  durationMin: 60,
  preferredStart: '18:00',
  preferredEnd: '18:30',
  energy: 'any',
  flexible: true,
  protected: false,
  tier: 'should',
  active: true,
  ...over,
});

/**
 * A deliberately small evening: two hours awake, and after the engine's
 * buffer and its reserved slack only one 60-minute routine can fit.
 *
 * This matters. An earlier draft of this test used a whole free day, where
 * everything fits and nothing is ever arbitrated — it would have passed
 * against a scheduler that ignored priorities completely, because the
 * question it claimed to ask was never actually put to the engine.
 */
const day = (routines: Routine[], priorities: LifeArea[]) =>
  buildDailyPlan({
    date: '2026-09-07',
    wakeTime: '18:00',
    sleepTime: '20:00',
    fixed: [],
    routines,
    priorities,
    reservedFreeFraction: 0.1,
  });

const scheduled = (routines: Routine[], priorities: LifeArea[]) =>
  day(routines, priorities).items.filter((i) => !i.fixed).map((i) => i.title);

describe('when two things want the same hour', () => {
  // The interview says, in as many words: "Noted. When two things want the
  // same hour, family wins." Until this test existed, that sentence was
  // false — the scheduler ordered by how narrow a routine's preferred
  // window happened to be, and never read the answer at all.
  const family = routine({ title: 'Family time', area: 'family' });
  const work = routine({ title: 'Work block', area: 'work' });

  it('only one of them can fit — proving they really are competing', () => {
    expect(scheduled([work, family], ['family', 'health', 'work'])).toHaveLength(1);
  });

  it('gives the hour to the area the person put first', () => {
    expect(scheduled([work, family], ['family', 'health', 'work'])).toEqual(['Family time']);
  });

  it('and gives it to the other one when they say the opposite', () => {
    expect(scheduled([family, work], ['work', 'health', 'family'])).toEqual(['Work block']);
  });

  it('does not depend on the order the routines happen to be stored in', () => {
    // The old behaviour was decided by array order and window width — a coin
    // toss wearing a suit. Both arrangements must now agree.
    expect(scheduled([work, family], ['family', 'health', 'work'])).toEqual(
      scheduled([family, work], ['family', 'health', 'work']),
    );
  });
});

describe('what priority is NOT allowed to do', () => {
  it('never lets a favoured area outrank a non-negotiable elsewhere', () => {
    // Health ranked first must not drop the school pickup for a workout.
    const pickup = routine({ title: 'School pickup', area: 'family', tier: 'must' });
    const workout = routine({ title: 'Workout', area: 'health', tier: 'could' });
    expect(scheduled([workout, pickup], ['health', 'work', 'family'])).toEqual([
      'School pickup',
    ]);
  });

  it('never starves a goal just because it lives outside the top three', () => {
    // Ordering by area alone took goals still stalled after ten weeks from
    // 25% to 33% in the cohort simulation: a goal outside someone's top
    // three areas was the first thing cut, every day, and the app then
    // nagged them about a goal its own scheduler had starved.
    const goalBacked = routine({ title: 'Business block', area: 'work', goalId: 'g1' });
    const generic = routine({ title: 'Read', area: 'growth' });
    expect(scheduled([generic, goalBacked], ['growth', 'family', 'health'])).toEqual([
      'Business block',
    ]);
  });
});

describe('areaRank', () => {
  it('ranks in the order given, then everything else, then the unclassified', () => {
    const p: LifeArea[] = ['family', 'health', 'work'];
    expect(areaRank('family', p)).toBe(0);
    expect(areaRank('work', p)).toBe(2);
    expect(areaRank('enjoyment', p)).toBe(3);
    expect(areaRank(undefined, p)).toBe(4);
  });

  it('is stable when nothing was chosen', () => {
    expect(areaRank('family', [])).toBe(0);
    expect(areaRank('work', [])).toBe(0);
  });
});

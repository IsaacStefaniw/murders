import { describeDisplaced, displacedLine } from '@/features/planner/displaced';
import type { LifeArea, Routine } from '@/types/domain';

const r = (title: string, area: LifeArea): Routine =>
  ({ id: title, title, area, days: [1], durationMin: 60 }) as Routine;

const PRIORITIES: LifeArea[] = ['family', 'health', 'work'];

describe('saying which part of life won', () => {
  it('names the winner rather than the loser', () => {
    // "The evening went to family" is a plan doing its job. "You failed to
    // fit your workout" is a scolding, and the fastest way to become
    // another app that nags.
    const displaced = describeDisplaced([r('Deep work', 'work')], [{ area: 'family' }], PRIORITIES);
    const line = displacedLine(displaced)!;
    expect(line).toMatch(/gave way to family/);
    expect(line).not.toMatch(/fail|missed|should have|didn't manage/i);
  });

  it('does not credit a priority that took no part in the day', () => {
    // Attributing a mechanically full day to someone's stated values puts
    // words in their mouth. If family was not scheduled, family did not win.
    const displaced = describeDisplaced([r('Deep work', 'work')], [{ area: 'work' }], PRIORITIES);
    expect(displaced[0].lostTo).toBeUndefined();
    expect(displacedLine(displaced)).toMatch(/the day was full/i);
  });

  it('groups several drops into one decision, not three failures', () => {
    const displaced = describeDisplaced(
      [r('Deep work', 'work'), r('Read', 'growth'), r('Sauna', 'health')],
      [{ area: 'family' }],
      PRIORITIES,
    );
    const line = displacedLine(displaced)!;
    expect(line).toMatch(/3 things gave way to family/);
    expect(line.split('.').filter(Boolean)).toHaveLength(1);
  });

  it('attributes to the highest-ranked area that actually took time', () => {
    const displaced = describeDisplaced(
      [r('Deep work', 'work')],
      [{ area: 'health' }, { area: 'family' }],
      PRIORITIES,
    );
    expect(displaced[0].lostTo).toBe('family');
  });

  it('stays quiet when the whole day fitted', () => {
    expect(displacedLine([])).toBeNull();
    expect(describeDisplaced([], [{ area: 'family' }], PRIORITIES)).toEqual([]);
  });

  it('never treats a full day as something to apologise for', () => {
    const line = displacedLine(describeDisplaced([r('Read', 'growth')], [], PRIORITIES))!;
    expect(line).not.toMatch(/sorry|unfortunately|couldn't|too much/i);
  });
});

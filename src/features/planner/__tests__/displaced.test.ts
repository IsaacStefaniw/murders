import {
  describeDisplaced,
  describeMoved,
  displacedLine,
} from '@/features/planner/displaced';
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

describe('the move, which is what actually happens', () => {
  // Filming the first version proved a drop is rare: a deliberately
  // overloaded evening produced zero drops, because flexible routines spill
  // into whatever gap is left. Four things moved and one kept its hour —
  // and which one kept it is the decision worth naming.
  const kept = [
    { area: 'family' as LifeArea, start: '18:45', end: '19:30' },
    { area: 'health' as LifeArea, start: '19:45', end: '20:30' },
  ];
  const moved = [
    {
      routine: { title: 'Strength workout', area: 'health' as LifeArea, durationMin: 45 },
      from: 18 * 60 + 45,
      to: 19 * 60 + 45,
    },
  ];

  it('names what took the hour, and where the thing went instead', () => {
    const line = displacedLine(describeMoved(moved, kept, PRIORITIES))!;
    expect(line).toMatch(/Strength workout moved to 7:45pm/);
    expect(line).toMatch(/family had the hour/);
  });

  it('reads as a decision, never as a failure', () => {
    const line = displacedLine(describeMoved(moved, kept, PRIORITIES))!;
    expect(line).not.toMatch(/fail|missed|couldn't|sorry|unfortunately/i);
  });

  it('stays silent when nothing higher-ranked was in the window', () => {
    // The day ran out of room for mechanical reasons. Dressing that up as a
    // values decision would be a lie told in a friendly voice.
    const elsewhere = [{ area: 'growth' as LifeArea, start: '07:00', end: '08:00' }];
    expect(describeMoved(moved, elsewhere, PRIORITIES)).toEqual([]);
  });

  it('ignores a move too small for anyone to notice', () => {
    const nudged = [
      {
        routine: { title: 'Read', area: 'growth' as LifeArea, durationMin: 30 },
        from: 20 * 60,
        to: 20 * 60 + 10,
      },
    ];
    // Ten minutes is the plan settling, not a choice. The engine will not
    // even report it, but the describer must not invent meaning either.
    const out = describeMoved(nudged, kept, PRIORITIES);
    expect(out.every((d) => d.movedTo !== undefined)).toBe(true);
  });
});

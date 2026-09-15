import { freeCoachArea, isAlwaysFreeRoutine, runningRoutines } from '@/features/plus/entitlement';
import { PATH_AREA, PATH_ORDER } from '@/features/paths/definitions';
import type { LifeArea, Routine } from '@/types/domain';

/**
 * One coach runs free, and it has to actually run.
 *
 * The first version keyed this on a PathId and looked up that path's goal.
 * Running the real app showed it silently did nothing: only nutrition,
 * money and recovery are ever auto-started, so somebody whose top priority
 * was family had no started family path, no goal id to match, and no free
 * coach at all. Today still read "Dinner together — Plus" after a full
 * interview. Keyed on area it cannot fail that way — the routine either
 * belongs to the part of life they ranked first or it does not.
 */

const routine = (over: Partial<Routine> = {}): Routine =>
  ({
    id: over.id ?? 'r',
    title: 'Dinner together',
    area: 'family',
    days: [1, 2, 3],
    durationMin: 45,
    preferredStart: '18:00',
    tier: 'should',
    active: true,
    ...over,
  }) as Routine;

describe('which coach is free', () => {
  it('is the first priority the person ranked', () => {
    expect(freeCoachArea(['family', 'health', 'work'])).toBe('family');
    expect(freeCoachArea(['work', 'family'])).toBe('work');
    expect(freeCoachArea(['relationship'])).toBe('relationship');
  });

  it('skips priorities with no coach behind them', () => {
    // Growth and enjoyment are real answers with little scheduled behind
    // them; the next ranked area wins rather than nothing being free.
    expect(freeCoachArea(['growth', 'enjoyment', 'work'])).toBe('work');
  });

  it('falls back to health rather than to nothing', () => {
    expect(freeCoachArea(['growth'])).toBe('health');
    expect(freeCoachArea([])).toBe('health');
    expect(freeCoachArea(undefined)).toBe('health');
  });
});

describe('what runs without paying', () => {
  it('runs the whole of the chosen area', () => {
    const rs = [
      routine({ id: 'fam', area: 'family' }),
      routine({ id: 'train', area: 'health', title: 'Strength' }),
    ];
    const free = runningRoutines(rs, false, undefined, 'family');
    expect(free.map((r) => r.id)).toEqual(['fam']);
  });

  it('is the regression: a family priority with no started family path', () => {
    // Exactly the case that shipped broken. No paths, no goalIds, nothing
    // started — and the family routine must still run.
    const fam = routine({ id: 'fam', area: 'family', goalId: undefined });
    expect(isAlwaysFreeRoutine(fam, undefined, freeCoachArea(['family', 'health']))).toBe(true);
  });

  it('never charges for the hardest moment', () => {
    // The standing promise: anything belonging to the recovery goal runs
    // whether or not somebody is Plus, whatever area is free.
    const urge = routine({ id: 'u', area: 'health', goalId: 'g-recovery' });
    expect(isAlwaysFreeRoutine(urge, 'g-recovery', 'family')).toBe(true);
  });

  it('gives Plus everything regardless', () => {
    const rs = [routine({ id: 'a', area: 'family' }), routine({ id: 'b', area: 'work' })];
    expect(runningRoutines(rs, true, undefined, 'family')).toHaveLength(2);
  });

  it('leaves the other areas locked, which is what Plus is for', () => {
    const work = routine({ id: 'w', area: 'work' });
    expect(isAlwaysFreeRoutine(work, undefined, 'family' as LifeArea)).toBe(false);
  });
});


/**
 * The Coaches tab advertises the free coach from the same rule Today
 * places it by. Until `PATH_AREA` existed the tab read every non-recovery
 * coach as "Plus puts its sessions into your days", including the one
 * already running for nothing — the app disagreeing with itself about
 * what somebody had paid for.
 */
describe('the tab and the day agree', () => {
  it('maps every coach to the area its routines carry', () => {
    for (const id of PATH_ORDER) expect(PATH_AREA[id]).toBeDefined();
    expect(PATH_AREA.family).toBe('family');
    expect(PATH_AREA.work).toBe('work');
    // Three coaches share `health` on purpose: a free health area really
    // does run training, nutrition and the urge tools.
    expect([PATH_AREA.training, PATH_AREA.nutrition, PATH_AREA.recovery]).toEqual([
      'health',
      'health',
      'health',
    ]);
  });

  it('marks free exactly the coaches whose routines run free', () => {
    const freeArea = freeCoachArea(['family', 'health']);
    const free = PATH_ORDER.filter((id) => PATH_AREA[id] === freeArea);
    expect(free).toEqual(['family']);
    expect(
      isAlwaysFreeRoutine(
        { id: 'r', title: 'Dinner together', area: 'family', active: true } as Routine,
        undefined,
        freeArea,
      ),
    ).toBe(true);
  });
});

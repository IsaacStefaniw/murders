import { availableStartsFor, freeEndAtOrBefore } from '@/features/planner/generate';
import { smartMoveOptions } from '@/features/planner/moveOptions';
import { toMinutes } from '@/lib/dates';
import type { DailyPlan, LifeProfile, PlanItem } from '@/types/domain';

const at = (start: string, end: string, title: string, patch: Partial<PlanItem> = {}): PlanItem => ({
  id: title, date: '2026-09-01', start, end, title,
  area: 'health', tier: 'should', status: 'planned', fixed: false, ...patch,
});

/** The day from the bug report: two work blocks and a crowded lunch break. */
const items: PlanItem[] = [
  at('07:05', '07:10', 'Cold-shower finish'),
  at('08:00', '12:00', 'Work', { fixed: true, area: 'work' }),
  at('12:15', '13:15', 'Strength training', { id: 'training' }),
  at('13:30', '17:30', 'Work', { fixed: true, area: 'work', id: 'work2' }),
  at('17:45', '18:15', 'The daily walk'),
  at('19:30', '19:45', 'Hold the eating window'),
  at('21:55', '22:15', 'Wind down, screens away'),
];
const plan: DailyPlan = { date: '2026-09-01', items };
const profile = { wakeTime: '06:30', sleepTime: '22:30' } as LifeProfile;
const training = items.find((i) => i.id === 'training')!;

describe('moving something on a full day', () => {
  /**
   * Stepping by a whole hour from a window that opens at 18:25 produced
   * exactly ONE time for the entire evening, which reads as "there is
   * nowhere to put this" when there is nearly two hours free.
   */
  it('offers times through the evening, not one', () => {
    const slots = availableStartsFor(training, plan, profile, 12);
    expect(slots.length).toBeGreaterThan(1);
    expect(slots).toContain('20:00');
  });

  it('offers times a person would actually pick', () => {
    for (const s of availableStartsFor(training, plan, profile, 12)) {
      expect(Number(s.slice(3)) % 15).toBe(0);
    }
  });

  /**
   * Filling the list in window order let one wide gap consume every slot,
   * hiding whether anything later in the day was free at all.
   */
  it('does not let one early gap use up the whole list', () => {
    const short = at('09:00', '09:20', 'Ten minutes', { id: 'short' });
    const withShort: DailyPlan = { ...plan, items: [...items, short] };
    const slots = availableStartsFor(short, withShort, profile, 6);
    const morning = slots.filter((s) => s < '12:00').length;
    expect(morning).toBeLessThan(slots.length);
  });

  it('still refuses to offer a time that would overlap something', () => {
    const slots = availableStartsFor(training, plan, profile, 24);
    const busy = items.filter((i) => i.id !== training.id);
    for (const s of slots) {
      const start = Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
      const end = start + 60;
      for (const b of busy) {
        const bs = Number(b.start.slice(0, 2)) * 60 + Number(b.start.slice(3));
        const be = Number(b.end.slice(0, 2)) * 60 + Number(b.end.slice(3));
        expect(bs < end && be > start).toBe(false);
      }
    }
  });

  it('says the day is full rather than offering nothing, when it is', () => {
    const packed: DailyPlan = {
      ...plan,
      items: [...items, at('18:25', '21:55', 'Evening with the family', { id: 'evening' })],
    };
    const { options, allSlots } = smartMoveOptions(training, packed, profile, 13 * 60);
    expect(allSlots).toEqual([]);
    // Only "Tomorrow" survives — which is why the UI now explains itself.
    expect(options.map((o) => o.kind)).toEqual(['tomorrow']);
  });
});

describe('logging something after it happened', () => {
  it('places it clear of what is already on the day', () => {
    // A 30-minute walk reported as ending 12:30, straight into a work block.
    const end = freeEndAtOrBefore(items, 12 * 60 + 30, 30);
    expect(end).toBeLessThanOrEqual(12 * 60);
  });

  /**
   * Backwards, never forwards: the thing already happened, so the honest
   * placement is as close to the reported time as reality allows.
   */
  it('never moves it later than it was reported', () => {
    for (const reported of [8 * 60, 12 * 60 + 30, 14 * 60, 20 * 60]) {
      expect(freeEndAtOrBefore(items, reported, 30)).toBeLessThanOrEqual(reported);
    }
  });

  it('leaves a clear time exactly where it was reported', () => {
    expect(freeEndAtOrBefore(items, 19 * 60, 30)).toBe(19 * 60);
  });

  /**
   * A real event that overlaps beats a tidy fiction — if the day genuinely
   * cannot hold it, it stays where the person said it happened.
   */
  it('keeps the reported time when nothing fits at all', () => {
    const solid = [at('06:30', '22:30', 'Solid', { id: 'solid' })];
    expect(freeEndAtOrBefore(solid, 14 * 60, 60, 6 * 60 + 30)).toBe(14 * 60);
  });

  it('ignores skipped items, which are not occupying anything', () => {
    const withSkip = [at('11:00', '12:00', 'Skipped thing', { id: 's', status: 'skipped' })];
    expect(freeEndAtOrBefore(withSkip, 12 * 60, 60)).toBe(12 * 60);
  });
});

/**
 * Same defect as the picker, one option down: "Tonight" searched from 5pm
 * regardless of the current time, so at 8pm it could offer 5:15pm — a
 * window that has already closed, which Today then files under
 * "Earlier — did it happen?". Only "Next free window" was reading the clock.
 */
describe('no option offers a time that has already gone', () => {
  // A long work block and a wide-open evening, so "Tonight" and "Next free
  // window" resolve to genuinely different times and neither is deduped.
  const openEvening: DailyPlan = {
    date: '2026-09-01',
    items: [
      at('08:00', '17:00', 'Work', { fixed: true, area: 'work', id: 'work' }),
      at('12:00', '13:00', 'Strength training', { id: 'training' }),
    ],
  };
  const item = openEvening.items.find((i) => i.id === 'training')!;

  it('never returns a start before now', () => {
    const evening = 20 * 60;
    const { options } = smartMoveOptions(item, openEvening, profile, evening);
    const slots = options.filter((o) => o.kind === 'slot');
    expect(slots.length).toBeGreaterThan(0);
    for (const o of slots) {
      expect(toMinutes(o.start!)).toBeGreaterThanOrEqual(evening);
    }
  });

  // "Tonight" is deliberately not offered as a second chip when the
  // evening already IS the next free window — one chip, not two for the
  // same time. What matters is that the evening stays reachable.
  it('still reaches the evening earlier in the day', () => {
    const { options } = smartMoveOptions(item, openEvening, profile, 9 * 60);
    const slots = options.filter((o) => o.kind === 'slot');
    expect(slots.some((o) => toMinutes(o.start!) >= 17 * 60)).toBe(true);
  });
});

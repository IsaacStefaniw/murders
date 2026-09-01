import { candidateStartsFor, moveWithBump } from '@/features/planner/moveWithBump';
import type { DailyPlan, PlanItem } from '@/types/domain';

const at = (start: string, end: string, title: string, patch: Partial<PlanItem> = {}): PlanItem => ({
  id: title, date: '2026-09-01', start, end, title,
  area: 'health', tier: 'should', status: 'planned', fixed: false, ...patch,
});

const day = (...items: PlanItem[]): DailyPlan => ({ date: '2026-09-01', items });
const ctx = { wakeTime: '06:30', sleepTime: '22:30' };
const byId = (o: { items: PlanItem[] }, id: string) => o.items.find((i) => i.id === id)!;

describe('the chosen time wins', () => {
  it('takes the slot and pushes what was there out of the way', () => {
    const plan = day(
      at('18:00', '18:30', 'Walk', { id: 'walk' }),
      at('12:00', '13:00', 'Training', { id: 'training' }),
    );
    const out = moveWithBump(plan, 'training', '18:00', ctx);
    expect(byId(out, 'training').start).toBe('18:00');
    expect(out.displaced.map((d) => d.id)).toEqual(['walk']);
    expect(byId(out, 'walk').start).not.toBe('18:00');
  });

  /**
   * A bumped item should land near its own time. A 6pm walk nudged to 6:40
   * is a nudge; the same walk sent to 7am is a different activity.
   */
  it('lands the bumped item as close to its own time as the day allows', () => {
    const plan = day(
      at('18:00', '18:30', 'Walk', { id: 'walk' }),
      at('12:00', '13:00', 'Training', { id: 'training' }),
    );
    const walk = byId(moveWithBump(plan, 'training', '18:00', ctx), 'walk');
    expect(walk.start >= '17:00' && walk.start <= '20:00').toBe(true);
  });

  it('leaves everything it does not collide with exactly where it was', () => {
    const plan = day(
      at('07:00', '07:30', 'Shower', { id: 'shower' }),
      at('18:00', '18:30', 'Walk', { id: 'walk' }),
      at('12:00', '13:00', 'Training', { id: 'training' }),
    );
    const out = moveWithBump(plan, 'training', '15:00', ctx);
    expect(out.displaced).toEqual([]);
    expect(byId(out, 'shower').start).toBe('07:00');
    expect(byId(out, 'walk').start).toBe('18:00');
  });
});

describe('what may never be bumped', () => {
  it('does not move work out of the way', () => {
    const plan = day(
      at('09:00', '17:00', 'Work', { id: 'work', fixed: true }),
      at('18:00', '19:00', 'Training', { id: 'training' }),
    );
    const out = moveWithBump(plan, 'training', '10:00', ctx);
    expect(byId(out, 'work').start).toBe('09:00');
    expect(out.displaced).toEqual([]);
  });

  /**
   * The choice is still honoured — someone may genuinely train through a
   * work block — but they are told, rather than finding out later.
   */
  it('honours the choice over work, and says that it did', () => {
    const plan = day(
      at('09:00', '17:00', 'Work', { id: 'work', fixed: true }),
      at('18:00', '19:00', 'Training', { id: 'training' }),
    );
    const out = moveWithBump(plan, 'training', '10:00', ctx);
    expect(byId(out, 'training').start).toBe('10:00');
    expect(out.overlapsFixed).toBe(true);
  });

  /**
   * A completed item is a record of what happened. Moving it would make
   * the day's history false.
   */
  it('never moves something already done', () => {
    const plan = day(
      at('12:00', '12:30', 'Walk', { id: 'walk', status: 'completed' }),
      at('18:00', '19:00', 'Training', { id: 'training' }),
    );
    const out = moveWithBump(plan, 'training', '12:00', ctx);
    expect(byId(out, 'walk').start).toBe('12:00');
    expect(byId(out, 'walk').status).toBe('completed');
  });
});

describe('when the day runs out of room', () => {
  it('keeps the bumped item rather than losing it, and reports it', () => {
    const plan = day(
      at('06:30', '21:00', 'Work', { id: 'work', fixed: true }),
      at('21:10', '22:10', 'Reading', { id: 'reading', tier: 'could' }),
      at('21:10', '22:10', 'Training', { id: 'training', tier: 'must' }),
    );
    const out = moveWithBump(plan, 'training', '21:10', ctx);
    expect(out.items.map((i) => i.id)).toContain('reading');
    expect(out.displaced).toEqual([
      { id: 'reading', title: 'Reading', from: '21:10', to: null },
    ]);
  });

  it('gives the scarce space to the more important thing', () => {
    const plan = day(
      at('06:30', '20:00', 'Work', { id: 'work', fixed: true }),
      at('20:10', '21:10', 'Optional', { id: 'optional', tier: 'could' }),
      at('20:10', '21:10', 'Important', { id: 'important', tier: 'must' }),
      at('21:20', '22:20', 'Training', { id: 'training' }),
    );
    const out = moveWithBump(plan, 'training', '20:10', ctx);
    const important = out.displaced.find((d) => d.id === 'important');
    const optional = out.displaced.find((d) => d.id === 'optional');
    expect(important?.to).not.toBeNull();
    expect(optional?.to).toBeNull();
  });
});

describe('the times offered', () => {
  const plan = day(
    at('09:00', '12:00', 'Work', { id: 'work', fixed: true }),
    at('18:00', '18:30', 'Walk', { id: 'walk' }),
    at('12:30', '13:30', 'Training', { id: 'training' }),
  );

  it('covers the whole day, not just the gaps', () => {
    const candidates = candidateStartsFor(plan, 'training', ctx);
    expect(candidates.length).toBeGreaterThan(20);
    expect(candidates[0].start).toBe('06:30'); // wake time, already on the grid
  });

  it('prices each one honestly', () => {
    const candidates = candidateStartsFor(plan, 'training', ctx);
    const overWork = candidates.find((c) => c.start === '10:00')!;
    expect(overWork.hitsFixed).toBe(true);
    expect(overWork.bumps).toBe(0);

    const overWalk = candidates.find((c) => c.start === '18:00')!;
    expect(overWalk.bumps).toBe(1);
    expect(overWalk.hitsFixed).toBe(false);

    const free = candidates.find((c) => c.start === '14:00')!;
    expect(free.bumps).toBe(0);
    expect(free.hitsFixed).toBe(false);
  });

  it('never offers a time that would run past bedtime', () => {
    for (const c of candidateStartsFor(plan, 'training', ctx)) {
      expect(c.start <= '21:30').toBe(true);
    }
  });
});

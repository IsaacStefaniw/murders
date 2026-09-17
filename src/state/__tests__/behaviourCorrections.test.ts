/**
 * Undoing a mis-tap.
 *
 * Until these existed a logged behaviour event was permanent. A wrong day,
 * a double tap, a chip pressed on the wrong intention — all of it sat in
 * the record forever, and the record is not decorative: `hotWindow`,
 * `weekdayShape`, `weekPressure` and every intervention time the app
 * computes are built on `occurredAt`. One wrong entry moves the hour the
 * app decides to interrupt somebody at.
 *
 * The cost is not the arithmetic. Somebody who cannot correct a mistake
 * stops trusting the record, and then stops keeping it, which costs far
 * more than the mis-tap did.
 */

import { useAppStore } from '@/state/store';
import { hotWindow } from '@/features/behaviours/patterns';
import type { BehaviourEvent } from '@/types/domain';

const event = (id: string, occurredAt: string): BehaviourEvent => ({
  id,
  intentionId: 'bi-1',
  occurredAt,
});

beforeEach(() => useAppStore.getState().resetAll());

describe('removing a logged event', () => {
  it('takes it out of the record', () => {
    useAppStore.setState({
      behaviourEvents: [event('a', '2026-09-14T21:00:00'), event('b', '2026-09-15T21:00:00')],
    });
    useAppStore.getState().removeBehaviourEvent('a');
    expect(useAppStore.getState().behaviourEvents.map((e) => e.id)).toEqual(['b']);
  });

  it('leaves everything else alone', () => {
    useAppStore.setState({ behaviourEvents: [event('a', '2026-09-14T21:00:00')] });
    useAppStore.getState().removeBehaviourEvent('not-a-real-id');
    expect(useAppStore.getState().behaviourEvents).toHaveLength(1);
  });

  /**
   * The point of the undo, stated as the thing it protects: a double tap
   * that stays in the record drags the window the app interrupts on.
   */
  it('takes the mistake back out of the window the app acts on', () => {
    const real = [
      event('a', '2026-09-08T21:00:00'),
      event('b', '2026-09-10T21:15:00'),
      event('c', '2026-09-12T21:00:00'),
      event('d', '2026-09-14T21:30:00'),
    ];
    const mistake = event('oops', '2026-09-15T07:00:00');
    useAppStore.setState({ behaviourEvents: [...real, mistake] });

    const withMistake = hotWindow(useAppStore.getState().behaviourEvents);
    useAppStore.getState().removeBehaviourEvent('oops');
    const without = hotWindow(useAppStore.getState().behaviourEvents);

    expect(without).not.toBeNull();
    expect(without!.hits).toBe(4);
    // The morning mis-tap was dragging the count the window is read from.
    expect(without!.total).toBeLessThan(withMistake!.total);
  });
});

describe('correcting the time', () => {
  it('moves the event without touching anything else on it', () => {
    useAppStore.setState({
      behaviourEvents: [{ ...event('a', '2026-09-15T07:00:00'), trigger: 'stress', detail: 'two' }],
    });
    useAppStore.getState().setBehaviourEventOccurredAt('a', '2026-09-15T21:00:00');
    const [after] = useAppStore.getState().behaviourEvents;
    expect(after.occurredAt).toBe('2026-09-15T21:00:00');
    expect(after.trigger).toBe('stress');
    expect(after.detail).toBe('two');
  });
});

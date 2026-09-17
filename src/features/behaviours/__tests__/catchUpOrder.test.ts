/**
 * Which night the aftermath runs on, when several are logged at once.
 *
 * Isaac, on his own week: *"I have drank a few times this week and could
 * only log yesterday."* Catching up is the ordinary case, not the edge
 * one — and the day chips let somebody log Thursday, then remember Monday.
 *
 * `finish()` took the last entry in the list, which is TYPING order, so
 * logging yesterday first and Monday second handed the aftermath to
 * Monday. That is not cosmetic. Everything the breakout says is about what
 * happens next: `steady()` counts the week, `rightNow()` reads the hours
 * to the next window, and the plan it produces is delivered ahead of that
 * window. Anchored to a night four days gone, all three answer a question
 * nobody asked.
 *
 * The selection is pure, so it is tested as the rule rather than through
 * the sheet: of everything recorded in one sitting, the aftermath belongs
 * to the most recent OCCURRENCE.
 */

type Entry = { id: string; occurredAt: string };

/** The rule in `BehaviourLog.finish`. */
const latestOf = (logged: Entry[]): Entry | null =>
  logged.reduce<Entry | null>(
    (best, e) => (best === null || e.occurredAt > best.occurredAt ? e : best),
    null,
  );

describe('catching up on a week', () => {
  it('runs on the most recent night, whatever order it was typed in', () => {
    // Yesterday first, because it is the one they remember best, then the
    // two earlier nights as they come back to them.
    const logged: Entry[] = [
      { id: 'thu', occurredAt: '2026-09-16T21:30:00' },
      { id: 'mon', occurredAt: '2026-09-13T20:00:00' },
      { id: 'wed', occurredAt: '2026-09-15T22:15:00' },
    ];
    expect(latestOf(logged)?.id).toBe('thu');
  });

  it('agrees with typing order when somebody logs oldest-first', () => {
    const logged: Entry[] = [
      { id: 'mon', occurredAt: '2026-09-13T20:00:00' },
      { id: 'wed', occurredAt: '2026-09-15T22:15:00' },
      { id: 'thu', occurredAt: '2026-09-16T21:30:00' },
    ];
    expect(latestOf(logged)?.id).toBe('thu');
  });

  it('is the event itself when there is only one', () => {
    expect(latestOf([{ id: 'a', occurredAt: '2026-09-16T21:30:00' }])?.id).toBe('a');
  });

  it('has nothing to run on when nothing was recorded', () => {
    // Closing the sheet without logging must not push a breakout.
    expect(latestOf([])).toBeNull();
  });

  /**
   * Two on the same evening — a second drink an hour later. The later one
   * wins, because the plan is delivered ahead of the next window and the
   * later occurrence is the one closer to it.
   */
  it('takes the later of two on the same night', () => {
    const logged: Entry[] = [
      { id: 'first', occurredAt: '2026-09-16T20:00:00' },
      { id: 'second', occurredAt: '2026-09-16T22:45:00' },
    ];
    expect(latestOf(logged)?.id).toBe('second');
  });
});

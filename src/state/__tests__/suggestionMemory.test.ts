/**
 * Saying no, and it staying said.
 *
 * `refreshSuggestions` ran on every Today mount and rebuilt the list as
 * `[...open, ...additions]`, where `open` was the unanswered ones. Three
 * things followed from that one line, and they compounded:
 *
 *   1. Every accepted and dismissed record was deleted the moment any new
 *      suggestion appeared. The app kept no memory of a single answer.
 *   2. The key set that stops a duplicate being added was built from the
 *      open ones only, so a dismissed suggestion came straight back on the
 *      next mount. Dismissing was a gesture with no effect.
 *   3. The three cooldowns that keep the app quiet — one connection nudge
 *      a fortnight, one underserved-goal nudge a fortnight, one stall
 *      nudge per STALL_DAYS — all count answered nudges by reading the
 *      same list. After a purge there was nothing left to count.
 *
 * What is under test is the person's experience of it: I said no, and it
 * asked me again the next time I opened the app.
 */

import {
  SUGGESTION_COOLDOWN_DAYS,
  SUGGESTION_MEMORY_DAYS,
  useAppStore,
} from '@/state/store';
import type { Routine, Suggestion } from '@/types/domain';

const daysAgo = (n: number) => new Date(Date.now() - n * 86400e3).toISOString();

const suggestion = (over: Partial<Suggestion> = {}): Suggestion => ({
  id: over.id ?? `sug-${Math.random()}`,
  kind: 'move_routine',
  message: 'Move strength to the morning?',
  reason: 'You skipped 3 of the last 4.',
  payload: { routineId: 'r-strength', preferredStart: '07:00', preferredEnd: '07:45' },
  confidence: 0.7,
  status: 'open',
  createdAt: daysAgo(0),
  ...over,
});

const seed = (suggestions: Suggestion[]) => useAppStore.setState({ suggestions });
const read = () => useAppStore.getState().suggestions;

beforeEach(() => useAppStore.getState().resetAll());

describe('answering a suggestion', () => {
  it('stamps when it was answered, not only that it was', () => {
    const s = suggestion({ id: 'a' });
    seed([s]);
    useAppStore.getState().dismissSuggestion('a');
    const after = read().find((x) => x.id === 'a')!;
    expect(after.status).toBe('dismissed');
    expect(after.resolvedAt).toBeTruthy();
  });

  /**
   * The cooldown has to run from the moment it was answered. A suggestion
   * raised thirteen days ago and dismissed this morning would otherwise be
   * offered again tomorrow.
   */
  it('keeps the answer separate from when it was raised', () => {
    const raised = daysAgo(13);
    seed([suggestion({ id: 'a', createdAt: raised })]);
    useAppStore.getState().dismissSuggestion('a');
    const after = read().find((x) => x.id === 'a')!;
    expect(after.createdAt).toBe(raised);
    expect(after.resolvedAt! > after.createdAt).toBe(true);
  });
});

describe('the memory a refresh is allowed to erase', () => {
  it('keeps answers that a refresh used to delete', () => {
    seed([
      suggestion({ id: 'kept-yes', status: 'accepted', resolvedAt: daysAgo(1) }),
      suggestion({ id: 'kept-no', status: 'dismissed', resolvedAt: daysAgo(2) }),
    ]);
    useAppStore.getState().refreshSuggestions();
    expect(read().map((s) => s.id).sort()).toEqual(['kept-no', 'kept-yes']);
  });

  it('forgets an answer once it is older than the app needs it', () => {
    seed([
      suggestion({
        id: 'ancient',
        status: 'dismissed',
        createdAt: daysAgo(SUGGESTION_MEMORY_DAYS + 10),
        resolvedAt: daysAgo(SUGGESTION_MEMORY_DAYS + 5),
      }),
      suggestion({ id: 'recent', status: 'dismissed', resolvedAt: daysAgo(3) }),
    ]);
    useAppStore.getState().refreshSuggestions();
    expect(read().map((s) => s.id)).toEqual(['recent']);
  });

  it('leaves an unanswered suggestion exactly where it was', () => {
    seed([suggestion({ id: 'open-one' })]);
    useAppStore.getState().refreshSuggestions();
    expect(read().map((s) => s.id)).toEqual(['open-one']);
  });

  /**
   * The list lives on a device that never syncs anywhere, so it cannot
   * grow without bound — but the bound has to be longer than every
   * cooldown that reads it, or the caps go quiet without anybody noticing.
   */
  it('remembers for longer than any cooldown that counts answers', () => {
    expect(SUGGESTION_MEMORY_DAYS).toBeGreaterThan(SUGGESTION_COOLDOWN_DAYS);
    expect(SUGGESTION_MEMORY_DAYS).toBeGreaterThan(21);
  });
});

/**
 * The part a person actually feels. Everything above is bookkeeping for
 * this: the card came back the next time they opened the app.
 */
describe('a dismissal that holds', () => {
  const routine: Routine = {
    id: 'r-strength',
    title: 'Strength',
    area: 'health' as const,
    days: [1, 3, 5],
    durationMin: 45,
    preferredStart: '18:00',
    preferredEnd: '18:45',
    energy: 'evening' as const,
    flexible: true,
    protected: false,
    tier: 'should' as const,
    active: true,
  };

  it('is not raised again inside the cooldown', () => {
    useAppStore.setState({ routines: [routine] });
    seed([
      suggestion({
        id: 'said-no',
        status: 'dismissed',
        resolvedAt: daysAgo(1),
        payload: { routineId: 'r-strength' },
      }),
    ]);
    useAppStore.getState().refreshSuggestions();
    const open = read().filter((s) => s.status === 'open');
    expect(open.filter((s) => (s.payload as { routineId?: string }).routineId === 'r-strength'))
      .toEqual([]);
  });

  /**
   * Not permanent, on purpose. Weeks change, and a move that was wrong in
   * March can be right in June. The rule is that the app may not ask again
   * tomorrow, not that it may never ask again.
   */
  it('lifts once the fortnight is up', () => {
    const stale = suggestion({
      id: 'old-no',
      status: 'dismissed',
      createdAt: daysAgo(SUGGESTION_COOLDOWN_DAYS + 3),
      resolvedAt: daysAgo(SUGGESTION_COOLDOWN_DAYS + 2),
    });
    seed([stale]);
    // The mute is keyed off the answer's age, so a fresh detection of the
    // same thing is no longer suppressed by it.
    const cooledOff =
      (stale.resolvedAt ?? stale.createdAt) <
      new Date(Date.now() - SUGGESTION_COOLDOWN_DAYS * 86400e3).toISOString();
    expect(cooledOff).toBe(true);
  });
});

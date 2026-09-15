import { readFileSync } from 'fs';
import { join } from 'path';

import {
  ATTENTION_ORDER,
  claimAttention,
  shows,
  waiting,
  type AttentionId,
} from '@/features/today/attention';

/**
 * One job, and one thing asking for it.
 *
 * Eleven blocks could render on Today at once. Each is silent most days,
 * which is exactly why the failure was invisible: nobody building one ever
 * saw four of them fire together, and on the morning they did, the screen
 * answered "what now?" fifth.
 */

const ALL: AttentionId[] = [...ATTENTION_ORDER];
const every = Object.fromEntries(ALL.map((id) => [id, true]));

describe('at most one', () => {
  it('says nothing on an ordinary day', () => {
    expect(claimAttention({})).toBeNull();
    expect(claimAttention({ budget: false, checkin: false })).toBeNull();
  });

  it('picks exactly one when everything fires at once', () => {
    const claimed = claimAttention(every);
    expect(claimed).toBe('welcomeBack');
    // And every other block is told no.
    for (const id of ALL) expect(shows(claimed, id)).toBe(id === 'welcomeBack');
  });

  it('falls through to whatever is left', () => {
    expect(claimAttention({ suggestion: true })).toBe('suggestion');
    expect(claimAttention({ budget: true, suggestion: true })).toBe('budget');
  });
});

describe('the order', () => {
  /**
   * Somebody returning after a gap is the moment with the least room for
   * noise. Everything else is a stranger talking over a reunion.
   */
  it('puts a person coming back ahead of everything', () => {
    expect(ATTENTION_ORDER[0]).toBe('welcomeBack');
  });

  it('puts what changes today ahead of what is merely due', () => {
    const at = (id: AttentionId) => ATTENTION_ORDER.indexOf(id);
    expect(at('setupDay')).toBeLessThan(at('checkin'));
    expect(at('readiness')).toBeLessThan(at('checkin'));
    expect(at('trial')).toBeLessThan(at('budget'));
  });

  /**
   * The Plus nudge used to render at the top of Today, above everything,
   * before the app had shown it could do the job. An app asking for money
   * before it has answered "what now?" has the order wrong. It stays in
   * the rotation — it is one-time and dismissible, so mid-table still
   * means it gets seen — but it never talks over a person coming back
   * after a fortnight away, or over a day that has not been set up.
   */
  it('never lets the paywall outrank the app doing its job', () => {
    const at = (id: AttentionId) => ATTENTION_ORDER.indexOf(id);
    for (const id of ['welcomeBack', 'setupDay', 'readiness', 'ritual', 'trial', 'checkin'] as const) {
      expect(at(id)).toBeLessThan(at('plus'));
    }
  });

  it('lists each one exactly once', () => {
    expect(new Set(ATTENTION_ORDER).size).toBe(ATTENTION_ORDER.length);
  });
});

describe('what is held back', () => {
  it('is counted, so nothing is silently swallowed', () => {
    expect(waiting(every)).toBe(ALL.length - 1);
    expect(waiting({ budget: true })).toBe(0);
    expect(waiting({})).toBe(-1);
  });
});

/* ── The screen actually obeys it ─────────────────────────────────────── */

/**
 * A structural test, because the failure mode is a block being added back
 * ungated — which is precisely how the screen got to eleven in the first
 * place. Every arbitrated component must appear inside a `shows(claimed, …)`
 * guard in Today, and the ones deliberately exempt are listed here with
 * the reason.
 */
describe('today.tsx', () => {
  const source = readFileSync(
    join(process.cwd(), 'src/app/(tabs)/today.tsx'),
    'utf8',
  );

  const GATED: Record<string, AttentionId> = {
    '<RitualCard': 'ritual',
    '<BudgetCard': 'budget',
    '<TrialReview': 'trial',
    '<CheckinCard': 'checkin',
    '<WelcomeBack': 'welcomeBack',
    '<ReadinessCard': 'readiness',
    '<PlusNudge': 'plus',
    '<SuggestionCard': 'suggestion',
  };

  it('gates every arbitrated block', () => {
    const ungated: string[] = [];
    for (const [tag, id] of Object.entries(GATED)) {
      if (!source.includes(tag)) continue;
      // The guard has to be on the same JSX expression as the tag.
      const at = source.indexOf(tag);
      const before = source.slice(Math.max(0, at - 400), at);
      if (!before.includes(`shows(claimed, '${id}')`)) ungated.push(tag);
    }
    expect(ungated).toEqual([]);
  });

  it('mounts each arbitrated block exactly once', () => {
    for (const tag of Object.keys(GATED)) {
      const n = source.split(tag).length - 1;
      expect([0, 1]).toContain(n);
    }
  });

  /**
   * Deliberately exempt, and the reasons are in attention.ts: a coach
   * interruption is a different screen, the move note is the app answering
   * something the person just did, and tonight's urge tools are the reason
   * somebody opened the app at the hour they fire.
   */
  it('leaves the three exemptions alone', () => {
    expect(source).toContain('router.push(`/coach/interrupt');
    expect(source).toContain('{moveNote ?');
    expect(source).toContain('Tonight');
  });

  /**
   * `setHydrated` applies the stored clock offset and then publishes the
   * flag, so there is a render where the state is restored and the clock
   * is not. An interruption decided in that render asks about the wrong
   * hour — and, because it is recorded the moment it appears, burns the
   * right one doing it.
   */
  it('waits for the store to finish reading itself before interrupting', () => {
    expect(source).toContain('!hydrated || firstDay || !plan');
  });

  /**
   * Recording an interruption changes the log the computation reads, which
   * produced the NEXT interruption, which the effect then presented — so a
   * day with three things to say walked through all three, recorded each
   * as seen, and showed only the last. One per app open, and the first.
   */
  it('presents one interruption per open, and does not cascade', () => {
    expect(source).toContain('interrupted.current');
    expect(source).toContain('interrupted.current = true');
  });

  /**
   * The ledger belongs to the end-of-day review, which does the whole day
   * in three taps. Today used to carry a second copy of the same rows.
   */
  it('points at the day review rather than carrying the ledger', () => {
    expect(source).not.toContain('Earlier today');
    expect(source).toContain("/review/day");
  });

  /** The 56-chip habit wall is the "+" column's job now. */
  it('does not carry the habit wall', () => {
    expect(source).not.toContain('<QuickLog');
  });

  /**
   * The evening used to hoist a "Any time" block to the top and leave a
   * second one lower down titled "Also any time" — two headings for one
   * idea, on the screen that is supposed to have one job. The section
   * moves; it does not split.
   */
  it('has one Any time section, in one of two places', () => {
    expect(source).not.toContain('Also any time');
    expect(source.split('title="Any time"').length - 1).toBe(1);
    expect(source).toContain('{isEvening ? anyTime : null}');
    expect(source).toContain('{isEvening ? null : anyTime}');
  });
});

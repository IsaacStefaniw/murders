import {
  claimedFloor,
  distinctWeeks,
  earnedLevel,
  gateFor,
  LEVEL_GATES,
  levelFor,
  levelProgress,
  type LevelEvidence,
} from '@/features/paths/level';

const ev = (sessions: number, weeks: number, standardsMet = false): LevelEvidence => ({
  sessions,
  weeks,
  standardsMet,
});

describe('the claim', () => {
  it('is believed immediately, so an experienced person never grinds through a beginner block', () => {
    expect(levelFor('training', 'established', ev(0, 0))).toBe('established');
  });

  /**
   * The gate. `advanced` prescribes top singles and an overreach week —
   * genuinely unsafe for someone who picked the flattering option on a
   * form. No intake answer opens it.
   */
  it('cannot buy the top rung, however it is phrased', () => {
    expect(claimedFloor('advanced')).toBe('established');
    expect(levelFor('training', 'advanced', ev(0, 0))).toBe('established');
  });

  it('defaults to foundation when there is no claim at all', () => {
    expect(claimedFloor(null)).toBe('foundation');
    expect(levelFor('training', undefined, ev(0, 0))).toBe('foundation');
  });
});

describe('the evidence', () => {
  it('needs weeks as well as sessions — a keen fortnight is not a habit', () => {
    // Enough sessions for `developing`, nowhere near enough weeks.
    expect(earnedLevel('training', ev(20, 2))).toBe('foundation');
    expect(earnedLevel('training', ev(12, 6))).toBe('developing');
  });

  it('never skips a rung, even when the numbers are far past it', () => {
    // Volume that clears `advanced` still stops at `established` without
    // the standard, and the levels below are implied rather than jumped.
    expect(earnedLevel('training', ev(200, 60))).toBe('established');
    expect(earnedLevel('training', ev(200, 60, true))).toBe('advanced');
  });

  it('lifts someone above what they claimed once the log says more', () => {
    expect(levelFor('training', 'foundation', ev(40, 20))).toBe('established');
  });

  /**
   * The one direction that is never automatic. A thin log is far more
   * often a busy month than a lie, and an app that quietly decides you
   * were exaggerating is one people stop being honest with.
   */
  it('never demotes a claim for a thin log', () => {
    expect(levelFor('training', 'established', ev(1, 1))).toBe('established');
  });
});

describe('stepping back', () => {
  it('is honoured, because the person is better evidence than the log', () => {
    expect(levelFor('training', 'established', ev(40, 20), 'foundation')).toBe('foundation');
  });

  it('cannot be used to skip the ladder upward', () => {
    expect(levelFor('training', 'foundation', ev(0, 0), 'advanced')).toBe('foundation');
  });
});

describe('what the hub shows', () => {
  it('names both halves of what is outstanding', () => {
    const p = levelProgress('training', 'foundation', ev(4, 2));
    expect(p.next).toBe('developing');
    expect(p.sessionsToGo).toBe(8);
    expect(p.weeksToGo).toBe(4);
    expect(p.text).toBe('8 more sessions and 4 more weeks to reach Developing.');
  });

  it('drops the half that is already met', () => {
    const p = levelProgress('training', 'foundation', ev(4, 9));
    expect(p.weeksToGo).toBe(0);
    expect(p.text).toBe('8 more sessions to reach Developing.');
  });

  it('says what the extra standard is when volume alone is not enough', () => {
    const p = levelProgress('training', 'established', ev(200, 60), 'three baselined lifts');
    expect(p.blockedBy).toBe('three baselined lifts');
    expect(p.text).toContain('three baselined lifts');
  });

  it('has something to say at the top of the ladder', () => {
    const p = levelProgress('training', 'advanced', ev(200, 60, true));
    expect(p.next).toBeNull();
    expect(p.text).not.toBe('');
  });
});

describe('counting weeks', () => {
  it('counts a burst once', () => {
    expect(distinctWeeks(['2026-03-02', '2026-03-03', '2026-03-04', '2026-03-06'])).toBe(1);
  });

  it('splits across the Monday boundary', () => {
    // Sunday the 8th closes one week; Monday the 9th opens the next.
    expect(distinctWeeks(['2026-03-08', '2026-03-09'])).toBe(2);
  });

  it('ignores unparseable keys rather than inventing a week for them', () => {
    expect(distinctWeeks(['', 'not-a-date', '2026-03-02'])).toBe(1);
  });
});

describe('every pathway has a ladder', () => {
  it('gates money on persistence too, not just on training', () => {
    expect(earnedLevel('money', ev(3, 3))).toBe('foundation');
    expect(earnedLevel('money', ev(4, 4))).toBe('developing');
  });
});

/**
 * The advanced gate, for someone whose lifts already prove the case.
 *
 * Forty weeks was never about time for its own sake — it was a proxy for
 * evidence that a person can absorb top singles and an overreach week.
 * When the log carries that evidence directly, the proxy has done its job
 * and holding someone for another seven months is the app being wrong.
 */
describe('proven advanced gate', () => {
  const proven = (sessions: number, weeks: number): LevelEvidence => ({
    sessions,
    weeks,
    standardsMet: true,
  });

  it('opens at 48 sessions and 20 weeks once the standards are met', () => {
    expect(earnedLevel('training', proven(48, 20))).toBe('advanced');
  });

  it('still sits above established, so no rung is skipped', () => {
    // The loop stops at the first unmet gate, so a proven gate set below
    // the established one would never be reached at all — and nobody
    // should reach the top rung without time on the one below it.
    expect(earnedLevel('training', proven(36, 16))).toBe('established');
  });

  it('is still a real gate — a keen burst does not open it', () => {
    // Forty-eight sessions crammed into six weeks is a burst, not a
    // training history, and the weeks half is what says so.
    expect(earnedLevel('training', proven(48, 6))).not.toBe('advanced');
  });

  it('does not open at all without the standards, however long the log', () => {
    expect(earnedLevel('training', { sessions: 200, weeks: 80, standardsMet: false })).toBe(
      'established',
    );
  });

  it('never shortens a gate for a pathway with nothing to prove', () => {
    // Only training has a standard computable from a log. A `standardsMet`
    // that arrived from somewhere else must not quietly discount the rest.
    expect(gateFor('money', 'advanced', proven(48, 20))).toEqual(
      LEVEL_GATES.money.advanced,
    );
    expect(earnedLevel('money', proven(48, 20))).not.toBe('advanced');
  });

  it('counts down against the gate actually in force', () => {
    // The meters and the sentence must quote the same number. A lifter
    // whose standards are met should be told 12 sessions to go, not 88.
    const p = levelProgress('training', 'established', proven(36, 16));
    expect(p.next).toBe('advanced');
    expect(p.sessionsToGo).toBe(12);
    expect(p.weeksToGo).toBe(4);
  });
});

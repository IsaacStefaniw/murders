/**
 * "Can the pre questionnaire help you land in this bucket then? and show
 * improvements... people are not starting from 0."
 *
 * Two things here. The questionnaire giving a reading on day one — which
 * is the easy half — and the trap in the second half.
 *
 * The trap: somebody answers two questions at signup and reads 48. A
 * fortnight later they buy a dynamometer, do the tests, and read 43.
 * Nothing about them changed. Reporting that as "five years better" would
 * be a flattering lie, arriving early, caused entirely by the user doing
 * what the app asked. These tests exist so that cannot happen quietly.
 */

import { paceProgress } from '@/features/health/progress';
import { readPace, type PaceInputs } from '@/features/health/pace';
import {
  SELF_RATED_HEALTH_RR,
  WALKING_PACE_RR,
  selfRatedHealthLogHazard,
  selfReportedFrom,
  walkingPaceLogHazard,
} from '@/features/health/selfReport';

const base: PaceInputs = { age: 45, sexAtBirth: 'male' };

/* ── Day one: the questionnaire alone ─────────────────────────────────── */

describe('landing in the bucket from questions alone', () => {
  it('reads something from two answers and nothing measured', () => {
    // The whole point. "Nothing measured yet" is both useless and untrue
    // for somebody carrying thirty years of history.
    const out = readPace({ ...base, selfRatedHealth: 'good', walkingPace: 'brisk' });
    expect(out.coverage.observed).toBe(2);
    expect(out.yearsEquivalent).not.toBeNull();
  });

  it('carries the published effects for both questions', () => {
    expect(SELF_RATED_HEALTH_RR).toEqual({
      excellent: 1.0,
      good: 1.23,
      fair: 1.44,
      poor: 1.92,
    });
    expect(Math.exp(selfRatedHealthLogHazard('poor'))).toBeCloseTo(1.92, 5);
    expect(selfRatedHealthLogHazard('excellent')).toBe(0);
    expect(walkingPaceLogHazard('brisk')).toBe(0);
    expect(Math.exp(walkingPaceLogHazard('slow'))).toBeCloseTo(WALKING_PACE_RR.slow, 5);
  });

  it('marks every questionnaire answer as self-reported', () => {
    const out = readPace({ ...base, selfRatedHealth: 'good', walkingPace: 'steady' });
    for (const c of out.observed) expect(c.source).toBe('self-reported');
  });

  it('widens the interval for a reading built on answers rather than tests', () => {
    // Same construct, different precision. Asked is worth less than
    // measured and the error bars have to say so.
    const asked = readPace({ ...base, walkingPace: 'slow' });
    const measured = readPace({ ...base, gaitMs: 0.6 });
    expect(asked.components.find((c) => c.id === 'gait')!.source).toBe('self-reported');
    expect(measured.components.find((c) => c.id === 'gait')!.source).toBe('measured');
  });

  it('lets a measured gait speed replace the asked one rather than average with it', () => {
    // Two instruments answering the same question with different precision
    // should not be blended — the better one takes over.
    const both = readPace({ ...base, walkingPace: 'slow', gaitMs: 1.3 });
    const gait = both.components.find((c) => c.id === 'gait')!;
    expect(gait.source).toBe('measured');
    expect(gait.logHazard).toBe(0);
    expect(gait.detail).toMatch(/measured/);
  });

  it('offers the upgrade while it is still a proxy, and not after', () => {
    expect(readPace({ ...base, walkingPace: 'slow' }).components.find((c) => c.id === 'gait')!.upgradeTo).toBeTruthy();
    expect(readPace({ ...base, gaitMs: 1.3 }).components.find((c) => c.id === 'gait')!.upgradeTo).toBeUndefined();
  });

  it('reads answers out of the interview, and tolerates a skipped question', () => {
    expect(selfReportedFrom({ selfRatedHealth: 'fair', walkingPace: 'brisk' })).toEqual({
      selfRatedHealth: 'fair',
      walkingPace: 'brisk',
    });
    expect(selfReportedFrom({})).toEqual({});
    expect(selfReportedFrom(undefined)).toEqual({});
    // A junk value is not silently accepted as an answer.
    expect(selfReportedFrom({ selfRatedHealth: 'amazing' })).toEqual({});
  });
});

/* ── The trap ─────────────────────────────────────────────────────────── */

describe('telling improvement apart from better measurement', () => {
  it('refuses to call a first measurement an improvement', () => {
    const before = readPace({ ...base, selfRatedHealth: 'good' });
    const after = readPace({ ...base, selfRatedHealth: 'good', gripKg: 50, balanceSeconds: 30 });
    const p = paceProgress(before, after);
    expect(p.yearsFromChange).toBe(0);
    expect(p.movements.every((m) => !m.real)).toBe(true);
    expect(p.headline).toMatch(/have not moved/i);
    // And says what measuring bought, rather than "nothing". Both new
    // markers read at their reference, so the figure is unchanged — but
    // the interval is tighter, and that IS the result.
    expect(p.headline).toMatch(/measured 2 more of them/i);
    expect(p.headline).toMatch(/tighter margin/i);
  });

  it('says when a marker stopped being readable and the margin widened', () => {
    const p = paceProgress(
      readPace({ ...base, selfRatedHealth: 'excellent', gripKg: 50 }),
      readPace({ ...base, selfRatedHealth: 'excellent' }),
    );
    expect(p.headline).toMatch(/no longer readable/i);
    expect(p.headline).toMatch(/widened/i);
  });

  it('refuses to call an asked-then-measured upgrade an improvement', () => {
    // The exact scenario: slow self-report at signup, decent measured gait
    // a fortnight later. The figure moves several years. None of it is them.
    const before = readPace({ ...base, walkingPace: 'slow' });
    const after = readPace({ ...base, gaitMs: 1.3 });
    const p = paceProgress(before, after);
    expect(p.yearsFromChange).toBe(0);
    expect(p.yearsFromMeasurement).toBeLessThan(0);
    const gait = p.movements.find((m) => m.id === 'gait')!;
    expect(gait.kind).toBe('sharper');
    expect(gait.real).toBe(false);
    expect(gait.detail).toMatch(/rather than estimated/i);
  });

  it('says so outright when the only movement is measurement', () => {
    // A smaller number with no explanation would imply progress by itself.
    const before = readPace({ ...base, walkingPace: 'slow' });
    const after = readPace({ ...base, gaitMs: 1.3 });
    expect(paceProgress(before, after).headline).toMatch(
      /because we can see more of them, which is not the same thing/i,
    );
  });

  it('DOES call a real change an improvement', () => {
    // Same component, same kind of measurement, better number. The only
    // case allowed to be congratulated.
    const before = readPace({ ...base, gripKg: 20 });
    const after = readPace({ ...base, gripKg: 27 });
    const p = paceProgress(before, after);
    expect(p.yearsFromChange).toBeLessThan(0);
    expect(p.yearsFromMeasurement).toBe(0);
    const grip = p.movements.find((m) => m.id === 'grip')!;
    expect(grip.kind).toBe('changed');
    expect(grip.real).toBe(true);
    expect(p.headline).toMatch(/better on the markers themselves/i);
  });

  it('reports a real change that went the wrong way too', () => {
    const p = paceProgress(readPace({ ...base, gripKg: 27 }), readPace({ ...base, gripKg: 18 }));
    expect(p.yearsFromChange).toBeGreaterThan(0);
    expect(p.headline).toMatch(/worse on the markers themselves/i);
  });

  it('splits a mixed move into both, and names the measurement half', () => {
    const before = readPace({ ...base, walkingPace: 'slow', gripKg: 20 });
    const after = readPace({ ...base, gaitMs: 1.3, gripKg: 27 });
    const p = paceProgress(before, after);
    expect(p.yearsFromChange).toBeLessThan(0);
    expect(p.yearsFromMeasurement).toBeLessThan(0);
    expect(p.headline).toMatch(/us knowing more rather than you being different/i);
  });

  it('ignores movement too small to mean anything', () => {
    const p = paceProgress(readPace({ ...base, gripKg: 26.9 }), readPace({ ...base, gripKg: 27 }));
    expect(p.movements).toHaveLength(0);
    expect(p.headline).toBe('Nothing has moved.');
  });

  it('shows a marker that stopped being readable rather than quietly dropping it', () => {
    const p = paceProgress(readPace({ ...base, gripKg: 20 }), readPace(base));
    const grip = p.movements.find((m) => m.id === 'grip')!;
    expect(grip.kind).toBe('lost');
    expect(grip.real).toBe(false);
  });

  it('never attributes a measurement move to the person, across every pairing', () => {
    // The invariant, swept: no movement whose source changed, or whose
    // value appeared from nothing, may ever be marked real.
    const states: PaceInputs[] = [
      base,
      { ...base, selfRatedHealth: 'fair' },
      { ...base, walkingPace: 'steady' },
      { ...base, gaitMs: 1.1 },
      { ...base, gripKg: 30, balanceSeconds: 12 },
      { ...base, walkingPace: 'slow', gripKg: 22 },
    ];
    for (const a of states) {
      for (const b of states) {
        for (const m of paceProgress(readPace(a), readPace(b)).movements) {
          if (m.kind !== 'changed') expect(m.real).toBe(false);
        }
      }
    }
  });
});

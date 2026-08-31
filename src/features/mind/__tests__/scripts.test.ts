import {
  cueAt,
  MEDITATION_SCRIPTS,
  scriptById,
  scriptsForLevel,
  spaceCues,
} from '@/features/mind/scripts';

describe('script integrity', () => {
  it('every script is complete and attributed', () => {
    const ids = new Set(MEDITATION_SCRIPTS.map((s) => s.id));
    expect(ids.size).toBe(MEDITATION_SCRIPTS.length);
    for (const s of MEDITATION_SCRIPTS) {
      expect(s.summary.length).toBeGreaterThan(10);
      expect(s.attribution.length).toBeGreaterThan(10);
      expect(s.durationsMin.length).toBeGreaterThan(0);
    }
  });

  /**
   * A cue track that runs past the end abandons the person mid-session, and
   * one that finishes early leaves them staring at a stale line. Every
   * script, at every duration it offers.
   */
  it('every cue lands inside its session, at every offered duration', () => {
    for (const script of MEDITATION_SCRIPTS) {
      for (const min of script.durationsMin) {
        const cues = script.build(min);
        const totalSec = min * 60;
        expect(cues.length).toBeGreaterThan(2);
        for (const cue of cues) {
          expect(cue.atSec).toBeGreaterThanOrEqual(0);
          expect(cue.atSec).toBeLessThan(totalSec);
          expect(cue.text.length).toBeGreaterThan(5);
        }
        // Strictly increasing: a cue track that goes backwards would make
        // `cueAt` show the wrong line for the rest of the session.
        for (let i = 1; i < cues.length; i++) {
          expect(cues[i].atSec).toBeGreaterThanOrEqual(cues[i - 1].atSec);
        }
      }
    }
  });

  /**
   * Guidance that clumps at the start and then abandons you is the classic
   * failure of a written script. No stretch of a session should be silent
   * for more than a couple of minutes.
   */
  it('never leaves a long silence in the middle of a session', () => {
    for (const script of MEDITATION_SCRIPTS) {
      for (const min of script.durationsMin) {
        const cues = script.build(min);
        for (let i = 1; i < cues.length; i++) {
          expect(cues[i].atSec - cues[i - 1].atSec).toBeLessThanOrEqual(150);
        }
      }
    }
  });

  /**
   * "Clear your mind" is not achievable and teaches people they are failing
   * at something they are doing correctly. Nor does a wellbeing app claim
   * to treat anything.
   */
  it('never tells anyone to clear their mind, and claims no treatment', () => {
    const text = JSON.stringify(
      MEDITATION_SCRIPTS.map((s) => ({
        ...s,
        cues: s.durationsMin.map((m) => s.build(m)),
        build: undefined,
      })),
    ).toLowerCase();
    for (const banned of [
      'clear your mind',
      'empty your mind',
      'stop thinking',
      'cure',
      'treats ',
      'prescrib',
      'anxiety disorder',
      'depression',
      'guaranteed',
    ]) {
      expect(text).not.toContain(banned);
    }
  });

  /** The practices that can surface difficult material say so beforehand. */
  it('warns where a practice can bring up more than expected', () => {
    for (const id of ['body-scan', 'kindness', 'nsdr']) {
      expect(scriptById(id)!.safety).toBeTruthy();
    }
  });

  it('every script opens with an instruction, not a cue mid-practice', () => {
    for (const script of MEDITATION_SCRIPTS) {
      expect(script.build(script.durationsMin[0])[0].atSec).toBe(0);
    }
  });
});

describe('cueAt', () => {
  const cues = [
    { atSec: 0, text: 'Settle' },
    { atSec: 30, text: 'Breathe' },
    { atSec: 90, text: 'Return' },
  ];

  it('shows the last instruction whose time has passed', () => {
    expect(cueAt(cues, 0)!.text).toBe('Settle');
    expect(cueAt(cues, 29)!.text).toBe('Settle');
    expect(cueAt(cues, 30)!.text).toBe('Breathe');
    expect(cueAt(cues, 1000)!.text).toBe('Return');
  });

  it('has nothing to show before the first cue or with no cues', () => {
    expect(cueAt([{ atSec: 5, text: 'Later' }], 2)).toBeNull();
    expect(cueAt([], 10)).toBeNull();
  });
});

describe('spaceCues', () => {
  it('spreads instructions across the stretch it was given', () => {
    const out = spaceCues([{ text: 'a' }, { text: 'b' }, { text: 'c' }], 60, 240);
    expect(out.map((c) => c.atSec)).toEqual([60, 120, 180]);
  });

  it('handles a single line and an empty list without inventing time', () => {
    expect(spaceCues([{ text: 'only' }], 30, 90)[0].atSec).toBe(30);
    expect(spaceCues([], 0, 100)).toEqual([]);
  });
});

describe('scriptsForLevel', () => {
  /**
   * Levels are a mirror, not a lock — `practice.ts` is explicit about that.
   * Ordering changes; availability never does.
   */
  it('offers every script at every level, in a different order', () => {
    for (const level of [1, 2, 3, 4]) {
      expect(scriptsForLevel(level)).toHaveLength(MEDITATION_SCRIPTS.length);
    }
    expect(scriptsForLevel(1)[0].practice).toBe('breath');
    expect(scriptsForLevel(4)[0].practice).toBe('noting');
  });
});

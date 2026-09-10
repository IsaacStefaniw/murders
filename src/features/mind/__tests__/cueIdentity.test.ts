import { MEDITATION_SCRIPTS } from '@/features/mind/scripts';

/**
 * The meditation player speaks each cue once and remembers which one it has
 * said by its `atSec`. Two cues sharing a second would make the second one
 * silent — a gap in a guided sit, with no error anywhere.
 *
 * It used to remember by text instead, which had the same failure for any
 * line a script repeats. No script repeats one today; that is a property of
 * the content, so it is pinned here rather than relied upon.
 */
describe('cue identity', () => {
  for (const script of MEDITATION_SCRIPTS) {
    for (const durationMin of script.durationsMin) {
      const cues = script.build(durationMin);

      test(`${script.id} @ ${durationMin} min gives every cue its own second`, () => {
        const seconds = cues.map((c) => c.atSec);
        expect(new Set(seconds).size).toBe(seconds.length);
      });

      test(`${script.id} @ ${durationMin} min keeps its cues in order`, () => {
        // cueAt walks forward and stops at the first cue in the future, so
        // an out-of-order track would strand every cue after it.
        const seconds = cues.map((c) => c.atSec);
        expect([...seconds].sort((a, b) => a - b)).toEqual(seconds);
      });
    }
  }

  test('some cues carry a detail line, and it is spoken as well as shown', () => {
    // Guards the reason the player speaks both parts: if detail ever stopped
    // being used, the second Speech.speak call would be dead code.
    const withDetail = MEDITATION_SCRIPTS.flatMap((s) => s.build(s.durationsMin[0])).filter(
      (c) => c.detail,
    );
    expect(withDetail.length).toBeGreaterThan(0);
    for (const cue of withDetail) {
      expect(cue.detail!.trim().length).toBeGreaterThan(0);
      // Spoken aloud, so it has to be a sentence, not a screen fragment.
      expect(cue.detail).not.toEqual(cue.text);
    }
  });
});

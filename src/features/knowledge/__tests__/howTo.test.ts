import { HOW_TO, howToFor } from '@/features/knowledge/howTo';
import { protocolById } from '@/features/knowledge/protocols';
import { ALL_LADDERS } from '@/features/paths/nextRung';

/** Every practice a coach offers as somebody's FIRST step. */
const firstRungs = [...new Set(ALL_LADDERS.flatMap((l) => l.rungs[0].protocolIds))];

describe('how to actually do it', () => {
  it('every id here is a real practice', () => {
    for (const id of Object.keys(HOW_TO)) {
      expect({ id, exists: protocolById(id) !== undefined }).toEqual({ id, exists: true });
    }
  });

  it('covers the two the library was called out for', () => {
    // A target with no method, and a coach's sentence that means nothing
    // to someone holding a dumbbell.
    expect(howToFor('fibre-30')?.example).toMatch(/29 g/);
    expect(howToFor('end-range-strength')?.steps.join(' ')).toMatch(/goblet squat/);
  });

  it('gives steps somebody could follow without knowing the jargon', () => {
    for (const [id, howTo] of Object.entries(HOW_TO)) {
      expect({ id, steps: howTo.steps.length >= 3 }).toEqual({ id, steps: true });
      for (const step of howTo.steps) {
        // A step that is one clause is a restatement, not an instruction.
        expect({ id, step, long: step.length > 25 }).toEqual({ id, step, long: true });
      }
    }
  });

  it('adds no claim the practice does not already carry', () => {
    // The steps operationalise; they never promise. Anything that reads as
    // a benefit belongs in `why`, where it has a source attached.
    const banned = ['cures', 'guaranteed', 'will fix', 'proven to', 'burns fat'];
    const text = JSON.stringify(HOW_TO).toLowerCase();
    for (const phrase of banned) expect(text).not.toContain(phrase);
  });

  it('puts a worked example wherever the practice states a target', () => {
    // "Thirty grams" and "two sessions" mean nothing without one.
    for (const id of ['fibre-30', 'end-range-strength', 'strength-minimum-weekly']) {
      expect({ id, example: Boolean(howToFor(id)?.example) }).toEqual({ id, example: true });
    }
  });
});

describe('coverage, as a line that can be raised', () => {
  it('every first rung on every ladder has steps', () => {
    // The first rung is what somebody meets before they have any idea what
    // they are doing, so it is the floor this gate holds. Higher rungs are
    // still outstanding and that is deliberate, not forgotten.
    const missing = firstRungs.filter((id) => !howToFor(id));
    expect(missing).toEqual([]);
  });

  it('reports honestly how much of the library is still without steps', () => {
    // Not an assertion, a number that should embarrass us into raising it.
    const total = 321;
    const done = Object.keys(HOW_TO).length;
    expect(done).toBeGreaterThanOrEqual(firstRungs.length);
    expect(done).toBeLessThan(total);
  });
});

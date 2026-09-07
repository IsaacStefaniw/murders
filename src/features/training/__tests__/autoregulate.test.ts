/**
 * Auto-regulation across every sleep band, every readiness band and every
 * window the workout screen can hand it.
 *
 * The rules: the main work is never removed, accessories go before any
 * main set is trimmed, the estimate it reports is what the exercises left
 * actually take, and a window under fifteen minutes gets the same answer
 * the non-programme path gives — no session, and the screen's "a walk
 * beats a rushed workout" — rather than a session pretending to fit.
 */

import { buildWorkout } from '@/features/modalities/gym/program';
import {
  autoRegulate,
  buildProgramme,
  estimateSessionMin,
  type ProgrammeSession,
} from '@/features/training/programme';

const programme = buildProgramme(
  {
    goal: 'hypertrophy',
    experience: 'consistent',
    level: 'established',
    daysAvailable: 4,
    sessionMin: 60,
    equipment: 'gym',
    focusLift: 'bench',
    age: 38,
  },
  { bench: 100, squat: 140, deadlift: 180, ohp: 60 },
);
const session: ProgrammeSession = programme.weeks[0].sessions[0];

const SLEEP: (number | undefined)[] = [5, 6.5, 8, undefined];
const READINESS: ('ready' | 'caution' | 'back-off' | undefined)[] = ['ready', 'caution', 'back-off', undefined];
const WINDOWS = [15, 20, 30, 45, 60];

const mains = (s: ProgrammeSession) => s.exercises.filter((e) => !e.accessory);
const accessories = (s: ProgrammeSession) => s.exercises.filter((e) => e.accessory);

describe('autoRegulate across the bands', () => {
  it('keeps every main movement, cuts accessories before any main set, and reports the honest estimate', () => {
    for (const sleptHours of SLEEP) {
      for (const readiness of READINESS) {
        for (const availableMin of WINDOWS) {
          const label = `${sleptHours ?? 'unknown'}h / ${readiness ?? 'unknown'} / ${availableMin} min`;
          const out = autoRegulate(session, { availableMin, sleptHours, readiness, age: 38 });
          if (!out) throw new Error(`${label}: no session`);

          // Main work: same movements, same order.
          expect([label, mains(out).map((e) => e.name)]).toEqual([label, mains(session).map((e) => e.name)]);

          // A main set may only be trimmed once no accessory is left to cut.
          const mainSetsTrimmed = mains(out).some(
            (e, i) => e.sets < mains(session)[i].sets,
          );
          if (mainSetsTrimmed && accessories(out).length > 0) {
            throw new Error(`${label}: trimmed main sets with accessories still in`);
          }

          // Never below the two-set floor, never a heavier load than programmed.
          for (const e of mains(out)) {
            if (e.sets < 2) throw new Error(`${label}: ${e.name} at ${e.sets} sets`);
            const original = mains(session).find((o) => o.name === e.name)!;
            expect([label, e.loadKg]).toEqual([label, original.loadKg]);
          }

          // The number on the screen is the number the session takes.
          expect([label, out.estimatedMin]).toEqual([label, estimateSessionMin(out.exercises, 38)]);
        }
      }
    }
  });

  it('fits a window that is big enough for what is left', () => {
    for (const availableMin of WINDOWS) {
      const out = autoRegulate(session, { availableMin, age: 38 })!;
      const floor = estimateSessionMin(
        mains(session).map((e) => ({ ...e, sets: 2 })),
        38,
      );
      // If the main work at two sets fits the window, the whole session
      // must have been made to fit; if it cannot, the estimate says so.
      if (floor <= availableMin) expect(out.estimatedMin).toBeLessThanOrEqual(availableMin);
      else expect(out.estimatedMin).toBeGreaterThan(availableMin);
    }
  });

  it('answers a window under fifteen minutes the way the non-programme path does', () => {
    expect(buildWorkout(14, 'gym', 1)).toBeNull();
    expect(autoRegulate(session, { availableMin: 14, age: 38 })).toBeNull();
    expect(autoRegulate(session, { availableMin: 15, age: 38 })).not.toBeNull();
    expect(autoRegulate(session, { availableMin: 0, age: 38 })).toBeNull();
  });
});

describe('what each band does on its own', () => {
  it('leaves a normal night, a fair night and a cautious morning alone', () => {
    expect(autoRegulate(session, { sleptHours: 8 })).toEqual(session);
    expect(autoRegulate(session, { sleptHours: 6.5 })).toEqual(session);
    expect(autoRegulate(session, { sleptHours: 6 })).toEqual(session);
    expect(autoRegulate(session, { readiness: 'ready' })).toEqual(session);
    expect(autoRegulate(session, { readiness: 'caution' })).toEqual(session);
    expect(autoRegulate(session, {})).toEqual(session);
  });

  it('cuts accessories to one on a short night and says so', () => {
    const out = autoRegulate(session, { sleptHours: 5, availableMin: 60, age: 38 })!;
    expect(accessories(out)).toHaveLength(1);
    expect(mains(out)).toEqual(mains(session));
    expect(out.note).toMatch(/short night/i);
    expect(out.note).not.toMatch(/tight window/i);
  });

  it('cuts accessories to one when the recovery read says back off, in the person\'s own numbers', () => {
    const out = autoRegulate(session, { sleptHours: 8, readiness: 'back-off', availableMin: 60, age: 38 })!;
    expect(accessories(out)).toHaveLength(1);
    expect(out.note).toMatch(/your own recovery numbers/i);
  });

  it('names both when both are true', () => {
    const out = autoRegulate(session, { sleptHours: 5, availableMin: 25, age: 38 })!;
    expect(out.note).toMatch(/short recovery and a tight window/i);
  });

  it('names the minutes when only time is short', () => {
    const out = autoRegulate(session, { sleptHours: 8, availableMin: 25, age: 38 })!;
    expect(out.note).toBe('Only 25 minutes — condensed, main work kept.');
  });

  it('does not mutate the programmed session', () => {
    const before = JSON.stringify(session);
    autoRegulate(session, { sleptHours: 5, availableMin: 15, readiness: 'back-off', age: 38 });
    expect(JSON.stringify(session)).toBe(before);
  });
});

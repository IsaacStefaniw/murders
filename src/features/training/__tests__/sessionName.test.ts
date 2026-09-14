/**
 * "Muscle-group focuses instead of 'Upper A'."
 *
 * The letters are how a coach labels a split on a whiteboard. They are not
 * how anybody decides whether they feel like doing it — and on the screen
 * where the week's sessions sit side by side as chips, "Upper A" and
 * "Upper B" answer the question identically while being different taps.
 */

import { buildProgramme, type TrainingInputs } from '@/features/training/programme';
import { muscleGroupOf, nameSessions, sessionMuscleName } from '@/features/training/sessionName';

describe('naming one movement', () => {
  it('reads a muscle group off the movement pattern', () => {
    expect(muscleGroupOf('Bench press')).toBe('Chest');
    expect(muscleGroupOf('Overhead press')).toBe('Shoulders');
    expect(muscleGroupOf('Barbell row')).toBe('Back');
    expect(muscleGroupOf('Squat')).toBe('Legs');
    expect(muscleGroupOf('Deadlift')).toBe('Glutes');
  });

  it('names movements the swap table does not hold', () => {
    expect(muscleGroupOf('Bulgarian split squat')).toBe('Legs');
    expect(muscleGroupOf('Calf raises')).toBe('Calves');
    expect(muscleGroupOf('Plank')).toBe('Core');
  });

  it('returns nothing for something it cannot place', () => {
    expect(muscleGroupOf('Cardio: easy pace to warm up')).toBeNull();
  });
});

describe('naming a session', () => {
  it('names it after its primary lifts, in sentence case', () => {
    // "Chest, Shoulders & Back" reads as a product name. This reads as English.
    expect(
      sessionMuscleName([
        { name: 'Bench press' },
        { name: 'Overhead press' },
        { name: 'Barbell row' },
      ]),
    ).toBe('Chest, shoulders & back');
  });

  it('ignores the accessories', () => {
    // A leg day carrying a lat pulldown as its fourth movement is not a
    // back day, and letting accessories vote makes every name "everything".
    expect(
      sessionMuscleName([
        { name: 'Squat' },
        { name: 'Deadlift' },
        { name: 'Lat pulldown', accessory: true },
      ]),
    ).toBe('Legs & glutes');
  });

  it('stops at three groups', () => {
    const name = sessionMuscleName([
      { name: 'Squat' },
      { name: 'Bench press' },
      { name: 'Barbell row' },
      { name: 'Overhead press' },
      { name: 'Plank' },
    ]);
    expect(name).toBe('Legs, chest & back');
  });

  it('never produces two ampersands', () => {
    const name = sessionMuscleName([{ name: 'Squat' }, { name: 'Deadlift' }]);
    expect(name!.match(/&/g)).toHaveLength(1);
  });

  it('gives nothing back where nothing can be derived', () => {
    expect(sessionMuscleName([{ name: 'Cardio: easy pace, talking the whole way' }])).toBeNull();
  });
});

describe('naming a whole week', () => {
  it('keeps a unique name clean, with no letter', () => {
    const out = nameSessions([
      { title: 'Upper A', exercises: [{ name: 'Bench press' }] },
      { title: 'Lower A', exercises: [{ name: 'Squat' }] },
    ]);
    expect(out).toEqual(['Chest', 'Legs']);
  });

  it('adds the letters back only where two names would collide', () => {
    // A four-day upper/lower block runs the same movements twice. They ARE
    // the same session run twice, and a repeated chip is worse than a letter.
    const out = nameSessions([
      { title: 'Upper A', exercises: [{ name: 'Bench press' }] },
      { title: 'Lower A', exercises: [{ name: 'Squat' }] },
      { title: 'Upper B', exercises: [{ name: 'Bench press' }] },
      { title: 'Lower B', exercises: [{ name: 'Squat' }] },
    ]);
    expect(out).toEqual(['Chest A', 'Legs A', 'Chest B', 'Legs B']);
  });

  it('leaves a conditioning day its own title', () => {
    const out = nameSessions([
      { title: 'Full body A', exercises: [{ name: 'Squat' }] },
      { title: 'Conditioning', exercises: [{ name: 'Cardio: hard intervals' }] },
    ]);
    expect(out).toEqual(['Legs', 'Conditioning']);
  });
});

describe('the names that reach a real block', () => {
  const inputs: TrainingInputs = {
    goal: 'strength',
    experience: 'consistent',
    daysAvailable: 4,
    sessionMin: 60,
    equipment: 'gym',
  };

  it('never ships an Upper A', () => {
    for (const days of [2, 3, 4, 5]) {
      const p = buildProgramme({ ...inputs, daysAvailable: days });
      for (const w of p.weeks) {
        for (const s of w.sessions) {
          expect(s.title).not.toMatch(/^(Upper|Lower|Full body) [A-E]$/);
        }
      }
    }
  });

  it('keeps titles unique inside a week, because they are keys', () => {
    // swapKey and the session chips are both keyed on the title.
    for (const days of [2, 3, 4, 5]) {
      const p = buildProgramme({ ...inputs, daysAvailable: days, goal: 'fitter' });
      for (const w of p.weeks) {
        const titles = w.sessions.map((s) => s.title);
        expect(new Set(titles).size).toBe(titles.length);
      }
    }
  });

  it('keeps `kind` as the stable handle for the split', () => {
    const p = buildProgramme(inputs);
    expect(p.weeks[0].sessions.map((s) => s.kind)).toEqual(['upper', 'lower', 'upper', 'lower']);
  });
});

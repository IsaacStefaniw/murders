/**
 * Gym coach — deterministic session generation.
 *
 * A workout is decided before the user arrives: exercises, sets, rests.
 * Decision fatigue at the gym door is a skip. When time is short the
 * session shrinks intelligently (main work survives, accessories go) —
 * never abandoned. No injury or medical advice, ever.
 */

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  restSec: number;
  /** Accessories are the first thing cut when time is short. */
  accessory?: boolean;
}

export interface WorkoutSession {
  title: string;
  exercises: Exercise[];
  estimatedMin: number;
  note?: string;
}

type Setting = 'gym' | 'home' | 'outdoors' | 'mixed';

const MAIN: Record<Exclude<Setting, 'mixed'>, Exercise[][]> = {
  gym: [
    [
      { name: 'Squat', sets: 4, reps: '5–8', restSec: 120 },
      { name: 'Bench press', sets: 3, reps: '6–10', restSec: 90 },
      { name: 'Seated row', sets: 3, reps: '8–12', restSec: 90 },
    ],
    [
      { name: 'Deadlift', sets: 3, reps: '3–6', restSec: 150 },
      { name: 'Overhead press', sets: 3, reps: '6–10', restSec: 90 },
      { name: 'Lat pulldown', sets: 3, reps: '8–12', restSec: 90 },
    ],
  ],
  home: [
    [
      { name: 'Push-ups', sets: 4, reps: 'to 2 short of failure', restSec: 75 },
      { name: 'Goblet or air squats', sets: 4, reps: '12–20', restSec: 75 },
      { name: 'Backpack rows', sets: 3, reps: '10–15', restSec: 75 },
    ],
  ],
  outdoors: [
    [
      { name: 'Run intervals — 3 min hard / 2 min easy', sets: 5, reps: '1 round', restSec: 0 },
      { name: 'Hill strides', sets: 4, reps: '20 sec', restSec: 60 },
    ],
  ],
};

const ACCESSORIES: Exercise[] = [
  { name: 'Curls or band pulls', sets: 2, reps: '10–15', restSec: 60, accessory: true },
  { name: 'Core: plank', sets: 2, reps: '45 sec', restSec: 45, accessory: true },
];

function estimateMin(exercises: Exercise[]): number {
  const workSec = exercises.reduce(
    (sum, e) => sum + e.sets * (45 + e.restSec),
    0,
  );
  return Math.round(workSec / 60) + 5; // + warm-up
}

/**
 * Build the session for the time that actually exists.
 * `dayIndex` rotates main blocks so consecutive sessions differ.
 */
export function buildWorkout(
  availableMin: number,
  setting: Setting,
  dayIndex = 0,
): WorkoutSession | null {
  if (availableMin < 15) return null;
  const pool = MAIN[setting === 'mixed' ? 'gym' : setting];
  const main = pool[dayIndex % pool.length].map((e) => ({ ...e }));

  let exercises: Exercise[] = [...main, ...ACCESSORIES.map((e) => ({ ...e }))];
  let shortened = false;

  // Cut accessories first, then trim sets — the main work survives.
  while (estimateMin(exercises) > availableMin) {
    const lastAccessory = [...exercises].reverse().find((e) => e.accessory);
    if (lastAccessory) {
      exercises = exercises.filter((e) => e !== lastAccessory);
      shortened = true;
      continue;
    }
    const heaviest = exercises.reduce((a, b) => (a.sets >= b.sets ? a : b));
    if (heaviest.sets <= 2) break;
    heaviest.sets -= 1;
    shortened = true;
  }

  return {
    title: setting === 'outdoors' ? 'Intervals' : 'Strength',
    exercises,
    estimatedMin: Math.min(estimateMin(exercises), availableMin),
    note: shortened
      ? `Condensed for ${availableMin} minutes — main work kept, extras trimmed.`
      : undefined,
  };
}

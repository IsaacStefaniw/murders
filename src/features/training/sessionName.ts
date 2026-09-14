/**
 * Naming a session after what it trains.
 *
 * Isaac: "muscle-group focuses instead of 'Upper A'".
 *
 * "Upper A" and "Lower B" are how a coach labels a split on a whiteboard.
 * They are not how anybody decides whether they feel like doing it, and
 * they are actively unhelpful on the screen where the day's sessions sit
 * side by side and the question is "which of these do I want today?" —
 * "Upper A" and "Upper B" answer it identically while being different
 * sessions.
 *
 * So the name comes from the session's own primary lifts. A session with a
 * bench press, an overhead press and a row is "Chest, shoulders & back",
 * because that is what it is. Nothing about the programme changes; this
 * reads what was already built and says it in words.
 *
 * ── WHY THE PRIMARY LIFTS ONLY ──────────────────────────────────────────
 *
 * Accessories are deliberately excluded. A lower-body day carrying a lat
 * pulldown as its fourth movement is not a back day, and letting the
 * accessories vote turns every name into "everything" — which is the same
 * problem as "Upper A" with more syllables.
 *
 * ── WHY THE LETTERS SURVIVE, SOMETIMES ──────────────────────────────────
 *
 * A four-day upper/lower block programmes Upper A and Upper B with the
 * same movements. They are genuinely the same session run twice, so they
 * derive the same name, and a name repeated in a list of chips is worse
 * than a letter. `nameSessions` therefore adds A/B/C back, but only to the
 * names that would otherwise collide — so "Legs, glutes & hamstrings" and
 * "Chest, shoulders & back" stay clean in a block where they are unique.
 *
 * Session titles are also keys: `swapKey` and the session chips are keyed
 * off the title, so uniqueness within a week is a correctness requirement
 * rather than a nicety.
 */

import { patternOf } from '@/features/training/swap';

/**
 * What a movement pattern trains, in the words people use.
 *
 * One word each, deliberately. "Glutes & hamstrings" is the more accurate
 * name for a hinge and it produces "Legs & glutes & hamstrings" once it is
 * joined to a squat — two ampersands in a chip label, which reads as a bug.
 * The list is a name, not an anatomy lesson.
 */
const GROUP_OF_PATTERN: Record<string, string> = {
  'horizontal press': 'Chest',
  'vertical press': 'Shoulders',
  pull: 'Back',
  squat: 'Legs',
  hinge: 'Glutes',
  arms: 'Arms',
  core: 'Core',
};

/** Movements the swap table does not hold, named directly. */
const GROUP_OF_NAME: { match: RegExp; group: string }[] = [
  { match: /carry|farmer/i, group: 'Core' },
  { match: /calf/i, group: 'Calves' },
  { match: /lunge|split squat|step-up/i, group: 'Legs' },
  { match: /curl|tricep|extension/i, group: 'Arms' },
  { match: /plank|dead bug|hollow/i, group: 'Core' },
  { match: /balance|stand on one leg/i, group: 'Balance' },
];

export function muscleGroupOf(exerciseName: string): string | null {
  const pattern = patternOf(exerciseName);
  if (pattern && GROUP_OF_PATTERN[pattern]) return GROUP_OF_PATTERN[pattern];
  for (const { match, group } of GROUP_OF_NAME) {
    if (match.test(exerciseName)) return group;
  }
  return null;
}

/** "Chest, shoulders & back". At most three, in the order they are trained. */
export function sessionMuscleName(
  exercises: { name: string; accessory?: boolean }[],
): string | null {
  const groups: string[] = [];
  for (const e of exercises) {
    if (e.accessory) continue;
    const group = muscleGroupOf(e.name);
    if (group && !groups.includes(group)) groups.push(group);
  }
  if (groups.length === 0) return null;
  // Sentence case: the first group carries the capital, the rest do not.
  // "Chest, Shoulders & Back" reads as a product name; this reads as English.
  const shown = groups.slice(0, 3).map((g, i) => (i === 0 ? g : g.toLowerCase()));
  if (shown.length === 1) return shown[0];
  return `${shown.slice(0, -1).join(', ')} & ${shown[shown.length - 1]}`;
}

/**
 * Names for a whole week's sessions, guaranteed distinct.
 *
 * Falls back to the session's existing title where nothing can be derived.
 * The conditioning day is the case that matters: it trains no muscle group
 * in particular, "Conditioning" already says what it is, and giving it a
 * body-part name would be worse than the letters this replaces.
 */
export function nameSessions<T extends { title: string; exercises: { name: string; accessory?: boolean }[] }>(
  sessions: T[],
): string[] {
  const derived = sessions.map((s) => sessionMuscleName(s.exercises) ?? s.title);
  const counts = new Map<string, number>();
  for (const name of derived) counts.set(name, (counts.get(name) ?? 0) + 1);
  const seen = new Map<string, number>();
  return derived.map((name) => {
    if ((counts.get(name) ?? 0) < 2) return name;
    const n = seen.get(name) ?? 0;
    seen.set(name, n + 1);
    return `${name} ${String.fromCharCode(65 + n)}`;
  });
}

/**
 * The same practice, prescribed twice under two names.
 *
 * Three separate instances, all found by reading what the pathway audit
 * actually built rather than by scanning its table for zeroes:
 *
 *   - Family stacked "One outing in the diary", "Protected family evening"
 *     and "The family year" on top of "The booked-in family adventure" —
 *     four bookings of one idea, 412 new minutes a week aimed at the
 *     busiest person the app has.
 *   - Training put "Easy aerobic session — conversational pace" and
 *     "Second aerobic session" beside Zone 2, whose own summary is
 *     'steady "can still hold a conversation" cardio'.
 *   - Work scheduled a "Quarterly arc" every Sunday, fifty-two times a
 *     year, because routines have no cadence longer than a week.
 *
 * The dedupe in withLadder only matches protocol ids, and a ladder rung
 * has none — so a rung must DECLARE what it covers. This test is the
 * standing check that it did.
 */

import { PATHS, type PathId } from '@/features/paths/definitions';
import { LEVEL_ORDER } from '@/features/paths/level';
import { isRelabelledTime } from '@/features/knowledge/protocols';
import type { LifeProfile } from '@/types/domain';

const profile = {
  wakeTime: '06:00',
  sleepTime: '22:30',
  workDays: [1, 2, 3, 4, 5],
  workStart: '09:00',
  workEnd: '17:30',
  priorities: ['health', 'work', 'family'],
  people: [
    { id: 'p', name: 'Sam', relation: 'partner' },
    { id: 'k', name: 'Kid', relation: 'child' },
  ],
  trainingDaysPerWeek: 5,
  trainingDurationMin: 60,
  trainingPreference: 'gym',
  capacity: 'push',
  age: 38,
  kidsCount: 2,
} as unknown as LifeProfile;

const PATH_IDS = Object.keys(PATHS) as PathId[];

/** Weekly minutes the person has to FIND — re-labelled time excluded. */
const newMinutes = (routines: { durationMin: number; days: unknown[]; protocolId?: string }[]) =>
  routines
    .filter((r) => !isRelabelledTime(r.protocolId))
    .reduce((n, r) => n + r.durationMin * Math.max(1, r.days.length), 0);

/**
 * Training the person asked for by name. Five sixty-minute sessions is 300
 * minutes of the training pathway's worst case and it is their own answer
 * to their own question — the app did not add it, and counting it here
 * would measure the user rather than the design.
 */
const ASKED_FOR = profileTrainingMinutes();
function profileTrainingMinutes(): number {
  return 5 * 60;
}

describe('no pathway prescribes the same practice twice', () => {
  it.each(PATH_IDS)('%s never schedules one protocol under two routines', (path) => {
    for (const level of LEVEL_ORDER) {
      const build = PATHS[path].build({ level }, profile);
      const seen = new Map<string, string>();
      for (const r of build.routines) {
        if (!r.protocolId) continue;
        const already = seen.get(r.protocolId);
        expect({ level, protocol: r.protocolId, first: already ?? null }).toEqual({
          level,
          protocol: r.protocolId,
          first: null,
        });
        seen.set(r.protocolId, r.title);
      }
    }
  });

  /**
   * A ceiling, not a target. Someone who asked for five sixty-minute
   * sessions gets five sixty-minute sessions — that is 300 of training's
   * worst case and it is their own answer, not the app's idea. What this
   * catches is the app adding hours on top of that without anyone deciding
   * to.
   */
  it.each(PATH_IDS)('%s keeps what IntentNorth adds within a sane week', (path) => {
    for (const level of LEVEL_ORDER) {
      const build = PATHS[path].build({ level }, profile);
      const total = newMinutes(build.routines) - (path === 'training' ? ASKED_FOR : 0);
      expect({ path, level, overSevenHours: total > 420 }).toEqual({
        path,
        level,
        overSevenHours: false,
      });
    }
  });
});

describe('a routine says how often it really happens', () => {
  it('never titles something quarterly and then schedules it weekly', () => {
    for (const path of PATH_IDS) {
      for (const level of LEVEL_ORDER) {
        for (const r of PATHS[path].build({ level }, profile).routines) {
          const claimsRarity = /quarterly|monthly|seasonal|annual|yearly/i.test(r.title);
          // Routines have no cadence longer than a week, so a title
          // promising one is writing a cheque the scheduler cannot cash.
          expect({ title: r.title, claimsRarity }).toEqual({ title: r.title, claimsRarity: false });
        }
      }
    }
  });
});

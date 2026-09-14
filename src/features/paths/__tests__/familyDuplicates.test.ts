import { PATHS } from '@/features/paths/definitions';
import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { dedupeRoutines, routineKey } from '@/features/planner/mergeRoutines';

/**
 * Three Saturday mornings for one Saturday.
 *
 * `routineKey` returns null for a routine with no `protocolId` and no
 * `sessionType`, and null means "never collides". Two of the three weekend
 * family blocks this app can produce had neither, so a household with kids
 * could end up with the interview's "Family adventure", the coach's
 * `family-adventure`, and a `goodWeekend` block — all on Saturday morning,
 * none of them able to dedupe against the others.
 *
 * Same root cause as the sauna: something that should have been one thing
 * was two, because nothing identified them as the same thing.
 */

const ANSWERS = {
  name: 'Sam',
  weekShape: 'employed',
  priorities: ['family', 'health', 'work'],
  household: ['partner', 'kids'],
  kidsCount: '2',
  partnerName: 'Alex',
  workDays: ['1', '2', '3', '4', '5'],
  workHours: '09:00-17:30',
  sleep: '06:30-22:30',
  energy: 'morning',
  trainingDays: '3',
  capacity: 'steady',
} as never;

/** Saturday-morning family blocks, however they were produced. */
function weekendFamily(routines: { title: string; area: string; days: number[]; preferredStart: string }[]) {
  return routines.filter(
    (r) => r.area === 'family' && r.days.includes(6) && r.preferredStart < '12:00',
  );
}

describe('the weekend family block', () => {
  it('every routine the family pathway makes can be deduped', () => {
    // The actual invariant. A routine with no identity is a routine that
    // can be added twice for ever.
    const profile = buildLifeOperatingPlan(ANSWERS).profile;
    const build = PATHS.family.build({ goodWeekend: 'outdoors', variant: 'youngKids' }, profile);
    const anonymous = build.routines.filter((r) => routineKey(r) === null);
    expect({ anonymous: anonymous.map((r) => r.title) }).toEqual({ anonymous: [] });
  });

  it('the interview’s weekend family block can be deduped too', () => {
    // Scoped to the weekend block, which is the duplicate that was
    // shipping. Other untagged interview routines ("Date night") have the
    // same latent problem against the relationship coach and are a
    // separate fix — noted rather than widened into here.
    const plan = buildLifeOperatingPlan(ANSWERS);
    const adventure = plan.routines.find((r) => r.title === 'Family adventure');
    expect(adventure).toBeDefined();
    expect(routineKey(adventure!)).toBe('protocol:family-adventure');
  });

  it('leaves one Saturday morning, not three', () => {
    const plan = buildLifeOperatingPlan(ANSWERS);
    const build = PATHS.family.build({ goodWeekend: 'outdoors', variant: 'youngKids' }, plan.profile);
    const merged = dedupeRoutines([...plan.routines, ...build.routines]);
    expect(weekendFamily(merged).length).toBeLessThanOrEqual(1);
  });
});

/**
 * Who the family coach is actually for.
 *
 * The family pathway presumed kids. A grandparent, a couple with no
 * children, a carer looking after a parent, and a parent of teenagers all
 * got the same build: a three-hour Saturday outing and "one-on-one with
 * each child" (QA open item PW-O6). The usability carer asked for calm
 * parenting and her own recovery, not outings; the operator with teenagers
 * asked for a coach that spoke to them.
 *
 * Composition is read from the intake first, because it is what the
 * person just said, and from the profile second, because the interview
 * asked "who's at home" before the coach was ever opened. Nothing here is
 * a persona: it is the handful of facts that change which practices make
 * sense at all.
 */

import { answered, answeredValues } from '@/features/knowledge/questionBank';
import type { GoalMilestone, LifeProfile, Routine } from '@/types/domain';

export interface HouseholdComposition {
  underFive: boolean;
  primary: boolean;
  teens: boolean;
  /** Grown-up children who have moved out. */
  adultKids: boolean;
  grandkids: boolean;
  /** A parent, or another adult, the person cares for. */
  caredFor: boolean;
  partner: boolean;
  /** Any child living at home, whatever the age. */
  kidsAtHome: boolean;
}

/**
 * The interview names these people with fixed strings (buildPlan.ts) and
 * a relation of 'family'. Matching on the string is fragile and is the
 * reason the report proposes a 'caredFor' and 'grandchild' relation on
 * Person; until then this is the only signal the profile carries.
 */
const CARED_FOR_NAME = /care for/i;
const GRANDKIDS_NAME = /grandchild/i;

export function composition(
  answers: Record<string, string>,
  profile: LifeProfile | null,
): HouseholdComposition {
  const people = profile?.people ?? [];
  const partner = people.some((p) => p.relation === 'partner');
  const profileKids = people.some((p) => p.relation === 'child') || Boolean(profile?.kidsCount);
  const profileCaredFor = people.some((p) => p.relation === 'family' && CARED_FOR_NAME.test(p.name));
  const profileGrandkids = people.some((p) => p.relation === 'family' && GRANDKIDS_NAME.test(p.name));

  const agesAnswered = answeredValues(answers, 'ages').length > 0;
  const underFive = answered(answers, 'ages', 'under5');
  const primary = answered(answers, 'ages', 'primary');
  const teens = answered(answers, 'ages', 'teens');
  const adultKids = answered(answers, 'ages', 'adult');
  // 'none' is a real answer — the person said there are no kids — and it
  // beats a stale kidsCount on the profile. An unanswered question falls
  // back to what the interview knew.
  const kidsAtHome = agesAnswered
    ? underFive || primary || teens
    : profileKids;

  const othersAnswered = answeredValues(answers, 'others').length > 0;
  const caredFor = othersAnswered ? answered(answers, 'others', 'parent') : profileCaredFor;
  const grandkids = othersAnswered ? answered(answers, 'others', 'grandkids') : profileGrandkids;

  return { underFive, primary, teens, adultKids, grandkids, caredFor, partner, kidsAtHome };
}

/**
 * Which of the five builds a household gets. One variant, not a blend:
 * a carer with teenagers gets the carer build, because the person's own
 * recovery is the thing everything else waits on, and the teenage
 * practices are still one tap away in the library.
 */
export type FamilyVariant = 'carer' | 'teens' | 'youngKids' | 'grandparent' | 'noKids';

export function familyVariant(c: HouseholdComposition): FamilyVariant {
  if (c.caredFor) return 'carer';
  if (c.teens && !c.underFive && !c.primary) return 'teens';
  if (c.kidsAtHome) return 'youngKids';
  if (c.grandkids) return 'grandparent';
  return 'noKids';
}

/** Titles and milestones that only make sense with a child at home. */
export const KIDS_ONLY = /\bchild(ren|hood)?\b|\bkids?\b|babysitter/i;
/** The weekly outing — wrong for a carer, whatever the rung promises. */
export const OUTINGS = /\boutings?\b|adventure/i;

/**
 * Take the pieces a household cannot use out of a build.
 *
 * The ladder is written once per pathway, so its developing rung promises
 * "One-on-one time with each child" to everyone and its foundation rung
 * puts an outing in every diary. A grandparent gets the grandchildren
 * version from the build itself; a couple with no kids should not see the
 * promise at all; a carer running on empty should not be told to book a
 * Saturday adventure.
 */
export function withoutMatching<
  T extends { routines: Routine[]; goal: { milestones?: GoalMilestone[]; routineIds: string[] } },
>(build: T, pattern: RegExp): T {
  const routines = build.routines.filter((r) => !pattern.test(r.title));
  return {
    ...build,
    routines,
    goal: {
      ...build.goal,
      milestones: (build.goal.milestones ?? []).filter((m) => !pattern.test(m.title)),
      routineIds: routines.map((r) => r.id),
    },
  };
}

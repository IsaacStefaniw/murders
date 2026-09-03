/**
 * The pathway ladder, made real.
 *
 * ── The defect this file exists to fix ──────────────────────────────────
 *
 * `LEVEL_BLURB` in ./level tells every user, for every one of the seven
 * pathways, exactly what changes at each rung — "one account, one automatic
 * transfer, one number to watch" at the bottom, "allocation across accounts
 * and a drawdown plan" at the top. Twenty-eight specific promises.
 *
 * An audit of 7,000 profiles (docs/PATHWAY_HONING_BRIEF.md) found that
 * **100% of builds were byte-identical across all four levels, in all seven
 * pathways.** `buildGoalPlan` never received a level, so none of those
 * promises were kept. The ladder was a label on a box with one thing in it.
 *
 * ── What a rung actually is ─────────────────────────────────────────────
 *
 * ADDITIVE, NOT PARALLEL. Each rung is the rung below it plus something,
 * never a different programme. Someone climbing does not lose the thing
 * that was working, and someone stepping back keeps a coherent subset
 * rather than being handed a stranger's plan.
 *
 * ONE NEW THING AT A TIME. The bottom rung is deliberately thin. A
 * foundation user given the established programme does not do 40% of it —
 * they do none of it, decide the app is not for them, and leave. The
 * cohort work has said this in every round: overcommitted low-capacity
 * users plateau no matter how well the time is chosen.
 *
 * THE TOP RUNG IS AN ARC, NOT MORE REPS. Advanced adds the long horizon —
 * a season, a quarter, a year — because that is what someone two years in
 * actually lacks, and piling on volume is how you injure or bore them.
 *
 * EVERY ADDITION SAYS WHY. A routine that appears without explanation is
 * indistinguishable from a bug.
 */

import { newId } from '@/lib/dates';
import type { GoalMilestone, LifeProfile, Routine, Weekday } from '@/types/domain';

import type { PathId } from './definitions';
import { LEVEL_ORDER, levelRank, type PathLevel } from './level';

/** A rung's contribution: what it adds on top of every rung below it. */
export interface Rung {
  /** Recurring work introduced at this rung. */
  routines: RungRoutine[];
  /** Progress steps introduced at this rung. */
  milestones: string[];
  /** One sentence shown with the plan, explaining what just appeared. */
  note: string;
}

export interface RungRoutine {
  title: string;
  /**
   * Concepts this rung's routine already covers.
   *
   * Deduplication by exact title is not enough: the family pathway's
   * protocol already schedules "One-on-one with each child" and the
   * developing rung added "One-on-one time — one child, no phone", so a
   * user was handed the same practice twice under two names. Matching on
   * the concept is what stops a near-duplicate reading as a bigger plan.
   */
  covers?: string[];
  durationMin: number;
  days: Weekday[];
  preferredStart: string;
  preferredEnd: string;
  area: Routine['area'];
  energy: Routine['energy'];
  protocolId?: string;
  /** Protected work is never displaced. Used sparingly and on purpose. */
  protectedBlock?: boolean;
  tier?: Routine['tier'];
}

const WEEKEND: Weekday[] = [6];
const SUNDAY: Weekday[] = [0];
const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5];

/**
 * The ladder, one pathway at a time.
 *
 * Each entry is written against the promise already on screen in
 * `LEVEL_BLURB`, because that text is the specification a user has
 * already read. Where the two disagree, the blurb is right and this is
 * wrong.
 */
const LADDER: Record<PathId, Record<PathLevel, Rung>> = {
  training: {
    foundation: {
      routines: [
        {
          title: 'Movement practice — patterns before load',
          durationMin: 20,
          days: [2, 5],
          preferredStart: '07:00',
          preferredEnd: '09:00',
          area: 'health',
          energy: 'morning',
          tier: 'should',
        },
      ],
      milestones: ['Six sessions finished — any six', 'Both lifts feel repeatable'],
      note: 'Fewer movements, lighter loads, a technical focus. Finishing every session able to do it again is the whole target.',
    },
    developing: {
      routines: [
        {
          title: 'Easy aerobic session — conversational pace',
          durationMin: 30,
          days: WEEKEND,
          preferredStart: '08:00',
          preferredEnd: '11:00',
          area: 'health',
          energy: 'morning',
          tier: 'should',
        },
      ],
      milestones: ['Twelve sessions logged with weights', 'One full four-week block finished'],
      note: 'Barbell work comes in and the aerobic base starts. This is the piece most lifters skip, and it pays the longest.',
    },
    established: {
      routines: [
        {
          title: 'Second aerobic session',
          durationMin: 40,
          days: [3],
          preferredStart: '17:30',
          preferredEnd: '19:30',
          area: 'health',
          energy: 'evening',
          tier: 'could',
        },
      ],
      milestones: ['A peak week completed as written', 'A heavy top set on the lift you care about'],
      note: 'Full volume and intensity, a peak week, and a heavy top set. The second easy session is what lets the hard one stay hard.',
    },
    advanced: {
      routines: [
        {
          title: 'Block review — what the numbers did',
          durationMin: 25,
          days: SUNDAY,
          preferredStart: '17:00',
          preferredEnd: '19:00',
          area: 'health',
          energy: 'evening',
          tier: 'could',
        },
      ],
      milestones: ['An overreach week absorbed and recovered from', 'A twelve-week arc planned in advance'],
      note: 'The block is now planned in arcs rather than months, and reviewed against your own logged numbers.',
    },
  },

  nutrition: {
    foundation: {
      routines: [
        {
          title: 'Protein at breakfast',
          durationMin: 10,
          days: [1, 2, 3, 4, 5, 6, 0],
          preferredStart: '07:00',
          preferredEnd: '09:30',
          area: 'health',
          energy: 'morning',
          tier: 'should',
        },
      ],
      milestones: ['Seven days of protein at breakfast'],
      note: 'One change at a time. Protein at breakfast moves before anything else does.',
    },
    developing: {
      routines: [
        {
          title: 'Weekly weigh-in — the trend, not the number',
          durationMin: 5,
          days: WEEKEND,
          preferredStart: '07:00',
          preferredEnd: '10:00',
          area: 'health',
          energy: 'morning',
          tier: 'could',
        },
      ],
      milestones: ['Protein and fibre targets known', 'Four weeks of trend data'],
      note: 'Targets for protein and fibre, and a weekly trend rather than a daily number that only ever makes people anxious.',
    },
    established: {
      routines: [
        {
          title: 'Cook-ahead block — two meals banked',
          durationMin: 60,
          days: SUNDAY,
          preferredStart: '15:00',
          preferredEnd: '18:00',
          area: 'health',
          energy: 'evening',
          tier: 'could',
        },
      ],
      milestones: ['Meals timed around training for a full block', 'One adjustment made from your own trend'],
      note: 'Full targets, meals timed around training, and adjustment from your own trend instead of a generic table.',
    },
    advanced: {
      routines: [
        {
          title: 'Phase review — intake against the training block',
          durationMin: 20,
          days: SUNDAY,
          preferredStart: '17:00',
          preferredEnd: '19:00',
          area: 'health',
          energy: 'evening',
          tier: 'could',
        },
      ],
      milestones: ['A maintenance phase planned, not stumbled into'],
      note: 'Intake now moves with the training block, and the maintenance phase is planned rather than accidental.',
    },
  },

  money: {
    foundation: {
      routines: [
        {
          title: 'Set up one automatic transfer',
          durationMin: 20,
          days: SUNDAY,
          preferredStart: '19:00',
          preferredEnd: '20:30',
          area: 'admin',
          energy: 'evening',
          tier: 'should',
        },
      ],
      milestones: ['One account, one number to watch', 'One transfer running by itself'],
      note: 'One account, one automatic transfer, one number. Everything after this is observation rather than discipline.',
    },
    developing: {
      routines: [
        {
          title: 'Savings rate check — one number',
          durationMin: 10,
          days: SUNDAY,
          preferredStart: '19:30',
          preferredEnd: '20:30',
          area: 'admin',
          energy: 'evening',
          tier: 'could',
        },
      ],
      milestones: ['A savings rate you actually know', 'One month of buffer banked', 'The first debt ordered properly'],
      note: 'A savings rate, a buffer target, and the first debt put in the right order.',
    },
    established: {
      routines: [
        {
          title: 'Monthly money hour',
          durationMin: 60,
          days: SUNDAY,
          preferredStart: '15:00',
          preferredEnd: '18:00',
          area: 'admin',
          energy: 'evening',
          tier: 'could',
        },
      ],
      milestones: ['Three months of buffer banked', 'An invested percentage you chose on purpose'],
      note: 'The full ladder — buffer, debt, invested percentage — tracked monthly rather than felt vaguely.',
    },
    advanced: {
      routines: [
        {
          title: 'Quarterly allocation review',
          durationMin: 45,
          days: SUNDAY,
          preferredStart: '15:00',
          preferredEnd: '18:00',
          area: 'admin',
          energy: 'evening',
          tier: 'could',
        },
      ],
      milestones: ['Allocation set across accounts', 'A drawdown plan written down'],
      note: 'Allocation across accounts and a drawdown plan, reviewed quarterly. Education, never financial advice.',
    },
  },

  work: {
    foundation: {
      routines: [
        {
          title: 'Shutdown: name tomorrow’s first thing',
          durationMin: 10,
          days: WEEKDAYS,
          preferredStart: '17:00',
          preferredEnd: '18:30',
          area: 'work',
          energy: 'evening',
          tier: 'should',
        },
      ],
      milestones: ['One protected block survives a full week', 'Five days ended knowing tomorrow’s first move'],
      note: 'One protected block a day, and ending the day knowing what tomorrow starts with.',
    },
    developing: {
      routines: [
        {
          title: 'Weekly shape — plan the week before it plans you',
          durationMin: 25,
          days: SUNDAY,
          preferredStart: '17:00',
          preferredEnd: '19:30',
          area: 'work',
          energy: 'evening',
          tier: 'should',
        },
      ],
      milestones: ['Two blocks held in one week', 'One hard boundary defended out loud'],
      note: 'Two blocks, a weekly shape, and the first boundary actually defended rather than intended.',
    },
    established: {
      routines: [
        {
          title: 'Delegation pass — what should not be yours',
          durationMin: 20,
          days: [5],
          preferredStart: '15:00',
          preferredEnd: '17:30',
          area: 'work',
          energy: 'midday',
          tier: 'could',
        },
      ],
      milestones: ['One recurring task handed over for good', 'A review that changed the next week'],
      note: 'Deep work, delegation, and a review that changes next week rather than describing last week.',
    },
    advanced: {
      routines: [
        {
          title: 'Quarterly arc — the week built backwards',
          durationMin: 60,
          days: SUNDAY,
          preferredStart: '15:00',
          preferredEnd: '18:00',
          area: 'work',
          energy: 'evening',
          tier: 'could',
        },
      ],
      milestones: ['A quarter defined by one outcome', 'The week rebuilt backwards from it'],
      note: 'Quarterly arcs, with the week built backwards from them instead of forwards from the inbox.',
    },
  },

  recovery: {
    foundation: {
      routines: [
        {
          title: 'Two-minute reset — available instantly',
          durationMin: 5,
          days: [1, 2, 3, 4, 5, 6, 0],
          preferredStart: '20:00',
          preferredEnd: '22:00',
          area: 'health',
          energy: 'evening',
          tier: 'should',
        },
      ],
      milestones: ['One tool that works, ready before you need it'],
      note: 'The next hour is the whole plan. One tool that works, available the moment it is needed.',
    },
    developing: {
      routines: [
        {
          title: 'Evening check — did the moment come, what happened',
          durationMin: 5,
          days: [1, 2, 3, 4, 5, 6, 0],
          preferredStart: '21:00',
          preferredEnd: '22:30',
          area: 'health',
          energy: 'evening',
          tier: 'should',
        },
      ],
      milestones: ['The usual trigger named out loud', 'A counter-move ready before the moment arrives'],
      note: 'Trigger patterns named, and a counter-move ready before the moment rather than during it.',
    },
    established: {
      routines: [
        {
          title: 'Weekly pattern review — when it actually wins',
          durationMin: 15,
          days: SUNDAY,
          preferredStart: '18:00',
          preferredEnd: '20:00',
          area: 'health',
          energy: 'evening',
          tier: 'could',
        },
      ],
      milestones: ['The pattern mapped across four weeks', 'Interventions timed to your real window'],
      note: 'The pattern is mapped from what you logged, and the interventions are timed to it rather than to the clock.',
    },
    advanced: {
      routines: [
        {
          title: 'Maintenance review — the plan for the year',
          durationMin: 20,
          days: SUNDAY,
          preferredStart: '17:00',
          preferredEnd: '19:00',
          area: 'health',
          energy: 'evening',
          tier: 'could',
        },
      ],
      milestones: ['A written plan for the hard weeks', 'Three months steady'],
      note: 'Maintenance: the plan is for the year now, not the night. This support is free and always will be.',
    },
  },

  relationship: {
    foundation: {
      routines: [
        {
          title: 'One ritual that survives a bad week',
          durationMin: 20,
          days: [3],
          preferredStart: '20:00',
          preferredEnd: '21:30',
          area: 'relationship',
          energy: 'evening',
          tier: 'should',
        },
      ],
      milestones: ['One ritual kept four weeks running'],
      note: 'One ritual small enough to survive a bad week. Everything else is built on it.',
    },
    developing: {
      routines: [
        {
          title: 'The conversation you have been putting off',
          durationMin: 30,
          days: SUNDAY,
          preferredStart: '19:00',
          preferredEnd: '21:00',
          area: 'relationship',
          energy: 'evening',
          tier: 'could',
        },
      ],
      milestones: ['A weekly rhythm you both rely on', 'One avoided conversation actually had'],
      note: 'A weekly rhythm, and the first conversation that has been waiting for a good moment that was never going to arrive.',
    },
    established: {
      routines: [
        {
          title: 'Repair check — anything left unsaid this week',
          durationMin: 15,
          days: SUNDAY,
          preferredStart: '20:00',
          preferredEnd: '21:30',
          area: 'relationship',
          energy: 'evening',
          tier: 'could',
        },
      ],
      milestones: ['A shared plan you both actually agreed to', 'Repair practised before it was needed'],
      note: 'Rituals, repair, and a plan you both agreed to rather than one of you assumed.',
    },
    advanced: {
      routines: [
        {
          title: 'Seasonal review — what are we building',
          durationMin: 45,
          days: SUNDAY,
          preferredStart: '15:00',
          preferredEnd: '18:00',
          area: 'relationship',
          energy: 'evening',
          tier: 'could',
        },
      ],
      milestones: ['The long arc named together', 'Revisited at the turn of a season'],
      note: 'The long arc — what you are building over years, revisited each season instead of assumed.',
    },
  },

  family: {
    foundation: {
      routines: [
        {
          covers: ['family-adventure'],
          title: 'One outing in the diary before the week starts',
          durationMin: 15,
          days: SUNDAY,
          preferredStart: '18:00',
          preferredEnd: '20:00',
          area: 'family',
          energy: 'evening',
          tier: 'should',
        },
      ],
      milestones: ['One outing that actually happened'],
      note: 'One outing in the diary before the week starts. A plan made on Sunday beats a good intention on Saturday.',
    },
    developing: {
      routines: [
        {
          covers: ['one-on-one-child'],
          title: 'One-on-one time — one child, no phone',
          durationMin: 45,
          days: [4],
          preferredStart: '16:30',
          preferredEnd: '18:30',
          area: 'family',
          energy: 'evening',
          tier: 'should',
        },
      ],
      milestones: ['A weekly adventure that repeats', 'One-on-one time with each child'],
      note: 'A weekly adventure, and regular one-on-one time with each child rather than time with all of them at once.',
    },
    established: {
      routines: [
        {
          covers: ['family-adventure', 'family-ritual-anchor'],
          title: 'Protected family evening',
          durationMin: 90,
          days: [5],
          preferredStart: '18:00',
          preferredEnd: '19:00',
          area: 'family',
          energy: 'evening',
          protectedBlock: true,
          tier: 'must',
        },
      ],
      milestones: ['A tradition kept three times', 'An evening work never took'],
      note: 'Traditions, adventures, and time genuinely protected against work rather than nominally reserved.',
    },
    advanced: {
      routines: [
        {
          covers: ['family-adventure'],
          title: 'The family year — seasons and trips',
          durationMin: 60,
          days: SUNDAY,
          preferredStart: '15:00',
          preferredEnd: '18:00',
          area: 'family',
          energy: 'evening',
          tier: 'could',
        },
      ],
      milestones: ['A year mapped: seasons, trips, traditions', 'One tradition that will outlast childhood'],
      note: 'A family year — seasons, trips, and the traditions that outlast childhood.',
    },
  },
};

/** The blurb text for a rung, for tests and for the hub. */
export function rungFor(path: PathId, level: PathLevel): Rung {
  return LADDER[path][level];
}

/**
 * How much NEW recurring time each rung may add.
 *
 * The audit that justified the ladder also found what a first attempt at
 * it caused: family climbed to 440 minutes a week on average and 565 at
 * the top — nine hours of scheduled family time on top of a job. A pathway
 * that asks for more than a person has is not ambitious, it is ignored,
 * and no round of the cohort work has ever found that a bigger ask
 * produced more done.
 *
 * This is an ALLOWANCE ON TOP, not a cap on the whole pathway. The first
 * version capped everything and promptly cut the pathway's own
 * prescriptions — the aerobic session out of training, the eating window
 * out of nutrition — which is the opposite of the intent. What a pathway
 * itself prescribes is the promise and is never trimmed; the ladder is
 * enrichment, and enrichment is what gives way.
 */
const LADDER_ALLOWANCE_MIN: Record<PathLevel, number> = {
  foundation: 60,
  developing: 120,
  established: 190,
  advanced: 260,
};

/**
 * Practices that re-label time a person already spends.
 *
 * A device-free family meal is not an extra three hours a week — it is
 * dinner, eaten differently. Charging the allowance for it would cut
 * something genuinely additive to make room for time nobody gets back.
 */
const REPLACES_EXISTING_TIME = new Set([
  'device-free-meal',
  'family-ritual-anchor',
  'partner-reunion',
  'partner-appreciation',
]);

function costOf(r: Routine): number {
  if (r.protocolId && REPLACES_EXISTING_TIME.has(r.protocolId)) return 0;
  return r.durationMin * Math.max(1, r.days.length);
}

/**
 * Take as much of the ladder as the allowance affords.
 *
 * Cheapest first, so a rung contributes several small practices rather
 * than one expensive one that crowds the others out — and a rung's
 * required work (`must`/`should`) is taken before its optional work
 * whatever it costs, because that is what the rung promised.
 */
export function fitLadderToBudget(added: Routine[], level: PathLevel): Routine[] {
  const allowance = LADDER_ALLOWANCE_MIN[level];
  const required = added.filter((r) => r.tier === 'must' || r.tier === 'should');
  const optional = added
    .filter((r) => r.tier !== 'must' && r.tier !== 'should')
    .sort((a, b) => costOf(a) - costOf(b));

  const taken = [...required];
  let spent = required.reduce((n, r) => n + costOf(r), 0);
  for (const r of optional) {
    if (spent + costOf(r) > allowance) continue;
    taken.push(r);
    spent += costOf(r);
  }
  // Restored to written order so the plan reads the way it was authored.
  return added.filter((r) => taken.includes(r));
}

export interface LadderBuild {
  routines: Routine[];
  /** Parallel to `routines`: the concepts each one already covers. */
  covers: string[][];
  milestones: GoalMilestone[];
  /** One line per rung reached, newest last. */
  notes: string[];
}

/**
 * Everything the ladder contributes at this level — this rung and every
 * rung below it.
 *
 * Additive by construction: `LEVEL_ORDER.slice(0, rank + 1)`. There is no
 * way to express "at established you stop doing the foundation thing",
 * because that is not what a ladder is and every attempt to model it has
 * produced a plan that changes out from under people.
 */
export function ladderFor(
  path: PathId,
  level: PathLevel,
  profile: LifeProfile | null,
  goalId: string,
): LadderBuild {
  const rungs = LEVEL_ORDER.slice(0, levelRank(level) + 1).map((l) => LADDER[path][l]);
  const routines: Routine[] = [];
  const covers: string[][] = [];
  const milestones: GoalMilestone[] = [];
  const notes: string[] = [];

  for (const rung of rungs) {
    notes.push(rung.note);
    for (const r of rung.routines) {
      covers.push(r.covers ?? []);
      routines.push({
        id: newId('r'),
        goalId,
        title: r.title,
        area: r.area,
        days: r.days,
        durationMin: r.durationMin,
        preferredStart: r.preferredStart,
        preferredEnd: r.preferredEnd,
        energy: r.energy,
        // Flexible unless deliberately protected. A ladder that hard-fixes
        // half a week would fight the scheduler and lose, noisily.
        flexible: !r.protectedBlock,
        protected: r.protectedBlock === true,
        protocolId: r.protocolId,
        // Marks this as programme structure rather than an evidence-based
        // practice. The "no orphan blocks" rule exists so nothing can claim
        // a health benefit without a graded source behind it; a weekly
        // review block makes no such claim, and inventing a protocol id for
        // it would defeat the rule rather than satisfy it.
        ladderRung: true,
        tier: r.tier ?? 'could',
        active: true,
      });
    }
    for (const title of rung.milestones) {
      milestones.push({ id: newId('ms'), title, done: false });
    }
  }

  // Capacity is an honest statement about how much someone can carry right
  // now, and the cohort work is unambiguous that overloading a 'minimal'
  // week produces a plateau rather than progress. The rungs still exist —
  // the optional extras from the upper ones simply wait.
  if (profile?.capacity === 'minimal') {
    return {
      routines: routines.filter((r) => r.tier !== 'could'),
      covers: covers.filter((_, i) => routines[i].tier !== 'could'),
      milestones,
      notes: [...notes, 'Trimmed to what a minimal week can carry. The rest is waiting, not gone.'],
    };
  }

  return { routines, covers, milestones, notes };
}

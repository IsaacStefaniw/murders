/**
 * Isaac. The only user.
 *
 * ── Why this file exists ────────────────────────────────────────────────
 *
 * Isaac, 9 Nov 2026: *"I want to design this app for me now - no one else.
 * structure it just for me."*
 *
 * `features/onboarding` is thirty-nine questions whose entire job is to
 * discover what is written below. For one user those answers are not
 * state to be gathered, they are **facts**, and a fact belongs in a
 * constant rather than behind an interview.
 *
 * This is also the fix for the thing that broke the product. The
 * simulated version of Isaac in this repo worked 08:30–18:30; he works
 * 08:00–16:30. Every plan the app ever built for him put training at
 * 17:30, which was impossible every working day, and his verdict was *"I
 * opened it and it was wrong."* A wrong answer that cannot be corrected
 * by the person who knows the truth is the worst failure a planning app
 * has. Here the truth is a line of code.
 *
 * ── What this deliberately is not ───────────────────────────────────────
 *
 * It is not a replacement persona. `features/sim/personas.ts` holds
 * `career_optimiser`, which was *modelled on* Isaac and is wrong about him
 * in at least four ways that mattered — the finish time, the children, the
 * home gym and Monday futsal. Nothing here is copied from it. Every field
 * below was stated by him on 9 Nov 2026 and the questions he was asked are
 * recorded next to the answers, so a later reader can tell a fact from an
 * inference.
 *
 * ── The one standing risk, named here rather than discovered later ──────
 *
 * A declared week is only better than a computed one **while the
 * declaration is true**. Futsal was missing from three versions of his
 * plan because nothing in the interview asked about a weekly team sport,
 * and a constant cannot notice that it has gone stale. `STATED_ON` is the
 * mitigation: anything older than a season should be re-read aloud before
 * it is trusted.
 */

import type {
  BehaviourKey,
  ExistingHabitKey,
  LifeProfile,
  PhysicalConstraint,
  Weekday,
} from '@/types/domain';

/** When these facts were stated. Re-read them aloud when they are stale. */
export const STATED_ON = '2026-11-09';

/* ── The facts, as given ──────────────────────────────────────────────── */

export interface Me {
  name: string;
  weightKg: number;
  /** Office hours. The finish time is real, not aspirational. */
  workStart: string;
  workEnd: string;
  workDays: Weekday[];
  /** Minutes door to door, which is what decides whether lunch can train. */
  lunchMin: number;
  /** The office is this many minutes from the home gym. */
  commuteMin: number;
  wakeTime: string;
  sleepTime: string;
  /** Two boys, under five. Asleep between these. */
  boysAsleepFrom: string;
  boysAsleepBy: string;
  /** Days Isaac collects from daycare. The rest are the partner's. */
  pickupDays: Weekday[];
  /** Weekly fixture, and the most durable thing in the week. See week.ts. */
  futsalDay: Weekday;
  futsalStart: string;
  /**
   * The year he was born, stated 10 Nov 2026.
   *
   * A year rather than an age, and `health/age.ts` says why: `age` on the
   * profile is a DECADE MIDPOINT from a chip list, and the Gompertz hazard
   * doubles risk about every eight years — so five years of error is a
   * hazard out by roughly half again before anything is measured. A year
   * takes the dominant term in the error budget from ±5 years to ±1.
   *
   * Nothing in the markers instrument computes without it. `PaceInputs.age`
   * is commented *"Chronological age. Nothing computes without it"*, and
   * `ageOf` returned undefined for this profile until this field existed —
   * so the question *"how much younger am I"* had no answer for a reason
   * that was not about his health at all.
   */
  birthYear: number;
  constraints: PhysicalConstraint[];
  /**
   * The training rung, stated rather than inferred.
   *
   * Isaac, 10 Nov 2026: *"been training for 20 years and doing heavy
   * weight for 10"*.
   *
   * `trainingExperience: 'consistent'` is the most advanced answer the
   * interview offers, and `LEVEL_FROM_EXPERIENCE` maps it to
   * **established** — one rung below the top. The difference is not
   * cosmetic. `LEVEL_TUNING.advanced` gives +1 set per lift, +2.5% load,
   * an RPE cap of 9 instead of 8, +1 accessory, and a deliberate
   * overreach in week 3.
   *
   * That is a precise description of how he actually trains, and the app
   * could have given it to him at any point in the last six weeks. The
   * interview had no way to say "twenty years", so the answer that fit
   * best was the one that under-prescribed.
   */
  trainingLevel: 'foundation' | 'developing' | 'established' | 'advanced';
  /** Years lifting, and years lifting heavy. Provenance for the rung. */
  trainingYears: { total: number; heavy: number };
}

export const ME: Me = {
  name: 'Isaac',
  weightKg: 90,
  workStart: '08:00',
  workEnd: '16:30',
  workDays: [1, 2, 3, 4, 5],
  // "45 minutes door to door" — so a ~30 minute session once changing and
  // the two-minute drive each way come out of it.
  lunchMin: 45,
  commuteMin: 2,
  wakeTime: '06:30',
  // Stated as 10pm. Sleep is broken some nights by the boys, which is why
  // nothing in this app may spend it: see `week.ts` on the 05:30 slot.
  sleepTime: '22:00',
  boysAsleepFrom: '20:00',
  boysAsleepBy: '20:30',
  // "my partner does pickups somedays (Tuesdays and Friday)" — so Tuesday
  // and Friday evenings are his, and the other three are not.
  pickupDays: [1, 3, 4],
  futsalDay: 1,
  futsalStart: '18:15',
  birthYear: 1988,
  // Rack has adjustable safeties, confirmed 10 Nov, so barbell work needs
  // no spotter substitution. Asked because he benches 91% triples alone.
  constraints: [],
  trainingLevel: 'advanced',
  trainingYears: { total: 20, heavy: 10 },
};

/* ── Derived, so nothing recomputes it wrongly ────────────────────────── */

/** Evenings the partner collects, so a session can run at 17:00. */
export const FREE_EVENINGS: Weekday[] = ME.workDays.filter(
  (d) => !ME.pickupDays.includes(d) && d !== ME.futsalDay,
);

/**
 * Minutes a lunch session actually has.
 *
 * Door to door minus the drive both ways minus changing. It comes out at
 * about thirty, which is why the block is built for thirty rather than for
 * the fifty the generator defaults to.
 */
export const LUNCH_SESSION_MIN = ME.lunchMin - ME.commuteMin * 2 - 11;

/**
 * The hard stretch of the day, and the reason the plan has the shape it
 * has.
 *
 * Isaac named three sources of stress and one was "the kids at the hard
 * end of the day". The boys are asleep at 20:00–20:30, so that runs from
 * the end of work until then — three hours, every weekday, entirely
 * predictable. His vaping trigger is "drinking or stressed" and his
 * drinking is "midweek at home and heavy weekends", so the chain is:
 *
 *   three hard hours -> stress -> vape. Boys asleep -> quiet house ->
 *   the drink -> the kitchen -> the phone -> a late bed -> a worse
 *   tomorrow -> harder three hours.
 *
 * The decision therefore belongs at the START of the stretch and the
 * danger sits at the END of it, which is why `week.ts` puts "decide
 * tonight" at 17:30 rather than at 20:30. A choice made by the man who
 * has just done bath, books and two refusals to sleep is made by the
 * tired version of him.
 */
export const HARD_STRETCH = { from: '17:30', to: ME.boysAsleepBy } as const;

/** The quiet window. Ninety minutes, five nights a week. */
export const WINDOW = { from: ME.boysAsleepBy, to: ME.sleepTime } as const;

/* ── The answers, frozen ──────────────────────────────────────────────── */

/**
 * What the interview would have collected, had it still been asked.
 *
 * `InterviewAnswers` is `Record<string, string | string[] | undefined>`,
 * and three health modules plus `QuickLog` read it for markers and
 * negative-habit detection. They only ever wanted the answers, never the
 * asking — so they keep working untouched against this constant, which is
 * what makes deleting the interview a small change rather than a rewrite.
 *
 * Frozen on purpose. A fact that something can quietly reassign at runtime
 * is not a fact, it is state with extra steps.
 */
export const ISAAC_ANSWERS: Readonly<Record<string, string | string[] | undefined>> =
  Object.freeze({
    name: ME.name,
    weekShape: 'employed',
    priorities: ['health', 'relationship', 'work'],
    household: ['partner', 'kids'],
    kidsCount: '2',
    // Stated as "smash the gym" alongside two quits and a demanding job.
    // 'steady' rather than 'push': four lifts, a game and two cessations is
    // already a full week, and `capacity` is what stops the app adding to
    // it. See the §3 fatigue note in docs/ISAAC_WEEK.md.
    capacity: 'steady',
    workDays: ME.workDays.map(String),
    workHours: `${ME.workStart}-${ME.workEnd}`,
    sleep: `${ME.wakeTime}-${ME.sleepTime}`,
    // Work affinity is his clearest signal: morning 0.85, evening 0.60.
    // The mirror image of his training affinity, which is why the deep
    // work block is at 08:00 and the lifting is not.
    energy: 'morning',
    trainingDays: '4',
    // Squat rack, barbell and plates, bench, incline, smith machine,
    // pulley, leg extension. 'gym' is the honest value: TrainingEquipment
    // describes what the movements may assume, not where the building is,
    // and 'home' would downgrade him to dumbbell patterns he has better
    // tools than.
    trainingSetup: 'gym',
    trainingExperience: 'consistent',
    weight: String(ME.weightKg),
    // "lose fat, keep muscle" AND "support the training" — `weight` is the
    // right aim because fat loss keeps protein HIGH, which is the thing
    // that protects the muscle he does not want to lose.
    foodAim: 'weight',
    foodTrouble: 'evenings',
    moreOf: ['Seeing friends', 'Time outdoors', 'Deep work'],
    lessOf: ['alcohol', 'doomscrolling'] as BehaviourKey[],
    existingHabits: ['workout', 'walking'] as ExistingHabitKey[],
    ambition: 'Quit drinking and vaping, get in the best shape of my life, be present for the boys',
  });

/**
 * The profile the planner and the health modules read.
 *
 * Built from `ME` rather than typed twice, so the two cannot drift. There
 * is no `rotation`: his week does not move, which is the whole premise of
 * `week.ts`.
 */
export const ISAAC_PROFILE: LifeProfile = {
  firstName: ME.name,
  priorities: ['health', 'relationship', 'work'],
  people: [],
  workDays: ME.workDays,
  workStart: ME.workStart,
  workEnd: ME.workEnd,
  wakeTime: ME.wakeTime,
  sleepTime: ME.sleepTime,
  energyProfile: 'morning',
  capacity: 'steady',
  birthYear: ME.birthYear,
  weightKg: ME.weightKg,
  // Stated, and it is read rather than displayed: the grip hazard in
  // pace.ts is sex-specific and the Essential 8 tables branch on it.
  // health/domain's own note — "never a label shown back to them, and
  // never used to decide what they are capable of."
  sexAtBirth: 'male',
  kidsCount: 2,
  trainingDaysPerWeek: 4,
  trainingDurationMin: LUNCH_SESSION_MIN,
  trainingPreference: 'gym',
  moreOf: ['Seeing friends', 'Time outdoors', 'Deep work'],
  lessOf: ['alcohol', 'doomscrolling'],
  existingHabits: ['workout', 'walking'],
  constraints: ME.constraints,
  weekShape: 'employed',
  // Carried onto the profile, because the profile is what the store reads.
  // Stated on `ME` and left there, this field was inert: `trainingLevelState`
  // builds the rung from the earned ladder and the interview's claim, and a
  // constant nobody reads is the exact failure this project keeps repeating
  // — `features/me/week.ts` is still sitting unread as I write this.
  statedTrainingLevel: ME.trainingLevel,
  // The day the facts were stated, not the day the object was constructed —
  // a constant that reported `new Date()` would claim to be newly true on
  // every app launch, which is the opposite of what STATED_ON is for.
  createdAt: `${STATED_ON}T00:00:00.000Z`,
  updatedAt: `${STATED_ON}T00:00:00.000Z`,
};

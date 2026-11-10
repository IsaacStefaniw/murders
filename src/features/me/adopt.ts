/**
 * Put the profile that lives in this repo into the app on the phone.
 *
 * ── The question this answers ───────────────────────────────────────────
 *
 * Isaac, 10 Nov 2026: *"How do you keep the profile I've made here? Push
 * that through as well? I just want to access via app as well as through
 * Claude chat."*
 *
 * The honest architecture, in three lines:
 *
 *  - **The repo is the source of truth.** `features/me/profile.ts` holds
 *    his facts as constants, in git, reviewed and pushed. That is how the
 *    profile is "kept" — it is code, not a row in a database, and it
 *    cannot be lost by a cleared app or a reinstalled phone.
 *  - **Claude reads and writes the repo.** That is every correction of the
 *    last two days.
 *  - **The app cannot read the repo at runtime** — it is a compiled
 *    bundle. But static facts compiled INTO the bundle work perfectly.
 *    This module is that bridge.
 *
 * So: profile, week, protocols and if-thens are constants, and a change to
 * them needs a new build. They change rarely, so that is the right trade.
 * **The log is the exception** and it is the hard half — it changes daily,
 * which is the one thing a compiled constant cannot do. See `THE_LOG_GAP`.
 *
 * ── What this replaces ──────────────────────────────────────────────────
 *
 * `completeOnboarding` is the single action that writes the profile, and
 * it is called from exactly one place: `plan-review.tsx`, at the end of a
 * thirty-nine question interview. For one user that interview exists to
 * discover facts that are already written down, so this calls the same
 * action with the same shape and skips the asking.
 *
 * It deliberately reuses `completeOnboarding` rather than setting state
 * directly. That action also flips `onboarded` and seeds
 * `interviewAnswers`, which the health markers and `QuickLog` read — and
 * a second way of writing the same state is how two code paths drift
 * until one of them is wrong.
 */

import { buildLifeOperatingPlan, type LifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { ISAAC_ANSWERS, ISAAC_PROFILE, ME, STATED_ON } from '@/features/me/profile';
import type { InterviewAnswers } from '@/features/onboarding/script';

/**
 * The plan his own answers produce, built from the constants.
 *
 * `ISAAC_PROFILE` is handed back rather than `plan.profile`, because the
 * two are built from different things and the constant is the one that was
 * checked: `buildLifeOperatingPlan` derives a profile from the answers,
 * and `profile.ts` states it directly. Where they disagree, the stated one
 * wins — it is the one with his words next to each field.
 *
 * Everything else comes from the builder, because goals, routines and
 * behaviour intentions are composed rather than stated, and composing them
 * by hand here would be a second implementation of the thing the app
 * already does.
 */
export function mePlan(): LifeOperatingPlan {
  const plan = buildLifeOperatingPlan(ISAAC_ANSWERS as InterviewAnswers);
  return { ...plan, profile: ISAAC_PROFILE };
}

/** Exactly what `completeOnboarding` wants, so the call site is one line. */
export function meOnboarding(): {
  profile: typeof ISAAC_PROFILE;
  goals: LifeOperatingPlan['goals'];
  routines: LifeOperatingPlan['routines'];
  behaviourIntentions: LifeOperatingPlan['behaviourIntentions'];
  answers: InterviewAnswers;
} {
  const plan = mePlan();
  return {
    profile: plan.profile,
    goals: plan.goals,
    routines: plan.routines,
    behaviourIntentions: plan.behaviourIntentions,
    answers: ISAAC_ANSWERS as InterviewAnswers,
  };
}

/**
 * The body numbers he has stated, as readings for the metrics stream.
 *
 * Isaac gave his height and body fat on 10 Nov and neither had anywhere
 * to go: `LifeProfile` has no height field, because the app reads height
 * from the `body.height` metric that Apple Health or `BodyNumbers` writes.
 * A fact stated and then stored nowhere is this project's most repeated
 * failure, so these are seeded as observations like any other.
 *
 * `source` is `'user'` rather than `'healthkit'` because he said them —
 * and the distinction is load-bearing downstream, where
 * `pace.ts` widens its interval for anything self-reported.
 *
 * **Weight is deliberately not here.** 90 kg is his own round number for
 * himself, and seeding it would put a fictional reading at the head of
 * the trend that `weekly-weight-trend` reads. The first real weight
 * should be the first one he steps on for — 06:50, per `docs/DAILY.md`.
 */
export function meMetrics(): { key: string; value: number; note: string }[] {
  return [
    { key: 'body.height', value: ME.heightCm, note: `Stated ${STATED_ON}` },
    { key: 'body.bodyFat', value: ME.bodyFatPct, note: `Stated ${STATED_ON}, not measured` },
  ];
}

/** The paths his answers justify, for the caller to start after adopting. */
export const mePathStarts = (): LifeOperatingPlan['pathStarts'] => mePlan().pathStarts;

/**
 * What this does NOT solve, said here so nobody thinks the loop is closed.
 *
 * The log changes every day. A constant compiled into a bundle cannot, so
 * entries written on the phone and entries written in this repo are two
 * separate records, and nothing reconciles them. Three honest options,
 * none of them free:
 *
 *  1. **The app owns the log and exports it.** He logs on the phone, and a
 *     share sheet hands the entries out as text when he wants them read.
 *     Smallest to build, and the reading is manual.
 *  2. **Chat owns the log and the app reads a seeded copy.** What happens
 *     today, except the seeding needs a build each time, which is absurd
 *     for a daily entry.
 *  3. **The app asks the four questions itself**, with the Claude API
 *     behind it. Then the log never leaves the phone and nothing needs
 *     reconciling. This is what he asked for when he said "let's embed the
 *     claude api into the app", and it is the only option that actually
 *     closes the loop.
 *
 * Option 3 is the right one and it is also the most work. Until it exists,
 * option 1 is the stopgap and the log in `docs/LOG.md` is the record.
 */
export const THE_LOG_GAP =
  'Your profile and your week can be compiled into the app, because they change rarely. The log cannot, because it changes daily — so until the app can ask the four questions itself, entries live wherever you write them.';

/** For a screen to show where these facts came from and when. */
export const PROVENANCE = `Stated ${STATED_ON}, from docs/ISAAC_WEEK.md. Not from an interview.`;

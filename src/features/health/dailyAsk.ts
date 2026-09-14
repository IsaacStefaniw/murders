/**
 * What to ask, and how often — the cadence model.
 *
 * Isaac: "should we ask 3 questions every day? ... to check sleep time,
 * bad habits? and ??? whatever's most useful for model."
 *
 * The short answer is two, not three, and only on days the app cannot get
 * the answer without asking. The reasoning matters more than the number.
 *
 * ── WHY NOT THREE EVERY DAY ─────────────────────────────────────────────
 *
 * Almost nothing in the markers instrument moves daily. Grip strength,
 * walking speed, balance and cardiorespiratory fitness shift over months —
 * which is why `functionTests.ts` sets `everyDays: 90` on all four. Asking
 * about a quarterly quantity every morning does not produce better data, it
 * produces noise with a higher abandonment rate.
 *
 * This app has already made that argument about itself, in
 * `ReadinessCard`: "a card that says 'you're ready!' daily is wallpaper by
 * week two, and then says nothing on the morning it matters." A question
 * whose answer changes nothing teaches people to dismiss the app, and the
 * cost is paid on the day a question does matter.
 *
 * ── SO: ASK AT THE RATE THE THING ACTUALLY MOVES ────────────────────────
 *
 *   Sleep timing      nightly    — genuinely varies, and see below
 *   Habits            daily      — only while somebody has one running
 *   Self-rated health monthly    — it is an "in general" instrument
 *   Function tests    quarterly  — they move over months
 *
 * And the rule that removes most of the asking: NEVER ask for something
 * Apple Health already knows. A person with Health connected should be
 * asked about sleep roughly never.
 *
 * ── WHY SLEEP TIMING IS THE ONE DAILY QUESTION WORTH HAVING ─────────────
 *
 * Bed time and wake time give two things for one question. Duration, which
 * Life's Essential 8 already scores — and REGULARITY, which Windred and
 * colleagues (Sleep, 2024) found to be a STRONGER predictor of all-cause
 * mortality than duration, across 60,977 UK Biobank participants and more
 * than ten million hours of accelerometry.
 *
 * The two CLOCK TIMES are the point, not the duration between them. Two
 * people can average seven and a half hours with identical variability
 * while one sleeps eleven-to-seven every night and the other alternates
 * ten-to-six and one-to-nine. The second is the irregular one and duration
 * cannot see it at all. See `sleepTiming.ts`.
 *
 * That is the whole argument for a nightly touch. Regularity cannot be
 * recovered from a survey — "do you sleep regularly?" is not the same
 * measurement — and it cannot be computed from one night. It needs a
 * series, which is exactly what a daily question builds and nothing else
 * in the instrument does.
 *
 * ── AND "CONNECTED" WAS NEVER THE RIGHT QUESTION ────────────────────────
 *
 * The first version of this gated on whether Apple Health was connected,
 * which is wrong in the common case. Plenty of people have Health on with
 * no Watch, or a Watch they do not wear to bed, or sleep tracking off —
 * connected does not mean supplying sleep. Worse, it is not even a
 * property of the account: somebody who usually wears a watch and forgot
 * last night has a hole in exactly the series this is trying to build.
 *
 * So the gate is per-NIGHT and asks the only question that matters: do we
 * have last night? If not, ask. If yes, say nothing.
 */

import type { MetricObservation } from '@/features/model/metrics';
import { addDays } from '@/lib/dates';

export type AskId = 'sleepTiming' | 'habits' | 'selfRatedHealth';

export interface DailyAsk {
  id: AskId;
  /** The question, in the words a person would use. */
  prompt: string;
  /** Why it is being asked, when that is not obvious. */
  why?: string;
}

/** Self-rated health is an "in general" instrument. Monthly at most. */
export const SELF_RATED_HEALTH_EVERY_DAYS = 30;

export interface AskInputs {
  today: string;
  /**
   * Nights the app already holds, as date keys.
   *
   * Not "is Health connected" — see the header. A watch that was not worn
   * leaves a hole in the series whatever the account setting says, and the
   * hole is the thing worth asking about.
   */
  nightsRecorded: string[];
  /** Behaviours the person currently has running, if any. */
  activeHabits: string[];
  /** Whether they said they currently smoke or drink above the low band. */
  hasStandingHabit: boolean;
  metrics: MetricObservation[];
  /** Date key of the last self-rated health answer, if there is one. */
  lastSelfRatedHealth?: string;
}

/**
 * What is actually worth asking this person today.
 *
 * Usually nothing, or one thing. Returning an empty list is the expected
 * outcome for somebody with Health connected and no habit running, and
 * that is the design working rather than failing.
 */
export function asksFor(input: AskInputs): DailyAsk[] {
  const out: DailyAsk[] = [];

  // Sleep: asked for the night we do not have, whatever the reason we do
  // not have it. A watch left on the nightstand and a watch never bought
  // leave the same gap.
  if (!input.nightsRecorded.includes(input.today)) {
    out.push({
      id: 'sleepTiming',
      prompt: 'When did you fall asleep, and when did you wake?',
      why: 'The two times, not the hours between them. How steady your timing is predicts more than how long you sleep — and it is the one thing here that cannot be worked out later from an average.',
    });
  }

  // Habits: only while somebody has one running. Asking a non-smoker every
  // morning whether they smoked is the definition of a question whose
  // answer changes nothing.
  if (input.activeHabits.length > 0 || input.hasStandingHabit) {
    out.push({
      id: 'habits',
      prompt: 'Anything yesterday you are keeping an eye on?',
      why: 'Neutral either way. Nothing counts up, and a yes is data rather than a failure.',
    });
  }

  // Self-rated health: monthly, because it asks about "in general".
  const due =
    !input.lastSelfRatedHealth ||
    input.lastSelfRatedHealth <= addDays(input.today, -SELF_RATED_HEALTH_EVERY_DAYS);
  if (due) {
    out.push({
      id: 'selfRatedHealth',
      prompt: 'In general, how would you say your health is?',
      why: 'Asked every month or so. Day to day it measures your mood; over months it measures something real.',
    });
  }

  return out;
}

/* ── Sleep regularity ─────────────────────────────────────────────────── */

/**
 * Superseded by `sleepTiming.ts`, and kept for one reason.
 *
 * This computes the variability of how LONG somebody sleeps, which was the
 * best available while the app only stored `sleep.hours`. It is a different
 * and weaker quantity than the published index — see the header of
 * `sleepTiming.ts` for why duration cannot see irregular timing at all.
 *
 * It stays because somebody with months of Apple Health duration data and
 * no answered bed times still has something worth showing, and a fallback
 * that says less is better than a blank. It is never scored.
 */
export const REGULARITY_MIN_NIGHTS = 7;

export interface SleepRegularity {
  /** Standard deviation of nightly sleep duration, in hours. */
  sdHours: number;
  nights: number;
  band: 'steady' | 'variable' | 'erratic';
}

export function sleepRegularity(
  metrics: MetricObservation[],
  today: string,
  windowDays = 14,
): SleepRegularity | null {
  const from = addDays(today, -(windowDays - 1));
  const nights = metrics
    .filter(
      (m) => m.key === 'sleep.hours' && m.at.slice(0, 10) >= from && m.at.slice(0, 10) <= today,
    )
    .map((m) => m.value);
  if (nights.length < REGULARITY_MIN_NIGHTS) return null;

  const mean = nights.reduce((a, b) => a + b, 0) / nights.length;
  const variance =
    nights.reduce((sum, n) => sum + (n - mean) ** 2, 0) / (nights.length - 1);
  const sdHours = Math.sqrt(variance);

  return {
    sdHours,
    nights: nights.length,
    band: sdHours < 1 ? 'steady' : sdHours < 2 ? 'variable' : 'erratic',
  };
}

export const REGULARITY_NOTE =
  'This is how much the LENGTH of your nights varies, which is a weaker cousin of the published measure — that one compares when you were asleep from one day to the next. Answer the two bed-and-wake times for a few nights and the app computes the real thing instead. Shown as a reading rather than scored.';

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
 * That finding is the whole argument for a nightly touch. Regularity
 * cannot be recovered from a survey — "do you sleep regularly?" is not the
 * same measurement — and it cannot be computed from one night. It needs a
 * series, which is exactly what a daily question builds and nothing else
 * in the instrument does.
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
  /** True where Apple Health is supplying sleep, which removes the ask. */
  healthConnected: boolean;
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

  // Sleep: only where the phone is not already answering it.
  if (!input.healthConnected) {
    out.push({
      id: 'sleepTiming',
      prompt: 'When did you go to bed, and when did you get up?',
      why: 'Two numbers, and they give both how long you slept and how steady your timing is. Steadiness turns out to predict more than length does.',
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

/** Nights needed before regularity means anything. */
export const REGULARITY_MIN_NIGHTS = 7;

export interface SleepRegularity {
  /** Standard deviation of nightly sleep duration, in hours. */
  sdHours: number;
  nights: number;
  /** How it reads, in plain words. */
  band: 'steady' | 'variable' | 'erratic';
}

/**
 * Regularity, as far as the app can currently see it.
 *
 * An honest limitation stated up front: the published Sleep Regularity
 * Index is computed from minute-by-minute accelerometry and measures how
 * much two consecutive days OVERLAP in when you were asleep. What the app
 * holds is nightly duration, so this computes the variability of DURATION
 * instead — a weaker cousin of the real thing, and not the same measure.
 *
 * It is worth having anyway: duration irregularity has its own UK Biobank
 * analyses against cardiovascular outcomes, and somebody whose nights run
 * five, nine, six, ten hours is telling the app something real that an
 * average of seven and a half completely hides.
 *
 * It does NOT get a hazard coefficient in `pace.ts`, because the published
 * effect sizes belong to the index we are not computing. It is shown as a
 * reading, with what it is and is not stated beside it.
 */
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
  'Windred and colleagues (Sleep, 2024) found sleep regularity a stronger predictor of all-cause mortality than sleep duration, across 60,977 people and more than ten million hours of accelerometry. Their measure compares when you were asleep from one day to the next; this one compares how LONG, which is a weaker cousin of it — so it is shown as a reading rather than scored.';

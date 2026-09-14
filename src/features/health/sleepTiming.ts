/**
 * Sleep regularity, computed the way the published index computes it.
 *
 * Isaac: "asking when they fell asleep/woke up answers the consistency???
 * which is why it's important signal each day."
 *
 * Exactly, and it corrects the previous build. `dailyAsk.ts` first computed
 * regularity as the standard deviation of nightly DURATION, because
 * `sleep.hours` was all the app stored — and that is a different and
 * weaker quantity. Two people can both average seven and a half hours with
 * identical variability while one sleeps eleven-to-seven every night and
 * the other alternates ten-to-six and one-to-nine. The second is the
 * irregular one, and duration cannot see it at all.
 *
 * Asking the two clock times fixes that, which is the whole argument for
 * the daily question. It is the one thing in this instrument that cannot
 * be recovered later, cannot be inferred from an average, and needs a
 * series rather than a reading.
 *
 * ── WHAT THE SLEEP REGULARITY INDEX IS ──────────────────────────────────
 *
 * For every minute of the day, ask: was this person in the same state —
 * asleep or awake — at this time yesterday? SRI is the percentage of
 * minutes where the answer is yes, rescaled so that 100 is perfect
 * day-to-day concordance and 0 is chance.
 *
 *   SRI = (2 × fraction matching − 1) × 100
 *
 * Windred and colleagues computed it from minute-by-minute accelerometry
 * across 60,977 UK Biobank participants, and found the most regular
 * quintile had 30% lower all-cause mortality than the most irregular —
 * with SRI fitting the mortality data better than sleep duration did.
 *
 * ── WHAT OURS APPROXIMATES, AND WHERE IT IS WRONG ───────────────────────
 *
 * Two simplifications, both stated rather than buried:
 *
 * 1. SELF-REPORTED TIMES, not accelerometry. People misreport when they
 *    fell asleep, usually in the direction of when they got into bed.
 * 2. ONE CONTINUOUS BLOCK per night. Real sleep has wakings, and the
 *    published index counts every one of them. Ours cannot see them, so
 *    it will read slightly more regular than the truth.
 *
 * Both push the same way — ours flatters — which is why the component
 * carries the self-report interval widening rather than the measured one.
 * It is nonetheless the same construct measured the same way, which the
 * duration-variability version was not.
 */

import { addDays } from '@/lib/dates';

const MINUTES_PER_DAY = 1440;

export interface SleepNight {
  /** Date key of the morning they woke. */
  date: string;
  /** Minutes from midnight when they fell asleep. May be before midnight. */
  bedMin: number;
  /** Minutes from midnight when they woke, on `date`. */
  wakeMin: number;
}

/** Nights needed before an index means anything. Seven is what the study used. */
export const SRI_MIN_NIGHTS = 7;

/**
 * Which minutes of each calendar day the person was asleep.
 *
 * A night that starts before midnight lands on two calendar days, which is
 * the part that makes this fiddly and the part that makes it correct: an
 * eleven-o'clock bedtime is not a property of the morning it ends on.
 */
function asleepByDay(nights: SleepNight[]): Map<string, Uint8Array> {
  const days = new Map<string, Uint8Array>();
  const dayOf = (date: string) => {
    let d = days.get(date);
    if (!d) {
      d = new Uint8Array(MINUTES_PER_DAY);
      days.set(date, d);
    }
    return d;
  };

  for (const night of nights) {
    const { date, bedMin, wakeMin } = night;
    if (bedMin > wakeMin) {
      // Crossed midnight: bedMin..end of the previous day, then 0..wakeMin.
      const previous = dayOf(addDays(date, -1));
      for (let t = bedMin; t < MINUTES_PER_DAY; t++) previous[t] = 1;
      const today = dayOf(date);
      for (let t = 0; t < wakeMin; t++) today[t] = 1;
    } else {
      // A nap-shaped night, or an afternoon sleeper. Same day throughout.
      const today = dayOf(date);
      for (let t = bedMin; t < wakeMin; t++) today[t] = 1;
    }
  }
  return days;
}

export interface SleepRegularityIndex {
  /** 0–100. 100 is identical timing every night; 0 is chance. */
  sri: number;
  /** Consecutive day-pairs the index was computed across. */
  pairs: number;
  band: 'regular' | 'somewhat irregular' | 'irregular' | 'very irregular';
}

/**
 * The index across a window, or null where there are not enough nights.
 *
 * Only CONSECUTIVE pairs count. A gap in the record is a gap in the
 * measurement rather than something to interpolate across — somebody who
 * logs Monday and then Friday has not told us anything about Tuesday.
 */
export function sleepRegularityIndex(
  nights: SleepNight[],
  today: string,
  windowDays = 14,
): SleepRegularityIndex | null {
  const from = addDays(today, -(windowDays - 1));
  const inWindow = nights.filter((n) => n.date >= from && n.date <= today);
  if (inWindow.length < SRI_MIN_NIGHTS) return null;

  const days = asleepByDay(inWindow);

  /**
   * Only days we can fully describe.
   *
   * A calendar day gets its MORNING from the night dated that day, and its
   * EVENING from the night dated the day after. Have only one of those and
   * the day looks awake for half of it — which made the first and last day
   * of every window read as wildly irregular, purely as an artefact of
   * where the window was cut. An eleven-to-seven sleeper with a perfect
   * fortnight was scoring 92 instead of 100.
   */
  const recorded = new Set(inWindow.map((n) => n.date));
  const complete = (date: string) => recorded.has(date) && recorded.has(addDays(date, 1));

  let matching = 0;
  let compared = 0;

  for (const [date, minutes] of days) {
    if (!complete(date)) continue;
    const nextDate = addDays(date, 1);
    const next = days.get(nextDate);
    if (!next || !complete(nextDate)) continue;
    for (let t = 0; t < MINUTES_PER_DAY; t++) {
      if (minutes[t] === next[t]) matching++;
    }
    compared += MINUTES_PER_DAY;
  }

  if (compared === 0) return null;
  const sri = (2 * (matching / compared) - 1) * 100;
  return {
    sri,
    pairs: compared / MINUTES_PER_DAY,
    band:
      sri >= 80
        ? 'regular'
        : sri >= 70
          ? 'somewhat irregular'
          : sri >= 60
            ? 'irregular'
            : 'very irregular',
  };
}

/**
 * Against the most regular sleepers.
 *
 * Windred reports a quintile contrast — most regular versus most irregular
 * at 30% lower all-cause mortality, so about 1.43 the other way. The bands
 * between are INTERPOLATED across that contrast rather than reported, and
 * the cut points are approximations of quintile boundaries in a cohort
 * whose mean age was 62.8. That is why this component is graded B despite
 * a six-figure sample: the effect is solid and our placement within it is
 * not precise.
 */
export const SRI_RR = {
  regular: 1.0,
  'somewhat irregular': 1.1,
  irregular: 1.25,
  'very irregular': 1.43,
} as const;

export function sriLogHazard(band: SleepRegularityIndex['band']): number {
  return Math.log(SRI_RR[band]);
}

export const SRI_PROVENANCE = {
  study: 'Windred and colleagues, 2024',
  journal: 'Sleep',
  sample: '60,977 UK Biobank participants with 7 days of accelerometry, over 10 million hours recorded',
  design: 'prospective cohort' as const,
  effect:
    'The most regular quintile of sleep timing had 30% lower all-cause mortality than the most irregular, and regularity fitted the mortality data better than sleep duration did',
  grade: 'B' as const,
  caveat:
    'Ours is computed from self-reported bed and wake times modelled as one unbroken block, where theirs came from minute-by-minute accelerometry that catches every waking. Both simplifications make ours read more regular than the truth, and the bands between the reported quintiles are interpolated.',
};

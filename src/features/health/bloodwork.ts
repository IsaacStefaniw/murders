/**
 * The three components a phone cannot see.
 *
 * Blood pressure, blood lipids and blood glucose are three of Life's
 * Essential 8, and `essential8.ts` has been reporting all three as "Not
 * scored — needs a blood test" since it was written. That was honest while
 * there was nowhere to put the result. It stopped being honest the moment
 * somebody had a pathology report on the kitchen bench and no way to tell
 * the app about it.
 *
 * These three matter more than the four the app can already see. A person
 * whose activity, sleep, nicotine and BMI all score 100 and whose blood
 * pressure is 165/100 does not have excellent cardiovascular health, and a
 * marker screen reading "4 of 8 observed · High" to that person is the
 * most dangerous thing the app could say. Getting them in takes the
 * composite from half a construct to seven-eighths of one.
 *
 * ── The tables ──────────────────────────────────────────────────────────
 *
 * Source: Lloyd-Jones et al., "Life's Essential 8: Updating and Enhancing
 * the American Heart Association's Construct of Cardiovascular Health",
 * Circulation, 2022 — the same paper the four tables in `essential8.ts`
 * come from. The published thresholds are used exactly, including the
 * medication deductions, which is the part an app is most tempted to drop
 * because it makes people's numbers worse.
 *
 * ── Units ───────────────────────────────────────────────────────────────
 *
 * The AHA publishes in mg/dL. Australian pathology reports are in mmol/L,
 * and this app is Australian everywhere else it touches the real world —
 * HELP, super, offset accounts, standard drinks. So the app asks in
 * mmol/L, the way the report reads, and converts. Asking somebody to
 * convert their own blood test before typing it in is how you get a
 * mistyped number, and a mistyped cholesterol is worse than an absent one.
 *
 * ── Staleness ───────────────────────────────────────────────────────────
 *
 * A reading has a shelf life and the construct does not say what it is, so
 * this module does. A blood pressure from eighteen months ago is a fact
 * about a person who no longer exists; a lipid panel moves more slowly. An
 * expired reading is kept and shown — it is still their number and they
 * should see it — but it stops counting toward the composite, and the
 * component says why. Scoring somebody on a four-year-old panel would be
 * the app inventing currency it does not have.
 *
 * ── What this is not ────────────────────────────────────────────────────
 *
 * Not a diagnosis, not a treatment decision, and never a reason to change
 * a medication. The medication flags exist because the published table
 * needs them to score correctly, and for no other purpose.
 */

/** mg/dL per mmol/L, for cholesterol. */
export const CHOLESTEROL_MG_DL_PER_MMOL = 38.67;

/** How long each reading counts for. Beyond this it is history, not data. */
export const BP_FRESH_DAYS = 180;
export const PANEL_FRESH_DAYS = 730;

/** The published deduction for being on treatment, in points. */
export const MEDICATION_DEDUCTION = 20;

export interface BloodPressureReading {
  systolic: number;
  diastolic: number;
}

/**
 * Blood pressure, AHA Life's Essential 8.
 *
 * The worse of the two numbers decides the band — a diastolic of 95 with a
 * systolic of 118 is not a 100, and a table read on systolic alone would
 * say it was.
 */
export function bpScore(reading: BloodPressureReading, onMedication = false): number {
  const { systolic: s, diastolic: d } = reading;
  const base =
    s >= 160 || d >= 100
      ? 0
      : s >= 140 || d >= 90
        ? 25
        : s >= 130 || d >= 80
          ? 50
          : s >= 120
            ? 75
            : 100;
  // The deduction applies to anyone on treatment and cannot take a score
  // below zero. It is in the published table and it is the first thing an
  // app is tempted to quietly drop, because it makes the number worse for
  // the people doing the right thing about it.
  return onMedication ? Math.max(0, base - MEDICATION_DEDUCTION) : base;
}

/** Non-HDL cholesterol is what the table scores, and what no report prints. */
export function nonHdlMmol(totalMmol: number, hdlMmol: number): number {
  return Math.max(0, totalMmol - hdlMmol);
}

/** Blood lipids, AHA Life's Essential 8. Non-HDL cholesterol, in mmol/L. */
export function lipidsScore(nonHdl: number, onMedication = false): number {
  const mgDl = nonHdl * CHOLESTEROL_MG_DL_PER_MMOL;
  const base =
    mgDl < 130 ? 100 : mgDl < 160 ? 60 : mgDl < 190 ? 40 : mgDl < 220 ? 20 : 0;
  return onMedication ? Math.max(0, base - MEDICATION_DEDUCTION) : base;
}

export interface GlucoseReading {
  /** HbA1c as a percentage, the way an Australian report prints it. */
  hba1cPct?: number;
  /** Fasting glucose in mmol/L, where HbA1c was not measured. */
  fastingGlucoseMmol?: number;
  /** A diagnosis of diabetes. The table branches on it, not on the number. */
  diabetes?: boolean;
}

/**
 * Blood glucose, AHA Life's Essential 8.
 *
 * HbA1c first, because the table is written on it. Fasting glucose is the
 * published fallback and is coarser: it can place somebody in the right
 * band but cannot separate the four bands inside diabetes, so somebody
 * with a diagnosis and only a fasting glucose gets the top of that range
 * rather than a number invented for them.
 *
 * Returns null where the reading cannot place a person, which happens and
 * is not a failure: an unscored component is reported as unscored.
 */
export function glucoseScore(reading: GlucoseReading): number | null {
  const { hba1cPct, fastingGlucoseMmol, diabetes } = reading;

  if (hba1cPct != null) {
    if (!diabetes) return hba1cPct < 5.7 ? 100 : 60;
    if (hba1cPct < 7) return 40;
    if (hba1cPct < 8) return 30;
    if (hba1cPct < 9) return 20;
    if (hba1cPct < 10) return 10;
    return 0;
  }

  if (fastingGlucoseMmol != null) {
    // 5.6 mmol/L is 100 mg/dL and 7.0 is 126 — the diagnostic cut points
    // the fallback is written on.
    if (diabetes) return 40;
    if (fastingGlucoseMmol < 5.6) return 100;
    if (fastingGlucoseMmol < 7) return 60;
    // A fasting glucose in the diabetic range without a diagnosis is not
    // this app's call to make. It scores the band and says nothing else.
    return 40;
  }

  return diabetes ? 40 : null;
}

/* ── Freshness ────────────────────────────────────────────────────────── */

export function daysBetween(fromIso: string, today: string): number | null {
  const then = Date.parse(fromIso);
  const now = Date.parse(`${today}T00:00:00.000Z`);
  if (!Number.isFinite(then) || !Number.isFinite(now)) return null;
  return Math.floor((now - then) / 86400000);
}

export interface Freshness {
  fresh: boolean;
  days: number | null;
  /** Shown on an expired reading, in place of a score. */
  line: string | null;
}

/** How a stale reading says so, in months or years rather than in days. */
function ago(days: number): string {
  if (days >= 730) return `${Math.floor(days / 365)} years ago`;
  if (days >= 365) return 'over a year ago';
  return `${Math.max(1, Math.round(days / 30))} months ago`;
}

export function freshness(takenAt: string, today: string, windowDays: number): Freshness {
  const days = daysBetween(takenAt, today);
  if (days === null) return { fresh: false, days: null, line: 'No date on this reading.' };
  if (days <= windowDays) return { fresh: true, days, line: null };
  return {
    fresh: false,
    days,
    line: `Measured ${ago(days)}, so it is shown but not counted.`,
  };
}

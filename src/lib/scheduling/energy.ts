/**
 * The day's energy shape, as something the scheduler can act on.
 *
 * `energyShape` in `src/features/health/sleepDebt.ts` has been computing
 * where a person's peak, dip and second wind fall since the readiness card
 * was built — and that is the only place it went. Rise charges A$14.99 a
 * month for exactly this and nothing else, so the shape sitting unused
 * beside a scheduler that decides what happens at nine in the morning was
 * the clearest waste in the app.
 *
 * ── What it is allowed to do ────────────────────────────────────────────
 *
 * A TIE-BREAK, and nothing more. The engine places by tier, then goal,
 * then the person's stated life-area order; every one of those is a thing
 * the person said, and a chronotype curve derived from their wake time is
 * not entitled to overrule any of it. So energy only ever chooses BETWEEN
 * starts the engine would already have accepted for the routine it is
 * placing. It never reopens a placement, never displaces anything already
 * on the day, and never moves anything across a bound that already exists
 * — a protocol's finish-before-sleep, a fixed block, a deadline, or a
 * practice whose hour is part of what it is.
 *
 * ── Which things care ───────────────────────────────────────────────────
 *
 * Most do not. A family dinner is at dinner time; a wind-down is before
 * bed; breathing works whenever you are anxious. The two ends that do care
 * are the ones the sleep literature is actually about: work that needs
 * concentration wants the peak, and low-demand movement and admin are the
 * things worth spending the dip on. Everything else is left alone, which
 * keeps the nudge rare enough to be believable.
 */

import { toMinutes } from '@/lib/dates';
import type { Routine } from '@/types/domain';

/** A stretch of the day. Structurally what `energyShape` returns. */
export interface EnergyBand {
  start: string;
  end: string;
}

/**
 * Peak, dip and second wind, as `energyShape(wakeTime, profile)` computes
 * them. Declared here rather than imported so `src/lib/scheduling` stays
 * free of the feature layer; the shapes match by construction and the
 * planner hands one straight across.
 */
export interface DayEnergy {
  peak: EnergyBand;
  dip: EnergyBand;
  second: EnergyBand;
}

/**
 * How much of a person this asks for.
 *
 * `deep` wants the peak, `light` is worth spending the dip on, `steady` is
 * everything else and is never nudged.
 */
export type Demand = 'deep' | 'light' | 'steady';

/**
 * Concentration practices that reach the placement engine.
 *
 * The obvious ones — a deep-work block, a think day, the weekly business
 * review — are carved out of the work hours instead of being placed, so
 * they are deliberately absent: listing them would suggest a nudge that
 * can never fire. What is left is the focused work that happens around a
 * job rather than inside one.
 */
const DEEP_PROTOCOLS = new Set([
  'creative-block',
  'creative-session-daily',
  'skill-technical-block',
  'skill-weak-link-block',
  'skill-interleaved-drills',
  'volume-pass',
  'ship-monthly',
  'week-preview',
  'fear-setting',
  'negotiation-anchor-prep',
]);

/**
 * The low-demand end: movement that costs no thought, and the household
 * admin that only ever gets done because it is on the day somewhere.
 */
const LIGHT_PROTOCOLS = new Set([
  'daily-walk',
  'post-meal-walk',
  'incubation-walk',
  'mobility-10',
  'batch-cook',
  'order-before-arrival',
  'meal-sketch',
]);

/**
 * What this routine asks of the person.
 *
 * Read from what the routine IS — the session behind it, the practice it
 * traces to, the part of life it belongs to — never from its title, which
 * is copy and changes.
 */
export function demandOf(routine: Routine): Demand {
  if (routine.protocolId && DEEP_PROTOCOLS.has(routine.protocolId)) return 'deep';
  if (routine.protocolId && LIGHT_PROTOCOLS.has(routine.protocolId)) return 'light';
  // A hard session is the clearest case of all: it is the one thing in the
  // day that goes measurably better on a body that is not flat.
  if (routine.sessionType === 'workout' || routine.sessionType === 'business_review') return 'deep';
  if (routine.sessionType === 'meal_plan') return 'light';
  // Money and household admin: the chores. Never worth a sharp hour.
  if (routine.area === 'admin') return 'light';
  return 'steady';
}

/**
 * The band a demand wants, or null when it wants nothing.
 *
 * The second wind is deliberately not a target. It is real and it is where
 * the evening people live, but the shape already shifts three hours for an
 * evening chronotype, and aiming at two separate peaks would move things
 * for a distinction nobody would recognise on their own day.
 */
export function bandFor(demand: Demand, energy: DayEnergy): EnergyBand | null {
  if (demand === 'deep') return energy.peak;
  if (demand === 'light') return energy.dip;
  return null;
}

/** Minutes of a routine starting at `start` that fall inside the band. */
export function overlapWith(start: number, durationMin: number, band: EnergyBand): number {
  // Bands are clock times and a day can run past midnight, so both ends are
  // brought onto the same lap as the start being scored: a band at 08:00 is
  // tomorrow's 08:00 for a routine starting at 01:00.
  const bandStart = normaliseTo(toMinutes(band.start), start);
  const bandEnd = normaliseTo(toMinutes(band.end), start, bandStart);
  return Math.max(0, Math.min(start + durationMin, bandEnd) - Math.max(start, bandStart));
}

/** Put a clock time on the same lap of the day as `reference`. */
function normaliseTo(minute: number, reference: number, after?: number): number {
  let m = minute;
  while (m < reference - 720) m += 1440;
  while (m > reference + 720) m -= 1440;
  if (after !== undefined && m < after) m += 1440;
  return m;
}

/** A routine that sits where it does because of the person's energy. */
export interface EnergyPlacement {
  routineId: string;
  title: string;
  demand: Exclude<Demand, 'steady'>;
  /** Minutes from midnight it was given. */
  start: number;
  band: EnergyBand;
}

/**
 * One sentence for the day, in the same shape as the displaced line: name
 * the decision, in the words the person would use, once rather than per
 * row. Three rows each explaining the same curve reads as a lecture.
 */
export function energyLine(placements: EnergyPlacement[]): string | null {
  const deep = placements.find((p) => p.demand === 'deep');
  const light = placements.find((p) => p.demand === 'light');
  if (deep) {
    const sharp = `Your sharp hours are ${clock(deep.band.start)} to ${clock(deep.band.end)}, so ${deep.title} sits there.`;
    return light ? `${sharp} ${light.title} takes the flat stretch after them.` : sharp;
  }
  if (light) {
    return `Your flat stretch is ${clock(light.band.start)} to ${clock(light.band.end)}, so ${light.title} sits there rather than in a sharp hour.`;
  }
  return null;
}

/** "9", "9:30", "1pm" — the app's clock voice, minutes only when they matter. */
function clock(hhmm: string): string {
  const min = toMinutes(hhmm);
  const h24 = Math.floor(min / 60) % 24;
  const m = min % 60;
  const suffix = h24 >= 12 ? 'pm' : 'am';
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0 ? `${h}${suffix}` : `${h}:${String(m).padStart(2, '0')}${suffix}`;
}

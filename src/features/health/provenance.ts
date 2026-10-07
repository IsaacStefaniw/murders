/**
 * Where a figure came from, and when.
 *
 * ── Isaac, using his own app ────────────────────────────────────────────
 *
 * *"Where did it get my BMI from?"*
 *
 * Nothing was broken. Height comes from Apple Health's five-year window or
 * from manual entry in `BodyNumbers`; weight the same; the 25.2 was real.
 * But the app never said so, and `docs/NEXT_SESSION.md` §2.4 drew the right
 * conclusion: **a health figure whose origin a person cannot trace is one
 * they are right to distrust.** Every derived number on these screens
 * should be able to say what it was computed from and when.
 *
 * The data was never missing. `MetricObservation` has carried
 * `source: 'user' | 'derived' | 'healthkit' | 'integration'` and an `at`
 * timestamp since it was written. It simply never reached a screen.
 *
 * ── Why this matters more for this persona than it looks ────────────────
 *
 * `docs/PERSONA.md` §3.5: honest evidence, loudly. "This is the one person
 * who genuinely wants the grades — who will respect a D more than a
 * confident claim, because they have been sold confident claims before."
 * Someone who reads Attia and Huberman and can tell a decent study from a
 * supplement advert will extend exactly as much trust to a 25.2 with no
 * origin as they would to a supplement label. Showing the origin is
 * cheaper than earning the trust back.
 *
 * ── What it refuses to do ───────────────────────────────────────────────
 *
 * It never invents a source. A figure with no observation behind it gets
 * null and the screen prints nothing, rather than "calculated from your
 * data" — which is the kind of sentence that sounds like provenance and
 * contains none.
 */

import { addDays } from '@/lib/dates';
import type { MetricObservation } from '@/features/model/metrics';

/**
 * Who supplied it, in the second person where that is the honest answer.
 *
 * 'derived' is the app's own arithmetic on top of something else — an
 * e1RM from a logged set. Saying "the app worked it out" rather than
 * naming a device is the truthful version, and it invites the follow-up
 * question rather than closing it.
 */
export function sourceWord(source: MetricObservation['source']): string {
  switch (source) {
    case 'healthkit':
      return 'Apple Health';
    case 'user':
      return 'you entered it';
    case 'derived':
      return 'the app worked it out';
    case 'integration':
      return 'a connected app';
  }
}

/**
 * When, as a person would say it.
 *
 * Days rather than times for anything older than yesterday: "14 Sep" is
 * what somebody can check against their own memory, where "18 days ago"
 * is arithmetic they have to do.
 */
export function whenWord(iso: string, today: string): string {
  const date = iso.slice(0, 10);
  if (date === today) return 'today';
  if (date === addDays(today, -1)) return 'yesterday';

  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return 'at some point';
  const month = MONTHS[m - 1] ?? '';
  // The year only where it is not this one — "14 Sep 2025" on a figure
  // from last autumn is the difference between stale and current, and
  // hiding it would be the same omission this module exists to fix.
  const thisYear = Number(today.slice(0, 4));
  return y === thisYear ? `${d} ${month}` : `${d} ${month} ${y}`;
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** "Apple Health, today" · "you entered it, 14 Sep". */
export function fromObservation(
  obs: MetricObservation | null | undefined,
  today: string,
): string | null {
  if (!obs) return null;
  return `${sourceWord(obs.source)}, ${whenWord(obs.at, today)}`;
}

export interface Ingredient {
  /** The figure, as the person would read it: "83.4 kg", "182 cm". */
  value: string;
  obs: MetricObservation | null | undefined;
}

/**
 * The provenance of a figure computed from several others.
 *
 * "From 83.4 kg (Apple Health, today) and 182 cm (you entered it, 14 Sep)."
 *
 * Returns null unless EVERY ingredient can be traced. A partial answer
 * here is worse than none: it would name the input the person already
 * trusts and go quiet about the one they are asking after.
 */
export function fromIngredients(
  ingredients: Ingredient[],
  today: string,
): string | null {
  if (ingredients.length === 0) return null;
  const parts: string[] = [];
  for (const { value, obs } of ingredients) {
    const where = fromObservation(obs, today);
    if (!where) return null;
    parts.push(`${value} (${where})`);
  }
  const joined =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  return `From ${joined}.`;
}

/**
 * The provenance of a figure averaged over several readings.
 *
 * Says how many and from where, because the count is the thing that
 * decides whether a mean means anything — "one night" and "seven nights"
 * are different claims and the old caption made them look identical.
 * Where readings come from more than one place, all of them are named:
 * a week of Apple Health nights with one typed in by hand is worth
 * knowing about.
 */
export function fromReadings(
  readings: MetricObservation[],
  noun: string,
  today: string,
): string | null {
  if (readings.length === 0) return null;

  const sources = [...new Set(readings.map((r) => r.source))];
  const where =
    sources.length === 1
      ? sourceWord(sources[0])
      : sources.map(sourceWord).join(' and ');

  const count = readings.length;
  const plural = count === 1 ? noun : `${noun}s`;

  const dates = readings.map((r) => r.at).sort();
  const last = whenWord(dates[dates.length - 1], today);

  return count === 1
    ? `From one ${noun} — ${where}, ${last}.`
    : `From ${count} ${plural} — ${where}. Most recent ${last}.`;
}

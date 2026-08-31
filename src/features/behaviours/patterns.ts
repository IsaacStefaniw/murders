/**
 * Behaviour pattern engine.
 *
 * Turns a stream of logged occurrences into three honest things: WHEN it
 * tends to happen, WHAT tends to be true on those days, and WHERE the week
 * is heading. From the first of those it computes the only genuinely useful
 * output — a time to intervene BEFORE the window opens, rather than a
 * message after the fact telling someone what they already know.
 *
 * Three rules hold everywhere in this file:
 *
 * 1. Below MIN_EVENTS_FOR_PATTERN, there is no pattern. Four points is
 *    already thin; three is a coincidence with a chart. Every function
 *    returns null rather than a confident-sounding shape built from two
 *    Tuesdays.
 * 2. Nothing here scores a person. There is no adherence percentage, no
 *    streak, no total. `weekPressure` compares counts because direction is
 *    information; it never grades.
 * 3. Correlation is reported as co-occurrence and worded as co-occurrence.
 *    `coFactor` says what was also true, never what caused what.
 */

import { behaviourInfo, type BehaviourInfo } from '@/features/behaviours/catalog';
import type { EvidenceLevel } from '@/features/knowledge/protocols';
import { latest, type MetricObservation } from '@/features/model/metrics';
import { toDateKey, toHHMM, toMinutes, weekdayOf } from '@/lib/dates';
import type { BehaviourEvent, BehaviourIntention, BehaviourKey, Weekday } from '@/types/domain';

/**
 * Four occurrences before the engine will claim anything. Chosen because it
 * is the smallest number where "three of these four" is a sentence worth
 * reading, and because a person who has logged four times has decided this
 * is worth logging.
 */
export const MIN_EVENTS_FOR_PATTERN = 4;

/** Default width of the search window: a habit lives in an evening, not a minute. */
const WINDOW_WIDTH_MIN = 180;

/** How far ahead of the window an intervention lands. Before the pull starts. */
export const DEFAULT_LEAD_MIN = 45;

const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const minuteOfDay = (iso: string): number => {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
};

const roundDown = (min: number, step = 15) => Math.floor(min / step) * step;
const roundUp = (min: number, step = 15) => Math.ceil(min / step) * step;

export interface HotWindow {
  /** Minutes from local midnight. May be greater than `endMin` when the window crosses midnight. */
  startMin: number;
  endMin: number;
  /** Occurrences inside the window. */
  hits: number;
  /** Occurrences considered. */
  total: number;
  /** hits / total, 0–1. */
  share: number;
  label: string;
}

/**
 * The time of day this behaviour clusters in, if it clusters at all.
 *
 * Searched circularly so that 11pm and 12:30am read as one late window
 * rather than two lonely ones at opposite ends of the day — which is the
 * shape late-night behaviours actually have.
 */
export function hotWindow(events: BehaviourEvent[], widthMin = WINDOW_WIDTH_MIN): HotWindow | null {
  const total = events.length;
  if (total < MIN_EVENTS_FOR_PATTERN) return null;
  const mins = events.map((e) => minuteOfDay(e.occurredAt));

  let best: { start: number; inside: number[] } | null = null;
  for (let h = 0; h < 24; h += 1) {
    const start = h * 60;
    const inside = mins.filter((m) => (m - start + 1440) % 1440 < widthMin);
    if (!best || inside.length > best.inside.length) best = { start, inside };
  }
  if (!best) return null;

  const hits = best.inside.length;
  const share = hits / total;
  // Half the occurrences inside a three-hour window is the bar for calling
  // it a window. Below that the behaviour is spread across the day, and
  // pretending otherwise sends the intervention to the wrong hour.
  if (hits < MIN_EVENTS_FOR_PATTERN || share < 0.5) return null;

  const offsets = best.inside.map((m) => (m - best!.start + 1440) % 1440);
  const startMin = (best.start + roundDown(Math.min(...offsets))) % 1440;
  const endMin = (best.start + roundUp(Math.max(...offsets))) % 1440;
  const width = (endMin - startMin + 1440) % 1440;

  return {
    startMin,
    endMin: width === 0 ? (startMin + 15) % 1440 : endMin,
    hits,
    total,
    share,
    label: `${toHHMM(startMin)}–${toHHMM(width === 0 ? (startMin + 15) % 1440 : endMin)}`,
  };
}

export interface WeekdayShape {
  /** Occurrences per weekday, index 0 = Sunday. */
  counts: number[];
  /** The smallest set of days holding most of the occurrences, when one exists. */
  concentrated: Weekday[] | null;
  label: string | null;
}

/**
 * Which days carry it. Only reported when a small set of days holds most of
 * the occurrences — a behaviour spread evenly over seven days has a shape,
 * and that shape is "every day", which is not news.
 */
export function weekdayShape(events: BehaviourEvent[]): WeekdayShape {
  const counts = new Array(7).fill(0) as number[];
  for (const e of events) counts[weekdayOf(toDateKey(new Date(e.occurredAt)))] += 1;
  const total = events.length;
  if (total < MIN_EVENTS_FOR_PATTERN) return { counts, concentrated: null, label: null };

  const ranked = counts
    .map((n, day) => ({ n, day: day as Weekday }))
    .filter((d) => d.n > 0)
    .sort((a, b) => b.n - a.n || a.day - b.day);

  let running = 0;
  const picked: Weekday[] = [];
  for (const d of ranked) {
    running += d.n;
    picked.push(d.day);
    if (running / total >= 0.7) break;
  }
  if (picked.length > 3 || running / total < 0.7) return { counts, concentrated: null, label: null };

  const days = [...picked].sort((a, b) => a - b);
  const isWeekend = days.length === 2 && days.includes(0) && days.includes(6);
  const label = isWeekend
    ? 'weekends'
    : days.map((d) => WEEKDAY_LABELS[d] + 's').join(days.length === 2 ? ' and ' : ', ');
  return { counts, concentrated: days, label };
}

export interface CoFactor {
  key: 'short_sleep';
  /** Occurrences where the co-factor held. */
  hits: number;
  /** Occurrences where the co-factor could be checked at all. */
  checked: number;
  label: string;
}

/** Below this, a night counts as short for co-occurrence purposes. */
const SHORT_SLEEP_HOURS = 6.5;

/**
 * What else was true on those days.
 *
 * Deliberately narrow: sleep only, because sleep is the one input with both
 * a reliable reading (HealthKit or the morning check-in) and a plausible
 * link to nearly every behaviour in the catalog. Adding weaker signals here
 * would produce more sentences and less truth.
 */
export function coFactor(events: BehaviourEvent[], metrics: MetricObservation[]): CoFactor | null {
  if (events.length < MIN_EVENTS_FOR_PATTERN) return null;
  const sleep = metrics.filter((m) => m.key === 'sleep.hours');
  if (sleep.length === 0) return null;

  let hits = 0;
  let checked = 0;
  for (const e of events) {
    // The night before the event: the reading logged on the event's own
    // calendar day, since a morning check-in records the night just past.
    const dayKey = toDateKey(new Date(e.occurredAt));
    const sameDay = sleep.filter((m) => toDateKey(new Date(m.at)) === dayKey);
    const reading = latest(sameDay, 'sleep.hours');
    if (!reading) continue;
    checked += 1;
    if (reading.value < SHORT_SLEEP_HOURS) hits += 1;
  }

  // Needs both enough readings to be checkable and a clear majority. Three
  // of five is not a finding; it is a coin.
  if (checked < MIN_EVENTS_FOR_PATTERN || hits / checked < 0.6) return null;
  return {
    key: 'short_sleep',
    hits,
    checked,
    label: `${hits} of the ${checked} followed a night under ${SHORT_SLEEP_HOURS} hours`,
  };
}

export interface WeekPressure {
  thisWeek: number;
  /** Mean per week over the three weeks before this one, to one decimal. */
  priorMean: number;
  direction: 'up' | 'down' | 'flat';
  /** False until there is enough history for the comparison to mean anything. */
  comparable: boolean;
}

/**
 * Where the week sits against recent ones. A count and a direction — never
 * a target, never a grade, and never the word "only".
 */
export function weekPressure(events: BehaviourEvent[], now = new Date()): WeekPressure {
  const end = now.getTime();
  const inBlock = (weeksAgo: number) =>
    events.filter((e) => {
      const t = new Date(e.occurredAt).getTime();
      return t > end - (weeksAgo + 1) * 7 * 86400e3 && t <= end - weeksAgo * 7 * 86400e3;
    }).length;

  const thisWeek = inBlock(0);
  const prior = [inBlock(1), inBlock(2), inBlock(3)];
  const earliest = events.reduce<string | null>(
    (min, e) => (min === null || e.occurredAt < min ? e.occurredAt : min),
    null,
  );
  const historyDays = earliest ? (end - new Date(earliest).getTime()) / 86400e3 : 0;
  const comparable = historyDays >= 14;
  const priorMean = Math.round((prior.reduce((a, b) => a + b, 0) / prior.length) * 10) / 10;
  const delta = thisWeek - priorMean;

  return {
    thisWeek,
    priorMean,
    direction: !comparable || Math.abs(delta) < 1 ? 'flat' : delta > 0 ? 'up' : 'down',
    comparable,
  };
}

export interface Intervention {
  /** HH:MM — when to put something else in front of them. */
  at: string;
  leadMin: number;
  window: HotWindow;
  line: string;
}

/**
 * The point of the whole module: a time to act, placed BEFORE the window.
 *
 * A message that arrives during the pull is a message arriving after the
 * decision. This lands while the choice is still cheap.
 */
export function interventionTime(
  window: HotWindow | null,
  leadMin = DEFAULT_LEAD_MIN,
): Intervention | null {
  if (!window) return null;
  const at = toHHMM((window.startMin - leadMin + 1440) % 1440);
  return {
    at,
    leadMin,
    window,
    line: `Usually lands ${window.label}. ${at} is ahead of it.`,
  };
}

export interface BehaviourPattern {
  behaviour: BehaviourKey;
  info: BehaviourInfo;
  events: number;
  /** 'learning' until there is enough to say anything; nothing is claimed before then. */
  readiness: 'learning' | 'ready';
  /** How many more occurrences before the engine will speak. */
  needed: number;
  window: HotWindow | null;
  days: WeekdayShape;
  coFactor: CoFactor | null;
  week: WeekPressure;
  intervention: Intervention | null;
}

export function behaviourPattern(
  intention: BehaviourIntention,
  allEvents: BehaviourEvent[],
  metrics: MetricObservation[] = [],
  now = new Date(),
): BehaviourPattern {
  const events = allEvents.filter((e) => e.intentionId === intention.id);
  const window = hotWindow(events);
  return {
    behaviour: intention.behaviour,
    info: behaviourInfo(intention.behaviour),
    events: events.length,
    readiness: events.length >= MIN_EVENTS_FOR_PATTERN ? 'ready' : 'learning',
    needed: Math.max(0, MIN_EVENTS_FOR_PATTERN - events.length),
    window,
    days: weekdayShape(events),
    coFactor: coFactor(events, metrics),
    week: weekPressure(events, now),
    intervention: interventionTime(window),
  };
}

export interface DueIntervention {
  intention: BehaviourIntention;
  pattern: BehaviourPattern;
  /** HH:MM, ahead of the window. */
  at: string;
  line: string;
}

/**
 * Which interventions belong on a given day, and when.
 *
 * This is the answer to "better push timings": the time is computed from
 * the person's own logged distribution rather than picked by us, and the
 * day is filtered by the same evidence — a Friday-night habit produces
 * nothing on a Tuesday. An app that nudges every evening regardless is an
 * app people mute by the second week, which costs the nudges that mattered.
 *
 * Requires a pattern, by construction: before four occurrences there is no
 * window, so there is no intervention, so nothing fires. The app stays
 * quiet until it has something true to say.
 */
export function dueInterventions(
  intentions: BehaviourIntention[],
  events: BehaviourEvent[],
  metrics: MetricObservation[],
  dateKey: string,
  now = new Date(),
): DueIntervention[] {
  const today = weekdayOf(dateKey);
  const out: DueIntervention[] = [];
  for (const intention of intentions.filter((i) => i.active)) {
    const pattern = behaviourPattern(intention, events, metrics, now);
    if (pattern.readiness !== 'ready' || !pattern.intervention) continue;
    // A concentrated day-shape is a filter, not a footnote.
    if (pattern.days.concentrated && !pattern.days.concentrated.includes(today)) continue;
    out.push({
      intention,
      pattern,
      at: pattern.intervention.at,
      line: pattern.intervention.line,
    });
  }
  return out.sort((a, b) => toMinutes(a.at) - toMinutes(b.at));
}

/* -------------------------------------------------------------------------
 * Copy. Kept here, next to the data, so the rules about what may be said
 * are testable rather than scattered through screens.
 * ---------------------------------------------------------------------- */

export type MomentNote =
  | { kind: 'mechanism'; text: string; evidenceLevel: EvidenceLevel; attribution: string }
  | { kind: 'pattern'; text: string }
  | { kind: 'logged'; text: string };

/**
 * Hours between an event and bedtime. An event after bedtime counts as zero
 * — it is as proximate as it gets — rather than as twenty-three hours before
 * the following night.
 */
export function hoursBeforeSleep(occurredAt: string, sleepTime: string | null): number | null {
  if (!sleepTime) return null;
  const gap = ((toMinutes(sleepTime) - minuteOfDay(occurredAt) + 1440) % 1440) / 60;
  return gap > 20 ? 0 : gap;
}

/**
 * What to say in the moment something is logged.
 *
 * The order matters and is the whole ethical design of this feature. A
 * mechanism is offered only when one exists and applies right now. Failing
 * that, the person's own pattern — true, specific, and theirs. Failing that,
 * an acknowledgement and nothing more.
 *
 * What is never returned: a judgement, a comparison to a target, a
 * consequence for their body invented to make the moment land harder. One
 * piece of chocolate at 8:45pm reaches the second branch, which is the
 * correct answer, because the first branch has nothing honest to say.
 */
export function momentNote(
  event: BehaviourEvent,
  pattern: BehaviourPattern,
  sleepTime: string | null,
): MomentNote {
  const effect = pattern.info.proximateEffect;
  const gap = hoursBeforeSleep(event.occurredAt, sleepTime);
  if (effect && gap !== null && gap <= effect.withinHoursOfSleep) {
    return {
      kind: 'mechanism',
      text: effect.text,
      evidenceLevel: effect.evidenceLevel,
      attribution: effect.attribution,
    };
  }

  if (pattern.readiness === 'ready' && pattern.window) {
    const inWindow =
      (minuteOfDay(event.occurredAt) - pattern.window.startMin + 1440) % 1440 <=
      (pattern.window.endMin - pattern.window.startMin + 1440) % 1440;
    if (inWindow) {
      return {
        kind: 'pattern',
        text: `That is ${pattern.window.hits} of your last ${pattern.window.total}, all between ${pattern.window.label}.`,
      };
    }
  }

  return { kind: 'logged', text: 'Logged. Noticing it is the part that counts.' };
}

/**
 * The week's read. Pattern and direction, in that order, and nothing about
 * whether the person is doing well or badly — the app does not know that.
 */
export function weekNote(pattern: BehaviourPattern): string | null {
  if (pattern.readiness === 'learning') {
    return pattern.events === 0
      ? null
      : `${pattern.events} logged so far. ${pattern.needed} more and the timing starts to show.`;
  }

  const parts: string[] = [];
  if (pattern.window) parts.push(`Mostly ${pattern.window.label}`);
  if (pattern.days.label) parts.push(`and mostly ${pattern.days.label}`);
  if (pattern.coFactor) parts.push(`— ${pattern.coFactor.label}`);
  if (parts.length === 0) {
    parts.push(`${pattern.events} logged, spread across the week rather than clustered`);
  }

  const head = parts.join(' ').replace(' —', ',') + '.';
  if (!pattern.week.comparable) return head;
  const tail =
    pattern.week.direction === 'up'
      ? `This week: ${pattern.week.thisWeek}, against ${pattern.week.priorMean} a week before.`
      : pattern.week.direction === 'down'
        ? `This week: ${pattern.week.thisWeek}, down from ${pattern.week.priorMean} a week.`
        : `This week: ${pattern.week.thisWeek}, about the usual.`;
  return `${head} ${tail}`;
}

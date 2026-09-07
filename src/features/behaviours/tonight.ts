/**
 * Tonight, for the behaviour someone named.
 *
 * Three reviewers with a drinking or vaping goal wanted the same three
 * things on Today from the first day: the plan for tonight in their own
 * words, a visible count of what is going right, and the urge tool one
 * tap away. This module computes the words for that card. The card itself
 * is TonightCard.tsx; everything here is pure so the words are testable.
 *
 * Rules that hold in every function:
 *
 * 1. Wins are counted; nothing is ever reset. A lapse is one event and
 *    turns into the next hour's plan. The word "streak" appears nowhere,
 *    because a streak is a thing you can lose and the research on what
 *    follows a lapse says the story of loss is what does the damage.
 * 2. The plan is an if-then sentence, cue first, and the "then" is a thing
 *    the person does — never a thing they avoid. Plans written as "I will
 *    not" leave nothing to do with the moment.
 * 3. The stand-in is matched to the trigger. Stress wants the breath out;
 *    boredom wants the hands busy; a social night is decided before
 *    arriving; a tired evening gets the smallest thing and bed.
 *
 * Wins and the plan in the person's own words are kept on the recovery
 * path's answers (`paths.recovery.answers`) through `updatePathAnswers`,
 * which already exists and already persists. A dedicated slice would be
 * cleaner and is proposed; this keeps the feature inside the files the
 * coach owns.
 */

import { behaviourInfo, type BehaviourInfo } from '@/features/behaviours/catalog';
import type { BehaviourPattern } from '@/features/behaviours/patterns';
import { answeredValues } from '@/features/knowledge/questionBank';
import { dateKeyToDate, formatTime, toDateKey, toHHMM } from '@/lib/dates';
import type { BehaviourEvent, BehaviourIntention } from '@/types/domain';

export type TriggerKey = 'stress' | 'boredom' | 'social' | 'evening' | 'tired' | 'lowmood' | 'unsure';
export type ReplacementKey = 'breathe' | 'walk' | 'read' | 'message' | 'tidy' | 'water';

/** The "when" half of the sentence, for each trigger the intake offers. */
export const TRIGGER_CUES: Record<TriggerKey, string> = {
  stress: 'the pressure is on',
  boredom: 'there is nothing to do',
  social: 'other people are doing it',
  evening: 'the house goes quiet in the evening',
  tired: 'I am running on empty',
  lowmood: 'the day has gone badly',
  unsure: 'the pull starts',
};

/** The "then" half: something done, never something avoided. */
export const REPLACEMENT_ACTIONS: Record<ReplacementKey, string> = {
  breathe: 'do the two-minute breath reset',
  walk: 'walk it off, outside if I can',
  read: 'read something on paper',
  message: 'message someone who knows',
  tidy: 'do one small job with my hands',
  water: 'make a drink, slowly',
};

export interface StandIn {
  key: ReplacementKey;
  /** One sentence about why this one fits this trigger. */
  line: string;
  /** Where a tap goes, when the app can run the stand-in itself. */
  route?: string;
}

/** The breath session opened straight into the reset, no chooser. */
export const URGE_BREATH_ROUTE = '/session/breathe?urge=1';

/**
 * Stand-ins by trigger, best fit first. The first entry is what "help me
 * pick" resolves to, so the unsure person with a boredom trigger gets
 * something for their hands rather than a breath they will not take.
 */
export const STAND_INS: Record<TriggerKey, StandIn[]> = {
  stress: [
    { key: 'breathe', line: 'Two minutes of long breaths out. Stress urges fall fastest to a slow exhale.', route: URGE_BREATH_ROUTE },
    { key: 'walk', line: 'Five minutes outside. The pressure comes down faster moving than sitting with it.' },
    { key: 'water', line: 'A drink made slowly, away from the desk. The making is the point.' },
  ],
  boredom: [
    { key: 'tidy', line: 'Boredom wants something to do, not something to calm. One small job with your hands.' },
    { key: 'walk', line: 'A short walk gives the restlessness somewhere to go.' },
    { key: 'read', line: 'A page of something on paper — stimulation that ends when you put it down.' },
  ],
  social: [
    { key: 'message', line: 'Decided before you arrive: your drink, your line, your exit. Message someone who knows you are on it.' },
    { key: 'water', line: 'A drink in your hand that is not the one. Nobody asks twice.' },
  ],
  evening: [
    { key: 'read', line: 'Something on paper at the hour the quiet starts, before the phone or the fridge.' },
    { key: 'breathe', line: 'Two minutes of slow breathing at the start of the quiet, not after the pull has begun.', route: URGE_BREATH_ROUTE },
    { key: 'water', line: 'The kettle on at the usual hour. A small ritual in the slot the habit had.' },
  ],
  tired: [
    { key: 'water', line: 'Running on empty, the answer is small on purpose: a drink made slowly, then bed at the usual time.' },
    { key: 'breathe', line: 'Ninety seconds of breathing, then bed. A tired evening cannot carry more than that.', route: URGE_BREATH_ROUTE },
  ],
  lowmood: [
    { key: 'message', line: 'A bad day makes the habit feel like relief. Message someone real — the stand-in is something kind that is not the habit.' },
    { key: 'walk', line: 'Ten minutes outside, no destination. Moving shifts a mood faster than sitting in it.' },
    { key: 'breathe', line: 'Two minutes of long breaths out, then one kind thing.', route: URGE_BREATH_ROUTE },
  ],
  unsure: [
    { key: 'breathe', line: 'The two-minute reset works for most triggers until you know yours.', route: URGE_BREATH_ROUTE },
    { key: 'walk', line: 'A short walk, outside if you can.' },
    { key: 'water', line: 'A drink made slowly. The making is the point.' },
  ],
};

export const TRIGGER_KEYS = Object.keys(TRIGGER_CUES) as TriggerKey[];
export const REPLACEMENT_KEYS = Object.keys(REPLACEMENT_ACTIONS) as ReplacementKey[];

const isTrigger = (v: string): v is TriggerKey => (TRIGGER_KEYS as string[]).includes(v);
const isReplacement = (v: string): v is ReplacementKey => (REPLACEMENT_KEYS as string[]).includes(v);

/** The triggers chosen, in the order chosen. The intake is multi-answer. */
export function triggersOf(answers: Record<string, string>): TriggerKey[] {
  return answeredValues(answers, 'trigger').filter(isTrigger);
}

/** The first trigger chosen, or unsure. The plan and the hour follow it. */
export function primaryTrigger(answers: Record<string, string>): TriggerKey {
  return triggersOf(answers)[0] ?? 'unsure';
}

/** What "help me pick" resolves to for this trigger. */
export function defaultReplacementFor(trigger: TriggerKey): ReplacementKey {
  return STAND_INS[trigger][0].key;
}

/** The replacement in force: the one chosen, or the trigger's best fit. */
export function replacementOf(answers: Record<string, string>): ReplacementKey {
  const raw = answers.replacement;
  if (raw && isReplacement(raw)) return raw;
  return defaultReplacementFor(primaryTrigger(answers));
}

/**
 * The stand-in for the moment. The trigger's own sentence where the chosen
 * replacement has one; otherwise the plain action, so a chosen replacement
 * is never overridden by a better-worded one.
 */
export function standInFor(answers: Record<string, string>): StandIn {
  const trigger = primaryTrigger(answers);
  const replacement = replacementOf(answers);
  const matched = STAND_INS[trigger].find((s) => s.key === replacement);
  if (matched) return matched;
  return {
    key: replacement,
    line: `${REPLACEMENT_ACTIONS[replacement].charAt(0).toUpperCase()}${REPLACEMENT_ACTIONS[replacement].slice(1)}.`,
    route: replacement === 'breathe' ? URGE_BREATH_ROUTE : undefined,
  };
}

/**
 * The stand-in to offer when the breath session has just finished and the
 * pull is still there: the trigger's next-best that is not more breathing.
 */
export function standInAfterBreath(answers: Record<string, string>): StandIn {
  const chosen = standInFor(answers);
  if (chosen.key !== 'breathe') return chosen;
  return STAND_INS[primaryTrigger(answers)].find((s) => s.key !== 'breathe') ?? chosen;
}

export interface IfThenPlan {
  cue: string;
  action: string;
  /** The whole sentence. */
  text: string;
  /** True when both halves are the person's own words. */
  ownWords: boolean;
}

/**
 * The plan as a sentence. The person's own cue and action win outright;
 * otherwise the intake's picks are composed into one. Own words are kept
 * exactly as typed after the "When" and the comma, so the grammar is theirs.
 */
export function ifThenPlan(answers: Record<string, string>): IfThenPlan {
  const ownCue = (answers.ifThenCue ?? '').trim().replace(/[.\s]+$/, '');
  const ownAction = (answers.ifThenAction ?? '').trim().replace(/[.\s]+$/, '');
  if (ownCue && ownAction) {
    return { cue: ownCue, action: ownAction, text: `When ${ownCue}, ${ownAction}.`, ownWords: true };
  }
  const cue = TRIGGER_CUES[primaryTrigger(answers)];
  const action = REPLACEMENT_ACTIONS[replacementOf(answers)];
  return { cue, action, text: `When ${cue}, I ${action}.`, ownWords: false };
}

/* -------------------------------------------------------------------------
 * Wins. Kept as date keys on the path's answers. Counted, never reset.
 * ---------------------------------------------------------------------- */

/** Date keys kept. Enough for a season; the count is what matters. */
export const CLEAR_DAYS_KEPT = 120;

/** A clear night can be counted from this minute of the day. */
export const COUNT_FROM_MIN = 20 * 60;

export function clearDaysOf(answers: Record<string, string>): string[] {
  const raw = answers.clearDays;
  if (!raw) return [];
  return [...new Set(raw.split(',').filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)))].sort();
}

/** The `clearDays` value with this day counted. */
export function markClearDay(answers: Record<string, string>, dateKey: string): string {
  const days = [...new Set([...clearDaysOf(answers), dateKey])].sort();
  return days.slice(-CLEAR_DAYS_KEPT).join(',');
}

/** The `clearDays` value with this day not counted — after a lapse that night. */
export function unmarkClearDay(answers: Record<string, string>, dateKey: string): string {
  return clearDaysOf(answers).filter((k) => k !== dateKey).join(',');
}

export function canMarkClear(nowMin: number): boolean {
  return nowMin >= COUNT_FROM_MIN;
}

export interface Tally {
  /** Nights counted clear. */
  clear: number;
  /** Whole days since the last logged occurrence; null when none logged. */
  daysSince: number | null;
  lapsedToday: boolean;
  line: string;
}

const dayDiff = (from: string, to: string): number =>
  Math.round((dateKeyToDate(to).getTime() - dateKeyToDate(from).getTime()) / 86400e3);

/**
 * What is going right, in numbers that only go up. Two of them: nights the
 * person counted clear, and days since the last one they logged. Neither
 * is a target and neither is compared to anyone.
 */
export function tally(
  intention: BehaviourIntention,
  events: BehaviourEvent[],
  answers: Record<string, string>,
  todayKey: string,
): Tally {
  const own = events.filter((e) => e.intentionId === intention.id);
  const days = own.map((e) => toDateKey(new Date(e.occurredAt)));
  const last = days.reduce<string | null>((m, k) => (m === null || k > m ? k : m), null);
  const lapsedToday = last === todayKey;
  const daysSince = last ? dayDiff(last, todayKey) : null;
  const clear = clearDaysOf(answers).length;

  const parts: string[] = [];
  if (clear > 0) parts.push(`${clear} clear ${clear === 1 ? 'night' : 'nights'} counted`);
  if (daysSince !== null && !lapsedToday) {
    parts.push(
      daysSince === 1 ? 'the last one was yesterday' : `${daysSince} days since the last one`,
    );
  }
  const line =
    parts.length === 0
      ? lapsedToday
        ? 'One event. The count is still yours.'
        : 'Nothing counted yet. Tonight can be the first.'
      : `${parts.join(', ')}.`.replace(/^./, (c) => c.toUpperCase());

  return { clear, daysSince, lapsedToday, line };
}

/**
 * After a lapse, the next hour is the whole plan. The stand-in the person
 * chose, then bed at the usual time, and nothing restarting from zero. The
 * account given of a slip is what predicts the slide, so the app gives a
 * short one.
 */
export function nextHour(answers: Record<string, string>): string {
  const standIn = standInFor(answers);
  return `One event, not a verdict. The next hour: ${standIn.line} Then bed at the usual time. Nothing restarts from zero.`;
}

/* -------------------------------------------------------------------------
 * The pattern, in plain words and the clock the rest of the screen uses.
 * ---------------------------------------------------------------------- */

/**
 * The timing as a sentence. The pattern engine labels a window as
 * "21:15–22:15", which sat beside "8:30pm" on the same card in the
 * usability review. This says the same thing in the twelve-hour clock and
 * says what the app will do about it.
 */
export function timingLine(pattern: BehaviourPattern): string {
  if (pattern.readiness === 'learning') {
    return pattern.events === 0
      ? 'Log it when it happens. After four, the timing shows and the app moves ahead of it.'
      : `${pattern.events} logged. ${pattern.needed} more and the timing starts to show.`;
  }
  const w = pattern.window;
  if (!w || !pattern.intervention) {
    return `${pattern.events} logged, spread across the day rather than clustered.`;
  }
  const days = pattern.days.label;
  const when = `Usually lands between ${formatTime(toHHMM(w.startMin))} and ${formatTime(toHHMM(w.endMin))}${days ? `, mostly ${days}` : ''}.`;
  const then = `${formatTime(pattern.intervention.at)} is when IntentNorth puts something else in front of you${days ? ' on those days' : ''}.`;
  return `${when} ${then}`;
}

/* -------------------------------------------------------------------------
 * The card, as data.
 * ---------------------------------------------------------------------- */

export interface TonightModel {
  info: BehaviourInfo;
  plan: IfThenPlan;
  standIn: StandIn;
  tally: Tally;
  timing: string;
  /** Wins can be kept — the recovery coach is running for this behaviour. */
  counting: boolean;
  clearMarked: boolean;
  /** The next-hour line when tonight already had one; otherwise null. */
  afterLapse: string | null;
}

export function tonightModel(
  intention: BehaviourIntention,
  events: BehaviourEvent[],
  pattern: BehaviourPattern,
  answers: Record<string, string>,
  todayKey: string,
  counting: boolean,
): TonightModel {
  const t = tally(intention, events, answers, todayKey);
  return {
    info: behaviourInfo(intention.behaviour),
    plan: ifThenPlan(answers),
    standIn: standInFor(answers),
    tally: t,
    timing: timingLine(pattern),
    counting,
    clearMarked: clearDaysOf(answers).includes(todayKey),
    afterLapse: t.lapsedToday ? nextHour(answers) : null,
  };
}

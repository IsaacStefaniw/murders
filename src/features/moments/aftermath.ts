/**
 * The ten minutes after a slip.
 *
 * ── Why this module exists ──────────────────────────────────────────────
 *
 * Isaac, on his own week: "I have drank a few times this week and could
 * only log yesterday. I also feel like I needed more of an action plan —
 * this should trigger a screen overlay with a bit of a guide and tools,
 * tips, and action plan. Whenever it's logged."
 *
 * He is describing the single most consequential moment in a behaviour app
 * and the app was answering it with a caption. Logging a drink produced a
 * `Card` headed "Logged", a sentence from `momentNote`, and a close button.
 * Everything a person needs at that moment already existed in this
 * codebase — `hotWindow` knows when it happens, `ifThenPlan` composes an
 * implementation intention, `STAND_INS` holds a tested alternative for
 * every trigger, `effectsFor` holds the mechanism — and none of it was
 * assembled at the moment it was for. The parts were spread across the
 * Life tab as cards a person reads when they are calm, which is the one
 * state they are not in at 9pm having just had the third one.
 *
 * ── What the moment actually needs, and in what order ───────────────────
 *
 * The order here is the design, and it is taken from relapse-prevention
 * practice rather than from what is convenient to render.
 *
 * 1. STEADY. Marlatt's abstinence violation effect is the mechanism that
 *    turns one drink into five: having broken the rule, the rule is gone,
 *    so the night is written off. It is not a metaphor — it is the best
 *    documented reason a lapse becomes a relapse. The first thing on the
 *    screen has to be the sentence that interrupts it, and it has to come
 *    BEFORE the mechanism note, the pattern and the plan. An app that
 *    leads with "alcohol within three hours of sleep cuts REM" has just
 *    added evidence to the case for writing the night off.
 *
 *    The true, useful, non-preachy form of the counter is: the next one is
 *    a separate decision. Not "don't beat yourself up" — which is a thing
 *    to be told, not a thing to act on.
 *
 * 2. TRIGGER. One tap, asked while it is fresh. This is the field the
 *    pattern engine is starving for: `BehaviourEvent.trigger` has existed
 *    all along and the only place that asked for it was a chip row further
 *    down the Life tab, after the sheet had closed. Asked here it is
 *    answered; asked there it is not.
 *
 * 3. PLAN. An if-then for the situation that just happened, in the
 *    person's own named trigger. Implementation intentions are the single
 *    best-evidenced technique in this whole field (Gollwitzer and
 *    Sheeran's meta-analysis puts it near d = 0.65, on 8,000-odd people),
 *    and they work precisely when they are specific to a situation that
 *    has actually occurred. Five minutes after it occurred is the best
 *    moment this app will ever get to write one.
 *
 * 4. COST, and TOMORROW. Now the mechanism, because now it is information
 *    rather than ammunition. And then the honest statement of what changes
 *    about tomorrow, which is usually nothing — said plainly, because the
 *    fear that it has all been undone is the other half of the spiral.
 *
 * ── What it refuses ─────────────────────────────────────────────────────
 *
 * No score, no streak, no "days clean" reset, no comparison to a target,
 * and no consequence invented to make the moment land harder. It never
 * says the person has a problem: the app cannot know that, and the one
 * place it would do real damage is here. Where the logged pattern crosses
 * into territory the app has no business in, it says so and names a human.
 */

import { behaviourInfo, type BehaviourInfo } from '@/features/behaviours/catalog';
import {
  effectsFor,
  hoursBeforeSleep,
  momentNote,
  type BehaviourPattern,
  type MomentNote,
} from '@/features/behaviours/patterns';
import {
  REPLACEMENT_ACTIONS,
  STAND_INS,
  TRIGGER_CUES,
  TRIGGER_KEYS,
  type ReplacementKey,
  type TriggerKey,
} from '@/features/behaviours/tonight';
import { toDateKey, toMinutes } from '@/lib/dates';
import type { BehaviourEvent } from '@/types/domain';

/* ── The trigger vocabulary, which there is now one of ─────────────────── */

/**
 * The chips, in the order a person reaches for them.
 *
 * The app had two vocabularies for this. `tonight.ts` has seven keys with
 * cues written to slot into an if-then sentence; the Life tab had its own
 * seven capitalised strings ('Stress', 'Boredom', 'Social', 'After a
 * meal', 'Work', 'Habit', 'Other') stored as free text on the event. So a
 * trigger captured on the Life tab could never compose a plan, and the two
 * lists disagreed about what the triggers even were. This is the one list.
 */
export const TRIGGER_LABELS: Record<TriggerKey, string> = {
  stress: 'Under pressure',
  social: 'Other people',
  evening: 'The evening quiet',
  tired: 'Running on empty',
  boredom: 'Nothing to do',
  lowmood: 'A bad day',
  unsure: 'Not sure',
};

/** The chips in display order — 'unsure' last, and never the default. */
export const TRIGGER_ORDER: TriggerKey[] = [
  'stress',
  'social',
  'evening',
  'tired',
  'boredom',
  'lowmood',
  'unsure',
];

const isTriggerKey = (v: string | undefined): v is TriggerKey =>
  v !== undefined && (TRIGGER_KEYS as string[]).includes(v);

/**
 * A trigger stored before this module existed, read back as a key.
 *
 * Events logged under the old Life-tab vocabulary hold 'Stress' or 'After
 * a meal'. Dropping them would throw away the only trigger data the app
 * has ever collected, so the old labels map onto the new keys and anything
 * unrecognised reads as unsure rather than as nothing.
 */
const LEGACY: Record<string, TriggerKey> = {
  stress: 'stress',
  boredom: 'boredom',
  social: 'social',
  work: 'stress',
  habit: 'evening',
  'after a meal': 'evening',
  other: 'unsure',
};

export function triggerKeyOf(raw: string | undefined): TriggerKey | null {
  if (!raw) return null;
  const lower = raw.trim().toLowerCase();
  if (isTriggerKey(lower)) return lower;
  return LEGACY[lower] ?? null;
}

/* ── Step 1: steady ────────────────────────────────────────────────────── */

export interface Steady {
  /** The first line on the screen. Short enough to read in one glance. */
  line: string;
  /**
   * The sentence that does the work — the one that interrupts the "well,
   * the night is gone" reasoning. Absent only where there is nothing to
   * interrupt, which is a first-ever log.
   */
  because?: string;
}

/** Occurrences of this intention in the seven days ending today. */
export function countThisWeek(
  events: BehaviourEvent[],
  intentionId: string,
  now: Date,
): number {
  const from = new Date(now.getTime() - 6 * 86400e3);
  const fromKey = toDateKey(from);
  const toKey = toDateKey(now);
  return events.filter((e) => {
    if (e.intentionId !== intentionId) return false;
    const key = toDateKey(new Date(e.occurredAt));
    return key >= fromKey && key <= toKey;
  }).length;
}

/** Words through nine, then numerals. A tally in figures reads as a score. */
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const spelled = (n: number): string => WORDS[n] ?? String(n);

/**
 * The opener.
 *
 * Three states, and the middle one is the whole point of the module. A
 * person logging their second or third of the week is the person the
 * abstinence violation effect is about to act on, and the sentence they
 * need is that the count is a count and the next occasion is its own
 * decision. Said once, plainly, with no encouragement attached — praise
 * here reads as consolation and consolation confirms that something bad
 * has happened.
 */
export function steady(weekCount: number): Steady {
  if (weekCount <= 1) {
    return {
      line: 'Logged.',
      because: 'Noticing it while it is fresh is the part that makes the rest of this work.',
    };
  }
  if (weekCount === 2) {
    return {
      line: 'That is two this week.',
      because:
        'Two is two. It is not a week written off, and the next one is a separate decision from this one — that gap is where most of the difference is made.',
    };
  }
  return {
    line: `That is ${spelled(weekCount)} this week.`,
    because:
      'A number, not a verdict. The week is not spent, and the next one is a separate decision — which is the only part of this you actually get to make.',
  };
}

/* ── Step 3: the plan ──────────────────────────────────────────────────── */

export interface AftermathPlan {
  trigger: TriggerKey;
  cue: string;
  action: string;
  replacement: ReplacementKey;
  /** The whole sentence, which is the thing worth remembering. */
  text: string;
  /** Why this stand-in fits this trigger. */
  because: string;
  /** Where the app can run it itself. */
  route?: string;
  /** The other stand-ins for this trigger, so the plan is chosen not given. */
  alternatives: Alternative[];
}

export interface Alternative {
  key: ReplacementKey;
  /**
   * The chip's text — short on purpose.
   *
   * The first version took the first sentence of the stand-in's own line,
   * and "A drink made slowly, away from the desk" ran off the right of a
   * 390pt screen: a chip row wraps between chips, and cannot wrap one that
   * is wider than the phone. The action phrase is the shortest true form
   * of the same thing.
   */
  label: string;
  /** The full sentence, once it is the chosen one. */
  line: string;
}

/**
 * An implementation intention for the situation that just happened.
 *
 * `ifThenPlan` in tonight.ts composes the same sentence from a path's
 * stored intake answers. This one composes it from a trigger named thirty
 * seconds ago, which is a different and better input: the intake asks what
 * usually sets it off, and this asks what did.
 */
const sentenceCase = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export function planFor(trigger: TriggerKey, chosen?: ReplacementKey): AftermathPlan {
  const options = STAND_INS[trigger];
  const standIn = options.find((s) => s.key === chosen) ?? options[0];
  const cue = TRIGGER_CUES[trigger];
  const action = REPLACEMENT_ACTIONS[standIn.key];
  return {
    trigger,
    cue,
    action,
    replacement: standIn.key,
    text: `When ${cue}, I ${action}.`,
    because: standIn.line,
    route: standIn.route,
    alternatives: options
      .filter((s) => s.key !== standIn.key)
      .map((s) => ({
        key: s.key,
        label: sentenceCase(REPLACEMENT_ACTIONS[s.key]),
        line: s.line,
      })),
  };
}

/* ── The thing to do in the next ten minutes ───────────────────────────── */

export interface RightNow {
  line: string;
  label: string;
  route?: string;
}

/** Past this hour, "do something instead" is advice about going to bed. */
export const LATE_CUTOFF_MIN = 23 * 60 + 30;

/**
 * Offered only while the night can still go either way.
 *
 * A stand-in handed to somebody at midnight is the app failing to notice
 * what time it is. A stand-in handed to somebody at nine, on a night their
 * own logged window says is still open, is the only genuinely actionable
 * thing on the screen.
 */
export function rightNow(
  plan: AftermathPlan,
  nowMin: number,
  loggedToday: boolean,
): RightNow | null {
  if (!loggedToday) return null;
  if (nowMin >= LATE_CUTOFF_MIN) return null;
  return {
    line: plan.because,
    label: plan.route ? 'Do it now' : 'Noted — that is the one',
    route: plan.route,
  };
}

/* ── Step 4: what it costs, and what changes ───────────────────────────── */

export interface Cost {
  /** The mechanism, where one honestly applies to this moment. */
  note: MomentNote;
  /** Hours between the event and bedtime, where bedtime is known. */
  hoursBeforeSleep: number | null;
  /**
   * What happens to tomorrow.
   *
   * Almost always: nothing. Saying so is not filler — the belief that a
   * slip has undone the work is the other half of the spiral, and it is
   * the half an app is uniquely placed to answer, because it holds the
   * record and can simply state it.
   */
  tomorrow: string;
}

export function cost(
  event: BehaviourEvent,
  pattern: BehaviourPattern,
  sleepTime: string | null,
): Cost {
  const gap = hoursBeforeSleep(event.occurredAt, sleepTime);
  const note = momentNote(event, pattern, sleepTime);
  const applicable = effectsFor(pattern.info, gap);

  // Only where a mechanism genuinely reaches tomorrow. Everything else
  // gets the true answer, which is that the plan stands.
  const reaches = applicable.find((e) => e.withinHoursOfSleep !== undefined);
  const tomorrow = reaches
    ? 'Tomorrow stands as it is. If the hard session is in the morning, it is worth moving rather than dropping — a short night is a reason to change the shape, not the day.'
    : 'Nothing about tomorrow changes. The plan is the plan.';

  return { note, hoursBeforeSleep: gap, tomorrow };
}

/* ── The whole thing ───────────────────────────────────────────────────── */

export interface Aftermath {
  behaviour: BehaviourInfo;
  steady: Steady;
  /** Occurrences in the seven days ending today, this one included. */
  weekCount: number;
  /** The trigger already on the event, where one was captured. */
  knownTrigger: TriggerKey | null;
  cost: Cost;
  /**
   * The person's own window, said back to them, where four or more
   * occurrences have made one real. This is the thing they cannot see and
   * the app can, which is the entire reason it is worth logging.
   */
  window: string | null;
}

export function aftermath(input: {
  event: BehaviourEvent;
  pattern: BehaviourPattern;
  events: BehaviourEvent[];
  sleepTime: string | null;
  now: Date;
}): Aftermath {
  const { event, pattern, events, sleepTime, now } = input;
  const info = behaviourInfo(pattern.behaviour);
  // The event being logged is counted, whether or not it has reached the
  // store yet — the screen runs before and after the write depending on
  // the caller, and "that is two this week" must not depend on which.
  const already = events.some((e) => e.id === event.id);
  const weekCount =
    countThisWeek(events, event.intentionId, now) + (already ? 0 : 1);

  return {
    behaviour: info,
    steady: steady(weekCount),
    weekCount,
    knownTrigger: triggerKeyOf(event.trigger),
    cost: cost(event, pattern, sleepTime),
    window:
      pattern.readiness === 'ready' && pattern.window
        ? `${pattern.window.hits} of your last ${pattern.window.total} have been ${pattern.window.label}.`
        : null,
  };
}

/** True where the event happened on the date this is being read on. */
export function loggedToday(event: BehaviourEvent, now: Date): boolean {
  return toDateKey(new Date(event.occurredAt)) === toDateKey(now);
}

/** Minutes from midnight for "right now", so callers need not repeat it. */
export const minuteOf = (d: Date): number => d.getHours() * 60 + d.getMinutes();

/** Re-exported so screens take the one vocabulary from one place. */
export { TRIGGER_CUES, toMinutes };

/* ── Delivering the plan back, at the hour it is for ───────────────────── */

export interface PlanDelivery {
  /** The person's own sentence. Said back, not paraphrased. */
  text: string;
  /** The label on the one action, where the app can run the stand-in. */
  label: string;
  route?: string;
}

/**
 * The plan, ready to deliver ahead of the window.
 *
 * `dueInterventions` has always computed the right MOMENT — a time taken
 * from the person's own logged distribution, ahead of the window rather
 * than inside it, filtered to the weekdays the pattern actually lives on.
 * What arrived at that moment was generic: a Today card reading "Line up
 * something else" and a push saying the behaviour "usually lands about
 * now". Both ignored the if-then the person had written after the last
 * slip, which is the one sentence that has any chance of working, because
 * an implementation intention works by being recalled in the situation it
 * names — and this is that situation, arriving on time.
 *
 * Null where no plan has been written yet. The generic line is the right
 * fallback then; it is only wrong once there is something better to say.
 */
export function planDelivery(
  plan: BehaviourIntentionPlan | undefined,
): PlanDelivery | null {
  if (!plan) return null;
  const trigger = triggerKeyOf(plan.trigger);
  if (!trigger) return null;
  const standIn = STAND_INS[trigger].find((s) => s.key === plan.replacement);
  return {
    text: plan.text,
    label: standIn?.route ? 'Do it now' : 'Noted',
    route: standIn?.route,
  };
}

/** The stored shape, kept in domain.ts so leaf types stay leaf-level. */
type BehaviourIntentionPlan = NonNullable<
  import('@/types/domain').BehaviourIntention['plan']
>;

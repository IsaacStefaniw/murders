/**
 * A coach with something to say, and one thing to ask.
 *
 * ── Why this is a screen and not a notification ─────────────────────────
 *
 * The sketch's strongest idea: "allow them to interrupt the user at points
 * with a different screen to ask questions and actually coach them." The
 * distinction matters. A card on Today is something you scroll past; a
 * notification is something you dismiss. An interruption arrives, says one
 * thing, asks one thing, takes the answer, and leaves. That is what a
 * person with expertise does when they notice something, and it is the
 * only shape in which the app gets to be a coach rather than a dashboard.
 *
 * ── The rules, and why each one is load-bearing ─────────────────────────
 *
 * **One at a time. Ever.** A coach that interrupts twice in a day is a
 * notification with a face on it. `nextInterrupt` returns at most one, and
 * once it has been shown it is recorded and never shown again.
 *
 * **Two answers, never three.** A third option is the app hedging, and a
 * person being interrupted has about four seconds of goodwill.
 *
 * **It always says why it fired.** Every interruption carries `because`,
 * in the person's own numbers. An app that asks without saying why is a
 * survey.
 *
 * **Adding is gated; fixing is not.** `commitmentBudget` already decides
 * how much new is reasonable this week, and `mayOffer` is the gate. But
 * only interruptions that ADD something go through it — a strained week is
 * exactly when moving a dead Tuesday matters most, and refusing to offer
 * the fix because the week is hard would be the gate working backwards.
 *
 * ── What is deliberately not here yet ───────────────────────────────────
 *
 * Nutrition ("the fibre protocol you added a week ago — how is it going?")
 * needs a routine to know when it was added, and `Routine` has no
 * `createdAt`. Money ("is your offset actually linked?") needs the money
 * path to record whether the step was ever confirmed. Both are real
 * triggers and both need a field that does not exist; inventing a
 * plausible-looking one that fires on nothing would be worse than four
 * triggers that work.
 */

import { mayOffer, type CommitmentBudget } from '@/features/budget/commitment';
import {
  isBalance,
  justification,
  listedProtocols,
  protocolById,
  type EvidenceLevel,
  type Pillar,
  type Protocol,
} from '@/features/knowledge/protocols';
import type { MetricObservation } from '@/features/model/metrics';
import { deadSlots, hourLabel, overWeeks } from '@/features/review/weekReview';
import { latenessMessage } from '@/features/coaches/reach';
import { voiceFor } from '@/features/coaches/voices';
import { PATH_AREA, type PathId } from '@/features/paths/definitions';
import type { WeeklyChange } from '@/features/review/weeklyChanges';
import { isReviewable } from '@/features/review/dayReview';
import {
  addDays,
  durationMinutes,
  formatTime,
  toHHMM,
  toMinutes,
  weekStartOf,
  weekdayOf,
  WEEKDAY_NAMES,
} from '@/lib/dates';
import type { DailyPlan, LifeArea, LifeProfile, PlanItem, Routine } from '@/types/domain';

/** What answering does. The screen switches on `kind`; nothing else does. */
export type InterruptEffect =
  | { kind: 'none' }
  | { kind: 'changes'; changes: WeeklyChange[] }
  | { kind: 'intensity'; pathId: PathId; push: boolean }
  | { kind: 'moveItem'; date: string; itemId: string; start: string }
  | { kind: 'moveItemToDate'; date: string; itemId: string; targetDate: string }
  | { kind: 'protocol'; protocolId: string }
  /**
   * One thing, on one day. The only effect that puts something NEW in the
   * week rather than moving or starting what is already there.
   */
  | {
      kind: 'addItem';
      date: string;
      title: string;
      area: LifeArea;
      start: string;
      durationMin: number;
    };

export interface InterruptAnswer {
  id: string;
  label: string;
  effect: InterruptEffect;
  /**
   * A sentence the person can send to somebody else, after answering.
   *
   * "Shall I say 20 late?" is the half of the family coach's product that
   * turns a reminder into help — and the app composes it rather than
   * sending it, so the OS share sheet does the sending and nothing about
   * the evening reaches a server. See features/coaches/reach.ts.
   */
  message?: string;
}

export interface CoachInterrupt {
  /** Stable for the occasion, so it is shown once and never again. */
  id: string;
  pathId: PathId;
  /** What the coach says, in its own voice. Rendered large, so kept short. */
  says: string;
  /**
   * A sentence under it, at reading size.
   *
   * A suggestion carries the practice's own summary, and at title size a
   * two-clause summary ran to six lines of 32pt and swallowed the screen.
   * What the coach SAYS is short; what the practice IS goes here.
   */
  detail?: string;
  /** The one question. */
  asks: string;
  /** Exactly two. */
  answers: [InterruptAnswer, InterruptAnswer];
  /** Why it fired, in the person's own numbers. Always shown. */
  because: string;
  /** The practice's own caution, where it has one. Never hidden behind a tap. */
  caveat?: string;
  /** True where saying yes means one more thing to do. Gated by mayOffer. */
  adds: boolean;
  /** Lower sorts first. Today beats this week beats whenever. */
  urgency: number;
}

/* ── Which coach owns what ────────────────────────────────────────────── */

/**
 * The coach for a part of life.
 *
 * Three paths share `health`; training is the one that speaks for it,
 * because every trigger that fires on a health routine is about when and
 * how hard, which is Ren's subject.
 */
/**
 * Areas no pathway covers, and who speaks for them anyway.
 *
 * `PATH_AREA` maps five of the seven life areas. `growth` and `enjoyment`
 * have no pathway at all, so `coachForArea` fell through to its `training`
 * default for both — and the browser said so out loud: "REN · STRENGTH
 * AND CONDITIONING" above a question about seeing a friend.
 *
 * `enjoyment` is the friendship practices, and the app had already decided
 * who owns those elsewhere: `nextRung.laddersFor('relationship')` hands
 * back `[COUPLE_LADDER, FRIENDSHIP_LADDER]`, or the friendship one alone
 * for somebody solo. This makes the two agree.
 *
 * `growth` is left alone on purpose. There is no coach with a claim on it
 * that I can point at in the code the way I can for friendship, and
 * guessing would be the same mistake in a new place.
 */
const AREA_COACH: Partial<Record<LifeArea, PathId>> = {
  enjoyment: 'relationship',
};

export function coachForArea(area: LifeArea): PathId {
  const exact = (Object.keys(PATH_AREA) as PathId[]).find(
    (id) => PATH_AREA[id] === area && id !== 'recovery' && id !== 'nutrition',
  );
  return exact ?? AREA_COACH[area] ?? 'training';
}

/**
 * Which coach owns a practice — by what it is about, not by which area it
 * sits in.
 *
 * ── Two coaches that could not speak ────────────────────────────────────
 *
 * `PATH_AREA` maps three coaches onto the same life area: training,
 * nutrition and recovery are all `health`. `coachForArea` resolves that
 * collision by excluding two of them and returning `training`, which is
 * correct for its own job — a life area has to pick one coach — and wrong
 * as the thing that decides who offers a practice.
 *
 * The result, audited across the library: of seven coaches, **nutrition
 * could never say anything at all**. Every one of the 130 offerable health
 * practices, including all the food ones, was offered in the training
 * coach's voice, and there is no nutrition-specific trigger to make up for
 * it. Recovery had exactly one way in — the short-nights interrupt — and
 * every sleep practice in the library was likewise attributed to training.
 * Money and work can still only ever offer a practice, which is a separate
 * and larger gap.
 *
 * A protocol already carries what it is about: `pillar`. That is the thing
 * to route on, with the area as the fallback for everything a pillar does
 * not settle. So Mara offers the food practices, Sol offers the sleep
 * ones, and the training coach stops being the voice of things it has
 * nothing to do with.
 */
const PILLAR_COACH: Partial<Record<Pillar, PathId>> = {
  nutrition: 'nutrition',
  sleep: 'recovery',
  training: 'training',
  longevity: 'training',
  wealth: 'money',
  leadership: 'work',
  /**
   * `connection` is deliberately NOT here.
   *
   * It was, for one test run, mapped to `relationship` — and the suite
   * caught it starving the family coach, because the family practices are
   * pillar `connection` with area `family` and a pillar mapping overrides
   * the area. The pillar settles who speaks only where the area cannot,
   * and for connection the area is exactly the right discriminator: the
   * partner practices are `relationship`, the family ones are `family`.
   *
   * The hole was the third value, `enjoyment`, which no pathway covers.
   * See `AREA_COACH` below.
   */
};

export function coachForProtocol(p: Protocol): PathId {
  return PILLAR_COACH[p.pillar] ?? coachForArea(p.area);
}

/* ── Triggers ─────────────────────────────────────────────────────────── */

/** Three nights under this in a week is the week saying something. */
export const SHORT_NIGHT_HOURS = 6;
export const SHORT_NIGHTS_TRIGGER = 3;

/** Held this many times running before more load is even offered. */
export const HELD_IN_A_ROW = 3;

/** How close to a family block the coach speaks up. */
export const FAMILY_WINDOW_MIN = 90;
export const FAMILY_FLOOR_MIN = 10;

/** How late the coach offers to say you will be. */
export const FAMILY_LATE_MIN = 20;

export interface InterruptInput {
  routines: Routine[];
  plans: Record<string, DailyPlan>;
  metrics: MetricObservation[];
  profile: LifeProfile | null;
  budget: CommitmentBudget;
  today: string;
  /** Minutes since midnight. Separate from `today` so tests can stand anywhere. */
  nowMinutes: number;
  /**
   * Interruptions already shown, with when. Each one happens once, and the
   * dates are what keeps suggestions from becoming a daily feed.
   */
  seen: readonly { id: string; at: string }[];
}

const dayItems = (plans: Record<string, DailyPlan>, date: string): PlanItem[] =>
  (plans[date]?.items ?? []).filter(isReviewable);

/**
 * A slot that has died more than once.
 *
 * The same evidence the week review uses, said by a person instead of
 * printed in a list — "Tuesday at 6am isn't working" arriving from Ren on
 * the day it matters is a different thing from a bullet in a review
 * screen nobody opened.
 */
function slotInterrupt(input: InterruptInput): CoachInterrupt | null {
  const slots = deadSlots(input.plans, weekStartOf(input.today), input.routines, input.today);
  const slot = slots[0];
  if (!slot) return null;
  const pathId = coachForArea(slot.routine.area);
  const v = voiceFor(pathId);
  const width = Math.max(60, toMinutes(slot.routine.preferredEnd) - toMinutes(slot.routine.preferredStart));
  const to = (slot.hour + 1) * 60;
  return {
    id: `slot:${slot.routine.id}:${slot.col}:${slot.hour}`,
    pathId,
    // Names the window, for the same reason the week review does: a count
    // somebody cannot place against a span of time is a number they have
    // to take on trust, and this app does not ask for that anywhere else.
    says: `${hourLabel(slot.hour)} isn't working for ${slot.routine.title.toLowerCase()}. That is ${overWeeks(slot.seen)}.`,
    asks: `Move it an hour later, or leave it where it is?`,
    because: `${v.name} watches when things happen, not just whether they do.`,
    adds: false,
    urgency: 2,
    answers: [
      {
        id: 'move',
        label: `Move to ${hourLabel(slot.hour + 1)}`,
        effect: {
          kind: 'changes',
          changes: [
            {
              id: `move-${slot.routine.id}-${to}`,
              kind: 'move_routine',
              routineId: slot.routine.id,
              payload: { preferredStart: toHHMM(to), preferredEnd: toHHMM(to + width) },
              description: `Move ${slot.routine.title.toLowerCase()} an hour later.`,
            },
          ],
        },
      },
      { id: 'leave', label: 'Leave it', effect: { kind: 'none' } },
    ],
  };
}

/** The routine held three times running, and the offer that earns. */
function loadInterrupt(input: InterruptInput): CoachInterrupt | null {
  for (const r of input.routines) {
    if (!r.active || r.area !== 'health' || !r.sessionType) continue;
    const seen: PlanItem[] = [];
    for (let i = 1; i <= 28 && seen.length < HELD_IN_A_ROW; i++) {
      const own = dayItems(input.plans, addDays(input.today, -i)).filter(
        (x) => x.routineId === r.id,
      );
      seen.push(...own);
    }
    if (seen.length < HELD_IN_A_ROW) continue;
    if (!seen.slice(0, HELD_IN_A_ROW).every((x) => x.status === 'completed')) continue;
    const v = voiceFor('training');
    return {
      id: `load:${r.id}:${input.today}`,
      pathId: 'training',
      says: `Three of ${r.title.toLowerCase()} in a row, all finished.`,
      asks: 'Ready for more, or hold here a while?',
      because: `${v.name} adds load off what you kept, never off the calendar.`,
      adds: true,
      urgency: 3,
      answers: [
        {
          id: 'more',
          label: 'Add a little',
          effect: { kind: 'intensity', pathId: 'training', push: true },
        },
        { id: 'hold', label: 'Hold here', effect: { kind: 'none' } },
      ],
    };
  }
  return null;
}

/** Three short nights, and today's hardest thing offered to tomorrow. */
function sleepInterrupt(input: InterruptInput): CoachInterrupt | null {
  const from = addDays(input.today, -7);
  const short = input.metrics.filter(
    (m) =>
      m.key === 'sleep.hours' &&
      m.at.slice(0, 10) >= from &&
      m.at.slice(0, 10) <= input.today &&
      m.value < SHORT_NIGHT_HOURS,
  ).length;
  if (short < SHORT_NIGHTS_TRIGGER) return null;

  const hardest = dayItems(input.plans, input.today)
    .filter((i) => i.status === 'planned')
    .sort((a, b) => durationMinutes(b.start, b.end) - durationMinutes(a.start, a.end))[0];
  if (!hardest) return null;

  const v = voiceFor('recovery');
  return {
    id: `sleep:${input.today}`,
    pathId: 'recovery',
    says: `${short} short nights this week. ${hardest.title} is on for today.`,
    asks: 'Today, or push it to tomorrow?',
    because: `${v.name} would rather move one session than watch a fortnight go.`,
    adds: false,
    urgency: 1,
    answers: [
      { id: 'today', label: 'Today, as planned', effect: { kind: 'none' } },
      {
        id: 'tomorrow',
        label: 'Tomorrow',
        effect: {
          kind: 'moveItemToDate',
          date: input.today,
          itemId: hardest.id,
          targetDate: addDays(input.today, 1),
        },
      },
    ],
  };
}

/** The evening that work is about to eat. */
function familyInterrupt(input: InterruptInput): CoachInterrupt | null {
  const next = dayItems(input.plans, input.today)
    .filter((i) => i.area === 'family' || i.area === 'relationship')
    .filter((i) => i.status === 'planned')
    .map((i) => ({ item: i, inMin: toMinutes(i.start) - input.nowMinutes }))
    .filter((x) => x.inMin >= FAMILY_FLOOR_MIN && x.inMin <= FAMILY_WINDOW_MIN)
    .sort((a, b) => a.inMin - b.inMin)[0];
  if (!next) return null;

  const pathId = coachForArea(next.item.area);
  const v = voiceFor(pathId);
  const later = toMinutes(next.item.start) + FAMILY_LATE_MIN;
  return {
    id: `family:${next.item.id}`,
    pathId,
    says: `${next.item.title} in ${next.inMin} minutes.`,
    asks: `Making it, or shall I move it to ${formatTime(toHHMM(later))}?`,
    because: `${v.name} asks now rather than asking tomorrow how it went.`,
    adds: false,
    urgency: 0,
    answers: [
      { id: 'making-it', label: 'Making it', effect: { kind: 'none' } },
      {
        id: 'late',
        label: `${FAMILY_LATE_MIN} minutes later`,
        effect: {
          kind: 'moveItem',
          date: input.today,
          itemId: next.item.id,
          start: toHHMM(later),
        },
        message: latenessMessage(next.item, FAMILY_LATE_MIN),
      },
    ],
  };
}

/* ── Protocol suggestions ─────────────────────────────────────────────── */

/**
 * The grades an unprompted suggestion is allowed to carry.
 *
 * An unprompted suggestion is a different act from a shelf somebody chose
 * to browse. A person who goes looking can read a D — "what experienced
 * people do, ahead of the research" — and decide for themselves; a person
 * being interrupted is being told this is worth their Tuesday. D and E
 * stay in the library and out of interruptions.
 *
 * ── Why C is in, and what that cost is admitting ────────────────────────
 *
 * This started at A and B, which is the defensible line, and then the
 * library was counted:
 *
 *     health 79 practices, 38 at A or B
 *     growth 33, 16 at A or B
 *     admin  13,  6
 *     work   21,  5
 *     enjoyment 6, 1
 *     family  9,  1
 *     relationship 5, 0
 *
 * A family-first person would have been offered `child-bedtime-routine`
 * once and then nothing, ever. Somebody whose week is about their
 * relationship would have been offered nothing at all — the coach with the
 * thinnest library would have been the coach that never spoke.
 *
 * That is not a reason to lower the bar quietly. It is a reason to lower
 * it to C, which the library already describes as "some evidence, not
 * settled", and to say the grade out loud in the interruption, which the
 * `because` line does.
 *
 * ── And the diagnosis that followed was wrong ───────────────────────────
 *
 * I read the gap as "the family and relationship shelves need more graded
 * practices". Isaac's correction: "Effective science is only a barometer.
 * There are things that are not plausible to study but constitute a well
 * balanced life." Those shelves do not need better grades. A weekly hour
 * with your partner is not a D-grade finding awaiting a trial, and the
 * grade was never going to improve, because there is nothing there to
 * improve — it is not that kind of claim.
 *
 * So eligibility is no longer a grade test alone. A practice may be
 * offered because the research is decent, OR because it is part of a
 * balanced life and says so. See ProtocolBasis. The interruption prints
 * whichever reason applies, through `justification`, so the person always
 * knows which of the two they are being told.
 */
export const SUGGESTION_GRADES: EvidenceLevel[] = ['A', 'B', 'C'];

/** Offerable: well enough evidenced, or honestly not an evidence claim. */
export const maySuggest = (p: Protocol): boolean =>
  isBalance(p) || SUGGESTION_GRADES.includes(p.evidenceLevel);

/** Days between suggestions. A coach that suggests daily is a feed. */
export const SUGGESTION_GAP_DAYS = 14;

/** The order a practice is worth offering in. Lower sorts first. */
function suggestionRank(p: Protocol, priorities: readonly string[]): number[] {
  const priority = priorities.indexOf(p.area);
  return [
    priority === -1 ? 99 : priority,
    // Balance practices rank with the best-evidenced ones rather than
    // below the worst. Sorting them by a letter they do not claim is the
    // same mistake as printing it.
    isBalance(p) ? 0 : SUGGESTION_GRADES.indexOf(p.evidenceLevel),
    // A smaller thing that happens beats a bigger one that does not — the
    // same rule the weekly pruner shrinks by.
    p.durationMin,
  ];
}

/**
 * A practice, offered by the coach whose area owns it.
 *
 * Point 4 of Isaac's five: the library has around two hundred graded
 * protocols and the app essentially never offers one — you browse them or
 * you do not get them. A suggestion is an interruption with a particular
 * shape: here is a practice, here is what it is for, here is the grade and
 * the caution, one tap to put it in the week and one tap to be done with
 * it.
 *
 * It is the lowest-urgency trigger on purpose. It is what a coach says
 * when nothing is wrong, and anything that IS wrong outranks it.
 *
 * Shown once each, ever. The id is the protocol's, so a practice that has
 * been offered is never offered again — which also means "not for me" and
 * backing out cost the same thing. With two hundred practices that is the
 * right trade: the alternative is an app that asks again, and asking again
 * is the whole of nagging.
 */
function suggestionInterrupt(input: InterruptInput): CoachInterrupt | null {
  const { profile } = input;
  if (!profile) return null;

  // Nothing is offered to somebody with nothing running. A person whose
  // week is empty does not need a two-hundred-item library pointed at
  // them; they need their plan, and every other trigger here exists to
  // help them get it. Suggestions are for a week that is already working.
  if (!input.routines.some((r) => r.active)) return null;

  const recent = input.seen.filter(
    (s) =>
      s.id.startsWith('suggest:') &&
      (daysSince(s.at, input.today) ?? SUGGESTION_GAP_DAYS + 1) < SUGGESTION_GAP_DAYS,
  );
  if (recent.length > 0) return null;

  const have = new Set(
    input.routines.filter((r) => r.protocolId).map((r) => r.protocolId as string),
  );
  const offered = new Set(input.seen.map((s) => s.id));
  const priorities = profile.priorities ?? [];

  const candidate = listedProtocols(profile.sexAtBirth)
    .filter((p) => !have.has(p.id))
    .filter((p) => !offered.has(`suggest:${p.id}`))
    .filter(maySuggest)
    // Only areas the person said matter. A practice from a part of life
    // they did not rank is the app deciding what their week is for.
    .filter((p) => priorities.includes(p.area))
    .sort((a, b) => {
      const ra = suggestionRank(a, priorities);
      const rb = suggestionRank(b, priorities);
      for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] - rb[i];
      return a.id.localeCompare(b.id);
    })[0];
  if (!candidate) return null;

  const pathId = coachForProtocol(candidate);
  const v = voiceFor(pathId);
  return {
    id: `suggest:${candidate.id}`,
    pathId,
    says: candidate.title,
    detail: candidate.summary,
    asks: `${candidate.durationMin} minutes. Want it in your week?`,
    because: `${v.name} suggests this: ${
      isBalance(candidate) ? candidate.balance : candidate.why
    } ${justification(candidate)}`,
    caveat: candidate.safety,
    adds: true,
    urgency: 4,
    answers: [
      {
        id: 'add',
        label: 'Put it in',
        effect: { kind: 'protocol', protocolId: candidate.id },
      },
      { id: 'not-for-me', label: 'Not for me', effect: { kind: 'none' } },
    ],
  };
}

/** Whole days between an ISO timestamp and a date key. */
function daysSince(iso: string, today: string): number | null {
  const then = Date.parse(iso);
  const now = Date.parse(`${today}T00:00:00.000Z`);
  if (!Number.isFinite(then) || !Number.isFinite(now)) return null;
  return Math.floor((now - then) / 86400000);
}

/* ── Following through on a message that was sent ─────────────────────── */

/** Where the follow-through lands, and how long it is given. */
const SOCIAL_START = '19:00';
const SOCIAL_MIN = 120;
/** How long after the message the offer still makes sense. */
const REACH_OUT_WINDOW_DAYS = 4;

/**
 * The practice that asks for a message, and promises the plan.
 *
 * Named rather than matched on title, because the title is copy and this
 * is a behaviour.
 */
const REACH_OUT_PROTOCOL = 'friend-reach-out';

/** Items that are somebody else being seen, rather than contacted. */
const isSocialPlan = (item: PlanItem): boolean =>
  item.area === 'enjoyment' || item.area === 'relationship';

/**
 * "You sent the message. Nothing went in the diary."
 *
 * ── The half of the practice the product never delivered ────────────────
 *
 * `friend-reach-out` grades at C and its own summary is "one message a
 * week that TURNS INTO A CONCRETE PLAN with someone you like". Its
 * rationale is blunter: strong relationships "run on logistics, not
 * sentiment".
 *
 * Measured on the seeded six-week account: Alex asked for more of "Seeing
 * friends" and got "Message a friend, make a plan" seven times in
 * forty-five days, and not one scheduled meeting. The most social thing in
 * the week of the persona whose defining trait is being social was a
 * reminder to text somebody. The protocol was right and the product
 * stopped half-way: it scheduled the intention to plan and then never
 * scheduled the plan.
 *
 * PERSONA.md §1 is why this matters more than it looks: "Plans with other
 * people in them survive a bad week. Plans with only themselves in them do
 * not." A Saturday with somebody expecting you is the most robust thing
 * this app can put in a week, and it was putting none in.
 *
 * ── Why this is not nagging, which the practice forbids ─────────────────
 *
 * The protocol carries `neverNag: true` and says "a week without one is
 * not a lapse". So this fires on a reach-out that was COMPLETED, never on
 * one that was missed. It is the opposite of a chase: the person did the
 * hard half and the app is offering to hold the easy half. It also stays
 * silent when the week already has something social in it, because then
 * there is nothing to follow through on.
 */
function reachOutInterrupt(input: InterruptInput): CoachInterrupt | null {
  const { plans, routines, today } = input;

  const reachOutIds = new Set(
    routines.filter((r) => r.protocolId === REACH_OUT_PROTOCOL).map((r) => r.id),
  );
  if (reachOutIds.size === 0) return null;

  // The most recent message actually sent, inside the window.
  let sent: { date: string; item: PlanItem } | null = null;
  for (let back = 0; back < REACH_OUT_WINDOW_DAYS; back += 1) {
    const date = addDays(today, -back);
    const item = (plans[date]?.items ?? []).find(
      (i) =>
        i.status === 'completed' &&
        (i.routineId ? reachOutIds.has(i.routineId) : false),
    );
    if (item) {
      sent = { date, item };
      break;
    }
  }
  if (!sent) return null;

  // Already something social in the week ahead, so the plan exists and
  // this has nothing to add.
  const ahead = Array.from({ length: 8 }, (_, i) => addDays(today, i));
  const already = ahead.some((date) =>
    (plans[date]?.items ?? []).some(
      (i) => isSocialPlan(i) && i.status !== 'skipped' && !reachOutIds.has(i.routineId ?? ''),
    ),
  );
  if (already) return null;

  // The next Saturday, which is the evening most likely to be free and
  // the one this persona's own week leaves open — Friday is already date
  // night. Never today: a plan for somebody else needs more notice than
  // the hours left in an evening.
  const target = ahead.slice(1).find((date) => weekdayOf(date) === 6);
  if (!target) return null;

  // On the PRACTICE, not the area: `coachForArea('enjoyment')` has no
  // pathway to find and falls through to training, which is how Ren came
  // to be asking about somebody's friends.
  const reachOut = protocolById(REACH_OUT_PROTOCOL);
  const pathId = reachOut ? coachForProtocol(reachOut) : 'relationship';
  const v = voiceFor(pathId);
  const when = WEEKDAY_NAMES[weekdayOf(target)];

  return {
    id: `reach-out:${sent.item.id}`,
    pathId,
    says: 'You sent the message. Nothing went in the diary.',
    detail:
      'The practice is one message a week that turns into a concrete plan. The message is the half most people find hard, and you did it.',
    asks: `Hold ${when} evening for it?`,
    because: `${v.name} schedules the people, not the reminder. Friendships run on logistics.`,
    adds: true,
    // Lower than a suggestion, higher than nothing: it is this week's
    // business rather than today's, and it expires with the weekend.
    urgency: 3,
    answers: [
      {
        id: 'hold-it',
        label: `${when}, ${formatTime(SOCIAL_START)}`,
        effect: {
          kind: 'addItem',
          date: target,
          title: 'Seeing a friend',
          area: 'enjoyment',
          start: SOCIAL_START,
          durationMin: SOCIAL_MIN,
        },
      },
      { id: 'not-yet', label: 'Not yet', effect: { kind: 'none' } },
    ],
  };
}

/* ── Arbitration ──────────────────────────────────────────────────────── */

const TRIGGERS = [
  familyInterrupt,
  sleepInterrupt,
  slotInterrupt,
  loadInterrupt,
  reachOutInterrupt,
  suggestionInterrupt,
];

/**
 * Everything a coach could say right now, most urgent first.
 *
 * Exported so the interrupt screen can resolve the one it was opened with,
 * rather than recomputing "the next one" and finding that showing it has
 * already taken it off the list.
 */
export function coachInterrupts(input: InterruptInput): CoachInterrupt[] {
  if (!input.profile) return [];
  const all = TRIGGERS.map((t) => t(input)).filter((x): x is CoachInterrupt => x !== null);
  return all.sort((a, b) => a.urgency - b.urgency);
}

/**
 * The one interruption to show, or nothing.
 *
 * Nothing is the common answer and that is correct. A coach that always
 * has something to say is a coach nobody believes.
 */
export function nextInterrupt(input: InterruptInput): CoachInterrupt | null {
  const seen = new Set(input.seen.map((s) => s.id));
  const offer = mayOffer(input.budget);
  return (
    coachInterrupts(input).find((i) => !seen.has(i.id) && (offer || !i.adds)) ?? null
  );
}

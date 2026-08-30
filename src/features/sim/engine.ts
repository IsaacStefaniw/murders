/**
 * Cohort simulator — runs synthetic users through the REAL product code:
 * generateDailyPlan, the adaptation detectors (with the store's evidence
 * hierarchy), applyMoveRoutine/applyProtectTime, buildWeeklyChanges, and
 * the anticipation gap. Nothing is mocked; the only synthetic part is the
 * human (personas.ts).
 */

import { detectAnticipationGap } from '@/features/anticipation/lookAhead';
import { generateDailyPlan } from '@/features/planner/generate';
import { buildWeeklyChanges } from '@/features/review/weeklyChanges';
import {
  applyMoveRoutine,
  applyProtectTime,
  detectMissedTwice,
  detectMoveOutcome,
  detectMovePattern,
  detectSlotMismatch,
  type ManualMove,
} from '@/lib/scheduling/adaptation';
import { addDays, toHHMM, toMinutes } from '@/lib/dates';
import type { DailyPlan, LifeArea, PlanItem, Routine, Suggestion } from '@/types/domain';
import type { GroundTruth, SimUser, Slot } from './personas';

const SLOT_STARTS: Record<Slot, string> = { morning: '06:45', midday: '12:15', evening: '17:45' };
const HISTORY_DAYS = 21;

function slotOfStart(start: string): Slot {
  const m = toMinutes(start);
  if (m < 11 * 60) return 'morning';
  if (m < 16 * 60) return 'midday';
  return 'evening';
}

function affinityFor(truth: GroundTruth, area: LifeArea, slot: Slot): number {
  return truth.affinity[area]?.[slot] ?? truth.baseAffinity[slot];
}

export interface WeekMetrics {
  planned: number;
  completed: number;
  byArea: Partial<Record<LifeArea, { planned: number; completed: number }>>;
  userMoves: number;
  suggestionsShown: Partial<Record<Suggestion['kind'], number>>;
  suggestionsAccepted: Partial<Record<Suggestion['kind'], number>>;
  /** Flexible minutes scheduled in the user's true best slot for that area. */
  alignedMinutes: number;
  flexMinutes: number;
  unplaced: number;
  hasRelationshipMoment: boolean;
  hasFamilyMoment: boolean;
  weeklyChangesApplied: number;
  routinesDeactivated: number;
}

export interface UserResult {
  persona: string;
  weeks: WeekMetrics[];
  firstMoveOutcomeAcceptWeek: number | null;
  firstAnyAdaptationWeek: number | null;
  overlapViolations: number;
  errors: number;
}

function emptyWeek(): WeekMetrics {
  return {
    planned: 0,
    completed: 0,
    byArea: {},
    userMoves: 0,
    suggestionsShown: {},
    suggestionsAccepted: {},
    alignedMinutes: 0,
    flexMinutes: 0,
    unplaced: 0,
    hasRelationshipMoment: false,
    hasFamilyMoment: false,
    weeklyChangesApplied: 0,
    routinesDeactivated: 0,
  };
}

export function runUser(user: SimUser, days: number, startDate = '2026-01-05'): UserResult {
  const { truth, rng } = user;
  let routines: Routine[] = user.plan.routines.map((r) => ({ ...r }));
  const profile = user.plan.profile;

  const plans: Record<string, DailyPlan> = {};
  const moves: ManualMove[] = [];
  const seenSuggestionKeys = new Set<string>();
  const weeks: WeekMetrics[] = [];
  let week = emptyWeek();
  let firstMoveOutcomeAcceptWeek: number | null = null;
  let firstAnyAdaptationWeek: number | null = null;
  let overlapViolations = 0;
  let errors = 0;
  let lastConnectionDay = -14;

  for (let d = 0; d < days; d++) {
    const date = addDays(startDate, d);
    const weekIndex = Math.floor(d / 7);

    let plan: (DailyPlan & { unplaced: Routine[] }) | null = null;
    try {
      plan = generateDailyPlan(profile, routines, date);
    } catch {
      errors += 1;
      continue;
    }
    week.unplaced += plan.unplaced.length;

    // Engine invariant: non-skipped flexible items never overlap.
    const sorted = [...plan.items].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    for (let i = 1; i < sorted.length; i++) {
      if (toMinutes(sorted[i].start) < toMinutes(sorted[i - 1].end)) overlapViolations += 1;
    }

    // The synthetic human lives the day.
    plan.items = plan.items.map((item): PlanItem => {
      if (item.fixed) return item;
      const area = item.area;
      const currentSlot = slotOfStart(item.start);
      let start = item.start;
      let end = item.end;
      let slot = currentSlot;

      // If another slot fits their real life much better, sometimes they move it.
      const bestSlot = (['morning', 'midday', 'evening'] as Slot[]).reduce((a, b) =>
        affinityFor(truth, area, a) >= affinityFor(truth, area, b) ? a : b,
      );
      if (
        item.routineId &&
        bestSlot !== currentSlot &&
        affinityFor(truth, area, bestSlot) - affinityFor(truth, area, currentSlot) > 0.2 &&
        rng() < truth.moveTendency
      ) {
        const duration = toMinutes(end) - toMinutes(start);
        start = SLOT_STARTS[bestSlot];
        end = toHHMM(toMinutes(start) + duration);
        slot = bestSlot;
        moves.push({ routineId: item.routineId, start, date });
        week.userMoves += 1;
      }

      const p = affinityFor(truth, area, slot) * truth.adherence;
      const completed = rng() < p;

      const duration = toMinutes(end) - toMinutes(start);
      week.flexMinutes += duration;
      if (slot === bestSlot) week.alignedMinutes += duration;
      week.planned += 1;
      const areaAcc = (week.byArea[area] ??= { planned: 0, completed: 0 });
      areaAcc.planned += 1;
      if (completed) {
        week.completed += 1;
        areaAcc.completed += 1;
      }
      if (area === 'relationship') week.hasRelationshipMoment ||= true;
      if (area === 'family' && item.title !== 'Family dinner') week.hasFamilyMoment ||= true;

      return { ...item, start, end, status: completed ? 'completed' : 'skipped' };
    });

    plans[date] = plan;
    // Keep detector input windowed like the store does.
    delete plans[addDays(date, -HISTORY_DAYS - 1)];

    // INTENT reacts — same evidence hierarchy as the store.
    const history = Object.values(plans).flatMap((p) => p.items);
    const claimed = new Set<string | undefined>();
    const fresh: Suggestion[] = [];
    const routineIdOf = (s: Suggestion) => (s.payload as { routineId?: string })?.routineId;
    for (const detected of [
      detectMoveOutcome(moves, plans, routines),
      detectMovePattern(moves, routines),
      detectSlotMismatch(history, routines),
      detectMissedTwice(history, routines),
    ]) {
      for (const s of detected) {
        if (claimed.has(routineIdOf(s))) continue;
        claimed.add(routineIdOf(s));
        fresh.push(s);
      }
    }
    // Mirror the store's 14-day anticipation cooldown.
    if (d - lastConnectionDay >= 14) {
      const gap = detectAnticipationGap(date, plans, routines, profile);
      if (gap) {
        fresh.push(gap);
        lastConnectionDay = d;
      }
    }

    for (const s of fresh) {
      const key = `${s.kind}:${routineIdOf(s) ?? (s.payload as { date?: string })?.date ?? ''}`;
      if (seenSuggestionKeys.has(key)) continue;
      seenSuggestionKeys.add(key);
      week.suggestionsShown[s.kind] = (week.suggestionsShown[s.kind] ?? 0) + 1;

      if (rng() < truth.acceptProb) {
        week.suggestionsAccepted[s.kind] = (week.suggestionsAccepted[s.kind] ?? 0) + 1;
        if (s.kind === 'move_routine') {
          routines = applyMoveRoutine(routines, s);
          firstAnyAdaptationWeek ??= weekIndex;
          if (s.confidence >= 0.9) firstMoveOutcomeAcceptWeek ??= weekIndex;
        } else if (s.kind === 'protect_time') {
          routines = applyProtectTime(routines, s);
          firstAnyAdaptationWeek ??= weekIndex;
        }
        // connection: the moment gets planned; count as an enjoyment moment.
        if (s.kind === 'connection') week.hasFamilyMoment ||= true;
      }
    }

    // Sunday night: weekly review, sometimes applied.
    if ((d + 1) % 7 === 0) {
      const proposal = buildWeeklyChanges({ weekStart: addDays(date, -6), plans, routines });
      if (proposal.changes.length > 0 && rng() < truth.applyReviewProb) {
        for (const change of proposal.changes) {
          if (change.kind === 'deactivate_routine') {
            routines = routines.map((r) => (r.id === change.routineId ? { ...r, active: false } : r));
            week.routinesDeactivated += 1;
          } else if (change.kind === 'move_routine' && change.payload) {
            routines = routines.map((r) =>
              r.id === change.routineId
                ? { ...r, preferredStart: change.payload!.preferredStart, preferredEnd: change.payload!.preferredEnd }
                : r,
            );
            firstAnyAdaptationWeek ??= weekIndex;
          }
          week.weeklyChangesApplied += 1;
        }
      }
      weeks.push(week);
      week = emptyWeek();
    }
  }

  return {
    persona: user.persona,
    weeks,
    firstMoveOutcomeAcceptWeek,
    firstAnyAdaptationWeek,
    overlapViolations,
    errors,
  };
}

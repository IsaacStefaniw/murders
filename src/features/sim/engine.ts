/**
 * Cohort simulator — runs synthetic users through the REAL product code:
 * generateDailyPlan, the adaptation detectors (with the store's evidence
 * hierarchy), applyMoveRoutine/applyProtectTime, buildWeeklyChanges, and
 * the anticipation gap. Nothing is mocked; the only synthetic part is the
 * human (personas.ts).
 */

import { detectAnticipationGap } from '@/features/anticipation/lookAhead';
import { detectGoalStalled, STALL_DAYS } from '@/features/goals/stalled';
import { generateDailyPlan } from '@/features/planner/generate';
import { buildWeeklyChanges } from '@/features/review/weeklyChanges';
import { runSessionForItem } from '@/features/sim/modalities';
import { MODALITIES } from '@/features/modalities/registry';
import {
  applyMoveRoutine,
  applyProtectTime,
  applyShorten,
  detectMissedTwice,
  detectMoveOutcome,
  detectMovePattern,
  detectShrinkToFit,
  detectSlotMismatch,
  type ManualMove,
} from '@/lib/scheduling/adaptation';
import { addDays, toHHMM, toMinutes } from '@/lib/dates';
import type { DailyPlan, Goal, LifeArea, PlanItem, Routine, Suggestion } from '@/types/domain';
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
  /** Modality sessions actually executed through the real generators. */
  sessions: Record<string, { run: number; shortened: number }>;
  /** Real product code produced an invalid session. Must stay zero. */
  contractViolations: number;
  milestonesCompleted: number;
}

export interface UserResult {
  persona: string;
  weeks: WeekMetrics[];
  firstMoveOutcomeAcceptWeek: number | null;
  firstAnyAdaptationWeek: number | null;
  overlapViolations: number;
  errors: number;
  /** Milestone progress by goal domain at the end of the run. */
  milestonesByDomain: Record<string, { done: number; total: number }>;
  goalsWithMilestones: number;
  goalsFullyMilestoned: number;
  /** Goals still stalled (undone milestone, no progress ≥ STALL_DAYS) at the end. */
  goalsStalledAtEnd: number;
}

export interface SimOptions {
  /** Wire the goal-stalled detector into the loop (ablate with false). */
  goalRescue?: boolean;
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
    sessions: {},
    contractViolations: 0,
    milestonesCompleted: 0,
  };
}

export function runUser(
  user: SimUser,
  days: number,
  startDate = '2026-01-05',
  opts: SimOptions = {},
): UserResult {
  const { truth, rng } = user;
  let routines: Routine[] = user.plan.routines.map((r) => ({ ...r }));
  const profile = user.plan.profile;
  // Goals are live state now: sessions tick milestones. createdAt is pinned
  // to the simulated signup day so stall windows measure simulated time.
  const goals: Goal[] = user.plan.goals.map((g) => ({
    ...g,
    createdAt: `${startDate}T08:00:00.000Z`,
    milestones: g.milestones?.map((m) => ({ ...m })),
  }));
  const goalRescue = opts.goalRescue !== false;
  const lastStallNudgeDay: Record<string, number> = {};
  const floorFor = (r: Routine): number =>
    (r.sessionType && MODALITIES[r.sessionType]?.shorteningFloorMin) || 10;
  // Durations at signup, so shrink-relief compares against the original ask.
  const originalDuration = new Map(routines.map((r) => [r.id, r.durationMin]));

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
    const recordSession = (item: PlanItem) => {
      const outcome = runSessionForItem(item, goals, {
        date,
        dayIndex: d,
        trainingSetting: profile.trainingPreference,
        rng,
      });
      if (!outcome) return;
      const acc = (week.sessions[outcome.type] ??= { run: 0, shortened: 0 });
      acc.run += 1;
      if (outcome.shortened) acc.shortened += 1;
      week.contractViolations += outcome.contractViolations;
      if (outcome.milestoneAdvanced) week.milestonesCompleted += 1;
    };

    plan.items = plan.items.map((item): PlanItem => {
      if (item.fixed) {
        // A carved-out session (the growth block) is still attended and
        // run — being fixed on the calendar doesn't mean it didn't happen.
        if (
          item.sessionType &&
          rng() < affinityFor(truth, item.area, slotOfStart(item.start)) * truth.adherence
        ) {
          const attended: PlanItem = { ...item, status: 'completed' };
          recordSession(attended);
          return attended;
        }
        return item;
      }
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

      let p = affinityFor(truth, area, slot) * truth.adherence;
      // Activation-cost relief for a shrunk routine: smaller asks are easier
      // to start. A modelling assumption (documented in docs/SIMULATION.md),
      // capped at +15% relative.
      if (item.routineId) {
        const orig = originalDuration.get(item.routineId);
        const dur = toMinutes(end) - toMinutes(start);
        if (orig && dur < orig) {
          p = Math.min(0.95, p * Math.min(1.15, 1 + 0.25 * (1 - dur / orig)));
        }
      }
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
        // The session behind the item actually runs — real registry, real
        // generators, milestone progression on the linked goal.
        recordSession({ ...item, start, end, status: 'completed' });
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
      detectShrinkToFit(history, routines, floorFor),
      detectMissedTwice(history, routines),
    ]) {
      for (const s of detected) {
        if (claimed.has(routineIdOf(s))) continue;
        claimed.add(routineIdOf(s));
        fresh.push(s);
      }
    }
    // Mirror the store's 14-day anticipation cooldown — and the app's
    // reality that the week ahead is always generated (Today ensures 7
    // days), so the detector sees planned future moments. v2 fidelity fix:
    // v1 fed it only lived days, making every week look empty and the
    // detector fire at max cadence for everyone. Weekly check, on Sundays.
    if (d - lastConnectionDay >= 14 && (d + 1) % 7 === 0) {
      const previewPlans: Record<string, DailyPlan> = { ...plans };
      for (let i = 1; i <= 6; i++) {
        const future = addDays(date, i);
        try {
          previewPlans[future] = generateDailyPlan(profile, routines, future);
        } catch {
          errors += 1;
        }
      }
      const gap = detectAnticipationGap(date, previewPlans, routines, profile);
      if (gap) {
        fresh.push(gap);
        lastConnectionDay = d;
      }
    }
    // Goal-stalled nudges — same per-goal cooldown as the store.
    if (goalRescue) {
      for (const s of detectGoalStalled(date, goals)) {
        const gid = (s.payload as { goalId: string }).goalId;
        if (d - (lastStallNudgeDay[gid] ?? -STALL_DAYS) < STALL_DAYS) continue;
        lastStallNudgeDay[gid] = d;
        fresh.push(s);
      }
    }

    for (const s of fresh) {
      const key = `${s.kind}:${routineIdOf(s) ?? (s.payload as { goalId?: string })?.goalId ?? (s.payload as { date?: string })?.date ?? ''}`;
      // goal_stalled re-nudges after its own cooldown, like the store
      // (which only remembers 21 days); everything else fires once.
      if (s.kind !== 'goal_stalled') {
        if (seenSuggestionKeys.has(key)) continue;
        seenSuggestionKeys.add(key);
      }
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
        } else if (s.kind === 'shorten_workout') {
          routines = applyShorten(routines, s);
          firstAnyAdaptationWeek ??= weekIndex;
        }
        // connection: the moment gets planned; count as an enjoyment moment.
        if (s.kind === 'connection') week.hasFamilyMoment ||= true;
        // goal_stalled: the rescue block lands tomorrow evening. If the
        // user's evening actually absorbs it, the milestone gets done.
        if (s.kind === 'goal_stalled') {
          const goal = goals.find((g) => g.id === (s.payload as { goalId: string }).goalId);
          const next = goal?.milestones?.find((m) => !m.done);
          const pDone = affinityFor(truth, goal?.area ?? 'growth', 'evening') * truth.adherence;
          if (next && rng() < pDone) {
            next.done = true;
            next.doneAt = `${addDays(date, 1)}T20:00:00.000Z`;
            week.milestonesCompleted += 1;
          }
        }
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
          } else if (
            change.kind === 'move_routine' &&
            change.payload?.preferredStart &&
            change.payload.preferredEnd
          ) {
            const { preferredStart, preferredEnd } = change.payload;
            routines = routines.map((r) =>
              r.id === change.routineId ? { ...r, preferredStart, preferredEnd } : r,
            );
            firstAnyAdaptationWeek ??= weekIndex;
          } else if (change.kind === 'shorten_routine' && change.payload?.newDurationMin) {
            const { newDurationMin } = change.payload;
            routines = routines.map((r) =>
              r.id === change.routineId ? { ...r, durationMin: newDurationMin } : r,
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

  const milestonesByDomain: UserResult['milestonesByDomain'] = {};
  let goalsWithMilestones = 0;
  let goalsFullyMilestoned = 0;
  for (const g of goals) {
    if (!g.milestones?.length) continue;
    goalsWithMilestones += 1;
    const acc = (milestonesByDomain[g.domain ?? 'personal'] ??= { done: 0, total: 0 });
    acc.total += g.milestones.length;
    acc.done += g.milestones.filter((m) => m.done).length;
    if (g.milestones.every((m) => m.done)) goalsFullyMilestoned += 1;
  }

  return {
    persona: user.persona,
    weeks,
    firstMoveOutcomeAcceptWeek,
    firstAnyAdaptationWeek,
    overlapViolations,
    errors,
    milestonesByDomain,
    goalsWithMilestones,
    goalsFullyMilestoned,
    goalsStalledAtEnd: detectGoalStalled(addDays(startDate, days - 1), goals).length,
  };
}

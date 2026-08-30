/**
 * Central app store.
 *
 * Zustand + AsyncStorage gives a local-first source of truth: the app is
 * fully usable offline and in demo mode. When Supabase is configured, the
 * sync layer (lib/storage) mirrors this state to the backend — see
 * docs/ARCHITECTURE.md and ADR-003.
 *
 * Every plan change flows through here and is recorded in `planEvents` —
 * the behavioural event stream the adaptation engine learns from.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { detectAnticipationGap } from '@/features/anticipation/lookAhead';
import { availableStartsFor, generateDailyPlan } from '@/features/planner/generate';
import type { WeeklyChange } from '@/features/review/weeklyChanges';
import {
  applyMoveRoutine,
  applyProtectTime,
  detectMissedTwice,
  detectMoveOutcome,
  detectMovePattern,
  detectSlotMismatch,
  type ManualMove,
} from '@/lib/scheduling/adaptation';
import { buildSeededHistory } from '@/features/dev/seedHistory';
import {
  addDays,
  newId,
  nowDate,
  setClockOffsetMs,
  todayKey,
  toHHMM,
  toMinutes,
} from '@/lib/dates';
import type {
  BehaviourEvent,
  BehaviourIntention,
  BehaviourKey,
  CompletionEvidence,
  DailyPlan,
  Goal,
  LifeProfile,
  PlanActionEvent,
  PlanItem,
  PlanItemStatus,
  Reflection,
  Routine,
  Suggestion,
} from '@/types/domain';

export interface AppState {
  hydrated: boolean;
  onboarded: boolean;
  profile: LifeProfile | null;
  goals: Goal[];
  routines: Routine[];
  plans: Record<string, DailyPlan>;
  planEvents: PlanActionEvent[];
  behaviourIntentions: BehaviourIntention[];
  behaviourEvents: BehaviourEvent[];
  reflections: Reflection[];
  suggestions: Suggestion[];

  completeOnboarding: (input: {
    profile: LifeProfile;
    goals: Goal[];
    routines: Routine[];
    behaviourIntentions: BehaviourIntention[];
  }) => void;
  updateProfile: (patch: Partial<LifeProfile>) => void;

  /** Returns the plan for a date, generating it if absent. */
  ensurePlan: (date: string) => DailyPlan;
  regeneratePlan: (date: string) => DailyPlan;
  approvePlan: (date: string, intention?: string, protectBehaviour?: BehaviourKey) => void;
  setItemStatus: (
    date: string,
    itemId: string,
    status: PlanItemStatus,
    evidence?: CompletionEvidence,
  ) => void;
  /** Move a plan item within its day. Recorded as a behavioural signal. */
  moveItem: (date: string, itemId: string, newStart: string, initiatedBy?: 'user' | 'intent') => void;
  /** Move a plan item to another day, at the first slot that actually fits. */
  moveItemToDate: (date: string, itemId: string, targetDate: string) => void;
  /** Shorten an item to fit the time that exists — recovery, not compliance. */
  shortenItem: (date: string, itemId: string, newDurationMin: number) => void;
  /** Add a one-off item (an anticipation plan, a spontaneous commitment). */
  addPlanItem: (
    date: string,
    input: { title: string; area: PlanItem['area']; start: string; durationMin: number },
  ) => void;

  addGoal: (goal: Goal, routines: Routine[]) => void;
  setGoalStatus: (goalId: string, status: Goal['status']) => void;
  setMilestoneDone: (goalId: string, milestoneId: string, done: boolean) => void;
  setGoalNextFocus: (goalId: string, nextFocus: string | undefined) => void;
  updateRoutine: (routineId: string, patch: Partial<Routine>) => void;

  addBehaviourIntention: (behaviour: BehaviourKey, intentionText: string) => void;
  setBehaviourIntentionActive: (id: string, active: boolean) => void;
  /** Returns the event id so the UI can attach a trigger afterwards. */
  logBehaviourEvent: (intentionId: string, trigger?: string, context?: string) => string;
  setBehaviourEventTrigger: (eventId: string, trigger: string) => void;

  saveReflection: (reflection: Omit<Reflection, 'id' | 'createdAt'>) => void;

  refreshSuggestions: () => void;
  acceptSuggestion: (id: string) => void;
  dismissSuggestion: (id: string) => void;
  /** Apply weekly-review changes and rebuild the coming week around them. */
  applyWeeklyChanges: (changes: WeeklyChange[]) => void;

  resetAll: () => void;
  setHydrated: () => void;

  /** Preview Lab — compress the learning loop for testing. */
  clockOffsetMs: number;
  advanceToNextMorning: () => void;
  jumpToEvening: () => void;
  resetClock: () => void;
  seedDemoHistory: () => void;
}

const initialData = {
  onboarded: false,
  profile: null as LifeProfile | null,
  goals: [] as Goal[],
  routines: [] as Routine[],
  plans: {} as Record<string, DailyPlan>,
  planEvents: [] as PlanActionEvent[],
  behaviourIntentions: [] as BehaviourIntention[],
  behaviourEvents: [] as BehaviourEvent[],
  reflections: [] as Reflection[],
  suggestions: [] as Suggestion[],
  clockOffsetMs: 0,
};

/** How far back the adaptation engine looks. */
const HISTORY_DAYS = 14;
const MAX_PLAN_EVENTS = 500;

function eventFor(
  item: PlanItem,
  date: string,
  kind: PlanActionEvent['kind'],
  extra: Partial<PlanActionEvent> = {},
): PlanActionEvent {
  return {
    id: newId('pe'),
    at: new Date().toISOString(),
    date,
    itemId: item.id,
    routineId: item.routineId,
    goalId: item.goalId,
    area: item.area,
    kind,
    initiatedBy: 'user',
    ...extra,
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      const record = (event: PlanActionEvent) => {
        set({ planEvents: [...get().planEvents, event].slice(-MAX_PLAN_EVENTS) });
      };

      const updatePlanItems = (date: string, map: (items: PlanItem[]) => PlanItem[]) => {
        const plans = get().plans;
        const plan = plans[date];
        if (!plan) return;
        set({
          plans: {
            ...plans,
            [date]: {
              ...plan,
              items: map(plan.items).sort((a, b) => toMinutes(a.start) - toMinutes(b.start)),
            },
          },
        });
      };

      return {
        ...initialData,
        hydrated: false,

        completeOnboarding: ({ profile, goals, routines, behaviourIntentions }) => {
          set({ onboarded: true, profile, goals, routines, behaviourIntentions });
          get().regeneratePlan(todayKey());
        },

        updateProfile: (patch) => {
          const profile = get().profile;
          if (!profile) return;
          set({ profile: { ...profile, ...patch, updatedAt: new Date().toISOString() } });
        },

        ensurePlan: (date) => {
          const existing = get().plans[date];
          if (existing) return existing;
          return get().regeneratePlan(date);
        },

        regeneratePlan: (date) => {
          const { profile, routines, plans } = get();
          if (!profile) throw new Error('Cannot plan without a profile');
          const { unplaced: _unplaced, ...plan } = generateDailyPlan(profile, routines, date);
          const previous = plans[date];
          const next: DailyPlan = {
            ...plan,
            intention: previous?.intention,
            protectBehaviour: previous?.protectBehaviour,
            lookForward: previous?.lookForward,
            approvedAt: undefined,
          };
          set({ plans: { ...plans, [date]: next } });
          return next;
        },

        approvePlan: (date, intention, protectBehaviour) => {
          const plans = get().plans;
          const plan = plans[date];
          if (!plan) return;
          set({
            plans: {
              ...plans,
              [date]: {
                ...plan,
                intention: intention ?? plan.intention,
                protectBehaviour: protectBehaviour ?? plan.protectBehaviour,
                approvedAt: new Date().toISOString(),
              },
            },
          });
        },

        setItemStatus: (date, itemId, status, evidence) => {
          const item = get().plans[date]?.items.find((i) => i.id === itemId);
          if (!item) return;
          const finalEvidence: CompletionEvidence | undefined =
            status === 'completed'
              ? (evidence ?? { source: 'manual', confidence: 1, at: new Date().toISOString() })
              : undefined;
          updatePlanItems(date, (items) =>
            items.map((i) => (i.id === itemId ? { ...i, status, evidence: finalEvidence } : i)),
          );
          if (status === 'completed') {
            record(eventFor(item, date, 'completed', { evidence: finalEvidence }));
          } else if (status === 'skipped') {
            record(eventFor(item, date, 'skipped'));
          } else if (status === 'planned' && item.status !== 'planned') {
            record(eventFor(item, date, 'reopened'));
          }
        },

        moveItem: (date, itemId, newStart, initiatedBy = 'user') => {
          const item = get().plans[date]?.items.find((i) => i.id === itemId);
          if (!item || item.fixed) return;
          const duration = toMinutes(item.end) - toMinutes(item.start);
          updatePlanItems(date, (items) =>
            items.map((i) =>
              i.id === itemId
                ? {
                    ...i,
                    start: newStart,
                    end: toHHMM(toMinutes(newStart) + duration),
                    movedFrom: i.movedFrom ?? i.start,
                  }
                : i,
            ),
          );
          record(
            eventFor(item, date, 'rescheduled', {
              originalStart: item.start,
              newStart,
              initiatedBy,
            }),
          );
          get().refreshSuggestions();
        },

        moveItemToDate: (date, itemId, targetDate) => {
          const { profile } = get();
          const item = get().plans[date]?.items.find((i) => i.id === itemId);
          if (!item || item.fixed || !profile) return;
          const targetPlan = get().ensurePlan(targetDate);
          const slots = availableStartsFor({ ...item, id: '' }, targetPlan, profile, 12);
          // Land as close to the original time as the target day allows.
          const target = toMinutes(item.start);
          const newStart =
            [...slots].sort((a, b) => Math.abs(toMinutes(a) - target) - Math.abs(toMinutes(b) - target))[0] ??
            item.start;
          const duration = toMinutes(item.end) - toMinutes(item.start);
          const movedItem: PlanItem = {
            ...item,
            id: newId('pi'),
            date: targetDate,
            start: newStart,
            end: toHHMM(toMinutes(newStart) + duration),
            movedFrom: item.movedFrom ?? item.start,
            status: 'planned',
          };
          updatePlanItems(date, (items) => items.filter((i) => i.id !== itemId));
          updatePlanItems(targetDate, (items) => [...items, movedItem]);
          record(
            eventFor(item, date, 'rescheduled', {
              originalStart: item.start,
              newStart,
              newDate: targetDate,
            }),
          );
          get().refreshSuggestions();
        },

        shortenItem: (date, itemId, newDurationMin) => {
          const item = get().plans[date]?.items.find((i) => i.id === itemId);
          if (!item || item.fixed) return;
          const originalDuration = toMinutes(item.end) - toMinutes(item.start);
          if (newDurationMin >= originalDuration) return;
          updatePlanItems(date, (items) =>
            items.map((i) =>
              i.id === itemId
                ? {
                    ...i,
                    end: toHHMM(toMinutes(i.start) + newDurationMin),
                    shortenedFromMin: i.shortenedFromMin ?? originalDuration,
                  }
                : i,
            ),
          );
          record(
            eventFor(item, date, 'shortened', {
              originalDurationMin: originalDuration,
              newDurationMin,
            }),
          );
        },

        addPlanItem: (date, input) => {
          get().ensurePlan(date);
          const item: PlanItem = {
            id: newId('pi'),
            date,
            start: input.start,
            end: toHHMM(toMinutes(input.start) + input.durationMin),
            title: input.title,
            area: input.area,
            tier: 'should',
            status: 'planned',
            fixed: false,
          };
          updatePlanItems(date, (items) => [...items, item]);
        },

        addGoal: (goal, routines) => {
          set({
            goals: [...get().goals, goal],
            routines: [...get().routines, ...routines],
          });
          get().regeneratePlan(todayKey());
        },

        setGoalStatus: (goalId, status) => {
          set({
            goals: get().goals.map((g) => (g.id === goalId ? { ...g, status } : g)),
            // Pausing or dropping a goal deactivates its routines.
            routines: get().routines.map((r) =>
              r.goalId === goalId ? { ...r, active: status === 'active' } : r,
            ),
          });
        },

        setMilestoneDone: (goalId, milestoneId, done) => {
          set({
            goals: get().goals.map((g) =>
              g.id === goalId
                ? {
                    ...g,
                    milestones: g.milestones?.map((m) =>
                      m.id === milestoneId ? { ...m, done } : m,
                    ),
                  }
                : g,
            ),
          });
        },

        setGoalNextFocus: (goalId, nextFocus) => {
          set({
            goals: get().goals.map((g) => (g.id === goalId ? { ...g, nextFocus } : g)),
          });
        },

        updateRoutine: (routineId, patch) => {
          set({
            routines: get().routines.map((r) => (r.id === routineId ? { ...r, ...patch } : r)),
          });
        },

        addBehaviourIntention: (behaviour, intentionText) => {
          set({
            behaviourIntentions: [
              ...get().behaviourIntentions,
              {
                id: newId('bi'),
                behaviour,
                intentionText,
                createdAt: new Date().toISOString(),
                active: true,
              },
            ],
          });
        },

        setBehaviourIntentionActive: (id, active) => {
          set({
            behaviourIntentions: get().behaviourIntentions.map((b) =>
              b.id === id ? { ...b, active } : b,
            ),
          });
        },

        logBehaviourEvent: (intentionId, trigger, context) => {
          const id = newId('be');
          set({
            behaviourEvents: [
              ...get().behaviourEvents,
              { id, intentionId, occurredAt: new Date().toISOString(), trigger, context },
            ],
          });
          return id;
        },

        setBehaviourEventTrigger: (eventId, trigger) => {
          set({
            behaviourEvents: get().behaviourEvents.map((e) =>
              e.id === eventId ? { ...e, trigger } : e,
            ),
          });
        },

        saveReflection: (reflection) => {
          const others = get().reflections.filter(
            (r) => !(r.date === reflection.date && r.kind === reflection.kind),
          );
          set({
            reflections: [
              ...others,
              { ...reflection, id: newId('ref'), createdAt: new Date().toISOString() },
            ],
          });
        },

        refreshSuggestions: () => {
          const { plans, routines, suggestions, planEvents, profile } = get();
          const today = todayKey();
          const history = Object.values(plans)
            .filter((p) => p.date >= addDays(today, -HISTORY_DAYS) && p.date <= today)
            .flatMap((p) => p.items);

          // Manual moves come from the behavioural event stream. For cross-day
          // moves the destination date is where the outcome lives.
          const moves: ManualMove[] = planEvents
            .filter((e) => e.kind === 'rescheduled' && e.initiatedBy === 'user' && e.routineId && e.newStart)
            .map((e) => ({ routineId: e.routineId!, start: e.newStart!, date: e.newDate ?? e.date }));

          // Evidence hierarchy: moved-then-completed beats move patterns beats
          // slot statistics beats miss streaks. More specific evidence wins;
          // a routine claimed by a stronger detector is left alone by weaker ones.
          const routineIdOf = (s: Suggestion) => (s.payload as { routineId?: string })?.routineId;
          const claimed = new Set<string | undefined>();
          const fresh: Suggestion[] = [];
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
          // Anticipation nudges are precious: at most one per 14 days,
          // counting the ones already answered. (Cohort simulation showed
          // the uncapped version nagging twice a week.)
          const recentConnection = suggestions.some(
            (s) => s.kind === 'connection' && s.createdAt >= new Date(Date.now() - 14 * 86400e3).toISOString(),
          );
          if (profile && !recentConnection) {
            const anticipation = detectAnticipationGap(today, plans, routines, profile);
            if (anticipation) fresh.push(anticipation);
          }

          // Keep existing open suggestions; add only genuinely new ones.
          const open = suggestions.filter((s) => s.status === 'open');
          const keyOf = (s: Suggestion) =>
            `${s.kind}:${(s.payload as { routineId?: string; date?: string })?.routineId ?? (s.payload as { date?: string })?.date ?? ''}`;
          const existingKeys = new Set(open.map(keyOf));
          const additions = fresh.filter((s) => !existingKeys.has(keyOf(s)));
          if (additions.length > 0) set({ suggestions: [...open, ...additions] });
        },

        acceptSuggestion: (id) => {
          const { suggestions, routines } = get();
          const suggestion = suggestions.find((s) => s.id === id);
          if (!suggestion) return;

          if (suggestion.kind === 'connection') {
            const payload = suggestion.payload as {
              date: string;
              start: string;
              durationMin: number;
              title: string;
              area: PlanItem['area'];
            };
            get().addPlanItem(payload.date, payload);
          } else {
            const nextRoutines =
              suggestion.kind === 'protect_time'
                ? applyProtectTime(routines, suggestion)
                : applyMoveRoutine(routines, suggestion);
            set({ routines: nextRoutines });
            get().regeneratePlan(todayKey());
          }
          set({
            suggestions: get().suggestions.map((s) =>
              s.id === id ? { ...s, status: 'accepted' as const } : s,
            ),
          });
        },

        dismissSuggestion: (id) => {
          set({
            suggestions: get().suggestions.map((s) =>
              s.id === id ? { ...s, status: 'dismissed' as const } : s,
            ),
          });
        },

        applyWeeklyChanges: (changes) => {
          set({
            routines: get().routines.map((r) => {
              const change = changes.find((c) => c.routineId === r.id);
              if (!change) return r;
              if (change.kind === 'deactivate_routine') return { ...r, active: false };
              if (change.kind === 'move_routine' && change.payload) {
                return {
                  ...r,
                  preferredStart: change.payload.preferredStart,
                  preferredEnd: change.payload.preferredEnd,
                };
              }
              return r;
            }),
          });
          // Rebuild the coming week so the change is visible immediately.
          const today = todayKey();
          for (let i = 0; i <= 6; i++) get().regeneratePlan(addDays(today, i));
        },

        resetAll: () => {
          setClockOffsetMs(0);
          set({ ...initialData });
        },
        setHydrated: () => {
          setClockOffsetMs(get().clockOffsetMs);
          set({ hydrated: true });
        },

        advanceToNextMorning: () => {
          const sim = nowDate();
          const target = new Date(sim);
          target.setDate(target.getDate() + 1);
          target.setHours(7, 30, 0, 0);
          const offset = get().clockOffsetMs + (target.getTime() - sim.getTime());
          setClockOffsetMs(offset);
          set({ clockOffsetMs: offset });
          get().ensurePlan(todayKey());
          get().refreshSuggestions();
        },

        jumpToEvening: () => {
          const sim = nowDate();
          if (sim.getHours() >= 19) return;
          const target = new Date(sim);
          target.setHours(19, 0, 0, 0);
          const offset = get().clockOffsetMs + (target.getTime() - sim.getTime());
          setClockOffsetMs(offset);
          set({ clockOffsetMs: offset });
        },

        resetClock: () => {
          setClockOffsetMs(0);
          set({ clockOffsetMs: 0 });
          get().ensurePlan(todayKey());
        },

        seedDemoHistory: () => {
          const { profile, routines, behaviourIntentions } = get();
          if (!profile) return;
          const seeded = buildSeededHistory(profile, routines, behaviourIntentions);
          set({
            plans: { ...get().plans, ...seeded.plans },
            planEvents: [...get().planEvents, ...seeded.planEvents].slice(-MAX_PLAN_EVENTS),
            behaviourEvents: [...get().behaviourEvents, ...seeded.behaviourEvents],
            reflections: [...get().reflections, ...seeded.reflections],
          });
          get().refreshSuggestions();
        },
      };
    },
    {
      name: 'intent-os-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key, value]) => key !== 'hydrated' && typeof value !== 'function',
          ),
        ),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

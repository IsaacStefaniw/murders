/**
 * Central app store.
 *
 * Zustand + AsyncStorage gives a local-first source of truth: the app is
 * fully usable offline and in demo mode. When Supabase is configured, the
 * sync layer (lib/storage) mirrors this state to the backend — see
 * docs/ARCHITECTURE.md and ADR-003.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { generateDailyPlan } from '@/features/planner/generate';
import { applyMoveRoutine, detectSlotMismatch } from '@/lib/scheduling/adaptation';
import { addDays, newId, todayKey } from '@/lib/dates';
import type {
  BehaviourEvent,
  BehaviourIntention,
  BehaviourKey,
  DailyPlan,
  Goal,
  LifeProfile,
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
  setItemStatus: (date: string, itemId: string, status: PlanItemStatus) => void;

  addGoal: (goal: Goal, routines: Routine[]) => void;
  setGoalStatus: (goalId: string, status: Goal['status']) => void;
  updateRoutine: (routineId: string, patch: Partial<Routine>) => void;

  addBehaviourIntention: (behaviour: BehaviourKey, intentionText: string) => void;
  setBehaviourIntentionActive: (id: string, active: boolean) => void;
  logBehaviourEvent: (intentionId: string, trigger?: string, context?: string) => void;

  saveReflection: (reflection: Omit<Reflection, 'id' | 'createdAt'>) => void;

  refreshSuggestions: () => void;
  acceptSuggestion: (id: string) => void;
  dismissSuggestion: (id: string) => void;

  resetAll: () => void;
  setHydrated: () => void;
}

const initialData = {
  onboarded: false,
  profile: null as LifeProfile | null,
  goals: [] as Goal[],
  routines: [] as Routine[],
  plans: {} as Record<string, DailyPlan>,
  behaviourIntentions: [] as BehaviourIntention[],
  behaviourEvents: [] as BehaviourEvent[],
  reflections: [] as Reflection[],
  suggestions: [] as Suggestion[],
};

/** How far back the adaptation engine looks. */
const HISTORY_DAYS = 14;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
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

      setItemStatus: (date, itemId, status) => {
        const plans = get().plans;
        const plan = plans[date];
        if (!plan) return;
        set({
          plans: {
            ...plans,
            [date]: {
              ...plan,
              items: plan.items.map((i) => (i.id === itemId ? { ...i, status } : i)),
            },
          },
        });
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
        set({
          behaviourEvents: [
            ...get().behaviourEvents,
            {
              id: newId('be'),
              intentionId,
              occurredAt: new Date().toISOString(),
              trigger,
              context,
            },
          ],
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
        const { plans, routines, suggestions } = get();
        const today = todayKey();
        const history = Object.values(plans)
          .filter((p) => p.date >= addDays(today, -HISTORY_DAYS) && p.date <= today)
          .flatMap((p) => p.items);
        const fresh = detectSlotMismatch(history, routines);
        // Keep existing open suggestions; add only genuinely new ones.
        const open = suggestions.filter((s) => s.status === 'open');
        const existingKeys = new Set(
          open.map((s) => `${s.kind}:${(s.payload as { routineId?: string })?.routineId}`),
        );
        const additions = fresh.filter(
          (s) => !existingKeys.has(`${s.kind}:${(s.payload as { routineId?: string })?.routineId}`),
        );
        if (additions.length > 0) set({ suggestions: [...open, ...additions] });
      },

      acceptSuggestion: (id) => {
        const { suggestions, routines } = get();
        const suggestion = suggestions.find((s) => s.id === id);
        if (!suggestion) return;
        set({
          routines: applyMoveRoutine(routines, suggestion),
          suggestions: suggestions.map((s) =>
            s.id === id ? { ...s, status: 'accepted' as const } : s,
          ),
        });
        get().regeneratePlan(todayKey());
      },

      dismissSuggestion: (id) => {
        set({
          suggestions: get().suggestions.map((s) =>
            s.id === id ? { ...s, status: 'dismissed' as const } : s,
          ),
        });
      },

      resetAll: () => set({ ...initialData }),
      setHydrated: () => set({ hydrated: true }),
    }),
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

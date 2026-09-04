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
import { behaviourInfo } from '@/features/behaviours/catalog';
import { assessGoal } from '@/features/goals/composer';
import { detectGoalStalled, STALL_DAYS } from '@/features/goals/stalled';
import { detectGoalUnderserved } from '@/features/goals/underserved';
import { applicableRoutines, protocolById, routineApplies, toRoutine } from '@/features/knowledge/protocols';
import { observe, type MetricObservation } from '@/features/model/metrics';
import { PATHS, type PathId } from '@/features/paths/definitions';
import { NO_ENTITLEMENT, runningRoutines, type Entitlement } from '@/features/plus/entitlement';
import { PERSIST_VERSION, migratePersisted, pruneHistory } from '@/state/hygiene';
import {
  EMPTY_FOOD_PREFERENCES,
  type EnjoymentRating,
  type FoodPreferences,
} from '@/features/modalities/meals/food';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
} from '@/features/notifications/schedule';
import { observationsFrom } from '@/features/training/log';
import {
  baselinesFrom,
  buildProgramme,
  LEVEL_FROM_EXPERIENCE,
  type TrainingInputs,
  type TrainingProgramme,
} from '@/features/training/programme';
import { answersFromProfile, PATH_ANSWER_FOR, profilePatchFor } from '@/features/onboarding/buildPlan';
import type { InterviewAnswers } from '@/features/onboarding/script';
import { buildExecutiveBlock, type WorkBlock, type WorkInputs } from '@/features/work/programme';
import {
  completionEvidence,
  levelFor,
  levelProgress,
  type LevelEvidence,
  type LevelProgress,
  type PathLevel,
} from '@/features/paths/level';
import {
  measuredTrainingLevel,
  trainingEvidence,
  TRAINING_STANDARD_TEXT,
} from '@/features/training/level';
import {
  availableStartsFor,
  freeEndAtOrBefore,
  generateDailyPlan,
} from '@/features/planner/generate';
import { moveWithBump, type Displacement } from '@/features/planner/moveWithBump';
import { describeDisplaced, describeMoved } from '@/features/planner/displaced';
import { mergeRoutines } from '@/features/planner/mergeRoutines';
import type { WeeklyChange } from '@/features/review/weeklyChanges';
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
import { MODALITIES } from '@/features/modalities/registry';
import { buildSeededHistory } from '@/features/dev/seedHistory';
import { addDays, durationMinutes, newId, nowDate, setClockOffsetMs, toHHMM, toMinutes, todayKey } from '@/lib/dates';
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
  LoggedSet,
  Routine,
  Suggestion,
  WorkoutLog,
} from '@/types/domain';

export interface AppState {
  hydrated: boolean;
  onboarded: boolean;
  /** Is this person Plus. Decided on the phone from what StoreKit says this Apple ID owns. */
  entitlement: Entitlement;
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
    /** Kept so the deferred questions know what has already been asked. */
    answers?: InterviewAnswers;
  }) => void;
  updateProfile: (patch: Partial<LifeProfile>) => void;

  /**
   * When the app was last opened, and the one before that.
   *
   * Two values because the first is overwritten on this launch: by the
   * time anything renders, "last opened" is a second ago. The previous one
   * is what says how long someone was actually away, which is the only
   * version of this fact worth anything.
   */
  lastOpenedAt: string | null;
  previousOpenAt: string | null;
  markOpened: () => void;

  /**
   * Every interview answer given so far, spine and deferred alike.
   *
   * Kept because the deferred questions are asked over weeks rather than
   * in one sitting, and the only way to know which are still outstanding
   * is to know which have been answered. The transient onboarding store
   * cannot do that — it is cleared the moment the interview ends.
   */
  interviewAnswers: InterviewAnswers;
  /**
   * Answer a question the interview deferred. Routes the value to the
   * profile field, the pathway intake, or both, and rebuilds whatever it
   * invalidates.
   */
  answerDeferredQuestion: (stepId: string, value: string | string[] | undefined) => void;

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
  /**
   * Move an item to a chosen time, displacing whatever flexible things sit
   * there. Returns what else moved so the person can be told — a plan that
   * rearranges itself silently is worse than one that refuses.
   */
  /** Record the measurable side of a completed practice (sauna, cold). */
  recordPracticeMetric: (item: PlanItem) => void;

  /**
   * The voice that reads a guided practice aloud.
   *
   * Null means "whatever the device picks for this locale" — the sensible
   * default, and the only option before this existed. Choosing one is a
   * preference, not a setting anyone should have to find: the picker sits
   * on the session screen where the voice is about to speak, and the choice
   * is remembered so nobody chooses twice.
   *
   * A voice identifier is device-specific. One that is missing after a
   * restore or an OS update falls back to the default rather than failing
   * silent, which is why the reader handles null as a normal state.
   */
  voicePreference: string | null;
  setVoicePreference: (identifier: string | null) => void;
  moveItem: (
    date: string,
    itemId: string,
    newStart: string,
    initiatedBy?: 'user' | 'intent',
  ) => Displacement[];
  /** Move a plan item to another day, at the first slot that actually fits. */
  moveItemToDate: (date: string, itemId: string, targetDate: string) => void;
  /** Shorten an item to fit the time that exists — recovery, not compliance. */
  shortenItem: (date: string, itemId: string, newDurationMin: number) => void;
  /** Add a one-off item (an anticipation plan, a spontaneous commitment). */
  addPlanItem: (
    date: string,
    input: {
      title: string;
      area: PlanItem['area'];
      start: string;
      durationMin: number;
      goalId?: string;
    },
  ) => Displacement[];

  /**
   * Record something that ALREADY happened — an unscheduled workout, a
   * sauna last night. Appends a completed item to the day and records the
   * completion event, so unplanned effort reaches week momentum, the goal
   * composer's streak and count rungs, and the adaptation engine exactly
   * like planned effort does. Returns the new item's id.
   */
  /**
   * Record something that happened and was never in the plan.
   *
   * Everything a day could contain used to be something IntentNorth had
   * scheduled, which quietly made it a scoreboard for its own suggestions.
   * A run the app did not think of earned no credit, the day read emptier
   * than it was, and next week was then planned from that fiction.
   */
  logCompletedActivity: (input: {
    title: string;
    area: PlanItem['area'];
    durationMin: number;
    date?: string;
    /** Defaults to ending now. */
    endedAt?: string;
    sessionType?: PlanItem['sessionType'];
    goalId?: string;
    /**
     * Set when the entry IS one of the person's own routines. Without it a
     * logged "Morning walk" is a different thing from the scheduled one to
     * every consumer downstream — adherence, streak rungs, the adaptation
     * engine — and the routine reads as never done.
     */
    routineId?: string;
    note?: string;
  }) => string;

  addGoal: (goal: Goal, routines: Routine[]) => void;
  /** Toggle a knowledge-base protocol on the plan. Returns true if now active. */
  toggleProtocol: (protocolId: string) => boolean;

  /** Personal Performance Model — universal metric observations. */
  metrics: MetricObservation[];
  addMetric: (key: string, value: number, note?: string) => void;
  /**
   * Correct or remove a reading. The stream used to be strictly
   * append-only, so a mistyped 140kg bench ticked goal milestones done and
   * then celebrated a phantom personal best forever — `latest` would read
   * the correction, but `personalBest` and the records feed never would.
   * Editing re-runs the evidence pass, which can also UNSET a milestone
   * that only the bad number had satisfied.
   */
  updateMetric: (id: string, value: number, note?: string) => void;
  removeMetric: (id: string) => void;

  /**
   * Performed training sessions. Separate from plan items on purpose: an
   * item records THAT it happened, a log records WHAT happened, and only
   * the second can feed a strength baseline or be corrected next morning.
   */
  workoutLogs: WorkoutLog[];
  /** Create or replace a session's log, writing any e1RM it evidences. */
  saveWorkoutLog: (log: WorkoutLog) => void;
  /** Correct one set after the fact — the reps or the weight, or both. */
  updateLoggedSet: (logId: string, setId: string, patch: Partial<LoggedSet>) => void;
  removeLoggedSet: (logId: string, setId: string) => void;
  removeWorkoutLog: (logId: string) => void;

  /**
   * Food preferences — allergies, intolerances, patterns, dislikes,
   * favourites. The model existed in `meals/food.ts` and reached no screen,
   * so the rotation could not honour an allergy it had the data to respect.
   */
  foodPreferences: FoodPreferences;
  setFoodPreferences: (patch: Partial<FoodPreferences>) => void;
  /**
   * Whether the person has been asked about allergies at all. Distinct from
   * having none: an empty list means "nothing to declare", but an unasked
   * list means the app does not know, and it must not suggest food as
   * though it does.
   */
  foodPreferencesAsked: boolean;
  markFoodPreferencesAsked: () => void;
  rateDish: (dishId: string, rating: EnjoymentRating['rating']) => void;

  /**
   * Notification settings. Off until someone turns them on: a permission
   * prompt before anyone has seen what the app would say is the fastest
   * route to a permanent no, and iOS offers that prompt once.
   */
  notifications: NotificationSettings;
  setNotificationSettings: (patch: Partial<NotificationSettings>) => void;

  /** Apple Health — read-only vitals feeding the same metric stream. */
  healthConnectedAt: string | null;
  healthLastSyncAt: string | null;
  setHealthConnected: () => void;
  appendHealthObservations: (observations: MetricObservation[]) => void;
  /** questionId → ISO last asked/answered (the engine's memory). */
  questionLog: Record<string, string>;
  markQuestionAsked: (id: string) => void;

  /**
   * checkinSpecId → ISO when it was declined. "Not now" is a real answer,
   * so it holds for a fortnight rather than reappearing tomorrow.
   */
  dismissedCheckins: Record<string, string>;
  dismissCheckin: (specId: string) => void;
  /** Answer a check-in: records the reading and re-runs the evidence pass. */
  answerCheckin: (specId: string, metricKey: string, value: number) => void;

  /** Training v2 — the current four-week block. */
  trainingProgramme: TrainingProgramme | null;
  buildTrainingBlock: () => void;

  /**
   * A voluntary cap on a pathway's level — "this is too hard, take it
   * back a step". Only ever lowers: the ladder in features/paths/level
   * decides how high someone can go, and this decides how high they want
   * to. Clearing it hands the decision back to the evidence.
   */
  pathLevelStepBack: Partial<Record<PathId, PathLevel>>;
  setPathLevelStepBack: (path: PathId, level: PathLevel | null) => void;
  /**
   * The other half of the same control — "this is too easy".
   *
   * Kept separate from the step-back rather than folded into one signed
   * number, because they are not opposites. Stepping back changes which
   * LEVEL is built; pushing changes the DOSE at the level you are already
   * on, and must never become a way to buy the advanced block's top
   * singles and overreach week with a tap.
   */
  pathIntensityPush: Partial<Record<PathId, boolean>>;
  setPathIntensityPush: (path: PathId, push: boolean) => void;
  /**
   * The same ladder, for any pathway.
   *
   * Six of the seven pathways had a ladder described in LEVEL_BLURB, none
   * of it built and none of it shown — the level card rendered on the
   * training hub alone. This is what lets every hub show the rung the
   * person is on and what the next one costs.
   */
  pathLevelState: (path: PathId) => {
    level: PathLevel;
    evidence: LevelEvidence;
    progress: LevelProgress;
    steppedBack: boolean;
    pushing: boolean;
  };
  /** Level, evidence and what unlocks the next rung, for the training hub. */
  trainingLevelState: () => {
    level: PathLevel;
    evidence: LevelEvidence;
    progress: LevelProgress;
    steppedBack: boolean;
    pushing: boolean;
  };

  /** Work & Leadership v2 — the current four-week executive block. */
  workBlock: WorkBlock | null;
  buildWorkBlock: () => void;

  /** Guided domain programs — see docs/PATHS_BRIEF.md. */
  paths: Partial<Record<PathId, { startedAt: string; answers: Record<string, string>; goalId: string }>>;
  /** (Re)start a path: builds its goal + routines from the intake answers. */
  startPath: (id: PathId, answers: Record<string, string>) => void;
  /** Merge deeper answers into a started path — the question engine's
   * choice questions land here and sharpen the plan without a rebuild. */
  updatePathAnswers: (id: PathId, patch: Record<string, string>) => void;
  setGoalStatus: (goalId: string, status: Goal['status']) => void;
  setMilestoneDone: (goalId: string, milestoneId: string, done: boolean) => void;
  /** Rename, retarget, or re-date a goal. A plan you cannot change is a plan you abandon. */
  updateGoal: (goalId: string, patch: Partial<Goal>) => void;
  /** Edit one rung's title. The condition behind it is left alone. */
  updateMilestone: (goalId: string, milestoneId: string, patch: { title?: string }) => void;
  addMilestone: (goalId: string, title: string) => void;
  removeMilestone: (goalId: string, milestoneId: string) => void;
  /** Evidence pass: milestones whose doneWhen is satisfied by metrics or
   * completed sessions get checked off automatically (goal composer). */
  assessGoals: () => void;
  setGoalNextFocus: (goalId: string, nextFocus: string | undefined) => void;
  updateRoutine: (routineId: string, patch: Partial<Routine>) => void;

  addBehaviourIntention: (behaviour: BehaviourKey, intentionText: string) => void;
  setBehaviourIntentionActive: (id: string, active: boolean) => void;
  /** Returns the event id so the UI can attach a trigger afterwards. */
  logBehaviourEvent: (
    intentionId: string,
    trigger?: string,
    context?: string,
    detail?: string,
    size?: BehaviourEvent['size'],
  ) => string;
  /** Log an occurrence that already happened, at its real time. */
  logPastBehaviourEvent: (
    intentionId: string,
    occurredAt: string,
    detail?: string,
    size?: BehaviourEvent['size'],
    trigger?: string,
  ) => string;
  setBehaviourEventTrigger: (eventId: string, trigger: string) => void;

  saveReflection: (reflection: Omit<Reflection, 'id' | 'createdAt'>) => void;

  /** The nutrition coach's decided week — dinners by weekday. */
  mealPlan: { weekStart: string; dinners: Record<number, string> } | null;
  saveMealPlan: (weekStart: string, dinners: Record<number, string>) => void;

  refreshSuggestions: () => void;
  acceptSuggestion: (id: string) => void;
  dismissSuggestion: (id: string) => void;
  /** Apply weekly-review changes and rebuild the coming week around them. */
  applyWeeklyChanges: (changes: WeeklyChange[]) => void;

  resetAll: () => void;
  setHydrated: () => void;
  /** Trim history to what the screens still read. Runs once per visit. */
  pruneHistory: () => void;
  /**
   * Record what StoreKit answered. Today and every later unapproved day
   * are re-planned, because the coaches either just started running or
   * just stopped — a cached plan from the other side of that line lies.
   */
  setEntitlement: (entitlement: Entitlement) => void;

  /** Preview Lab — compress the learning loop for testing. */
  clockOffsetMs: number;
  /** When the Plus card on Today was dismissed; null means show it. */
  plusNudgeDismissedAt: string | null;
  dismissPlusNudge: () => void;
  advanceToNextMorning: () => void;
  jumpToEvening: () => void;
  resetClock: () => void;
  seedDemoHistory: () => void;
}

const initialData = {
  onboarded: false,
  entitlement: NO_ENTITLEMENT as Entitlement,
  profile: null as LifeProfile | null,
  goals: [] as Goal[],
  routines: [] as Routine[],
  plans: {} as Record<string, DailyPlan>,
  planEvents: [] as PlanActionEvent[],
  behaviourIntentions: [] as BehaviourIntention[],
  behaviourEvents: [] as BehaviourEvent[],
  reflections: [] as Reflection[],
  suggestions: [] as Suggestion[],
  mealPlan: null as { weekStart: string; dinners: Record<number, string> } | null,
  paths: {} as Partial<
    Record<PathId, { startedAt: string; answers: Record<string, string>; goalId: string }>
  >,
  metrics: [] as MetricObservation[],
  workoutLogs: [] as WorkoutLog[],
  foodPreferences: EMPTY_FOOD_PREFERENCES as FoodPreferences,
  foodPreferencesAsked: false,
  notifications: DEFAULT_NOTIFICATION_SETTINGS as NotificationSettings,
  healthConnectedAt: null as string | null,
  healthLastSyncAt: null as string | null,
  questionLog: {} as Record<string, string>,
  dismissedCheckins: {} as Record<string, string>,
  trainingProgramme: null as TrainingProgramme | null,
  interviewAnswers: {} as InterviewAnswers,
  lastOpenedAt: null as string | null,
  previousOpenAt: null as string | null,
  pathLevelStepBack: {} as Partial<Record<PathId, PathLevel>>,
  pathIntensityPush: {} as Partial<Record<PathId, boolean>>,
  workBlock: null as WorkBlock | null,
  clockOffsetMs: 0,
  plusNudgeDismissedAt: null as string | null,
  voicePreference: null as string | null,
};

/** Derive Training v2 inputs from everything IntentNorth already knows. */
export function deriveTrainingInputs(
  profile: LifeProfile,
  pathAnswers: Record<string, string> | undefined,
  goals: Goal[],
  level?: PathLevel,
): TrainingInputs {
  const fitnessGoal = goals.find((g) => g.status === 'active' && g.domain === 'fitness');
  const title = fitnessGoal?.title.toLowerCase() ?? '';
  const goal: TrainingInputs['goal'] = /bench|squat|deadlift|strength|stronger|press/.test(title)
    ? 'strength'
    : /muscle|size|build/.test(title)
      ? 'hypertrophy'
      : /lose|fat|lean|kg|weight/.test(title)
        ? 'fatloss'
        : 'general';
  // The question engine's focus-lift answer beats the title heuristic.
  //
  // Overhead press was missing from both branches, so "Overhead press 60kg"
  // was read as a strength goal with no lift to focus — the programme knew
  // what kind of goal it was and not what it was about, which is most of
  // the way to being no goal at all.
  const chosen = pathAnswers?.focusLift;
  const fromTitle = TITLE_TO_LIFT.find(([pattern]) => pattern.test(title))?.[1];
  const focusLift =
    chosen === 'bench' || chosen === 'squat' || chosen === 'deadlift' || chosen === 'ohp'
      ? chosen
      : chosen === 'none'
        ? undefined
        : fromTitle;
  const equipment: TrainingInputs['equipment'] =
    profile.trainingPreference === 'gym'
      ? 'gym'
      : profile.trainingPreference === 'home'
        ? 'home'
        : profile.trainingPreference === 'outdoors'
          ? 'bodyweight'
          : 'gym';
  return {
    goal,
    experience:
      (pathAnswers?.experience as TrainingInputs['experience']) ??
      (goal === 'strength' ? 'consistent' : 'returning'),
    level,
    daysAvailable: profile.trainingDaysPerWeek,
    sessionMin: profile.trainingDurationMin >= 45 ? 60 : 30,
    equipment,
    focusLift,
    age: profile.age,
    // Carried from the profile, not re-asked. Something answered once in
    // onboarding must reach the place that acts on it, or the question was
    // theatre.
    constraints: profile.constraints,
  };
}

/**
 * Goal titles to the lift they are about. Ordered, so "overhead press"
 * is matched before a bare "press" could claim it.
 */
const TITLE_TO_LIFT: [RegExp, 'bench' | 'squat' | 'deadlift' | 'ohp'][] = [
  [/overhead press|shoulder press|\bohp\b|strict press/, 'ohp'],
  [/bench/, 'bench'],
  [/squat/, 'squat'],
  [/deadlift/, 'deadlift'],
];

/** Derive Work & Leadership v2 inputs from everything IntentNorth already knows. */
export function deriveWorkInputs(
  profile: LifeProfile,
  pathAnswers: Record<string, string> | undefined,
): WorkInputs {
  const style =
    (pathAnswers?.style as WorkInputs['style']) ?? profile.workStyle ?? 'mixed';
  return {
    style,
    meetingLoad: pathAnswers?.meetingLoad as WorkInputs['meetingLoad'],
    bottleneck: pathAnswers?.bottleneck,
    pressure: profile.pressure,
  };
}

/** How far back the adaptation engine looks. */
const HISTORY_DAYS = 14;

/** Shortest meaningful duration for a routine — its modality's floor. */
const routineFloorMin = (r: Routine): number =>
  (r.sessionType && MODALITIES[r.sessionType]?.shorteningFloorMin) || 10;
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

        completeOnboarding: ({ profile, goals, routines, behaviourIntentions, answers }) => {
          set({ onboarded: true, profile, goals, routines, behaviourIntentions, interviewAnswers: answers ?? {} });
          get().regeneratePlan(todayKey());
        },

        answerDeferredQuestion: (stepId, value) => {
          const profile = get().profile;
          set({ interviewAnswers: { ...get().interviewAnswers, [stepId]: value } });
          if (!profile) return;

          const patch = profilePatchFor(stepId, value, profile);
          if (patch) get().updateProfile(patch);

          // A pathway question only reaches a pathway that has been
          // started. Writing into one that has not would leave an answer
          // the intake would then ask for again.
          const route = PATH_ANSWER_FOR[stepId];
          const one = Array.isArray(value) ? value[0] : value;
          if (route && one && get().paths[route.path]) {
            get().updatePathAnswers(route.path, { [route.key]: one });
          }

          // A behaviour named here is a behaviour to protect against, and
          // the whole point of naming it is that something happens.
          if (stepId === 'lessOf' && Array.isArray(value)) {
            const existing = new Set(get().behaviourIntentions.map((b) => b.behaviour));
            for (const key of value as BehaviourKey[]) {
              if (!existing.has(key)) {
                get().addBehaviourIntention(key, behaviourInfo(key).intentionTemplate);
              }
            }
          }

          // Anything that changes what a block is computed from invalidates
          // the block. Rebuilding now beats a plan that silently disagrees
          // with the answer just given.
          if (route?.path === 'training' || stepId === 'trainingSetup') get().buildTrainingBlock();
          if (route?.path === 'work') get().buildWorkBlock();
          if (patch && ('wakeTime' in patch || 'workDays' in patch || 'trainingPreference' in patch)) {
            get().regeneratePlan(todayKey());
          }
        },

        markOpened: () => {
          const now = new Date().toISOString();
          const last = get().lastOpenedAt;
          // Reopening within the same hour is the same visit — a tab
          // switch must not erase the gap that just ended.
          if (last && Date.now() - Date.parse(last) < 3600e3) {
            set({ lastOpenedAt: now });
            return;
          }
          set({ previousOpenAt: last, lastOpenedAt: now });
          get().pruneHistory();
        },

        pruneHistory: () => {
          const { plans, behaviourEvents, reflections, workoutLogs, suggestions } = get();
          const patch = pruneHistory({ plans, behaviourEvents, reflections, workoutLogs, suggestions }, todayKey());
          if (Object.keys(patch).length > 0) set(patch);
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
          const { profile, routines, plans, goals, entitlement } = get();
          if (!profile) throw new Error('Cannot plan without a profile');
          // The line. Without Plus the day keeps its shape — sleep, work,
          // meals, whatever was fixed — and the coaches do not run, except
          // the Habits & urges pathway, which is never charged for. What
          // the others would have run is shown, locked, by the Today screen.
          // Anatomy first: a routine that does not apply to this body is
          // never planned, whatever the entitlement says.
          const applicable = applicableRoutines(routines, profile.sexAtBirth);
          const running = runningRoutines(applicable, entitlement.plus, get().paths.recovery?.goalId);
          const { unplaced, moved, ...plan } = generateDailyPlan(profile, running, date, [], goals);
          // What did not fit is the visible half of arbitration. It used to
          // be destructured into `_unplaced` and dropped on the floor, which
          // meant the engine made the product's defining decision and then
          // told nobody about it.
          // Moves first: they are the common case, and a routine that still
          // happens later reads far better than one that vanished.
          const displaced = [
            ...describeMoved(moved, plan.items, profile.priorities),
            ...describeDisplaced(unplaced, plan.items, profile.priorities),
          ];
          const previous = plans[date];
          const next: DailyPlan = {
            ...plan,
            displaced: displaced.length > 0 ? displaced : undefined,
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
            get().recordPracticeMetric(item);
            // A completed session can finish a count or streak rung.
            get().assessGoals();
          } else if (status === 'skipped') {
            record(eventFor(item, date, 'skipped'));
          } else if (status === 'planned' && item.status !== 'planned') {
            record(eventFor(item, date, 'reopened'));
          }
        },

        /**
         * Turn a completed practice into a number.
         *
         * The journey simulation completed 15,488 items across 250 people
         * and found that most practices the app schedules record nothing at
         * all: a wind-down done 777 times, protein at breakfast 591, the
         * urge reset 529 — all invisible on Progress. Sauna was the case
         * that got reported, but it was never the only one. A practice the
         * app puts in the plan and then never counts teaches the person it
         * does not matter.
         *
         * The general fix is a COUNT per protocol rather than a bespoke
         * metric per practice: twenty hand-written metrics would drift out
         * of date the first time a protocol was renamed, and a count is the
         * honest unit for something whose value is that it happened at all.
         * Where a practice has a genuinely meaningful unit — minutes in a
         * sauna, exposures to cold — that is recorded as well.
         *
         * Blocks with no protocol behind them record nothing, on purpose.
         * "Family dinner" and "Get stronger" are time and intent; inventing
         * a number for them would be worse than counting nothing.
         */
        setVoicePreference: (identifier) => set({ voicePreference: identifier }),

        recordPracticeMetric: (item) => {
          const title = item.title.toLowerCase();
          const minutes = durationMinutes(item.start, item.end);
          const routine = item.routineId
            ? get().routines.find((r) => r.id === item.routineId)
            : undefined;
          const protocolId = routine?.protocolId;

          if (title.includes('sauna') || title.includes('heat')) {
            get().addMetric('recovery.saunaMinutes', minutes, item.title);
          }
          if (title.includes('cold') || title.includes('ice bath')) {
            // Counted as exposures, not minutes: two minutes and four are
            // the same practice, and charting the seconds would invite
            // people to race them.
            get().addMetric('recovery.coldExposures', 1, item.title);
          }
          // Keyed by protocol where there is one, and by the routine
          // otherwise. A first pass counted only protocol-backed practices
          // and left the ladder rungs and the urge answers silent — 3,000
          // completions in the simulation that the app had asked for,
          // watched happen, and then had nothing to show for. The line that
          // matters is whether the app SCHEDULED it, not where it came from.
          if (routine) {
            get().addMetric(`practice.${protocolId ?? routine.id}`, 1, item.title);
          }
        },

        moveItem: (date, itemId, newStart, initiatedBy = 'user') => {
          const plan = get().plans[date];
          const profile = get().profile;
          const item = plan?.items.find((i) => i.id === itemId);
          if (!plan || !profile || !item || item.fixed) return [];

          // The chosen time is granted and the flexible day re-laid around
          // it. Choosing a time is a statement about priority; answering
          // "something else is there" mistakes IntentNorth's own arrangement for
          // a fact about the person's life.
          const outcome = moveWithBump(plan, itemId, newStart, {
            wakeTime: profile.wakeTime,
            sleepTime: profile.sleepTime,
          });
          updatePlanItems(date, () => outcome.items);

          record(
            eventFor(item, date, 'rescheduled', {
              originalStart: item.start,
              newStart,
              initiatedBy,
            }),
          );
          // Each knock-on move is recorded as its own reschedule, initiated
          // by IntentNorth rather than the user — the learning layer should not
          // read a bump as the person choosing that time.
          for (const d of outcome.displaced) {
            const moved = plan.items.find((i) => i.id === d.id);
            if (!moved || !d.to) continue;
            record(
              eventFor(moved, date, 'rescheduled', {
                originalStart: d.from,
                newStart: d.to,
                initiatedBy: 'intent',
              }),
            );
          }
          get().refreshSuggestions();
          return outcome.displaced;
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
          const duration = durationMinutes(item.start, item.end);
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
          const originalDuration = durationMinutes(item.start, item.end);
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
            goalId: input.goalId,
            tier: 'should',
            status: 'planned',
            fixed: false,
          };
          updatePlanItems(date, (items) => [...items, item]);

          // Adding is a move that starts from nowhere, and it has to obey
          // the same rule: the chosen time is granted and the flexible day
          // re-laid around it. Appending alone let an added block sit on
          // top of a deep-work block — fifty-two overlaps across eighty
          // simulated people, none of which any screen would have shown as
          // a conflict.
          const plan = get().plans[date];
          const profile = get().profile;
          if (!plan || !profile) return [];
          const outcome = moveWithBump(plan, item.id, input.start, {
            wakeTime: profile.wakeTime,
            sleepTime: profile.sleepTime,
          });
          updatePlanItems(date, () => outcome.items);
          for (const d of outcome.displaced) {
            const moved = plan.items.find((i) => i.id === d.id);
            if (!moved || !d.to) continue;
            record(
              eventFor(moved, date, 'rescheduled', {
                originalStart: d.from,
                newStart: d.to,
                initiatedBy: 'intent',
              }),
            );
          }
          get().refreshSuggestions();
          return outcome.displaced;
        },

        logCompletedActivity: (input) => {
          const date = input.date ?? todayKey();
          get().ensurePlan(date);
          const at = input.endedAt ?? new Date().toISOString();
          // Place it where it actually happened: ending now (or at the given
          // time), starting its duration earlier. Clamped so a late-evening
          // entry can't wrap past midnight into negative minutes.
          const ended = input.endedAt ? new Date(input.endedAt) : nowDate();
          const endMin = Math.min(
            1439,
            Math.max(input.durationMin, ended.getHours() * 60 + ended.getMinutes()),
          );
          // Placed clear of what is already on the day. Dropping it at
          // "now minus its duration" regardless is how three items ended up
          // stacked on one lunch break: they overlapped each other, and the
          // overlap then made the day look full to every later calculation.
          const placedEnd = freeEndAtOrBefore(
            get().plans[date]?.items ?? [],
            endMin,
            input.durationMin,
            toMinutes(get().profile?.wakeTime ?? '00:00'),
          );
          const item: PlanItem = {
            id: newId('pi'),
            date,
            start: toHHMM(placedEnd - input.durationMin),
            end: toHHMM(placedEnd),
            title: input.title,
            area: input.area,
            goalId: input.goalId,
            routineId: input.routineId,
            sessionType: input.sessionType,
            tier: 'should',
            status: 'completed',
            fixed: false,
            evidence: { source: 'manual', confidence: 1, at, note: input.note },
          };
          updatePlanItems(date, (items) => [...items, item]);
          record(eventFor(item, date, 'completed', { evidence: item.evidence }));
          get().assessGoals();
          return item.id;
        },

        addGoal: (goal, routines) => {
          set({
            goals: [...get().goals, goal],
            routines: mergeRoutines(get().routines, routines),
          });
          // Pre-onboarding there is nothing to regenerate yet.
          if (!get().profile) return;
          // The whole visible week, not just today: Today caches seven days
          // ahead, so regenerating only today left a Mon/Wed/Fri routine
          // invisible all week and looking unsaved.
          const today = todayKey();
          for (let i = 0; i <= 6; i++) get().regeneratePlan(addDays(today, i));
        },

        addMetric: (key, value, note) => {
          set({ metrics: [...get().metrics, observe(key, value, 'user', note)].slice(-2000) });
          // A new reading can satisfy a milestone rung — check immediately,
          // so the check-in's effect is visible the moment it lands.
          get().assessGoals();
        },

        updateMetric: (id, value, note) => {
          set({
            metrics: get().metrics.map((o) =>
              o.id === id ? { ...o, value, note: note ?? o.note } : o,
            ),
          });
          get().assessGoals();
        },

        removeMetric: (id) => {
          set({ metrics: get().metrics.filter((o) => o.id !== id) });
          get().assessGoals();
        },

        /**
         * Save a session and let it move the model.
         *
         * The e1RM observations are REPLACED rather than appended on every
         * save, keyed by the log's id. Editing yesterday's bench from 100 to
         * 90 must correct the baseline, not leave the 100 standing beside it
         * as a personal best that never happened — the same defect that
         * `updateMetric` exists to fix, arriving by a different door.
         */
        saveWorkoutLog: (log) => {
          const stamped = { ...log, updatedAt: new Date().toISOString() };
          const others = get().workoutLogs.filter((l) => l.id !== log.id);
          const noteTag = `workout:${log.id}`;
          const keptMetrics = get().metrics.filter((m) => m.note !== noteTag);
          // Noon LOCAL on the session's date, not noon UTC: east of
          // Greenwich the latter can land on the following calendar day,
          // which would file a Monday session under Tuesday in every
          // date-keyed view that reads the metric stream.
          const [ly, lm, ld] = log.date.split('-').map(Number);
          const at = new Date(ly, lm - 1, ld, 12, 0, 0, 0).toISOString();
          const fresh = observationsFrom(stamped).map((o) => ({
            ...observe(o.key, o.value, 'user', noteTag),
            at,
          }));
          set({
            workoutLogs: [...others, stamped].sort((a, b) => a.date.localeCompare(b.date)),
            metrics: [...keptMetrics, ...fresh].slice(-2000),
          });
          get().assessGoals();
        },

        updateLoggedSet: (logId, setId, patch) => {
          const log = get().workoutLogs.find((l) => l.id === logId);
          if (!log) return;
          get().saveWorkoutLog({
            ...log,
            sets: log.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
          });
        },

        removeLoggedSet: (logId, setId) => {
          const log = get().workoutLogs.find((l) => l.id === logId);
          if (!log) return;
          get().saveWorkoutLog({ ...log, sets: log.sets.filter((s) => s.id !== setId) });
        },

        dismissCheckin: (specId) => {
          set({
            dismissedCheckins: {
              ...get().dismissedCheckins,
              [specId]: new Date().toISOString(),
            },
          });
        },

        answerCheckin: (specId, metricKey, value) => {
          // Clearing the dismissal matters: someone who said "not now" last
          // week and answers this week should go back onto the normal
          // cadence rather than staying silent for the rest of the fortnight.
          const { [specId]: _cleared, ...rest } = get().dismissedCheckins;
          set({ dismissedCheckins: rest });
          get().addMetric(metricKey, value, 'check-in');
        },

        setNotificationSettings: (patch) => {
          set({ notifications: { ...get().notifications, ...patch } });
        },

        setFoodPreferences: (patch) => {
          set({ foodPreferences: { ...get().foodPreferences, ...patch } });
        },

        markFoodPreferencesAsked: () => set({ foodPreferencesAsked: true }),

        /**
         * Append rather than overwrite. Taste changes, and "I liked this
         * once in March" should not outvote "I have been bored of it since
         * June" — the ranking reads the most recent rating for a dish.
         */
        rateDish: (dishId, rating) => {
          const prefs = get().foodPreferences;
          set({
            foodPreferences: {
              ...prefs,
              enjoyment: [
                ...prefs.enjoyment,
                { dishId, rating, at: todayKey() },
              ].slice(-500),
            },
          });
        },

        removeWorkoutLog: (logId) => {
          set({
            workoutLogs: get().workoutLogs.filter((l) => l.id !== logId),
            metrics: get().metrics.filter((m) => m.note !== `workout:${logId}`),
          });
          get().assessGoals();
        },

        assessGoals: () => {
          const { goals, metrics, planEvents } = get();
          const now = new Date().toISOString();
          let changed = false;
          const next = goals.map((g) => {
            if (g.status !== 'active' || !g.milestones?.length) return g;
            const { autoDone, autoUndone } = assessGoal(g, { metrics, planEvents });
            if (autoDone.length === 0 && autoUndone.length === 0) return g;
            changed = true;
            return {
              ...g,
              milestones: g.milestones.map((m) => {
                if (autoDone.includes(m.id)) return { ...m, done: true, doneAt: now };
                // Evidence that no longer holds un-ticks the rung it ticked —
                // a corrected number must not leave a goal falsely complete.
                if (autoUndone.includes(m.id)) return { ...m, done: false, doneAt: undefined };
                return m;
              }),
            };
          });
          if (changed) set({ goals: next });
        },

        markQuestionAsked: (id) => {
          set({ questionLog: { ...get().questionLog, [id]: new Date().toISOString() } });
        },

        setHealthConnected: () => {
          set({ healthConnectedAt: new Date().toISOString() });
        },

        appendHealthObservations: (observations) => {
          set({
            metrics: [...get().metrics, ...observations].slice(-2000),
            healthLastSyncAt: new Date().toISOString(),
          });
          // A weight or sleep reading from Health can satisfy a rung too.
          if (observations.length > 0) get().assessGoals();
        },

        buildTrainingBlock: () => {
          const { profile, paths, goals, metrics } = get();
          if (!profile) return;
          const { level, pushing } = get().trainingLevelState();
          const inputs = deriveTrainingInputs(profile, paths.training?.answers, goals, level);
          set({
            trainingProgramme: buildProgramme(
              { ...inputs, pushHarder: pushing },
              baselinesFrom(metrics),
            ),
          });
        },

        setPathIntensityPush: (path, push) => {
          const next = { ...get().pathIntensityPush };
          if (push) next[path] = true;
          else delete next[path];
          set({ pathIntensityPush: next });
          // Same reasoning as the step-back: someone who has just said the
          // block is too easy should see a harder one now, not next week.
          if (path === 'training') get().buildTrainingBlock();
        },

        setPathLevelStepBack: (path, level) => {
          const next = { ...get().pathLevelStepBack };
          if (level) next[path] = level;
          else delete next[path];
          set({ pathLevelStepBack: next });
          // The block is rebuilt immediately: a person who has just said
          // the programme is too hard should not have to wait a week to
          // see an easier one.
          if (path === 'training') get().buildTrainingBlock();
        },

        pathLevelState: (path) => {
          if (path === 'training') return get().trainingLevelState();
          const { paths, plans, routines, goals, pathLevelStepBack, pathIntensityPush } = get();
          const goalId = paths[path]?.goalId;
          // A pathway's own completed work, and nothing else. Counting any
          // completed item would let a busy week in one part of life buy a
          // harder programme in another.
          const mine = new Set(
            routines.filter((r) => r.goalId && r.goalId === goalId).map((r) => r.title),
          );
          const goalTitle = goals.find((g) => g.id === goalId)?.title;
          const doneDates: string[] = [];
          for (const plan of Object.values(plans)) {
            const hit = plan.items.some(
              (i) => i.status === 'completed' && (mine.has(i.title) || i.title === goalTitle),
            );
            if (hit) doneDates.push(plan.date);
          }
          const evidence = completionEvidence(doneDates);
          const stepBack = pathLevelStepBack[path] ?? null;
          const level = levelFor(path, null, evidence, stepBack);
          return {
            level,
            evidence,
            progress: levelProgress(path, level, evidence),
            steppedBack: stepBack != null,
            pushing: stepBack == null && pathIntensityPush[path] === true,
          };
        },

        trainingLevelState: () => {
          const { paths, workoutLogs, metrics, profile, pathLevelStepBack, pathIntensityPush } = get();
          const evidence = trainingEvidence(workoutLogs, metrics, profile);
          // Where the lifts alone say to start — so an experienced lifter
          // is not handed a beginner's programme and told to earn his way
          // out of it over ten months.
          const measured = measuredTrainingLevel(metrics, profile);
          const claim = paths.training?.answers?.experience;
          const claimed =
            claim === 'new' || claim === 'returning' || claim === 'consistent'
              ? LEVEL_FROM_EXPERIENCE[claim]
              : null;
          const stepBack = pathLevelStepBack.training ?? null;
          const level = levelFor('training', claimed, evidence, stepBack, measured);
          return {
            level,
            evidence,
            progress: levelProgress('training', level, evidence, TRAINING_STANDARD_TEXT),
            steppedBack: stepBack != null,
            // A step-back and a push are mutually exclusive by construction:
            // someone who has just asked for an easier level is not also
            // asking for more work at it.
            pushing: stepBack == null && pathIntensityPush.training === true,
          };
        },

        buildWorkBlock: () => {
          const { profile, paths } = get();
          if (!profile) return;
          set({ workBlock: buildExecutiveBlock(deriveWorkInputs(profile, paths.work?.answers)) });
        },

        startPath: (id, answers) => {
          const def = PATHS[id];
          const { paths, profile } = get();
          // Retaking a path retires the old program cleanly first.
          const previous = paths[id];
          if (previous) get().setGoalStatus(previous.goalId, 'dropped');

          const plan = def.build(answers, profile);
          get().addGoal(plan.goal, plan.routines);
          // The recovery path protects a behaviour — make sure its
          // intention (and urge logging) is live too.
          if (plan.behaviour) {
            const active = get().behaviourIntentions.some(
              (b) => b.behaviour === plan.behaviour && b.active,
            );
            if (!active) {
              get().addBehaviourIntention(
                plan.behaviour,
                behaviourInfo(plan.behaviour).intentionTemplate,
              );
            }
          }
          set({
            paths: {
              ...get().paths,
              [id]: { startedAt: new Date().toISOString(), answers, goalId: plan.goal.id },
            },
          });
          // The new program should be visible across the whole week now.
          if (get().profile) {
            const today = todayKey();
            for (let i = 1; i <= 6; i++) get().regeneratePlan(addDays(today, i));
          }
        },

        updatePathAnswers: (id, patch) => {
          const entry = get().paths[id];
          if (!entry) return;
          set({
            paths: {
              ...get().paths,
              [id]: { ...entry, answers: { ...entry.answers, ...patch } },
            },
          });
        },

        toggleProtocol: (protocolId) => {
          const { routines, profile } = get();
          const existing = routines.find((r) => r.protocolId === protocolId);
          let nowActive: boolean;
          if (existing) {
            nowActive = !existing.active;
            set({
              routines: routines.map((r) =>
                r.protocolId === protocolId ? { ...r, active: nowActive } : r,
              ),
            });
          } else {
            const protocol = protocolById(protocolId);
            if (!protocol) return false;
            // The library does not list what does not apply, but a deep link
            // or an older screen might; the store is the last gate.
            if (!routineApplies({ protocolId: protocol.id }, profile?.sexAtBirth)) return false;
            set({ routines: [...routines, toRoutine(protocol, profile)] });
            nowActive = true;
          }
          // Rebuild the coming week so the practice shows up immediately.
          const today = todayKey();
          for (let i = 0; i <= 6; i++) get().regeneratePlan(addDays(today, i));
          return nowActive;
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
                      m.id === milestoneId
                        ? { ...m, done, doneAt: done ? nowDate().toISOString() : undefined }
                        : m,
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

        updateGoal: (goalId, patch) => {
          set({
            goals: get().goals.map((g) => (g.id === goalId ? { ...g, ...patch, id: g.id } : g)),
          });
          // A changed target or date can flip a rung either way.
          get().assessGoals();
        },

        updateMilestone: (goalId, milestoneId, patch) => {
          set({
            goals: get().goals.map((g) =>
              g.id === goalId
                ? {
                    ...g,
                    milestones: (g.milestones ?? []).map((m) =>
                      m.id === milestoneId ? { ...m, ...patch } : m,
                    ),
                  }
                : g,
            ),
          });
        },

        /**
         * A rung the person wrote themselves. It carries no `doneWhen`, so
         * only they can tick it — inventing a measurable condition for
         * words we did not parse would tick it off on evidence that has
         * nothing to do with what they meant.
         */
        addMilestone: (goalId, title) => {
          set({
            goals: get().goals.map((g) =>
              g.id === goalId
                ? {
                    ...g,
                    milestones: [
                      ...(g.milestones ?? []),
                      { id: newId('ms'), title, done: false },
                    ],
                  }
                : g,
            ),
          });
        },

        removeMilestone: (goalId, milestoneId) => {
          set({
            goals: get().goals.map((g) =>
              g.id === goalId
                ? { ...g, milestones: (g.milestones ?? []).filter((m) => m.id !== milestoneId) }
                : g,
            ),
          });
        },

        updateRoutine: (routineId, patch) => {
          set({
            routines: get().routines.map((r) => (r.id === routineId ? { ...r, ...patch } : r)),
          });
          if (!get().profile) return;
          // The whole visible week, not just today. Today caches seven days
          // ahead, so regenerating one day left a Mon/Wed/Fri change looking
          // unsaved all week — the same defect that made added goals appear
          // not to save.
          const today = todayKey();
          for (let i = 0; i <= 6; i++) get().regeneratePlan(addDays(today, i));
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

        logBehaviourEvent: (intentionId, trigger, context, detail, size) => {
          const id = newId('be');
          set({
            behaviourEvents: [
              ...get().behaviourEvents,
              {
                id,
                intentionId,
                occurredAt: new Date().toISOString(),
                trigger,
                context,
                detail,
                size,
              },
            ],
          });
          return id;
        },

        /**
         * Log something that already happened, at the time it happened.
         *
         * The eight-forty-five case: a person opens the app at ten and wants
         * to record the thing from an hour ago. Stamping it with `now` would
         * put it in the wrong window, and the window is the one thing this
         * whole engine exists to find.
         */
        logPastBehaviourEvent: (intentionId, occurredAt, detail, size, trigger) => {
          const id = newId('be');
          set({
            behaviourEvents: [
              ...get().behaviourEvents,
              { id, intentionId, occurredAt, trigger, detail, size },
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

        saveMealPlan: (weekStart, dinners) => {
          set({ mealPlan: { weekStart, dinners } });
        },

        refreshSuggestions: () => {
          const { plans, routines, suggestions, planEvents, profile, goals } = get();
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
            // No better slot exists → shrink the ask before protecting it.
            detectShrinkToFit(history, routines, routineFloorMin),
            detectMissedTwice(history, routines),
          ]) {
            for (const s of detected) {
              if (claimed.has(routineIdOf(s))) continue;
              // Some practices are never chased. A life-transition anchor
              // missed three weeks after a bereavement is not a signal to
              // act on, and the engine cannot know that on its own.
              const routine = routines.find((r) => r.id === routineIdOf(s));
              const protocol = routine?.protocolId ? protocolById(routine.protocolId) : undefined;
              if (protocol?.neverNag) continue;
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
          // Goal direction: one nudge per goal at a time, proactive
          // (underserved — the calendar stopped serving the goal) before
          // the backstop (stalled — no milestone progress for 3 weeks),
          // each with its own cooldown counting answered nudges.
          const goalIdOf = (s: Suggestion) => (s.payload as { goalId?: string })?.goalId;
          const recentGoalNudges = (kind: Suggestion['kind'], days: number) => {
            const cutoff = new Date(Date.now() - days * 86400e3).toISOString();
            return new Set(
              suggestions.filter((s) => s.kind === kind && s.createdAt >= cutoff).map(goalIdOf),
            );
          };
          const recentUnderserved = recentGoalNudges('plan_adjustment', 14);
          const recentStalled = recentGoalNudges('goal_stalled', STALL_DAYS);
          const goalClaimed = new Set<string | undefined>();
          const goalFresh: Suggestion[] = [];
          for (const s of detectGoalUnderserved(today, goals, routines, history)) {
            const gid = goalIdOf(s);
            if (recentUnderserved.has(gid) || recentStalled.has(gid) || goalClaimed.has(gid))
              continue;
            goalClaimed.add(gid);
            goalFresh.push(s);
          }
          for (const s of detectGoalStalled(today, goals)) {
            const gid = goalIdOf(s);
            if (recentStalled.has(gid) || goalClaimed.has(gid)) continue;
            goalClaimed.add(gid);
            goalFresh.push(s);
          }
          // Goal-direction suggestions surface first: the point of the
          // engine is movement toward what the user said matters.
          fresh.unshift(...goalFresh);

          // Keep existing open suggestions; add only genuinely new ones.
          const open = suggestions.filter((s) => s.status === 'open');
          const keyOf = (s: Suggestion) =>
            `${s.kind}:${(s.payload as { routineId?: string; goalId?: string; date?: string })?.routineId ?? (s.payload as { goalId?: string })?.goalId ?? (s.payload as { date?: string })?.date ?? ''}`;
          const existingKeys = new Set(open.map(keyOf));
          const additions = fresh.filter((s) => !existingKeys.has(keyOf(s)));
          if (additions.length > 0) set({ suggestions: [...open, ...additions] });
        },

        acceptSuggestion: (id) => {
          const { suggestions, routines } = get();
          const suggestion = suggestions.find((s) => s.id === id);
          if (!suggestion) return;

          if (
            suggestion.kind === 'connection' ||
            suggestion.kind === 'goal_stalled' ||
            suggestion.kind === 'plan_adjustment'
          ) {
            // Each proposes one concrete block; accepting puts it on the plan.
            const payload = suggestion.payload as {
              date: string;
              start: string;
              durationMin: number;
              title: string;
              area: PlanItem['area'];
              goalId?: string;
            };
            get().addPlanItem(payload.date, payload);
          } else {
            const nextRoutines =
              suggestion.kind === 'protect_time'
                ? applyProtectTime(routines, suggestion)
                : suggestion.kind === 'shorten_workout'
                  ? applyShorten(routines, suggestion)
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
              if (
                change.kind === 'move_routine' &&
                change.payload?.preferredStart &&
                change.payload.preferredEnd
              ) {
                return {
                  ...r,
                  preferredStart: change.payload.preferredStart,
                  preferredEnd: change.payload.preferredEnd,
                };
              }
              if (change.kind === 'shorten_routine' && change.payload?.newDurationMin) {
                return { ...r, durationMin: change.payload.newDurationMin };
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
        dismissPlusNudge: () => set({ plusNudgeDismissedAt: new Date().toISOString() }),

        setEntitlement: (entitlement) => {
          const before = get().entitlement.plus;
          set({ entitlement });
          if (before === entitlement.plus || !get().profile) return;
          const today = todayKey();
          for (const date of Object.keys(get().plans)) {
            if (date >= today && !get().plans[date]?.approvedAt) get().regeneratePlan(date);
          }
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
      version: PERSIST_VERSION,
      migrate: migratePersisted,
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key, value]) => key !== 'hydrated' && typeof value !== 'function',
          ),
        ),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Anyone who onboarded before the interview was split has a
        // profile but no stored answers. Reconstructing what the profile
        // can prove is what stops them being asked eighteen questions they
        // already sat through.
        if (state.profile && Object.keys(state.interviewAnswers ?? {}).length === 0) {
          state.interviewAnswers = answersFromProfile(state.profile);
        }
        // Routines added before the anatomy label existed are switched off
        // for a body they do not apply to, so no list shows them either.
        if (state.profile && state.routines?.length) {
          const sex = state.profile.sexAtBirth;
          const held = state.routines.filter((r) => r.active && !routineApplies(r, sex));
          if (held.length > 0) {
            state.routines = state.routines.map((r) => (held.includes(r) ? { ...r, active: false } : r));
          }
        }
        state.setHydrated();
      },
    },
  ),
);

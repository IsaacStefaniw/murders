/**
 * INTENT domain model — the client-side shape of the Personal Life Graph.
 *
 * These types mirror the database schema in supabase/migrations. Keep them in
 * sync via docs/DATA_MODEL.md when either changes.
 */

export type LifeArea =
  | 'family'
  | 'relationship'
  | 'health'
  | 'work'
  | 'growth'
  | 'enjoyment'
  | 'admin';

export type EnergyProfile = 'morning' | 'midday' | 'evening' | 'any';

export interface Person {
  id: string;
  name: string;
  relation: 'partner' | 'child' | 'friend' | 'family' | 'other';
}

/** Long-lived facts about the user. Stable Profile in the memory architecture. */
export interface LifeProfile {
  firstName: string;
  /** Life areas ranked by importance, most important first. */
  priorities: LifeArea[];
  people: Person[];
  workDays: Weekday[];
  workStart: string; // "09:00"
  workEnd: string; // "17:30"
  wakeTime: string;
  sleepTime: string;
  energyProfile: EnergyProfile;
  /**
   * Honest current capacity — the cohort simulation's clearest finding:
   * overcommitted low-capacity users plateau no matter how well things are
   * timed. 'minimal' generates fewer, smaller commitments and keeps more
   * slack; 'push' allows a fuller week.
   */
  capacity?: 'minimal' | 'steady' | 'push';
  trainingDaysPerWeek: number;
  trainingDurationMin: number;
  trainingPreference: 'gym' | 'home' | 'outdoors' | 'mixed';
  /** Free-text things the user said they want more of. */
  moreOf: string[];
  /** Behaviour catalog keys the user wants less of. */
  lessOf: BehaviourKey[];
  /** Optional personal numbers, asked only where the maths uses them
   * (protein target, training guidance). Never required, never judged. */
  age?: number;
  weightKg?: number;
  kidsCount?: number;
  /** What the workday mostly demands — shapes the work path. */
  workStyle?: 'maker' | 'manager' | 'mixed' | 'physical';
  /** The user's own three-year picture, in their words. */
  lifeVision?: string;
  createdAt: string;
  updatedAt: string;
}

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sunday = 0, matches Date.getDay()

/**
 * Runnable session kinds — the explicit link from a routine/plan item to
 * the modality that can run it. Never inferred from titles.
 */
export type SessionType =
  | 'breathe'
  | 'meditate'
  | 'workout'
  | 'business_review'
  | 'journal'
  | 'meal_plan';

export type GoalStatus = 'active' | 'paused' | 'achieved' | 'dropped';

/**
 * Goal domains carry different planning logic: a business goal becomes
 * milestones + deep-work blocks, a relationship goal becomes rituals, a
 * trip becomes a planning project plus anticipation. Domain ≠ LifeArea —
 * domain drives structure, area drives scheduling/reporting.
 */
export type GoalDomain =
  | 'health'
  | 'fitness'
  | 'business'
  | 'career'
  | 'finance'
  | 'relationship'
  | 'family'
  | 'friends'
  | 'personal'
  | 'experience'
  | 'behaviour';

export interface GoalMilestone {
  id: string;
  title: string;
  done: boolean;
  /** When it was completed — the goal-stalled detector reads this. */
  doneAt?: string;
}

export interface Goal {
  id: string;
  title: string;
  area: LifeArea;
  domain?: GoalDomain;
  /** The user's own reason. Used sparingly, to reframe when motivation drops. */
  why?: string;
  /** e.g. "4x per week" for behavioural goals. */
  cadencePerWeek?: number;
  milestones?: GoalMilestone[];
  /** The one lever for next week, set by the weekly review session. */
  nextFocus?: string;
  status: GoalStatus;
  createdAt: string;
  /** Routines generated from this goal. */
  routineIds: string[];
}

/**
 * A recurring intended activity. Routines are what the scheduling engine
 * places into days; goals become real through routines.
 */
export interface Routine {
  id: string;
  title: string;
  area: LifeArea;
  goalId?: string;
  /** Links to the evidence-based knowledge base (features/knowledge). */
  protocolId?: string;
  days: Weekday[];
  durationMin: number;
  /** Preferred start window. The engine tries this window first. */
  preferredStart: string; // "12:15"
  preferredEnd: string; // "14:00" — latest acceptable start
  energy: EnergyProfile;
  flexible: boolean;
  /** Protected routines (family dinner, wind-down) are never displaced. */
  protected: boolean;
  /**
   * Happens during work hours (deep-work blocks): scheduled as a fixed
   * carve-out of the work day instead of being placed into free time.
   */
  duringWork?: boolean;
  /** The modality session that runs this routine, if one exists. */
  sessionType?: SessionType;
  tier: PlanTier;
  active: boolean;
}

export type PlanTier = 'must' | 'should' | 'could';

export type PlanItemStatus = 'planned' | 'completed' | 'skipped' | 'rescheduled';

/**
 * Where the evidence for a completion came from. The web MVP is manual-only;
 * the native app adds passive sources. Inference is conservative: being at
 * the gym generates "Looks like you trained — confirm?", never silent
 * completion. Confidence and evidence matter.
 */
export type EvidenceSource =
  | 'manual'
  | 'healthkit'
  | 'location'
  | 'calendar'
  | 'device'
  | 'integration'
  | 'ai_inferred';

export interface CompletionEvidence {
  source: EvidenceSource;
  confidence: number; // 0..1; manual taps are 1
  at: string;
  note?: string;
}

export interface PlanItem {
  id: string;
  date: string; // "2026-09-01"
  start: string; // "12:15"
  end: string;
  title: string;
  area: LifeArea;
  tier: PlanTier;
  status: PlanItemStatus;
  routineId?: string;
  goalId?: string;
  /** The linked goal's next step — a block always knows what it's moving. */
  focus?: string;
  /** Fixed commitments (calendar events) cannot be moved by the engine. */
  fixed: boolean;
  /** Inherited from the routine: the modality session that runs this item. */
  sessionType?: SessionType;
  /** Original scheduled start, set on first move — distinguishes COMPLETED_AFTER_MOVE. */
  movedFrom?: string;
  /** Original duration before a shorten-to-fit, in minutes. */
  shortenedFromMin?: number;
  evidence?: CompletionEvidence;
}

/**
 * The behavioural event stream — every reschedule, shorten, skip and
 * completion, who initiated it, and with what evidence. This dataset is
 * what lets INTENT eventually say "you've moved 7 of your last 9 morning
 * workouts to the evening and completed 6 — make evenings the default?"
 */
export interface PlanActionEvent {
  id: string;
  at: string; // ISO timestamp
  date: string; // plan date the item belonged to
  itemId: string;
  routineId?: string;
  goalId?: string;
  area: LifeArea;
  kind: 'rescheduled' | 'shortened' | 'skipped' | 'completed' | 'reopened';
  originalStart?: string;
  newStart?: string;
  /** Set when the item moved to a different day. */
  newDate?: string;
  originalDurationMin?: number;
  newDurationMin?: number;
  /** Whether INTENT suggested this change or the user initiated it. */
  initiatedBy: 'user' | 'intent';
  reason?: string;
  evidence?: CompletionEvidence;
}

export interface DailyPlan {
  date: string;
  items: PlanItem[];
  /** One personal intention for the day, e.g. "No social media before lunch." */
  intention?: string;
  /** The behaviour intention being protected today. */
  protectBehaviour?: BehaviourKey;
  /** One thing to look forward to. */
  lookForward?: string;
  /** Short engine/AI summary, e.g. "Busy morning. Protect your afternoon." */
  summary?: string;
  approvedAt?: string;
}

export type BehaviourKey =
  | 'doomscrolling'
  | 'alcohol'
  | 'vaping'
  | 'social_media'
  | 'shopping'
  | 'junk_food'
  | 'late_nights';

export interface BehaviourIntention {
  id: string;
  behaviour: BehaviourKey;
  /** Supportive framing chosen by the user, e.g. "Fewer drinks on weeknights". */
  intentionText: string;
  createdAt: string;
  active: boolean;
}

/** A logged occurrence of a behaviour the user is working on. Neutral data, not failure. */
export interface BehaviourEvent {
  id: string;
  intentionId: string;
  occurredAt: string;
  trigger?: string;
  context?: string;
}

export type ReflectionMood = 1 | 2 | 3 | 4 | 5;

export interface Reflection {
  id: string;
  date: string;
  kind: 'morning' | 'evening' | 'journal';
  mood?: ReflectionMood;
  wentWell?: string;
  gotInTheWay?: string;
  /** Journal entries: gratitude gets its own line. */
  gratefulFor?: string;
  adjustTomorrow?: string;
  createdAt: string;
}

/**
 * A suggestion produced by the adaptation engine or an AI agent.
 * Tracking accepted/dismissed outcomes feeds future recommendations.
 */
export interface Suggestion {
  id: string;
  kind:
    | 'move_routine'
    | 'shorten_workout'
    | 'protect_time'
    | 'goal_stalled'
    | 'plan_adjustment'
    | 'connection';
  message: string;
  /** Why the system is suggesting this — always shown to the user. */
  reason: string;
  /** Structured payload the accept action applies, validated per kind. */
  payload?: Record<string, unknown>;
  confidence: number; // 0..1
  status: 'open' | 'accepted' | 'dismissed' | 'expired';
  createdAt: string;
}

export interface WeeklyReview {
  weekStart: string; // Monday date
  narrative: string;
  wentWell: string[];
  struggled: string[];
  proposedChanges: string[];
  stats: {
    completionRate: number;
    completionByArea: Partial<Record<LifeArea, { completed: number; planned: number }>>;
    behaviourEventCounts: Partial<Record<BehaviourKey, number>>;
    checkInsCompleted: number;
  };
  createdAt: string;
}

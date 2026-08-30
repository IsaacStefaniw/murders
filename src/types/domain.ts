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
  trainingDaysPerWeek: number;
  trainingDurationMin: number;
  trainingPreference: 'gym' | 'home' | 'outdoors' | 'mixed';
  /** Free-text things the user said they want more of. */
  moreOf: string[];
  /** Behaviour catalog keys the user wants less of. */
  lessOf: BehaviourKey[];
  createdAt: string;
  updatedAt: string;
}

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sunday = 0, matches Date.getDay()

export type GoalStatus = 'active' | 'paused' | 'achieved' | 'dropped';

export interface Goal {
  id: string;
  title: string;
  area: LifeArea;
  why?: string;
  /** e.g. "4x per week" for behavioural goals. */
  cadencePerWeek?: number;
  /** The first concrete milestone, when the user named one. */
  firstMilestone?: string;
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
  tier: PlanTier;
  active: boolean;
}

export type PlanTier = 'must' | 'should' | 'could';

export type PlanItemStatus = 'planned' | 'completed' | 'skipped' | 'rescheduled';

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
  /** Fixed commitments (calendar events) cannot be moved by the engine. */
  fixed: boolean;
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
  kind: 'morning' | 'evening';
  mood?: ReflectionMood;
  wentWell?: string;
  gotInTheWay?: string;
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

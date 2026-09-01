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

/** Practices the user ALREADY does — captured at onboarding so INTENT
 * builds on established behaviour instead of prescribing from zero. */
export type ExistingHabitKey =
  | 'fasting'
  | 'workout'
  | 'walking'
  | 'running'
  | 'meditation'
  | 'sauna'
  | 'cold'
  | 'journaling';

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
  /** What's already part of their life — the foundations INTENT builds on. */
  existingHabits?: ExistingHabitKey[];
  /** Optional personal numbers, asked only where the maths uses them
   * (protein target, training guidance). Never required, never judged. */
  age?: number;
  weightKg?: number;
  kidsCount?: number;
  /** What the workday mostly demands — shapes the work path. */
  workStyle?: 'maker' | 'manager' | 'mixed' | 'physical';
  /** Honest sleep quality — 'broken' promotes the wind-down to protected
   * and adds morning light; training auto-regulation reads it later. */
  sleepQuality?: 'good' | 'broken' | 'varies';
  /** Current pressure level — 'redline' adds a midday NSDR reset. */
  pressure?: 'calm' | 'full' | 'redline';
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

/**
 * A measurable completion condition for a milestone rung. Where one can be
 * stated, the system checks it off from evidence — a metric observation, a
 * count of completed sessions, a consistency streak — instead of asking.
 * 'confirm' rungs stay the honest fallback: only the user can say "done".
 */
export type DoneWhen =
  | { kind: 'metric'; metricKey: string; op: 'gte' | 'lte'; value: number; unit?: string }
  | { kind: 'count'; target: number }
  | { kind: 'streak'; weeks: number; minPerWeek: number }
  | { kind: 'confirm' };

/**
 * One recurring measurement a goal needs. Observations land in the shared
 * metrics stream. 'health' arrives from Apple Health, 'plan' is derived
 * from completed sessions (no user effort), 'ask' is one question at the
 * stated cadence — never a form.
 */
export interface CheckinSpec {
  id: string;
  metricKey: string;
  label: string;
  unit?: string;
  cadenceDays: number;
  source: 'health' | 'plan' | 'ask';
  /** The one-line ask, for 'ask' check-ins. */
  prompt?: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  done: boolean;
  /** When it was completed — the goal-stalled detector reads this. */
  doneAt?: string;
  /** Measurable completion condition; absent means user-confirmed. */
  doneWhen?: DoneWhen;
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
  /** How progress is measured — the goal composer drafts these. */
  checkins?: CheckinSpec[];
  /**
   * When it is meant to be true by. Optional on purpose: plenty of goals are
   * directions rather than deadlines, and inventing a date for those would
   * manufacture a failure the person never signed up for. Where one exists,
   * the trajectory engine can say whether the current rate arrives in time.
   */
  targetDate?: string;
  status: GoalStatus;
  createdAt: string;
  /** Routines generated from this goal. */
  routineIds: string[];
}

/**
 * One set, as performed. Weight and reps as typed — estimates are derived
 * on read, never written back over what the person actually entered.
 */
export interface LoggedSet {
  id: string;
  /** Exercise name as shown in the session; the join key back to the programme. */
  exercise: string;
  /** 1-based position within that exercise. */
  index: number;
  reps: number;
  /** Absent for bodyweight and unloaded work, which is not a gap. */
  weightKg?: number;
  rpe?: number;
  at: string;
}

/** A performed session. Stays editable after the fact — memory is not evidence. */
export interface WorkoutLog {
  id: string;
  /** Date key of the session, not of the typing. */
  date: string;
  title: string;
  sets: LoggedSet[];
  durationMin?: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
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
  /** Anchored on something the user already does — INTENT is organising
   * and upgrading an existing habit, not prescribing a new one. */
  established?: boolean;
  /**
   * The hour is part of what this is. The scheduler may slide it, but only
   * near its window — a dinner pushed to the morning has become false, not
   * merely inconvenient.
   */
  timeAnchored?: boolean;
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
  | 'smoking'
  | 'social_media'
  | 'gaming'
  | 'porn'
  | 'shopping'
  | 'gambling'
  | 'junk_food'
  | 'sugar'
  | 'late_caffeine'
  | 'late_nights'
  | 'phone_in_bed'
  | 'overworking'
  | 'procrastination';

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
  /**
   * What it actually was, in the user's own words — "one piece of Kit Kat",
   * "two beers", "40 minutes on Instagram". Free text on purpose: the moment
   * this becomes a quantity the app scores, it stops being a log and starts
   * being a scoreboard.
   */
  detail?: string;
  /**
   * How big it was RELATIVE TO THIS PERSON'S USUAL — not an absolute
   * measure, and never a judgement. It exists so the pattern engine can tell
   * a nibble from a night, and for nothing else.
   */
  size?: 'small' | 'usual' | 'more';
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

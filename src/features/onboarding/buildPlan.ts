/**
 * Turns Life Interview answers into a structured Life Operating Plan:
 * profile + starter goals + the routines that make them real + behaviour
 * intentions. Pure and unit-testable.
 */

import { behaviourInfo } from '@/features/behaviours/catalog';
import { buildGoalPlan, parseGoal } from '@/features/goals/goalPlanner';
import { protocolById, toRoutine } from '@/features/knowledge/protocols';
import type { PathId } from '@/features/paths/definitions';
import { dedupeRoutines } from '@/features/planner/mergeRoutines';
import { newId } from '@/lib/dates';
import type {
  BehaviourIntention,
  BehaviourKey,
  EnergyProfile,
  ExistingHabitKey,
  Goal,
  LifeArea,
  LifeProfile,
  Person,
  PhysicalConstraint,
  Routine,
  Weekday,
} from '@/types/domain';
import { worksSomewhere, type WeekShape } from './markets';
import type { InterviewAnswers } from './script';

export interface LifeOperatingPlan {
  profile: LifeProfile;
  goals: Goal[];
  routines: Routine[];
  behaviourIntentions: BehaviourIntention[];
  /** Paths the interview answers already justify — started at approval so
   * day one carries tailored protocols, milestones and advice. */
  pathStarts: { id: PathId; answers: Record<string, string> }[];
}

/** Which knowledge-base protocol carries each existing habit. */
export const HABIT_PROTOCOL: Partial<Record<ExistingHabitKey, string>> = {
  walking: 'daily-walk',
  running: 'zone2',
  meditation: 'meditation-10',
  sauna: 'sauna',
  cold: 'cold-finish',
  journaling: 'evening-journal',
  fasting: 'fasting-window',
  workout: 'strength',
};

const TRAINING_WINDOWS: Record<EnergyProfile, { start: string; end: string }> = {
  morning: { start: '06:15', end: '07:30' },
  midday: { start: '12:05', end: '13:15' },
  evening: { start: '17:45', end: '19:30' },
  any: { start: '12:05', end: '13:15' },
};

function str(answers: InterviewAnswers, key: string, fallback = ''): string {
  const v = answers[key];
  return typeof v === 'string' ? v.trim() : fallback;
}

function arr(answers: InterviewAnswers, key: string): string[] {
  const v = answers[key];
  return Array.isArray(v) ? v : [];
}

/** Pick training weekdays spread across the week, avoiding adjacent days where possible. */
export function pickTrainingDays(count: number, workDays: Weekday[]): Weekday[] {
  const preferred: Weekday[] = [1, 3, 5, 6, 2, 4, 0];
  const chosen: Weekday[] = [];
  for (const day of preferred) {
    if (chosen.length >= count) break;
    chosen.push(day);
  }
  // Prefer work days for lunchtime sessions — but availability beats theory;
  // the adaptation engine will correct this over time.
  void workDays;
  return chosen.sort((a, b) => a - b);
}

export function buildLifeOperatingPlan(answers: InterviewAnswers): LifeOperatingPlan {
  const now = new Date().toISOString();

  const household = arr(answers, 'household');
  const hasPartner = household.includes('partner');
  const hasKids = household.includes('kids');
  const partnerName = str(answers, 'partnerName');

  const people: Person[] = [];
  if (hasPartner) {
    people.push({ id: newId('p'), name: partnerName || 'Partner', relation: 'partner' });
  }
  if (hasKids) {
    people.push({ id: newId('p'), name: 'The kids', relation: 'child' });
  }
  // Everyone named here becomes someone the app can plan around and refer
  // to. An option that changed nothing would be worse than not offering it:
  // it would ask about the person taking up most of someone's week and then
  // behave as though they had said nothing.
  if (household.includes('grandkids')) {
    people.push({ id: newId('p'), name: 'The grandchildren', relation: 'family' });
  }
  if (household.includes('parent')) {
    people.push({ id: newId('p'), name: 'The person I care for', relation: 'family' });
  }

  const [workStart, workEnd] = (str(answers, 'workHours', '09:00-17:30') || '09:00-17:30').split(
    '-',
  );
  const [wakeTime, sleepTime] = (str(answers, 'sleep', '06:30-22:30') || '06:30-22:30').split('-');
  const energyProfile = (str(answers, 'energy', 'morning') || 'morning') as EnergyProfile;
  const capacity = (str(answers, 'capacity', 'steady') || 'steady') as NonNullable<
    LifeProfile['capacity']
  >;
  // The simulation's clearest lesson: plan to real capacity, not ambition.
  //
  // Zero is a real answer and must survive. `Number(x) || 3` read '0' as
  // falsy and handed back three sessions a week, so someone who said they
  // did not want to train was given a training plan anyway — the exact
  // failure for anyone whose body, or life, is not up for it right now.
  const rawTraining = str(answers, 'trainingDays');
  const parsedTraining = rawTraining === undefined || rawTraining === '' ? 3 : Number(rawTraining);
  const requestedTraining =
    Number.isFinite(parsedTraining) && parsedTraining >= 0 ? parsedTraining : 3;
  const trainingDaysPerWeek =
    capacity === 'minimal' ? Math.min(requestedTraining, 3) : requestedTraining;
  const wantsTraining = trainingDaysPerWeek > 0;
  const lessOf = arr(answers, 'lessOf') as BehaviourKey[];
  const priorities = arr(answers, 'priorities') as LifeArea[];

  const age = Number(str(answers, 'age')) || undefined;
  const sexAtBirth =
    (str(answers, 'sexAtBirth') as LifeProfile['sexAtBirth']) || undefined;
  const weightKg = Number(str(answers, 'weight')) || undefined;
  const kidsCount = Number(str(answers, 'kidsCount')) || (hasKids ? 1 : undefined);
  const workStyle =
    (str(answers, 'workStyle') as LifeProfile['workStyle']) || undefined;
  const sleepQuality =
    (str(answers, 'sleepQuality') as LifeProfile['sleepQuality']) || undefined;
  const pressure = (str(answers, 'pressure') as LifeProfile['pressure']) || undefined;
  const lifeVision = str(answers, 'vision') || undefined;
  const weekShape = (str(answers, 'weekShape') || 'employed') as WeekShape;
  const walking = str(answers, 'trainingSetup') === 'walking';
  const existingHabits = arr(answers, 'existingHabits') as ExistingHabitKey[];
  const constraints = arr(answers, 'constraints') as PhysicalConstraint[];
  const hasHabit = (h: ExistingHabitKey) => existingHabits.includes(h);

  const profile: LifeProfile = {
    firstName: str(answers, 'name', 'there') || 'there',
    priorities: priorities.length > 0 ? priorities : ['family', 'health', 'work'],
    people,
    workDays: arr(answers, 'workDays').map(Number).filter((d) => d >= 0 && d <= 6) as Weekday[],
    workStart,
    workEnd,
    wakeTime,
    sleepTime,
    energyProfile,
    capacity,
    trainingDaysPerWeek,
    trainingDurationMin: capacity === 'minimal' ? 30 : 45,
    trainingPreference: walking
      ? 'outdoors'
      : (str(answers, 'trainingSetup', 'mixed') as LifeProfile['trainingPreference']) || 'mixed',
    moreOf: arr(answers, 'moreOf'),
    lessOf,
    existingHabits: existingHabits.length > 0 ? existingHabits : undefined,
    constraints: constraints.length > 0 ? constraints : undefined,
    weekShape,
    age,
    sexAtBirth,
    weightKg,
    kidsCount,
    workStyle,
    sleepQuality,
    pressure,
    lifeVision,
    createdAt: now,
    updatedAt: now,
  };
  // Only invent a working week for someone who told us they have one.
  //
  // This used to be unconditional, so anyone who is retired, caring at
  // home, or between jobs had a Monday-to-Friday 9-to-5 written into their
  // profile and blocked out of their calendar. Their whole first plan was
  // then built around a job they do not have. An empty week is not missing
  // data for those people — it is the answer.
  if (worksSomewhere(weekShape) && profile.workDays.length === 0) {
    profile.workDays = [1, 2, 3, 4, 5];
  }

  const goals: Goal[] = [];
  const routines: Routine[] = [];

  // A fitness-domain ambition OWNS the training program (its goal carries
  // the milestones the calendar must serve) — building a second generic
  // training routine would only duplicate or, worse, orphan it.
  const ambition = str(answers, 'ambition');
  const parsedAmbition = ambition ? parseGoal(ambition) : null;
  const ambitionOwnsTraining = !walking && parsedAmbition?.domain === 'fitness';

  // Someone who said they do not want to train does not get a training
  // goal, a training routine, or a "Train 0× a week" card. Zero means
  // zero; the rest of the plan carries on without it.
  if (wantsTraining) {
    // Training goal → training routines. Walking is real training: it gets
    // the daily-walk protocol at the asked-for cadence, not a gym program.
    const trainingWindow = TRAINING_WINDOWS[energyProfile];
    const trainingGoal: Goal = {
      id: newId('g'),
      title: walking ? `Walk ${trainingDaysPerWeek}× a week` : `Train ${trainingDaysPerWeek}× a week`,
      area: 'health',
      cadencePerWeek: trainingDaysPerWeek,
      status: 'active',
      createdAt: now,
      routineIds: [],
    };
    if (walking) {
      const walk = protocolById('daily-walk');
      if (walk) {
        const walkRoutine = toRoutine(walk, profile, trainingGoal.id);
        walkRoutine.days = pickTrainingDays(Math.max(trainingDaysPerWeek, 3), profile.workDays);
        trainingGoal.routineIds.push(walkRoutine.id);
        routines.push(walkRoutine);
      }
    } else if (ambitionOwnsTraining) {
      // The ambition's goal will carry the workout routine — no generic twin.
    } else {
      const trainingRoutine: Routine = {
        id: newId('r'),
        title: 'Strength workout',
        area: 'health',
        protocolId: 'strength',
        goalId: trainingGoal.id,
        days: pickTrainingDays(trainingDaysPerWeek, profile.workDays),
        durationMin: profile.trainingDurationMin,
        preferredStart: trainingWindow.start,
        preferredEnd: trainingWindow.end,
        energy: energyProfile,
        flexible: true,
        protected: false,
        sessionType: 'workout',
        tier: 'should',
        active: true,
      };
      trainingGoal.routineIds.push(trainingRoutine.id);
      routines.push(trainingRoutine);
    }
    if (!ambitionOwnsTraining) goals.push(trainingGoal);
  }

  /**
   * A week with no job still has a shape, and this is where it comes from.
   *
   * Without this, someone retired finished onboarding and got a plan
   * containing a wind-down and not much else — an empty calendar that
   * reads as "there is nothing here for you". Their week is not empty;
   * it has a walking group on Tuesday and the grandchildren on Thursday.
   * Asked for, those become the frame, and everything else is planned
   * around them exactly as work is for everybody else.
   *
   * They go in FLEXIBLE and unprotected on purpose. These are the
   * person's own commitments, already happening; the app's job is to know
   * about them and plan around them, not to start reminding a
   * seventy-year-old to attend their own bowls club.
   */
  const anchorPicks = arr(answers, 'weekAnchors');
  if (!worksSomewhere(weekShape) && anchorPicks.length > 0) {
    const ANCHORS: Record<
      string,
      { title: string; area: LifeArea; days: Weekday[]; durationMin: number; start: string }
    > = {
      family: { title: 'Time with family', area: 'family', days: [4], durationMin: 180, start: '10:00' },
      volunteering: { title: 'Volunteering', area: 'growth', days: [2], durationMin: 180, start: '09:30' },
      group: { title: 'Class or club', area: 'enjoyment', days: [3], durationMin: 90, start: '10:00' },
      faith: { title: 'Church or community', area: 'growth', days: [0], durationMin: 120, start: '09:30' },
      appointments: { title: 'Appointments', area: 'health', days: [1], durationMin: 90, start: '10:00' },
      care: { title: 'Caring', area: 'family', days: [1, 3, 5], durationMin: 180, start: '09:00' },
      work: { title: 'Paid work', area: 'work', days: [2, 4], durationMin: 240, start: '09:00' },
    };
    for (const pick of anchorPicks) {
      const spec = ANCHORS[pick];
      if (!spec) continue;
      routines.push({
        id: newId('r'),
        title: spec.title,
        area: spec.area,
        days: spec.days,
        durationMin: spec.durationMin,
        preferredStart: spec.start,
        preferredEnd: spec.start,
        energy: 'any',
        flexible: true,
        protected: false,
        tier: 'should',
        active: true,
      });
    }
  }

  // Family dinner: protected daily anchor when family is present.
  if (hasKids || hasPartner) {
    routines.push({
      id: newId('r'),
      title: hasKids ? 'Family dinner' : 'Dinner together',
      area: 'family',
      // It is the device-free meal practice, so the library shows it as
      // already on and the family pathway does not schedule it a second time.
      protocolId: 'device-free-meal',
      days: [0, 1, 2, 3, 4, 5, 6],
      durationMin: 45,
      preferredStart: '18:00',
      preferredEnd: '18:45',
      energy: 'evening',
      flexible: false,
      protected: true,
      tier: 'must',
      active: true,
    });
  }

  // Date night: weekly when the user has a partner or asked for it.
  if (hasPartner || profile.moreOf.includes('Date nights')) {
    const dateGoal: Goal = {
      id: newId('g'),
      title: partnerName ? `Regular date nights with ${partnerName}` : 'Regular date nights',
      area: 'relationship',
      cadencePerWeek: 1,
      status: 'active',
      createdAt: now,
      routineIds: [],
    };
    const dateRoutine: Routine = {
      id: newId('r'),
      title: 'Date night',
      area: 'relationship',
      goalId: dateGoal.id,
      days: [5],
      durationMin: 120,
      preferredStart: '19:30',
      preferredEnd: '20:15',
      energy: 'evening',
      flexible: true,
      // A date night at 09:40 is not a date night. The scheduler may
      // slide it within the evening and no further.
      timeAnchored: true,
      protected: false,
      tier: 'should',
      active: true,
    };
    dateGoal.routineIds.push(dateRoutine.id);
    goals.push(dateGoal);
    routines.push(dateRoutine);
  }

  // Wind-down routine protects sleep, especially with a late-nights
  // intention or honestly-broken sleep — then it's non-negotiable.
  const guardSleep = lessOf.includes('late_nights') || sleepQuality === 'broken';
  routines.push({
    id: newId('r'),
    title: 'Wind down, screens away',
    area: 'health',
    protocolId: 'wind-down',
    sessionType: 'breathe' as const,
    days: [0, 1, 2, 3, 4],
    durationMin: 20,
    preferredStart: minusMinutes(sleepTime, 35),
    preferredEnd: minusMinutes(sleepTime, 20),
    energy: 'evening',
    flexible: false,
    protected: guardSleep,
    tier: guardSleep ? 'must' : 'could',
    active: true,
  });

  // Broken sleep gets the strongest free lever there is: morning light
  // anchors the clock so the wind-down has something to work with.
  if (sleepQuality === 'broken') {
    const light = protocolById('morning-light');
    if (light) routines.push(toRoutine(light, profile));
  }

  // Redline pressure: a midday NSDR reset — recovery scheduled like a
  // meeting, because at redline "when I get a minute" never arrives.
  if (pressure === 'redline') {
    const nsdr = protocolById('nsdr');
    if (nsdr) routines.push(toRoutine(nsdr, profile));
  }

  // Friend connection when asked for.
  if (profile.moreOf.includes('Seeing friends')) {
    goals.push({
      id: newId('g'),
      title: 'Stay close to friends',
      area: 'enjoyment',
      cadencePerWeek: 1,
      status: 'active',
      createdAt: now,
      routineIds: [],
    });
  }

  // Weekend family block: unstructured time is what kids remember.
  if (hasKids) {
    const wantsMoreKidTime = profile.moreOf.includes('Time with the kids');
    routines.push({
      id: newId('r'),
      title: 'Family adventure',
      area: 'family',
      days: wantsMoreKidTime ? [0, 6] : [6],
      durationMin: 90,
      preferredStart: '09:30',
      preferredEnd: '10:30',
      energy: 'morning',
      flexible: true,
      protected: false,
      tier: 'should',
      active: true,
    });
  }

  // One-on-one time: each kid getting their own slice of you. With two or
  // more kids one Sunday slot can't rotate fairly — it runs both weekend days.
  if (hasKids && profile.moreOf.includes('Time with the kids')) {
    routines.push({
      id: newId('r'),
      title: 'One-on-one time with each kid',
      area: 'family',
      days: (kidsCount ?? 1) >= 2 ? [0, 6] : [0],
      durationMin: 45,
      preferredStart: '15:30',
      preferredEnd: '16:30',
      energy: 'any',
      flexible: true,
      protected: false,
      tier: 'could',
      active: true,
    });
  }

  // Friend connection: the lightest possible action — a message that makes a plan.
  const friendsGoal = goals.find((g) => g.title === 'Stay close to friends');
  if (friendsGoal) {
    const reachOut: Routine = {
      id: newId('r'),
      title: 'Message a friend, make a plan',
      area: 'enjoyment',
      protocolId: 'friend-reach-out',
      goalId: friendsGoal.id,
      days: [3],
      durationMin: 15,
      preferredStart: '12:45',
      preferredEnd: '13:15',
      energy: 'midday',
      flexible: true,
      protected: false,
      tier: 'could',
      active: true,
    };
    friendsGoal.routineIds.push(reachOut.id);
    routines.push(reachOut);
  }

  // Reading replaces the evening scroll window — a want in place of a regret.
  if (profile.moreOf.includes('Reading')) {
    routines.push({
      id: newId('r'),
      title: 'Read',
      area: 'growth',
      days: [0, 1, 2, 3, 4],
      durationMin: 20,
      preferredStart: minusMinutes(sleepTime, 65),
      preferredEnd: minusMinutes(sleepTime, 45),
      energy: 'evening',
      flexible: true,
      protected: false,
      tier: 'could',
      active: true,
    });
  }

  // Creative time: making, not consuming — defended evenings.
  if (profile.moreOf.includes('Creative time')) {
    const creative = protocolById('creative-block');
    if (creative) routines.push(toRoutine(creative, profile));
  }

  // Deep work happens inside work hours, carved out as a fixed block.
  if (profile.moreOf.includes('Deep work')) {
    routines.push({
      id: newId('r'),
      title: 'Deep work block',
      area: 'work',
      protocolId: 'deep-work',
      days: profile.workDays.slice(0, 2),
      durationMin: 60,
      preferredStart: '09:15',
      preferredEnd: '10:15',
      energy: 'morning',
      flexible: false,
      protected: false,
      duringWork: true,
      tier: 'must',
      active: true,
    });
  }

  // Headspace toolkit: chosen modalities get a place in the week.
  const mind = arr(answers, 'mind');
  if (mind.includes('meditation')) {
    routines.push({
      id: newId('r'),
      title: 'Sit for ten',
      area: 'health',
      protocolId: 'meditation-10',
      days: [0, 2, 4],
      durationMin: 10,
      preferredStart: '13:00',
      preferredEnd: '13:45',
      energy: 'midday',
      flexible: true,
      protected: false,
      sessionType: 'meditate',
      tier: 'could',
      active: true,
    });
  }
  if (mind.includes('breathing')) {
    // Breathing lives at the moments that need it (urges, wind-down) —
    // extend the guided wind-down to every night rather than adding blocks.
    const windDown = routines.find((r) => r.sessionType === 'breathe');
    if (windDown) windDown.days = [0, 1, 2, 3, 4, 5, 6];
  }
  if (mind.includes('sauna')) {
    routines.push({
      id: newId('r'),
      title: 'Sauna & recover',
      area: 'health',
      protocolId: 'sauna',
      days: capacity === 'minimal' ? [6] : [3, 6],
      durationMin: 30,
      preferredStart: '18:45',
      preferredEnd: '19:45',
      energy: 'evening',
      flexible: true,
      protected: false,
      tier: 'could',
      active: true,
    });
  }

  // ── Existing habits: the foundations. Anything the user ALREADY does
  // gets scheduled as an established anchor — organised and upgraded,
  // never prescribed back as if it were new. Established routines are the
  // most reliable minutes in the whole plan; the engine builds around them.
  for (const habit of existingHabits) {
    const protocolId = HABIT_PROTOCOL[habit];
    if (!protocolId) continue;
    // 'workout' anchors the training routine that already exists; walking-
    // as-training already owns the walk. Everything else gets its protocol.
    if (habit === 'workout' || (habit === 'walking' && walking)) continue;
    if (!routines.some((r) => r.protocolId === protocolId)) {
      const protocol = protocolById(protocolId);
      if (!protocol) continue;
      const anchored = toRoutine(protocol, profile);
      // Cohort finding (sim v5): at minimal capacity, daily habit anchors
      // overload the calendar the habit was already living outside of.
      // Track the core days; the habit itself doesn't need the schedule.
      if (capacity === 'minimal' && anchored.days.length > 3) {
        anchored.days = anchored.days.filter((day) => [1, 3, 6].includes(day)).slice(0, 3);
        if (anchored.days.length === 0) anchored.days = [1, 3, 6];
      }
      routines.push(anchored);
    }
  }
  const foodAim = str(answers, 'foodAim');
  const startsNutritionPath = Boolean(foodAim && foodAim !== 'none');

  // Nutrition-lite: structure over logging — a ten-minute Sunday sketch.
  // (When the nutrition path starts, it owns the meal sketch instead.)
  if (profile.moreOf.includes('Cooking real food') && !startsNutritionPath) {
    routines.push({
      id: newId('r'),
      title: 'Sunday meal sketch',
      area: 'health',
      protocolId: 'meal-sketch',
      sessionType: 'meal_plan' as const,
      days: [0],
      durationMin: 15,
      preferredStart: '16:00',
      preferredEnd: '17:00',
      energy: 'any',
      flexible: true,
      protected: false,
      tier: 'could',
      active: true,
    });
  }

  // Adventure & travel: anticipation is a life ingredient, not a luxury.
  if (profile.moreOf.includes('Adventure & travel')) {
    const { goal: tripGoal, routines: tripRoutines } = buildGoalPlan(
      parseGoal('Plan a real adventure trip'),
      profile,
    );
    goals.push(tripGoal);
    routines.push(...tripRoutines);
  }

  // Money: the money path owns this now — started at approval with the
  // interview's mode and automation answers, so day one carries the
  // milestones and the check-in, not just a block.
  const money = str(answers, 'money');
  const startsMoneyPath = Boolean(money && money !== 'none');

  // The free-text ambition runs through the domain-aware goal planner —
  // "Grow the business to $2m" arrives with milestones and a growth block,
  // not as a flat wish.
  if (parsedAmbition) {
    // The work-style answer tailors a business ambition immediately:
    // makers get the thinking time carved out alongside the growth block.
    const ambitionAnswers: Record<string, string> =
      (parsedAmbition.domain === 'business' || parsedAmbition.domain === 'career') &&
      (workStyle === 'maker' || workStyle === 'mixed')
        ? { bottleneck: 'focus' }
        : {};
    // Someone who already trains is 'consistent' even when the interview
    // step was skipped — the habit is the evidence.
    const trainingExperience =
      str(answers, 'trainingExperience') || (hasHabit('workout') ? 'consistent' : '');
    if (ambitionOwnsTraining && trainingExperience) {
      ambitionAnswers.experience = trainingExperience;
    }
    const { goal, routines: goalRoutines } = buildGoalPlan(
      parsedAmbition,
      profile,
      undefined,
      ambitionAnswers,
    );
    goals.push(goal);
    routines.push(...goalRoutines);
  }

  // Minimal capacity: nice-to-haves run at most twice a week. Fewer plans,
  // kept, beat more plans, missed.
  if (capacity === 'minimal') {
    for (const r of routines) {
      if (r.tier === 'could' && r.days.length > 2) r.days = r.days.slice(0, 2);
    }
  }

  const behaviourIntentions: BehaviourIntention[] = lessOf.map((key) => ({
    id: newId('bi'),
    behaviour: key,
    intentionText: behaviourInfo(key).intentionTemplate,
    createdAt: now,
    active: true,
  }));

  // Mark every routine that matches an existing habit as established —
  // wherever it came from (habit anchor, mind toolkit, or the trainer).
  // Runs after ALL routines are assembled, ambition-owned training included.
  const establishedProtocols = new Set(
    existingHabits.map((h) => HABIT_PROTOCOL[h]).filter(Boolean),
  );
  for (const r of routines) {
    if (r.protocolId && establishedProtocols.has(r.protocolId)) r.established = true;
    if (hasHabit('workout') && r.sessionType === 'workout') r.established = true;
  }

  // A deep-work block can arrive from two doors (moreOf + a business
  // ambition); keep one of each protocol. The same rule now guards every
  // later merge into the store — see features/planner/mergeRoutines.
  const dedupedRoutines = dedupeRoutines(routines);

  // Paths the answers already justify — started at approval, so the first
  // day carries tailored milestones, check-ins and advice, not just blocks.
  const pathStarts: LifeOperatingPlan['pathStarts'] = [];
  if (startsNutritionPath) {
    const nutritionAnswers: Record<string, string> = {
      aim: foodAim,
      cooking: profile.moreOf.includes('Cooking real food') ? 'enjoy' : 'normal',
    };
    const foodTrouble = str(answers, 'foodTrouble');
    if (foodTrouble) nutritionAnswers.trouble = foodTrouble;
    // A faster already runs an eating window — their first nutrition lever
    // is live from day one, not something to earn.
    if (hasHabit('fasting')) nutritionAnswers.leverLevel = '1';
    pathStarts.push({ id: 'nutrition', answers: nutritionAnswers });
  }
  if (startsMoneyPath) {
    pathStarts.push({
      id: 'money',
      answers: {
        mode: money === 'checkin' ? 'clarity' : money,
        automation: str(answers, 'moneyAutomation', 'partial') || 'partial',
      },
    });
  }
  if (lessOf.length > 0) {
    pathStarts.push({
      id: 'recovery',
      answers: {
        behaviour: lessOf[0],
        trigger: 'unsure',
        replacement: arr(answers, 'mind').includes('breathing') ? 'breathe' : 'unsure',
      },
    });
  }

  return { profile, goals, routines: dedupedRoutines, behaviourIntentions, pathStarts };
}

function minusMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = (h * 60 + m - minutes + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Where a deferred interview answer lands when it arrives late.
 *
 * The opening interview builds the whole profile at once. A question
 * answered afterwards — inside the pathway that asked for it — has to
 * find its way to the same field, and only that field: rebuilding the
 * profile from the merged answers would also rebuild the goals and
 * routines, discarding whatever the person had since edited.
 *
 * Returns null for a step whose answer does not belong on the profile at
 * all. Those are the pathway ones, and they go through PATH_ANSWER_FOR.
 */
export function profilePatchFor(
  stepId: string,
  value: string | string[] | undefined,
  current: LifeProfile,
): Partial<LifeProfile> | null {
  const one = Array.isArray(value) ? value[0] : value;
  const many = Array.isArray(value) ? value : value ? [value] : [];

  switch (stepId) {
    case 'vision':
      return { lifeVision: one || undefined };
    case 'age':
      return { age: Number(one) || undefined };
    case 'weight':
      return { weightKg: Number(one) || undefined };
    case 'workStyle':
      return { workStyle: (one as LifeProfile['workStyle']) || undefined };
    case 'sleepQuality':
      return { sleepQuality: (one as LifeProfile['sleepQuality']) || undefined };
    case 'pressure':
      return { pressure: (one as LifeProfile['pressure']) || undefined };
    case 'moreOf':
      return { moreOf: many };
    case 'lessOf':
      return { lessOf: many as BehaviourKey[] };
    case 'existingHabits':
      return { existingHabits: many.length > 0 ? (many as ExistingHabitKey[]) : undefined };
    case 'trainingSetup':
      return {
        trainingPreference:
          one === 'walking' ? 'outdoors' : ((one as LifeProfile['trainingPreference']) ?? 'mixed'),
      };
    case 'sexAtBirth':
      // Asked in the training hub weeks after onboarding. Without this case
      // the answer reached the interview record and never the profile, so
      // the library, the anatomy gating and the strength standards kept
      // behaving as if it had never been asked.
      return { sexAtBirth: (one as LifeProfile['sexAtBirth']) || undefined };
    case 'kidsCount':
      return { kidsCount: Number(one) || undefined };
    case 'household': {
      // People are rebuilt rather than appended: answering this twice
      // should not leave two partners in the household.
      const people: Person[] = current.people.filter(
        (p) => p.relation !== 'partner' && p.relation !== 'child',
      );
      if (many.includes('partner')) {
        const existing = current.people.find((p) => p.relation === 'partner');
        people.push({ id: existing?.id ?? newId('p'), name: existing?.name ?? 'Partner', relation: 'partner' });
      }
      if (many.includes('kids')) {
        const existing = current.people.find((p) => p.relation === 'child');
        people.push({ id: existing?.id ?? newId('p'), name: existing?.name ?? 'The kids', relation: 'child' });
      }
      return { people };
    }
    case 'partnerName': {
      if (!one) return null;
      const people = current.people.map((p) => (p.relation === 'partner' ? { ...p, name: one } : p));
      // Naming a partner before saying there is one still means there is one.
      if (!people.some((p) => p.relation === 'partner')) {
        people.push({ id: newId('p'), name: one, relation: 'partner' });
      }
      return { people };
    }
    default:
      return null;
  }
}

/**
 * Deferred answers that belong to a pathway's intake rather than the
 * profile — the ones whose whole job is to change what that coach builds.
 */
export const PATH_ANSWER_FOR: Record<string, { path: PathId; key: string }> = {
  trainingExperience: { path: 'training', key: 'experience' },
  trainingSetup: { path: 'training', key: 'setup' },
  age: { path: 'training', key: 'age' },
  foodAim: { path: 'nutrition', key: 'aim' },
  foodTrouble: { path: 'nutrition', key: 'trouble' },
  weight: { path: 'nutrition', key: 'weightKg' },
  money: { path: 'money', key: 'aim' },
  moneyAutomation: { path: 'money', key: 'automation' },
  workStyle: { path: 'work', key: 'style' },
  sleepQuality: { path: 'recovery', key: 'sleepQuality' },
  pressure: { path: 'recovery', key: 'pressure' },
};

/**
 * Reconstruct the interview answers from a profile that already exists.
 *
 * Needed exactly once, for the people who onboarded before the interview
 * was split. Their answers were never stored — the profile was the only
 * record — so without this every one of them would open the app and be
 * asked eighteen questions they had already sat through. That is a worse
 * first impression than the long interview was.
 *
 * Only what the profile can actually prove. A field the profile does not
 * carry stays unanswered, and the question is asked once, in the pathway
 * that wants it, which is the correct outcome rather than a compromise.
 */
export function answersFromProfile(profile: LifeProfile): InterviewAnswers {
  const answers: InterviewAnswers = {
    name: profile.firstName,
    priorities: profile.priorities,
    capacity: profile.capacity,
    workDays: profile.workDays.map(String),
    workHours: `${profile.workStart}-${profile.workEnd}`,
    sleep: `${profile.wakeTime}-${profile.sleepTime}`,
    energy: profile.energyProfile,
    trainingDays: String(profile.trainingDaysPerWeek),
  };

  if (profile.lifeVision) answers.vision = profile.lifeVision;
  if (profile.age) answers.age = String(profile.age);
  if (profile.sexAtBirth) answers.sexAtBirth = profile.sexAtBirth;
  if (profile.weightKg) answers.weight = String(profile.weightKg);
  if (profile.workStyle) answers.workStyle = profile.workStyle;
  if (profile.sleepQuality) answers.sleepQuality = profile.sleepQuality;
  if (profile.pressure) answers.pressure = profile.pressure;
  if (profile.moreOf.length > 0) answers.moreOf = profile.moreOf;
  if (profile.lessOf.length > 0) answers.lessOf = profile.lessOf;
  if (profile.existingHabits?.length) answers.existingHabits = profile.existingHabits;
  if (profile.kidsCount) answers.kidsCount = String(profile.kidsCount);

  // 'outdoors' is where both 'outdoors' and 'walking' land, so it cannot
  // be reversed — and guessing wrong would hand a walker a barbell
  // programme. Left unanswered, and asked once.
  if (profile.trainingPreference !== 'outdoors') {
    answers.trainingSetup = profile.trainingPreference;
  }

  const household: string[] = [];
  if (profile.people.some((p) => p.relation === 'partner')) household.push('partner');
  if (profile.people.some((p) => p.relation === 'child')) household.push('kids');
  if (household.length > 0) answers.household = household;

  const partner = profile.people.find((p) => p.relation === 'partner');
  if (partner && partner.name !== 'Partner') answers.partnerName = partner.name;

  return answers;
}

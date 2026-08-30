/**
 * Turns Life Interview answers into a structured Life Operating Plan:
 * profile + starter goals + the routines that make them real + behaviour
 * intentions. Pure and unit-testable.
 */

import { behaviourInfo } from '@/features/behaviours/catalog';
import { newId } from '@/lib/dates';
import type {
  BehaviourIntention,
  BehaviourKey,
  EnergyProfile,
  Goal,
  LifeArea,
  LifeProfile,
  Person,
  Routine,
  Weekday,
} from '@/types/domain';
import type { InterviewAnswers } from './script';

export interface LifeOperatingPlan {
  profile: LifeProfile;
  goals: Goal[];
  routines: Routine[];
  behaviourIntentions: BehaviourIntention[];
}

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

  const [workStart, workEnd] = (str(answers, 'workHours', '09:00-17:30') || '09:00-17:30').split(
    '-',
  );
  const [wakeTime, sleepTime] = (str(answers, 'sleep', '06:30-22:30') || '06:30-22:30').split('-');
  const energyProfile = (str(answers, 'energy', 'morning') || 'morning') as EnergyProfile;
  const trainingDaysPerWeek = Number(str(answers, 'trainingDays', '3')) || 3;
  const lessOf = arr(answers, 'lessOf') as BehaviourKey[];
  const priorities = arr(answers, 'priorities') as LifeArea[];

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
    trainingDaysPerWeek,
    trainingDurationMin: 45,
    trainingPreference:
      (str(answers, 'trainingSetup', 'mixed') as LifeProfile['trainingPreference']) || 'mixed',
    moreOf: arr(answers, 'moreOf'),
    lessOf,
    createdAt: now,
    updatedAt: now,
  };
  if (profile.workDays.length === 0) profile.workDays = [1, 2, 3, 4, 5];

  const goals: Goal[] = [];
  const routines: Routine[] = [];

  // Training goal → training routines.
  const trainingWindow = TRAINING_WINDOWS[energyProfile];
  const trainingGoal: Goal = {
    id: newId('g'),
    title: `Train ${trainingDaysPerWeek}× a week`,
    area: 'health',
    cadencePerWeek: trainingDaysPerWeek,
    status: 'active',
    createdAt: now,
    routineIds: [],
  };
  const trainingRoutine: Routine = {
    id: newId('r'),
    title: 'Strength workout',
    area: 'health',
    goalId: trainingGoal.id,
    days: pickTrainingDays(trainingDaysPerWeek, profile.workDays),
    durationMin: profile.trainingDurationMin,
    preferredStart: trainingWindow.start,
    preferredEnd: trainingWindow.end,
    energy: energyProfile,
    flexible: true,
    protected: false,
    tier: 'should',
    active: true,
  };
  trainingGoal.routineIds.push(trainingRoutine.id);
  goals.push(trainingGoal);
  routines.push(trainingRoutine);

  // Family dinner: protected daily anchor when family is present.
  if (hasKids || hasPartner) {
    routines.push({
      id: newId('r'),
      title: hasKids ? 'Family dinner' : 'Dinner together',
      area: 'family',
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
      protected: false,
      tier: 'should',
      active: true,
    };
    dateGoal.routineIds.push(dateRoutine.id);
    goals.push(dateGoal);
    routines.push(dateRoutine);
  }

  // Wind-down routine protects sleep, especially with a late-nights intention.
  routines.push({
    id: newId('r'),
    title: 'Wind down, screens away',
    area: 'health',
    days: [0, 1, 2, 3, 4],
    durationMin: 20,
    preferredStart: minusMinutes(sleepTime, 35),
    preferredEnd: minusMinutes(sleepTime, 20),
    energy: 'evening',
    flexible: false,
    protected: lessOf.includes('late_nights'),
    tier: lessOf.includes('late_nights') ? 'must' : 'could',
    active: true,
  });

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

  // Friend connection: the lightest possible action — a message that makes a plan.
  const friendsGoal = goals.find((g) => g.title === 'Stay close to friends');
  if (friendsGoal) {
    const reachOut: Routine = {
      id: newId('r'),
      title: 'Message a friend, make a plan',
      area: 'enjoyment',
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

  // Deep work happens inside work hours, carved out as a fixed block.
  if (profile.moreOf.includes('Deep work')) {
    routines.push({
      id: newId('r'),
      title: 'Deep work block',
      area: 'work',
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

  // Free-text ambition becomes a goal seed.
  const ambition = str(answers, 'ambition');
  if (ambition) {
    goals.push({
      id: newId('g'),
      title: ambition,
      area: 'growth',
      status: 'active',
      createdAt: now,
      routineIds: [],
    });
  }

  const behaviourIntentions: BehaviourIntention[] = lessOf.map((key) => ({
    id: newId('bi'),
    behaviour: key,
    intentionText: behaviourInfo(key).intentionTemplate,
    createdAt: now,
    active: true,
  }));

  return { profile, goals, routines, behaviourIntentions };
}

function minusMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = (h * 60 + m - minutes + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Goal planner — INTENT does the structuring, not the user.
 *
 * From one sentence ("Grow the business to $2m revenue") this module infers
 * the domain, extracts target and timeframe, and produces a domain-shaped
 * plan: milestones plus the recurring behaviour that makes the goal real.
 * The AI agent (lib/ai) can refine this; the deterministic path is always
 * available and is the fallback.
 */

import { newId } from '@/lib/dates';
import type {
  Goal,
  GoalDomain,
  GoalMilestone,
  LifeArea,
  LifeProfile,
  Routine,
  Weekday,
} from '@/types/domain';

export interface ParsedGoal {
  title: string;
  domain: GoalDomain;
  area: LifeArea;
  target?: string;
  timeframe?: string;
}

export interface GoalPlan {
  goal: Goal;
  routines: Routine[];
}

const DOMAIN_AREA: Record<GoalDomain, LifeArea> = {
  health: 'health',
  fitness: 'health',
  business: 'work',
  career: 'work',
  finance: 'admin',
  relationship: 'relationship',
  family: 'family',
  friends: 'enjoyment',
  personal: 'growth',
  experience: 'enjoyment',
  behaviour: 'health',
};

const DOMAIN_MATCHERS: [GoalDomain, RegExp][] = [
  ['behaviour', /\b(quit|stop|cut down|reduce|less|drink less|vape|vaping|smoking|scroll)\b/i],
  ['business', /\b(business|revenue|clients?|sales|launch|startup|company|customers?)\b/i],
  ['career', /\b(promotion|career|new job|role|salary)\b/i],
  ['finance', /\b(save|savings|debt|invest|mortgage|deposit|budget)\b/i],
  ['fitness', /\b(train|gym|run|marathon|5k|10k|strength|muscle|weight|fitness|kg|kilos?|lbs)\b/i],
  ['health', /\b(sleep|meditat|stress|energy|health|blood pressure)\b/i],
  ['relationship', /\b(wife|husband|partner|marriage|date night|relationship|couple)\b/i],
  ['family', /\b(kids?|family|son|daughter|children|dad|mum|parent)\b/i],
  ['friends', /\b(friends?|mates?|catch up)\b/i],
  ['experience', /\b(trip|travel|holiday|vacation|adventure|visit|weekend away)\b/i],
];

export function parseGoal(text: string): ParsedGoal {
  const title = text.trim().replace(/^i want to /i, '').replace(/^i want /i, '');
  const domain =
    DOMAIN_MATCHERS.find(([, re]) => re.test(text))?.[0] ?? ('personal' as GoalDomain);
  const target = text.match(/\$[\d,.]+\s*[mk]?|\b[\d,.]+\s*(?:kg|km|k\b|%|million)/i)?.[0]?.trim();
  const timeframe = text.match(
    /\bby (?:january|february|march|april|may|june|july|august|september|october|november|december|\d{4}|next \w+)|\bthis year\b|\bin \d+ (?:weeks?|months?|years?)\b/i,
  )?.[0];
  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    domain,
    area: DOMAIN_AREA[domain],
    target,
    timeframe,
  };
}

function milestone(title: string): GoalMilestone {
  return { id: newId('ms'), title, done: false };
}

function routineBase(goalId: string, area: LifeArea): Omit<Routine, 'id' | 'title' | 'days' | 'durationMin' | 'preferredStart' | 'preferredEnd'> {
  return {
    area,
    goalId,
    energy: 'any',
    flexible: true,
    protected: false,
    tier: 'should',
    active: true,
  };
}

/** Domain-shaped milestones + recurring behaviour. Deterministic; AI refines. */
export function buildGoalPlan(parsed: ParsedGoal, profile: LifeProfile | null, why?: string): GoalPlan {
  const goalId = newId('g');
  const workDays: Weekday[] = profile?.workDays?.length ? profile.workDays : [1, 2, 3, 4, 5];
  const shortTitle = parsed.title.length > 30 ? `${parsed.title.slice(0, 27)}…` : parsed.title;
  let milestones: GoalMilestone[] = [];
  const routines: Routine[] = [];

  switch (parsed.domain) {
    case 'business':
    case 'career':
      milestones = [
        milestone('Establish the current baseline'),
        milestone(parsed.target ? `Define the gap to ${parsed.target}` : 'Define the gap'),
        milestone('Identify the two biggest growth levers'),
        milestone('Set the monthly target'),
      ];
      routines.push({
        ...routineBase(goalId, 'work'),
        id: newId('r'),
        title: `Growth block: ${shortTitle}`,
        days: [workDays[0] ?? 2],
        durationMin: 90,
        preferredStart: '09:15',
        preferredEnd: '10:45',
        energy: 'morning',
        flexible: false,
        duringWork: true,
        sessionType: 'business_review',
        tier: 'must',
      });
      break;

    case 'fitness':
    case 'health':
      milestones = [milestone('First week done'), milestone('Four consistent weeks')];
      routines.push({
        ...routineBase(goalId, 'health'),
        id: newId('r'),
        title: shortTitle,
        days: [1, 3, 5],
        durationMin: 45,
        preferredStart: '12:05',
        preferredEnd: '13:15',
        energy: profile?.energyProfile ?? 'any',
        sessionType: 'workout',
      });
      break;

    case 'finance':
      milestones = [
        milestone(parsed.target ? `Set the number: ${parsed.target}` : 'Set the number'),
        milestone('Know the current baseline'),
        milestone('Automate the transfer'),
      ];
      routines.push({
        ...routineBase(goalId, 'admin'),
        id: newId('r'),
        title: 'Money check-in',
        days: [0],
        durationMin: 30,
        preferredStart: '19:30',
        preferredEnd: '20:30',
        energy: 'evening',
        tier: 'could',
      });
      break;

    case 'relationship':
      routines.push({
        ...routineBase(goalId, 'relationship'),
        id: newId('r'),
        title: 'Date night',
        days: [5],
        durationMin: 120,
        preferredStart: '19:30',
        preferredEnd: '20:15',
        energy: 'evening',
      });
      break;

    case 'family':
      routines.push({
        ...routineBase(goalId, 'family'),
        id: newId('r'),
        title: 'Family adventure',
        days: [6],
        durationMin: 90,
        preferredStart: '09:30',
        preferredEnd: '10:30',
        energy: 'morning',
      });
      break;

    case 'friends':
      routines.push({
        ...routineBase(goalId, 'enjoyment'),
        id: newId('r'),
        title: 'Message a friend, make a plan',
        days: [3],
        durationMin: 15,
        preferredStart: '12:45',
        preferredEnd: '13:15',
        energy: 'midday',
        tier: 'could',
      });
      break;

    case 'experience':
      milestones = [
        milestone('Pick the destination'),
        milestone('Set the dates'),
        milestone('Set the budget'),
        milestone('Book it'),
      ];
      routines.push({
        ...routineBase(goalId, 'enjoyment'),
        id: newId('r'),
        title: `Plan: ${shortTitle}`,
        days: [0],
        durationMin: 30,
        preferredStart: '19:30',
        preferredEnd: '20:30',
        energy: 'evening',
        tier: 'could',
      });
      break;

    case 'behaviour':
      milestones = [
        milestone('Name the usual trigger'),
        milestone('Choose the replacement action'),
      ];
      // Behaviour change runs through intentions + if-then plans, not a
      // scheduled block; the wizard points the user at behaviour tracking.
      break;

    default:
      routines.push({
        ...routineBase(goalId, 'growth'),
        id: newId('r'),
        title: shortTitle,
        days: [2, 6],
        durationMin: 45,
        preferredStart: '12:05',
        preferredEnd: '13:30',
      });
  }

  const goal: Goal = {
    id: goalId,
    title: parsed.title,
    area: parsed.area,
    domain: parsed.domain,
    why: why?.trim() || undefined,
    milestones: milestones.length > 0 ? milestones : undefined,
    status: 'active',
    createdAt: new Date().toISOString(),
    routineIds: routines.map((r) => r.id),
  };
  return { goal, routines };
}

export const DOMAIN_LABELS: Record<GoalDomain, string> = {
  health: 'Health',
  fitness: 'Fitness',
  business: 'Business',
  career: 'Career',
  finance: 'Finance',
  relationship: 'Relationship',
  family: 'Family',
  friends: 'Friends',
  personal: 'Personal',
  experience: 'Experience',
  behaviour: 'Behaviour change',
};

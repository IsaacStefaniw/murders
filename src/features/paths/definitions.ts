/**
 * Paths — guided domain programs (docs/PATHS_BRIEF.md).
 *
 * A path is: a promise, a short intake where EVERY answer changes the
 * plan, optional personal numbers where the maths uses them, and a hub
 * that explains the week instead of just blocking time. Builders lean on
 * the goal planner and the evidence library so a path is a real goal with
 * real routines — adapted, learned-on, and reviewed like everything else.
 */

import { buildGoalPlan, type GoalPlan, type ParsedGoal } from '@/features/goals/goalPlanner';
import { protocolById, toRoutine } from '@/features/knowledge/protocols';
import { DOMAIN_QUESTIONS, type DomainQuestion } from '@/features/knowledge/questionBank';
import type { LifeProfile } from '@/types/domain';

export type PathId = 'training' | 'nutrition' | 'money' | 'work';

export interface PersonalNumberAsk {
  key: 'age' | 'weightKg';
  label: string;
  /** The reason, shown inline — we never collect a number we don't use. */
  why: string;
}

export interface PathDefinition {
  id: PathId;
  title: string;
  /** The value statement shown before the intake. */
  promise: string;
  questions: DomainQuestion[];
  personalNumbers?: PersonalNumberAsk[];
  build: (answers: Record<string, string>, profile: LifeProfile | null) => GoalPlan;
  /** Personal, concrete hub lines — "your number", not platitudes. */
  insights: (answers: Record<string, string>, profile: LifeProfile | null) => string[];
  /** The runnable session this path centres on (work resolves per-goal). */
  sessionLabel?: string;
  sessionRoute?: string;
}

const parsed = (title: string, domain: ParsedGoal['domain'], area: ParsedGoal['area']): ParsedGoal => ({
  title,
  domain,
  area,
});

export const PATHS: Record<PathId, PathDefinition> = {
  training: {
    id: 'training',
    title: 'Training',
    promise:
      'A program sized to your real week — strength first, the aerobic base when you’re ready, every session pre-decided so the gym door needs no willpower.',
    questions: DOMAIN_QUESTIONS.fitness ?? [],
    personalNumbers: [
      {
        key: 'age',
        label: 'Age',
        why: 'Past 45 the program protects you with longer warm-ups and conservative loading.',
      },
    ],
    build: (answers, profile) =>
      buildGoalPlan(parsed('Training that sticks', 'fitness', 'health'), profile, undefined, answers),
    insights: (answers, profile) => {
      const lines: string[] = [];
      if (answers.experience === 'new') {
        lines.push('Two 30-minute sessions you keep beat three you skip. Volume comes later — consistency first.');
      } else if (answers.experience === 'consistent') {
        lines.push('Strength three days, Zone 2 twice — the aerobic base is the piece most lifters skip, and it pays the longest.');
      } else {
        lines.push('Three days, main lifts first. The coach shrinks a session when time collapses — it never cancels it.');
      }
      if (answers.limiter === 'time') {
        lines.push('Time is your limiter, so nothing in this program needs more than 30–45 minutes, warm-up included.');
      }
      if (answers.limiter === 'boredom') {
        lines.push('Sessions rotate blocks so no two consecutive workouts repeat.');
      }
      if ((profile?.age ?? 0) >= 45) {
        lines.push(`At ${profile!.age}, warm-ups are non-negotiable — they’re built into every session estimate.`);
      }
      return lines;
    },
    sessionLabel: 'Start today’s workout',
    sessionRoute: '/session/workout',
  },

  nutrition: {
    id: 'nutrition',
    title: 'Nutrition',
    promise:
      'No diet, no logging. Protein-first dinners decided once a week, a walk that blunts the glucose spike, and your own protein number.',
    questions: [
      {
        key: 'aim',
        question: 'What’s the aim?',
        options: [
          { value: 'energy', label: 'Steadier energy' },
          { value: 'weight', label: 'Lose some weight' },
          { value: 'muscle', label: 'Support training' },
        ],
      },
      {
        key: 'cooking',
        question: 'Weeknight cooking reality?',
        options: [
          { value: 'quick', label: '15 minutes, tops' },
          { value: 'normal', label: 'Half an hour is fine' },
          { value: 'enjoy', label: 'I actually enjoy it' },
        ],
      },
    ],
    personalNumbers: [
      {
        key: 'weightKg',
        label: 'Weight (kg)',
        why: 'Sets your personal protein target — the one number that matters most.',
      },
    ],
    build: (answers, profile) => {
      const plan = buildGoalPlan(parsed('Eat like it matters', 'health', 'health'), profile, undefined, {
        anchor: 'food',
      });
      if (answers.aim === 'weight') {
        const kitchen = protocolById('kitchen-closed');
        if (kitchen) plan.routines.push(toRoutine(kitchen, profile, plan.goal.id));
      }
      return plan;
    },
    insights: (answers, profile) => {
      const lines: string[] = [];
      const w = profile?.weightKg;
      if (w) {
        const mult = answers.aim === 'muscle' ? [1.8, 2.2] : [1.6, 2.0];
        lines.push(
          `Your protein anchor: ~${Math.round(w * mult[0])}–${Math.round(w * mult[1])} g/day, spread across meals. Hit that and most of nutrition takes care of itself.`,
        );
      } else {
        lines.push('Add your weight to get a personal protein target — it’s the one number that matters most.');
      }
      lines.push('Dinners decided Sunday = seven days of willpower decisions deleted.');
      if (answers.aim === 'weight') {
        lines.push('Kitchen closes ~3 hours before bed. The eating window does quiet work; no counting required.');
      }
      if (answers.cooking === 'quick') {
        lines.push('Your rotation favours one-pan, under-20-minute dinners.');
      }
      return lines;
    },
    sessionLabel: 'Plan this week’s dinners',
    sessionRoute: '/session/meals',
  },

  money: {
    id: 'money',
    title: 'Money',
    promise:
      'Automation first, then a weekly half-hour that keeps drift small. The goal gets paid before the month starts — willpower budgeting is not a system.',
    questions: [
      ...(DOMAIN_QUESTIONS.finance ?? []),
      {
        key: 'automation',
        question: 'Is any of it automated today?',
        options: [
          { value: 'yes', label: 'Transfers run themselves' },
          { value: 'partial', label: 'Some of it' },
          { value: 'no', label: 'All manual' },
        ],
      },
    ],
    build: (answers, profile) =>
      buildGoalPlan(parsed('Money, running itself', 'finance', 'admin'), profile, undefined, answers),
    insights: (answers) => {
      const lines: string[] = [];
      if (answers.automation === 'no') {
        lines.push('First move, this week: automate one transfer on payday. Everything after that is observation, not discipline.');
      } else if (answers.automation === 'partial') {
        lines.push('Finish the automation: every recurring decision you delete is a decision that can’t go wrong on a bad day.');
      } else {
        lines.push('Automation is running — the weekly check-in is now about catching drift early, not forcing behaviour.');
      }
      if (answers.mode === 'debt') {
        lines.push('Order of operations: list every rate → pick the payoff order → automate the extra payment. The maths does the motivating.');
      }
      if (answers.mode === 'clarity') {
        lines.push('One place, one monthly number. Clarity precedes every good money decision.');
      }
      lines.push('Sunday, 30 minutes. Small and weekly beats big and never.');
      return lines;
    },
  },

  work: {
    id: 'work',
    title: 'Work & leadership',
    promise:
      'Protected thinking time, a weekly review that actually changes next week, and a calendar that reflects what you say matters.',
    questions: [
      ...(DOMAIN_QUESTIONS.business ?? []),
      {
        key: 'style',
        question: 'What does your day mostly demand?',
        options: [
          { value: 'maker', label: 'Deep, focused work' },
          { value: 'manager', label: 'People and meetings' },
          { value: 'mixed', label: 'Both, constantly' },
        ],
      },
    ],
    build: (answers, profile) => {
      const plan = buildGoalPlan(parsed('A week that produces', 'business', 'work'), profile, undefined, answers);
      // Makers get the deep-work carve-out even when focus isn't the named
      // bottleneck — the growth block alone doesn't protect making time.
      if (answers.style !== 'manager' && !plan.routines.some((r) => r.protocolId === 'deep-work')) {
        const deepWork = protocolById('deep-work');
        if (deepWork) plan.routines.push(toRoutine(deepWork, profile, plan.goal.id));
      }
      return plan;
    },
    insights: (answers) => {
      const lines: string[] = [];
      if (answers.style === 'maker' || answers.style === 'mixed') {
        lines.push('Mornings are for making. Meetings that can move, move after lunch.');
      }
      if (answers.style === 'manager') {
        lines.push('Your leverage is the weekly review: one lever named, one thing stopped, every week.');
      }
      if (answers.bottleneck === 'sales') {
        lines.push('The growth block opens with the sales levers until that milestone is done.');
      }
      if (answers.bottleneck === 'delivery') {
        lines.push('Fix the delivery bottleneck before chasing growth — capacity first, then volume.');
      }
      if (answers.bottleneck === 'focus') {
        lines.push('“No time to think” is a calendar problem. The deep-work block is the fix, and it’s protected.');
      }
      lines.push('The weekly review closes the loop: what moved, what stalled, the one lever for next week.');
      return lines;
    },
  },
};

export const PATH_ORDER: PathId[] = ['training', 'nutrition', 'money', 'work'];

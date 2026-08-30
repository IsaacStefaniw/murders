/**
 * Evidence-based goal intake — the structured questions asked when a goal
 * lands in a domain, before the plan is generated. Each answer changes the
 * plan the wizard builds (volume, protocols, milestones), so the questions
 * earn their place: nothing is asked that the planner doesn't use.
 * Question design follows the same sources as the protocol library
 * (docs/KNOWLEDGE.md).
 */

import type { GoalDomain } from '@/types/domain';

export interface DomainQuestion {
  key: string;
  question: string;
  options: { value: string; label: string }[];
}

export const DOMAIN_QUESTIONS: Partial<Record<GoalDomain, DomainQuestion[]>> = {
  fitness: [
    {
      key: 'experience',
      question: 'Where are you starting from?',
      options: [
        { value: 'new', label: 'Basically starting fresh' },
        { value: 'returning', label: 'Coming back after a break' },
        { value: 'consistent', label: 'Already training, want more' },
      ],
    },
    {
      key: 'limiter',
      question: 'What usually kills it?',
      options: [
        { value: 'time', label: 'No time' },
        { value: 'energy', label: 'No energy' },
        { value: 'boredom', label: 'It gets boring' },
      ],
    },
  ],
  health: [
    {
      key: 'anchor',
      question: 'What would move the needle most right now?',
      options: [
        { value: 'sleep', label: 'Better sleep' },
        { value: 'movement', label: 'More movement' },
        { value: 'food', label: 'Eating better' },
      ],
    },
  ],
  business: [
    {
      key: 'bottleneck',
      question: 'What’s the real bottleneck?',
      options: [
        { value: 'sales', label: 'Not enough sales' },
        { value: 'delivery', label: 'Delivery eats everything' },
        { value: 'focus', label: 'No time to think' },
      ],
    },
  ],
  career: [
    {
      key: 'bottleneck',
      question: 'What’s the real bottleneck?',
      options: [
        { value: 'visibility', label: 'Work is good, nobody sees it' },
        { value: 'skills', label: 'A skill gap' },
        { value: 'focus', label: 'No time for the important work' },
      ],
    },
  ],
  finance: [
    {
      key: 'mode',
      question: 'What is the money goal really about?',
      options: [
        { value: 'saving', label: 'Saving for something' },
        { value: 'debt', label: 'Getting out of debt' },
        { value: 'clarity', label: 'Just knowing where it goes' },
      ],
    },
  ],
};

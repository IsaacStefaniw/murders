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
    {
      key: 'team',
      question: 'Who else can carry the work?',
      options: [
        { value: 'solo', label: 'Just me' },
        { value: 'contractors', label: 'Freelancers and contractors' },
        { value: 'directs', label: 'A team who report to me' },
        { value: 'leaders', label: 'Leaders who have their own teams' },
      ],
    },
    {
      key: 'bigBet',
      question: 'Anything in the next 90 days that would be hard to undo?',
      options: [
        { value: 'signing', label: 'Yes — it’s close' },
        { value: 'maybe', label: 'Possibly' },
        { value: 'no', label: 'Nothing that size' },
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
    {
      key: 'calendarControl',
      question: 'How much of your week do you actually control?',
      options: [
        { value: 'mine', label: 'I set my own calendar' },
        { value: 'shared', label: 'Roughly half is other people’s' },
        { value: 'assigned', label: 'Mostly assigned to me' },
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
    {
      key: 'leak',
      question: 'Where does the money usually go missing?',
      options: [
        { value: 'recurring', label: 'Subscriptions I forgot about' },
        { value: 'impulse', label: 'One-off things I didn’t plan' },
        { value: 'everyday', label: 'The everyday stuff adds up' },
        { value: 'unknown', label: 'Genuinely no idea' },
      ],
    },
    {
      key: 'raise',
      question: 'Last time your income went up, what happened to the extra?',
      options: [
        { value: 'absorbed', label: 'Life expanded to match it' },
        { value: 'some', label: 'Some of it stuck' },
        { value: 'saved', label: 'Most of it went to the goal' },
        { value: 'notyet', label: 'Hasn’t happened yet' },
      ],
    },
  ],

  // Relationship, family and experience had NO intake questions before the
  // pathway research round — a goal in any of them fell through to a
  // generic plan. Each answer below changes which protocol leads.
  relationship: [
    {
      key: 'temperature',
      question: 'How are things right now, honestly?',
      options: [
        { value: 'good', label: 'Good — I want more of it' },
        { value: 'drifting', label: 'Fine, but we’re running in parallel' },
        { value: 'tense', label: 'The same argument keeps coming back' },
        { value: 'hard', label: 'Hard, and I’m not sure what happens next' },
      ],
    },
    {
      key: 'obstacle',
      question: 'What actually gets in the way?',
      options: [
        { value: 'kids', label: 'The kids own every evening' },
        { value: 'work', label: 'I get home already spent' },
        { value: 'drift', label: 'Nothing — we just stopped making time' },
        { value: 'conflict', label: 'It’s easier not to open things up' },
      ],
    },
    {
      key: 'window',
      question: 'When is there realistically a window with just the two of you?',
      options: [
        { value: 'after_bed', label: 'After the kids are down' },
        { value: 'early', label: 'Early, before the house wakes' },
        { value: 'weekend', label: 'Only at weekends' },
        { value: 'none', label: 'Honestly, almost never' },
      ],
    },
  ],
  family: [
    {
      key: 'ages',
      question: 'How old are the kids?',
      options: [
        { value: 'under5', label: 'Under 5' },
        { value: 'primary', label: 'Primary school' },
        { value: 'teens', label: 'Teenagers' },
        { value: 'mixed', label: 'A spread of ages' },
      ],
    },
    {
      key: 'blocker',
      question: 'What usually eats the family time?',
      options: [
        { value: 'work', label: 'Work runs over' },
        { value: 'logistics', label: 'Logistics and admin' },
        { value: 'scattered', label: 'Everyone’s on a screen' },
        { value: 'energy', label: 'Nothing left in the tank' },
      ],
    },
    {
      key: 'goodWeekend',
      question: 'What does a genuinely good weekend look like?',
      options: [
        { value: 'outdoors', label: 'Out and moving' },
        { value: 'slow', label: 'Slow, at home' },
        { value: 'people', label: 'Other people around' },
        { value: 'making', label: 'Building or making something' },
      ],
    },
  ],
  experience: [
    {
      key: 'horizon',
      question: 'Where is the next real trip?',
      options: [
        { value: 'booked', label: 'Booked already' },
        { value: 'choosing', label: 'Choosing between options' },
        { value: 'someday', label: 'A someday idea' },
        { value: 'none', label: 'Nothing on the horizon' },
      ],
    },
  ],
};

/**
 * Life Interview script.
 *
 * A deterministic conversational flow: INTENT asks, the user answers with
 * quick chips or short text. Every answer maps to structured profile data —
 * the interview never relies on parsing free conversation. An AI
 * interview processor (lib/ai) can later enrich this, but the structured
 * path is the source of truth.
 */

export type StepKind = 'text' | 'single' | 'multi';

export interface InterviewOption {
  value: string;
  label: string;
}

export interface InterviewStep {
  id: string;
  kind: StepKind;
  /** INTENT's message. Can reference earlier answers. */
  prompt: (answers: InterviewAnswers) => string;
  options?: InterviewOption[];
  /** For multi steps: cap on selections (order of selection is meaningful). */
  maxSelections?: number;
  placeholder?: string;
  optional?: boolean;
  /** Skip this step entirely based on earlier answers. */
  skipIf?: (answers: InterviewAnswers) => boolean;
}

export type InterviewAnswers = Record<string, string | string[] | undefined>;

export const INTERVIEW_STEPS: InterviewStep[] = [
  {
    id: 'name',
    kind: 'text',
    prompt: () =>
      "Let's build a life you actually follow. First — what should I call you?",
    placeholder: 'Your first name',
  },
  {
    id: 'priorities',
    kind: 'multi',
    maxSelections: 3,
    prompt: (a) =>
      `Good to meet you, ${a.name}. Which parts of life matter most right now? Pick up to three — order matters.`,
    options: [
      { value: 'family', label: 'Family' },
      { value: 'relationship', label: 'Relationship' },
      { value: 'health', label: 'Health' },
      { value: 'work', label: 'Work & business' },
      { value: 'growth', label: 'Personal growth' },
      { value: 'enjoyment', label: 'Enjoyment' },
    ],
  },
  {
    id: 'household',
    kind: 'multi',
    prompt: () => "Who's at home with you?",
    options: [
      { value: 'partner', label: 'Partner' },
      { value: 'kids', label: 'Kids' },
      { value: 'solo', label: 'Just me' },
    ],
  },
  {
    id: 'partnerName',
    kind: 'text',
    optional: true,
    skipIf: (a) => !(a.household as string[] | undefined)?.includes('partner'),
    prompt: () => "What's your partner's name? (I'll use it for date nights and shared plans.)",
    placeholder: 'Partner’s name — or skip',
  },
  {
    id: 'workDays',
    kind: 'multi',
    prompt: () => 'Which days do you usually work?',
    options: [
      { value: '1', label: 'Mon' },
      { value: '2', label: 'Tue' },
      { value: '3', label: 'Wed' },
      { value: '4', label: 'Thu' },
      { value: '5', label: 'Fri' },
      { value: '6', label: 'Sat' },
      { value: '0', label: 'Sun' },
    ],
  },
  {
    id: 'workHours',
    kind: 'single',
    prompt: () => 'And roughly what hours?',
    options: [
      { value: '08:00-16:00', label: '8 – 4' },
      { value: '09:00-17:30', label: '9 – 5:30' },
      { value: '09:00-18:30', label: '9 – 6:30' },
      { value: '07:00-15:00', label: 'Early start' },
    ],
  },
  {
    id: 'sleep',
    kind: 'single',
    prompt: () => 'When does a good day start and end for you?',
    options: [
      { value: '05:30-21:45', label: 'Early riser (5:30 – 9:45)' },
      { value: '06:30-22:30', label: 'Standard (6:30 – 10:30)' },
      { value: '07:30-23:15', label: 'Later (7:30 – 11:15)' },
    ],
  },
  {
    id: 'energy',
    kind: 'single',
    prompt: () => 'When do you have the most energy?',
    options: [
      { value: 'morning', label: 'Morning' },
      { value: 'midday', label: 'Midday' },
      { value: 'evening', label: 'Evening' },
    ],
  },
  {
    id: 'trainingDays',
    kind: 'single',
    prompt: () => 'How many days a week do you want to train? Be honest, not ambitious.',
    options: [
      { value: '2', label: '2' },
      { value: '3', label: '3' },
      { value: '4', label: '4' },
      { value: '5', label: '5' },
    ],
  },
  {
    id: 'trainingSetup',
    kind: 'single',
    prompt: () => 'Where will that usually happen?',
    options: [
      { value: 'gym', label: 'Gym' },
      { value: 'home', label: 'Home' },
      { value: 'outdoors', label: 'Outdoors' },
      { value: 'mixed', label: 'Mix of these' },
    ],
  },
  {
    id: 'mind',
    kind: 'multi',
    optional: true,
    prompt: () => 'And your headspace — anything you want in the toolkit?',
    options: [
      { value: 'breathing', label: 'Quick breathing resets' },
      { value: 'meditation', label: 'Short meditations' },
    ],
  },
  {
    id: 'moreOf',
    kind: 'multi',
    prompt: () => 'What do you want more of in your weeks?',
    options: [
      { value: 'Time with the kids', label: 'Time with the kids' },
      { value: 'Date nights', label: 'Date nights' },
      { value: 'Seeing friends', label: 'Seeing friends' },
      { value: 'Reading', label: 'Reading' },
      { value: 'Time outdoors', label: 'Time outdoors' },
      { value: 'Deep work', label: 'Deep work' },
    ],
  },
  {
    id: 'lessOf',
    kind: 'multi',
    optional: true,
    prompt: () =>
      'And less of? No judgement — naming these is how we protect against them.',
    options: [
      { value: 'doomscrolling', label: 'Doom scrolling' },
      { value: 'alcohol', label: 'Alcohol' },
      { value: 'vaping', label: 'Vaping' },
      { value: 'social_media', label: 'Social media' },
      { value: 'junk_food', label: 'Junk food' },
      { value: 'late_nights', label: 'Late nights' },
    ],
  },
  {
    id: 'ambition',
    kind: 'text',
    optional: true,
    prompt: () => "Last one. What's one thing you're working toward this year?",
    placeholder: 'e.g. Grow the business, book the family trip — or skip',
  },
];

/** Steps that actually apply for a given answer set, in order. */
export function activeSteps(answers: InterviewAnswers): InterviewStep[] {
  return INTERVIEW_STEPS.filter((s) => !s.skipIf?.(answers));
}

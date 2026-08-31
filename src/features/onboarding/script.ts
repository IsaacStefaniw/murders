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
      { value: 'admin', label: 'Money & security' },
    ],
  },
  {
    id: 'vision',
    kind: 'text',
    optional: true,
    prompt: () =>
      'If life is genuinely working three years from now — what does it look like? One or two lines, your words.',
    placeholder: 'e.g. Business runs without me, fit at 50, present with the kids…',
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
    id: 'kidsCount',
    kind: 'single',
    skipIf: (a) => !(a.household as string[] | undefined)?.includes('kids'),
    prompt: () => 'How many kids?',
    options: [
      { value: '1', label: '1' },
      { value: '2', label: '2' },
      { value: '3', label: '3' },
      { value: '4', label: '4+' },
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
    id: 'capacity',
    kind: 'single',
    prompt: () =>
      'Honestly — how full is life right now? INTENT plans to your real capacity, not your ambitions.',
    options: [
      { value: 'minimal', label: 'Running on fumes — keep it minimal' },
      { value: 'steady', label: 'Full, but functional' },
      { value: 'push', label: 'Room to push' },
    ],
  },
  {
    id: 'age',
    kind: 'single',
    optional: true,
    prompt: () =>
      'Roughly which decade are you in? (Training and recovery guidance changes with it.)',
    options: [
      { value: '25', label: '20s' },
      { value: '35', label: '30s' },
      { value: '45', label: '40s' },
      { value: '55', label: '50s' },
      { value: '65', label: '60s+' },
    ],
  },
  {
    id: 'workStyle',
    kind: 'single',
    prompt: () => 'What does your workday mostly demand?',
    options: [
      { value: 'maker', label: 'Deep, focused work' },
      { value: 'manager', label: 'People and meetings' },
      { value: 'mixed', label: 'Both, constantly' },
      { value: 'physical', label: 'On my feet, hands-on' },
    ],
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
      { value: '07:00-15:00', label: '7 – 3' },
      { value: '08:00-16:00', label: '8 – 4' },
      { value: '09:00-17:30', label: '9 – 5:30' },
      { value: '09:30-18:30', label: '9:30 – 6:30' },
      { value: '08:30-17:00', label: 'I set my own hours' },
      { value: '10:00-18:00', label: 'Later start' },
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
    id: 'sleepQuality',
    kind: 'single',
    prompt: () => 'And honestly — how is the sleep itself?',
    options: [
      { value: 'good', label: 'Mostly solid' },
      { value: 'broken', label: 'Broken or short' },
      { value: 'varies', label: 'Depends on the week' },
    ],
  },
  {
    id: 'pressure',
    kind: 'single',
    prompt: () =>
      'How much pressure are you carrying right now? The plan protects recovery differently at redline.',
    options: [
      { value: 'calm', label: 'Manageable' },
      { value: 'full', label: 'A lot, but coping' },
      { value: 'redline', label: 'Running hot' },
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
      { value: '1', label: '1 — just starting' },
      { value: '2', label: '2' },
      { value: '3', label: '3' },
      { value: '4', label: '4' },
      { value: '5', label: '5' },
      { value: '6', label: '6' },
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
      { value: 'walking', label: 'Walking is my training' },
      { value: 'mixed', label: 'Mix of these' },
    ],
  },
  {
    id: 'trainingExperience',
    kind: 'single',
    skipIf: (a) => a.trainingSetup === 'walking',
    prompt: () => 'And where are you starting from?',
    options: [
      { value: 'new', label: 'Basically starting fresh' },
      { value: 'returning', label: 'Coming back after a break' },
      { value: 'consistent', label: 'Already training, want more' },
    ],
  },
  {
    id: 'weight',
    kind: 'text',
    optional: true,
    prompt: () =>
      'Weight in kg? Optional — it sets your personal protein target, nothing else. Never judged, never shared.',
    placeholder: 'e.g. 90 — or skip',
  },
  {
    id: 'foodAim',
    kind: 'single',
    optional: true,
    prompt: () => 'Food — want the nutrition coach in the loop?',
    options: [
      { value: 'energy', label: 'Steadier energy' },
      { value: 'weight', label: 'Lose some weight' },
      { value: 'muscle', label: 'Support training' },
      { value: 'none', label: 'Not yet' },
    ],
  },
  {
    id: 'foodTrouble',
    kind: 'single',
    skipIf: (a) => !a.foodAim || a.foodAim === 'none',
    prompt: () => 'Where does food usually go wrong? The answer decides which lever comes first.',
    options: [
      { value: 'evenings', label: 'Evenings at home' },
      { value: 'snacking', label: 'Grazing all day' },
      { value: 'drinks', label: 'Drinks carry it' },
      { value: 'skipping', label: 'Skipping meals' },
      { value: 'nowhere', label: 'It’s mostly fine' },
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
      { value: 'sauna', label: 'Sauna · heat & cold' },
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
      { value: 'Adventure & travel', label: 'Adventure & travel' },
      { value: 'Cooking real food', label: 'Cooking real food' },
      { value: 'Creative time', label: 'Creative time' },
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
      { value: 'shopping', label: 'Impulse shopping' },
      { value: 'late_nights', label: 'Late nights' },
    ],
  },
  {
    id: 'money',
    kind: 'single',
    optional: true,
    prompt: () => 'Money — want INTENT in the loop?',
    options: [
      { value: 'checkin', label: 'A short weekly check-in' },
      { value: 'saving', label: "We're saving for something big" },
      { value: 'debt', label: 'Getting out of debt' },
      { value: 'none', label: 'Not yet' },
    ],
  },
  {
    id: 'moneyAutomation',
    kind: 'single',
    skipIf: (a) => !a.money || a.money === 'none',
    prompt: () => 'Is any of it automated today?',
    options: [
      { value: 'yes', label: 'Transfers run themselves' },
      { value: 'partial', label: 'Some of it' },
      { value: 'no', label: 'All manual' },
    ],
  },
  {
    id: 'ambition',
    kind: 'text',
    optional: true,
    prompt: () => "Last one. What's one thing you're working toward this year?",
    placeholder:
      'e.g. Grow the business to $2m · Save $50k · Run a marathon · Write the book · Japan with the kids',
  },
];

/** Steps that actually apply for a given answer set, in order. */
export function activeSteps(answers: InterviewAnswers): InterviewStep[] {
  return INTERVIEW_STEPS.filter((s) => !s.skipIf?.(answers));
}

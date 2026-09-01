/**
 * Life Interview script.
 *
 * A deterministic conversational flow: INTENT asks, the user answers with
 * quick chips or short text. Every answer maps to structured profile data —
 * the interview never relies on parsing free conversation. An AI
 * interview processor (lib/ai) can later enrich this, but the structured
 * path is the source of truth.
 *
 * ── Why the interview is split ──────────────────────────────────────────
 *
 * There were twenty-eight questions here and all of them came before the
 * person had seen a single thing the app does. That is the wrong trade in
 * both directions at once: too long to survive for someone deciding
 * whether to bother, and yet no more convincing for it, because a question
 * that changes nothing you can see is just a form.
 *
 * The resolution is not "ask fewer questions". It is that LENGTH IS NOT
 * THE PROBLEM — UNREWARDED LENGTH IS. So the script is now two things:
 *
 * A SPINE of nine questions, marked `core`, which is exactly the set the
 * scheduler cannot produce a correct first week without. Wake and sleep,
 * work days and hours, capacity, energy, training days, priorities, name,
 * and the one ambition. Answer those and there is a real plan on the other
 * side, not a teaser of one.
 *
 * Everything else is DEFERRED to the pathway that actually consumes it,
 * and asked there. Answering four questions to start the Training coach is
 * motivated configuration — you asked for the coach — where the same four
 * questions in a wall of twenty-eight are an interrogation by a stranger.
 * Each deferred step declares where it goes and how its answer lands on
 * the profile when it arrives late.
 *
 * And every core step carries a `reveal`: one line, shown the moment the
 * answer lands, naming what just changed in the plan. This is what makes
 * the questions the reveal rather than the toll before it.
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
  /**
   * Part of the opening spine. True only where the scheduler cannot build
   * a correct first week without the answer — that is the whole test, and
   * it is what keeps the spine at nine rather than creeping back to
   * twenty-eight.
   */
  core?: boolean;
  /** Where this is asked instead, when it is not core. */
  deferTo?: DeferTarget;
  /**
   * One line naming what just changed because of this answer, shown the
   * moment it lands. The reason a nine-question interview reads as the
   * plan being built rather than as a form being filled.
   */
  reveal?: (answers: InterviewAnswers) => string | null;
}

export type InterviewAnswers = Record<string, string | string[] | undefined>;

/**
 * Where a deferred question is asked instead of in the opening interview.
 * A PathId sends it to that coach's intake; 'coaches' means it belongs to
 * no single pathway and is asked from the Coaches tab.
 */
export type DeferTarget =
  | 'training'
  | 'nutrition'
  | 'money'
  | 'work'
  | 'recovery'
  | 'relationship'
  | 'family'
  | 'coaches';

/** Human names for the life areas, for the reveal lines. */
const LABEL: Record<string, string> = {
  family: 'family',
  relationship: 'your relationship',
  health: 'health',
  work: 'work',
  growth: 'growth',
  enjoyment: 'enjoyment',
  admin: 'money',
};

export const INTERVIEW_STEPS: InterviewStep[] = [
  {
    id: 'name',
    core: true,
    kind: 'text',
    prompt: () =>
      "Let's build a life you actually follow. First — what should I call you?",
    placeholder: 'Your first name',
  },
  {
    id: 'priorities',
    core: true,
    reveal: (a) => {
      const picked = Array.isArray(a.priorities) ? a.priorities : [];
      return picked.length > 0
        ? `Noted. When two things want the same hour, ${LABEL[picked[0]] ?? picked[0]} wins.`
        : null;
    },
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
    deferTo: 'coaches',
    kind: 'text',
    optional: true,
    prompt: () =>
      'If life is genuinely working three years from now — what does it look like? One or two lines, your words.',
    placeholder: 'e.g. Business runs without me, fit at 50, present with the kids…',
  },
  {
    id: 'household',
    deferTo: 'family',
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
    deferTo: 'family',
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
    deferTo: 'relationship',
    kind: 'text',
    optional: true,
    skipIf: (a) => !(a.household as string[] | undefined)?.includes('partner'),
    prompt: () => "What's your partner's name? (I'll use it for date nights and shared plans.)",
    placeholder: 'Partner’s name — or skip',
  },
  {
    id: 'capacity',
    core: true,
    reveal: (a) =>
      a.capacity === 'minimal'
        ? 'Then the week stays deliberately thin. Fewer commitments kept beats more abandoned.'
        : a.capacity === 'push'
          ? 'Fuller week, then — and the first time it stops getting done, it comes back down.'
          : 'A full week with slack left in it, so one bad day does not take the rest with it.',
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
    deferTo: 'training',
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
    deferTo: 'work',
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
    core: true,
    reveal: (a) => {
      const days = Array.isArray(a.workDays) ? a.workDays.length : 0;
      return days > 0
        ? `${days} working ${days === 1 ? 'day' : 'days'}. Nothing gets scheduled over them.`
        : null;
    },
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
    core: true,
    reveal: (a) => {
      const hours = typeof a.workHours === 'string' ? a.workHours.split('-') : null;
      return hours
        ? `Then your own time starts at ${hours[1]}, and that is where the evening plan goes.`
        : null;
    },
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
    core: true,
    reveal: (a) => {
      const times = typeof a.sleep === 'string' ? a.sleep.split('-') : null;
      return times
        ? `Up at ${times[0]}, down at ${times[1]}. Nothing is ever scheduled after ${times[1]}, and reminders go quiet then too.`
        : null;
    },
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
    deferTo: 'recovery',
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
    deferTo: 'recovery',
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
    core: true,
    reveal: (a) =>
      a.energy === 'morning'
        ? 'So the hardest thing in the day goes early, while it is cheapest.'
        : a.energy === 'evening'
          ? 'So the demanding work goes late, when you actually have it — not at 7am because a book said so.'
          : 'So the hard work sits mid-day, around the dip rather than in it.',
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
    core: true,
    reveal: (a) => {
      const n = Number(a.trainingDays);
      if (!n) return null;
      return n <= 3
        ? `${n} sessions, each full-body. At this frequency that beats a split, and it is what goes in the calendar.`
        : `${n} sessions on an upper/lower split — every lift trained twice a week.`;
    },
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
    deferTo: 'training',
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
    deferTo: 'training',
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
    id: 'existingHabits',
    /**
     * Core despite being optional, and despite the spine otherwise being
     * only what the scheduler strictly needs.
     *
     * This one has to be asked before the plan is built rather than after,
     * because it decides whether a routine is created as an ESTABLISHED
     * anchor or prescribed back as something new. Answered a week later it
     * would land on the profile and change nothing that had already been
     * built — the app would have spent its first week telling someone who
     * has meditated daily for a decade to try meditating.
     */
    core: true,
    reveal: (a) => {
      const habits = Array.isArray(a.existingHabits) ? a.existingHabits : [];
      return habits.length > 0
        ? `Then those stay yours. They go in as things you already do, not as things to start.`
        : 'Fine — then everything in the plan is new, and it starts small on purpose.';
    },
    kind: 'multi',
    optional: true,
    prompt: () =>
      "What's already part of your life? INTENT builds on what you do — never prescribes it back to you as if it were new.",
    options: [
      { value: 'workout', label: 'Gym training' },
      { value: 'walking', label: 'Walking' },
      { value: 'running', label: 'Running' },
      { value: 'fasting', label: 'Fasting / eating window' },
      { value: 'meditation', label: 'Meditation' },
      { value: 'sauna', label: 'Sauna' },
      { value: 'cold', label: 'Cold showers' },
      { value: 'journaling', label: 'Journaling' },
    ],
  },
  {
    id: 'weight',
    deferTo: 'nutrition',
    kind: 'text',
    optional: true,
    prompt: () =>
      'Weight in kg? Optional — it sets your personal protein target, nothing else. Never judged, never shared.',
    placeholder: 'e.g. 90 — or skip',
  },
  {
    id: 'foodAim',
    deferTo: 'nutrition',
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
    deferTo: 'nutrition',
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
    deferTo: 'recovery',
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
    deferTo: 'coaches',
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
    deferTo: 'recovery',
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
    deferTo: 'money',
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
    deferTo: 'money',
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
    core: true,
    reveal: (a) =>
      typeof a.ambition === 'string' && a.ambition.trim()
        ? 'Now the milestones get drafted from it, and the week gets built to serve them.'
        : null,
    kind: 'text',
    optional: true,
    prompt: () => "Last one. What's one thing you're working toward this year?",
    placeholder:
      'e.g. Grow the business to $2m · Save $50k · Run a marathon · Write the book · Japan with the kids',
  },
];

/**
 * Steps that actually apply for a given answer set, in order.
 *
 * Defaults to the spine. `'all'` is for anything that needs the full
 * script — tests, and the settings screen where someone can choose to
 * answer everything at once.
 */
export function activeSteps(
  answers: InterviewAnswers,
  scope: 'core' | 'all' = 'core',
): InterviewStep[] {
  return INTERVIEW_STEPS.filter(
    (s) => (scope === 'all' || s.core) && !s.skipIf?.(answers),
  );
}

/**
 * The deferred questions belonging to one place that have not been
 * answered yet — what a pathway hub offers, one at a time.
 */
export function deferredSteps(
  answers: InterviewAnswers,
  target: DeferTarget,
): InterviewStep[] {
  return INTERVIEW_STEPS.filter(
    (s) =>
      !s.core &&
      s.deferTo === target &&
      !s.skipIf?.(answers) &&
      (answers[s.id] === undefined ||
        (Array.isArray(answers[s.id]) && (answers[s.id] as string[]).length === 0)),
  );
}

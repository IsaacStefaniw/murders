/**
 * Life Interview script.
 *
 * A deterministic conversational flow: IntentNorth asks, the user answers with
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

import {
  ambitionPlaceholder,
  committedBlockLabel,
  moneyOptions,
  moreOfOptions,
  visionPlaceholder,
  worksSomewhere,
  type WeekShape,
} from './markets';

export type StepKind = 'text' | 'single' | 'multi';

export interface InterviewOption {
  value: string;
  label: string;
}

export interface InterviewStep {
  id: string;
  kind: StepKind;
  /** IntentNorth's message. Can reference earlier answers. */
  prompt: (answers: InterviewAnswers) => string;
  /**
   * Fixed options, or options computed from earlier answers.
   *
   * Computed is what makes "per market" real rather than cosmetic: a
   * retiree and a student are not offered the same money answers, because
   * the same four answers cannot describe both.
   */
  options?: InterviewOption[] | ((a: InterviewAnswers) => InterviewOption[]);
  /** For multi steps: cap on selections (order of selection is meaningful). */
  maxSelections?: number;
  placeholder?: string | ((a: InterviewAnswers) => string);
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
    /**
     * Asked second, before anything else, because it routes the rest.
     *
     * The interview used to go straight from a name to "which days do you
     * usually work?" — a question with no right answer for a retiree, a
     * carer, or anyone between jobs, and the plan behind it assumed a
     * Monday-to-Friday office either way. One tap here means nobody is
     * asked to describe a working week they do not have.
     */
    id: 'weekShape',
    core: true,
    kind: 'single',
    prompt: (a) => `Good to meet you, ${a.name}. What shape is your week?`,
    options: [
      { value: 'employed', label: 'Set hours, most weeks the same' },
      { value: 'selfDirected', label: 'I set my own hours' },
      { value: 'shift', label: 'Shifts, or hours that move' },
      { value: 'study', label: 'Studying' },
      { value: 'caring', label: 'At home, caring for family' },
      { value: 'retired', label: 'Retired, or not working right now' },
    ],
    reveal: (a) => {
      switch (a.weekShape) {
        case 'retired':
          return 'Then nothing gets planned around a job. We build the week out of what you already have in it.';
        case 'caring':
          return 'Then your caring hours go in as real commitments, and the rest of the plan works around them.';
        case 'shift':
          return 'Then the plan follows your roster rather than a fixed week — you can move anything, any day.';
        case 'study':
          return 'Then classes are fixed and the rest of the day is yours to shape.';
        case 'selfDirected':
          return 'Then the risk is work spreading into everything. The plan gives the rest of life a claim on the day first.';
        default:
          return 'Then the plan owns the edges of the day — before work, and after it.';
      }
    },
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
      `Which parts of life matter most right now, ${a.name}? Pick up to three — order matters.`,
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
    placeholder: (a) => visionPlaceholder(a.weekShape as WeekShape | undefined),
  },
  {
    id: 'household',
    deferTo: 'family',
    kind: 'multi',
    prompt: () => "Who's at home with you?",
    // Three options could not describe a student in a sharehouse, an adult
    // living with their parents, or anyone caring for one — and the last of
    // those is among the largest claims on a person's week there is.
    options: [
      { value: 'partner', label: 'Partner' },
      { value: 'kids', label: 'Kids' },
      { value: 'grandkids', label: 'Grandchildren, often' },
      { value: 'parent', label: 'A parent I care for' },
      { value: 'housemates', label: 'Housemates' },
      { value: 'family_home', label: 'My parents' },
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
      'Honestly — how full is life right now? IntentNorth plans to your real capacity, not your ambitions.',
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
      // '60s+' put a sixty-year-old and an eighty-five-year-old in one
      // bucket, and training and recovery guidance differs more across
      // those twenty-five years than across any other pair of decades here.
      { value: '65', label: '60s' },
      { value: '75', label: '70s' },
      { value: '85', label: '80s or beyond' },
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
    // Nobody who is retired is asked to name their working days. The
    // question has no honest answer, and the old code read the empty
    // result as missing data and invented a Monday-to-Friday job.
    skipIf: (a) => !worksSomewhere(a.weekShape as WeekShape | undefined),
    reveal: (a) => {
      const days = Array.isArray(a.workDays) ? a.workDays.length : 0;
      if (days === 0) return null;
      const noun = committedBlockLabel(a.weekShape as WeekShape | undefined).toLowerCase();
      return `${days} ${noun} ${days === 1 ? 'day' : 'days'}. Nothing gets scheduled over them.`;
    },
    kind: 'multi',
    prompt: (a) => {
      switch (a.weekShape) {
        case 'caring':
          return 'Which days are you on duty at home?';
        case 'study':
          return 'Which days do you have classes or work?';
        case 'shift':
          return 'Which days do you usually work? A rough answer is fine — you can move anything later.';
        default:
          return 'Which days do you usually work?';
      }
    },
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
    skipIf: (a) => !worksSomewhere(a.weekShape as WeekShape | undefined),
    reveal: (a) => {
      const hours = typeof a.workHours === 'string' ? a.workHours.split('-') : null;
      if (!hours) return null;
      if (a.weekShape === 'shift') {
        return `Planned around a ${hours[0]}–${hours[1]} shift for now. Move anything that lands wrong and the plan learns the pattern.`;
      }
      return `Then your own time starts at ${hours[1]}, and that is where the evening plan goes.`;
    },
    kind: 'single',
    prompt: (a) =>
      a.weekShape === 'shift'
        ? 'Which shift do you work most often? Pick the usual one — the plan bends around the others.'
        : a.weekShape === 'caring'
          ? 'Roughly which hours are you on?'
          : 'And roughly what hours?',
    options: (a) =>
      a.weekShape === 'shift'
        ? [
            { value: '06:00-14:00', label: 'Early (6 – 2)' },
            { value: '07:00-19:00', label: 'Long day (7 – 7)' },
            { value: '14:00-22:00', label: 'Afternoon (2 – 10)' },
            { value: '19:00-07:00', label: 'Nights (7pm – 7am)' },
            { value: '08:00-16:00', label: 'Days, mostly' },
            { value: '09:00-17:00', label: 'It changes every week' },
          ]
        : [
            { value: '07:00-15:00', label: '7 – 3' },
            { value: '08:00-16:00', label: '8 – 4' },
            { value: '09:00-17:30', label: '9 – 5:30' },
            { value: '09:30-18:30', label: '9:30 – 6:30' },
            { value: '08:30-17:00', label: 'I set my own hours' },
            { value: '10:00-18:00', label: 'Later start' },
          ],
  },
  {
    /**
     * What replaces the work questions for someone with no job.
     *
     * A retiree's week is not empty — it has a walking group, a Tuesday
     * volunteering shift, the grandchildren on Thursdays, medical
     * appointments. That IS the structure, and until it is asked for, the
     * app has nothing to build around and hands back a blank week, which
     * reads as "this is not for you".
     */
    id: 'weekAnchors',
    core: true,
    optional: true,
    kind: 'multi',
    skipIf: (a) => worksSomewhere(a.weekShape as WeekShape | undefined),
    prompt: () =>
      "What's already fixed in your week? These become the frame — everything else is planned around them.",
    options: [
      { value: 'family', label: 'Family or grandchildren' },
      { value: 'volunteering', label: 'Volunteering or committee' },
      { value: 'group', label: 'A class, club or group' },
      { value: 'faith', label: 'Church or community' },
      { value: 'appointments', label: 'Regular appointments' },
      { value: 'care', label: 'Caring for someone' },
      { value: 'work', label: 'A bit of paid work' },
    ],
    reveal: (a) => {
      const picked = Array.isArray(a.weekAnchors) ? a.weekAnchors : [];
      return picked.length > 0
        ? `Those go in first, and hold their place. The rest of the week is built around them.`
        : 'Then we start with a light, open week and add shape as you go.';
    },
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
    prompt: (a) =>
      a.weekShape === 'shift'
        ? 'On a normal day off, when do you get up and go to bed?'
        : 'When does a good day start and end for you?',
    // Three windows could not describe a 5am riser or a night-shift
    // sleeper, and the earliest on offer still had someone up past nine
    // thirty at night — which fits almost nobody over seventy.
    options: [
      { value: '05:00-21:00', label: 'Early (5:00 – 9:00)' },
      { value: '05:30-21:45', label: 'Early riser (5:30 – 9:45)' },
      { value: '06:30-22:30', label: 'Standard (6:30 – 10:30)' },
      { value: '07:30-23:15', label: 'Later (7:30 – 11:15)' },
      { value: '08:30-00:15', label: 'Night owl (8:30 – 12:15)' },
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
    prompt: (a) =>
      a.weekShape === 'retired'
        ? 'How many days a week would you like to move? Walking counts, and so does the garden.'
        : 'How many days a week do you want to train? Be honest, not ambitious.',
    options: (a) => [
      // Zero is a real answer, and it was not on offer. Someone recovering,
      // in pain, or simply not interested had to claim at least one session
      // a week to get past this screen — and the plan then held them to it.
      { value: '0', label: 'None for now' },
      { value: '1', label: a.weekShape === 'retired' ? '1' : '1 — just starting' },
      { value: '2', label: '2' },
      { value: '3', label: '3' },
      { value: '4', label: '4' },
      { value: '5', label: '5' },
      { value: '6', label: '6' },
    ],
  },
  {
    /**
     * Core despite being optional, on the same test that puts existing
     * habits in the spine: it changes what gets BUILT, not merely when.
     *
     * Asked a fortnight later it would arrive after the app had already
     * spent two weeks prescribing barbell squats to someone with a knee
     * that will not take them — and the most likely outcome of that is not
     * a corrected plan, it is a deleted app and a person who now believes
     * this sort of thing is not for them.
     */
    id: 'constraints',
    core: true,
    optional: true,
    kind: 'multi',
    prompt: () =>
      'Anything the plan should work around? Nothing here is medical advice — it just keeps the plan sensible.',
    options: [
      { value: 'joints', label: 'Sore joints or back' },
      { value: 'balance', label: 'Balance is not what it was' },
      { value: 'heart', label: 'A heart or breathing condition' },
      { value: 'recovering', label: 'Recovering from injury or illness' },
      { value: 'pregnancy', label: 'Pregnant or recently postpartum' },
      { value: 'energy', label: 'Energy is unreliable' },
    ],
    reveal: (a) => {
      const picked = Array.isArray(a.constraints) ? a.constraints : [];
      if (picked.length === 0) {
        return 'Good. You can add something here any time — the plan will adjust from that day.';
      }
      if (picked.includes('balance')) {
        return 'Then movement stays low-impact and steady, and balance work goes in early rather than being an afterthought.';
      }
      if (picked.includes('joints')) {
        return 'Then the loaded, jarring movements come out and are replaced, not simply removed.';
      }
      return 'Then the plan starts conservative and builds from what you can actually do. If something hurts, a professional beats an app.';
    },
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
      "What's already part of your life? IntentNorth builds on what you do — never prescribes it back to you as if it were new.",
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
    options: (a) =>
      moreOfOptions(
        a.weekShape as WeekShape | undefined,
        (a.household as string[] | undefined)?.includes('kids') ?? false,
      ),
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
    prompt: () => 'Money — want IntentNorth in the loop?',
    options: (a) => moneyOptions(a.weekShape as WeekShape | undefined),
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
    placeholder: (a) => ambitionPlaceholder(a.weekShape as WeekShape | undefined),
  },
];

/**
 * The options for a step, whether it declares them fixed or computes them.
 * Every renderer goes through here so no screen can accidentally read the
 * static list and show a founder's answers to a retiree.
 */
export function optionsFor(step: InterviewStep, answers: InterviewAnswers): InterviewOption[] {
  if (!step.options) return [];
  return typeof step.options === 'function' ? step.options(answers) : step.options;
}

/** Same, for placeholders — they carry as much market signal as options. */
export function placeholderFor(
  step: InterviewStep,
  answers: InterviewAnswers,
): string | undefined {
  if (!step.placeholder) return undefined;
  return typeof step.placeholder === 'function'
    ? step.placeholder(answers)
    : step.placeholder;
}

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

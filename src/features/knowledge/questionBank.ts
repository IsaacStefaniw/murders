/**
 * Evidence-based goal intake — the structured questions asked when a goal
 * lands in a domain, before the plan is generated. Each answer changes the
 * plan the wizard builds (volume, protocols, milestones), so the questions
 * earn their place: nothing is asked that the planner doesn't use.
 * Question design follows the same sources as the protocol library
 * (docs/KNOWLEDGE.md).
 */

import { BEHAVIOUR_CATALOG } from '@/features/behaviours/catalog';
import type { GoalDomain } from '@/types/domain';

export interface DomainQuestion {
  key: string;
  question: string;
  options: { value: string; label: string }[];
  /**
   * More than one answer can be true at once.
   *
   * Several of these questions were single-choice and should never have
   * been. "What usually kills it?" is time AND energy for most people;
   * "where does the money go missing?" is subscriptions AND the everyday
   * stuff; an urge answered at 9pm is stress AND boredom. Forcing one
   * answer does not simplify the plan, it throws away the second half of
   * what the person just told us — and then builds around the half that
   * survived.
   *
   * Stored as a comma-joined string so the answers object stays a flat
   * Record<string, string> that every existing caller already handles.
   * Read them with `answered()` rather than `===`.
   */
  multi?: boolean;
}

/** Whether a value was chosen, for single- and multi-answer questions alike. */
export function answered(answers: Record<string, string>, key: string, value: string): boolean {
  const raw = answers[key];
  if (!raw) return false;
  return raw === value || raw.split(',').includes(value);
}

/** Every value chosen for a question. */
export function answeredValues(answers: Record<string, string>, key: string): string[] {
  const raw = answers[key];
  return raw ? raw.split(',').filter(Boolean) : [];
}

/**
 * The Habits & urges intake.
 *
 * Kept out of DOMAIN_QUESTIONS on purpose: the goal wizard asks every
 * question under a goal's domain, and a typed "drink less" goal builds no
 * routine from a trigger, so asking there would break the rule at the top
 * of this file. The recovery pathway reads these directly.
 *
 * The trigger is multi-answer. A person who drinks when stressed AND when
 * everyone else is having one told us two things; the first named leads
 * the plan and the hour, and the hub speaks to each.
 */
export const RECOVERY_QUESTIONS: DomainQuestion[] = [
  {
    key: 'behaviour',
    question: 'Which habit are we working on first?',
    // Mirrors BEHAVIOUR_CATALOG rather than restating a subset of it — a
    // habit missing from this list was a habit the path could not start
    // on, which is how `shopping` ended up trackable in Settings and
    // unreachable here.
    options: BEHAVIOUR_CATALOG.map((b) => ({ value: b.key, label: b.label })),
  },
  {
    key: 'trigger',
    question: 'When does it usually win? Pick any that ring true.',
    multi: true,
    options: [
      { value: 'stress', label: 'When the pressure is on' },
      { value: 'boredom', label: 'When there is nothing to do' },
      { value: 'social', label: 'When other people are doing it' },
      { value: 'evening', label: 'Evenings at home, once things go quiet' },
      { value: 'tired', label: 'When I am running on empty' },
      { value: 'lowmood', label: 'When the day has gone badly' },
      { value: 'unsure', label: 'Honestly not sure — help me find it' },
    ],
  },
  {
    key: 'replacement',
    question: 'What could stand in its place?',
    options: [
      { value: 'breathe', label: 'A two-minute breath reset' },
      { value: 'walk', label: 'A short walk, outside if I can' },
      { value: 'read', label: 'Reading something on paper' },
      { value: 'message', label: 'Messaging someone who knows' },
      { value: 'tidy', label: 'Doing one small physical task' },
      { value: 'water', label: 'Making tea, or a cold glass of water' },
      { value: 'unsure', label: 'Help me pick — match it to my trigger' },
    ],
  },
];

export const DOMAIN_QUESTIONS: Partial<Record<GoalDomain, DomainQuestion[]>> = {
  fitness: [
    {
      // The block used to guess what someone wanted from the words in
      // their goal title — "build" meant muscle, "kg" meant fat loss — and
      // there was no way to say it plainly, or to change it. This is the
      // first thing a coach asks, so it is the first thing asked here.
      key: 'want',
      question: 'What do you want from training?',
      options: [
        { value: 'stronger', label: 'Get stronger' },
        { value: 'muscle', label: 'Build muscle' },
        { value: 'leaner', label: 'Get leaner' },
        { value: 'fitter', label: 'Get fitter for running or a sport' },
        { value: 'keep', label: 'Keep what I have' },
        { value: 'unsure', label: 'Not sure — help me pick' },
      ],
    },
    {
      // One flat list, because the intake shows every question at once:
      // a lift for the strength answer, a body area for muscle or leaner,
      // a distance for fitter. The hub's "change what I'm training for"
      // shows only the ones that fit the answer above (training/want.ts).
      key: 'focus',
      question: 'Where first? The lift, the body area or the distance that fits.',
      options: [
        { value: 'bench', label: 'The bench press' },
        { value: 'squat', label: 'The back squat' },
        { value: 'deadlift', label: 'The deadlift' },
        { value: 'ohp', label: 'Overhead press' },
        { value: 'upper', label: 'Upper body' },
        { value: 'lower', label: 'Lower body' },
        { value: 'whole', label: 'Whole body' },
        { value: '5k', label: '5 km' },
        { value: '10k', label: '10 km or more' },
        { value: 'sport', label: 'A sport, not a distance' },
        { value: 'unsure', label: 'Wherever you say' },
      ],
    },
    {
      key: 'experience',
      question: 'Where are you at with training right now?',
      options: [
        { value: 'new', label: 'Basically starting fresh' },
        { value: 'returning', label: 'Coming back after a break' },
        { value: 'consistent', label: 'Training regularly and it is going well' },
        { value: 'unsure', label: 'It comes and goes' },
      ],
    },
    {
      // The intake used to assume the person was not training well: it
      // never asked how often, and every option in the next question was a
      // reason it was not working. Someone training four days a week and
      // enjoying it had nothing true to tap.
      key: 'frequency',
      question: 'How many sessions in a normal week, at the moment?',
      options: [
        { value: '0', label: 'None right now' },
        { value: '1-2', label: 'One or two' },
        { value: '3-4', label: 'Three or four' },
        { value: '5+', label: 'Five or more' },
      ],
    },
    {
      key: 'limiter',
      question: 'What gets in the way, if anything? Pick any that ring true.',
      multi: true,
      options: [
        { value: 'nothing', label: 'Not much — I want it sharper, not easier' },
        { value: 'plateau', label: 'I have stalled on the same numbers' },
        { value: 'time', label: 'The day fills up before I get to it' },
        { value: 'energy', label: 'I am too wrung out by then' },
        { value: 'boredom', label: 'It gets repetitive and I drift' },
        { value: 'soreness', label: 'I overdo it and pay for it' },
        { value: 'confidence', label: 'I am not sure I am doing it right' },
        { value: 'travel', label: 'Travel and away weeks break the rhythm' },
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
        { value: 'stress', label: 'Getting the pressure down' },
        { value: 'unsure', label: 'Not sure — help me work it out' },
      ],
    },
  ],
  business: [
    {
      key: 'bottleneck',
      question: 'What is actually holding the work back right now?',
      multi: true,
      options: [
        { value: 'focus', label: 'No uninterrupted time to think' },
        { value: 'delivery', label: 'Delivering the current work eats the week' },
        { value: 'sales', label: 'Not enough new work coming in' },
        { value: 'people', label: 'Too much sits with me and nobody else' },
        { value: 'direction', label: 'I am busy but not sure it is the right busy' },
        { value: 'admin', label: 'Admin and email crowd out the real work' },
        { value: 'visibility', label: 'The work is good and nobody senior sees it' },
        { value: 'skills', label: 'There is a skill I keep needing and do not have' },
      ],
    },
    {
      key: 'team',
      question: 'Who else can carry some of it?',
      options: [
        { value: 'solo', label: 'Nobody — it is all mine' },
        { value: 'colleagues', label: 'Colleagues, but nobody reports to me' },
        { value: 'contractors', label: 'Freelancers and contractors' },
        { value: 'directs', label: 'A team who report to me' },
        { value: 'leaders', label: 'Leaders who run their own teams' },
        { value: 'unsure', label: 'It is not clear who owns what' },
      ],
    },
    {
      key: 'bigBet',
      question: 'Anything in the next 90 days that would be hard to undo?',
      options: [
        { value: 'signing', label: 'Yes, and it is close' },
        { value: 'maybe', label: 'Possibly — it is not decided' },
        { value: 'no', label: 'Nothing that size right now' },
      ],
    },
  ],
  career: [
    {
      key: 'careerBlocker',
      question: 'What is standing between you and the next step?',
      multi: true,
      options: [
        { value: 'visibility', label: 'The work is good and the wrong people see it' },
        { value: 'skills', label: 'There is a skill the next role needs and I do not have' },
        { value: 'focus', label: 'The important work never gets the good hours' },
        { value: 'network', label: 'I do not know the people who make these decisions' },
        { value: 'clarity', label: 'I am not actually sure what the next step is' },
        { value: 'confidence', label: 'I have not put myself forward' },
        { value: 'timing', label: 'Nothing is open where I am' },
      ],
    },
    {
      key: 'calendarControl',
      question: 'How much of your week do you actually control?',
      options: [
        { value: 'mine', label: 'I set my own calendar' },
        { value: 'shared', label: 'Roughly half is other people’s' },
        { value: 'assigned', label: 'Mostly assigned to me' },
        { value: 'unpredictable', label: 'It changes week to week' },
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
        { value: 'unsure', label: 'All of it, and I do not know where to start' },
      ],
    },
    {
      key: 'leak',
      question: 'Where does the money usually go missing? Pick any.',
      multi: true,
      options: [
        { value: 'recurring', label: 'Subscriptions I forgot about' },
        { value: 'impulse', label: 'One-off things I didn’t plan' },
        { value: 'everyday', label: 'The everyday stuff adds up' },
        { value: 'bills', label: 'Bills that keep creeping up' },
        { value: 'social', label: 'Going out and shouting rounds' },
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
      // Every relationship question presumed a partner. Someone with nobody
      // on the profile got "how are things with them, honestly?" and a
      // build of partner practices. Asked first, so the rest can be read
      // in the right light.
      key: 'with',
      question: 'Who is this about?',
      options: [
        { value: 'partner', label: 'My partner' },
        { value: 'early', label: 'Someone new — early days' },
        { value: 'solo', label: 'Nobody right now — the people I am close to' },
        { value: 'unsure', label: 'Not sure what to call it yet' },
      ],
    },
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
      // "A spread of ages" did nothing a multi-answer could not, and there
      // was no honest answer for a grandparent, a carer or a couple with
      // no children — the intake presumed kids (QA open item PW-O6).
      key: 'ages',
      multi: true,
      question: 'How old are the kids, if there are kids?',
      options: [
        { value: 'under5', label: 'Under 5' },
        { value: 'primary', label: 'Primary school' },
        { value: 'teens', label: 'Teenagers' },
        { value: 'adult', label: 'Grown up and moved out' },
        { value: 'none', label: 'No kids' },
      ],
    },
    {
      // A carer looking after a parent had nothing in this coach at all;
      // a grandparent asked for grandchildren-specific ideas. Both change
      // the build completely.
      key: 'others',
      multi: true,
      question: 'Anyone else this time is for?',
      options: [
        { value: 'grandkids', label: 'The grandchildren' },
        { value: 'parent', label: 'A parent I care for' },
        { value: 'nobody', label: 'No one else' },
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
        { value: 'stretched', label: 'I am stretched thin and short with them' },
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

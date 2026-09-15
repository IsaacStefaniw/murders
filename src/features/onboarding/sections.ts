/**
 * Setup as eight sections, with nothing deferred.
 *
 * ── The reversal, and the evidence for it ───────────────────────────────
 *
 * Isaac: *"Ignore all the other BS about shortening it — let's ask
 * significant questions up front which increases their commitment and then
 * the value the app provides."*
 *
 * The app's own numbers had already made the case. Of 37 interview steps,
 * 13 were asked at signup and 23 were deferred into a coach the person may
 * never open. Measured consequences:
 *
 *   - Rank Family #1, and get a week with nothing family-shaped in it,
 *     because every family routine is gated on `household` and `household`
 *     was deferred.
 *   - The markers headline cannot render at all without `age`, an optional
 *     question deferred into the Training coach.
 *   - Six of ten marker components sit behind opening one of two coaches.
 *   - Seven of the 23 deferred questions were unreachable even from the
 *     screen built to reach them.
 *
 * Deferring was never kindness. It was the app declining to ask, and then
 * being unable to do its job.
 *
 * ── Why long is the right call here, and not merely the asked-for one ───
 *
 * The reveal after every answer — "5 work days. Nothing gets scheduled
 * over them." — is effort justification working as designed: the plan is
 * valued because the person watched themselves build it. That mechanism
 * gets STRONGER with more questions, not weaker, on one condition: every
 * answer has to visibly buy something. A thirty-question setup where each
 * answer changes the plan on screen beats a twelve-question one where half
 * the answers vanish.
 *
 * So the rule is not "ask less". It is: **no question without a payout,
 * and no answer that goes nowhere.**
 *
 * ── What a section is for ───────────────────────────────────────────────
 *
 * Eight of them, each opening with what it unlocks and closing with what
 * it changed. Sections are what make thirty questions survivable: a person
 * will give you ten minutes if they can see the end, and eight dots is a
 * shape you can see the end of where "question 19 of 31" is not.
 *
 * **Skipping is allowed everywhere and priced everywhere.** A section you
 * skip says what it costs — "your markers will read 4 of 10 instead of 9"
 * — because a cost named up front is a decision and a cost discovered
 * later is a grievance. What a person skips stays offerable from the coach
 * that wanted it, which is what `deferTo` now means: not "asked later,
 * maybe", but "the place you can still answer this".
 *
 * ── The one deviation from the sketch ───────────────────────────────────
 *
 * The sketch has eight sections and no food section, but `foodAim` and
 * `foodTrouble` have to live somewhere and they are not lifestyle. They
 * sit in §5, which is named "Health and food" rather than "Health".
 */

import { INTERVIEW_STEPS, isCore, type InterviewAnswers, type InterviewStep } from './script';

export type SetupSection =
  | 'habits'
  | 'positives'
  | 'goals'
  | 'lifestyle'
  | 'health'
  | 'training'
  | 'money'
  | 'work';

export interface SetupSectionDef {
  id: SetupSection;
  /** The heading, and the word on the progress spine. */
  title: string;
  /** One line, before the first question: what answering this buys. */
  unlocks: string;
  /** One line, on the skip: what not answering costs. Never a guilt trip. */
  skipPrice: string;
}

/**
 * The sketch's order, and it is deliberate.
 *
 * Starting on what somebody wants LESS of is a committing opening: it is
 * the question they came with, and answering it first means the rest of
 * setup is spent on a person who has already told the truth about
 * something. Name comes before all of it, in §4's own first question, so
 * nobody is asked their vices by a stranger who has not introduced itself
 * — the welcome screen does that.
 */
export const SETUP_SECTIONS: SetupSectionDef[] = [
  {
    id: 'habits',
    title: 'Where you’re starting',
    unlocks:
      'Your name, the shape of your week, who is at home, and the thing you came here to change.',
    // Names what is actually in the section. §1 carries the name, the week
    // shape and the household as well as the habits, so a skip price about
    // urge tools alone would have been quietly untrue about the biggest
    // thing it costs.
    skipPrice: 'Skip — and the plan guesses at your week and who is in it, which it will get wrong.',
  },
  {
    id: 'positives',
    title: 'What you already do',
    unlocks: 'Anything here arrives as already yours, rather than handed back to you as a new idea.',
    skipPrice:
      'Skip — the plan will treat everything as new, including the walk you have taken for years.',
  },
  {
    id: 'goals',
    title: 'What you are actually after',
    unlocks:
      'What matters most, and the one thing you are working toward — with a number and a date, so it becomes a trajectory rather than a wish.',
    skipPrice: 'Skip — the plan still gets built, but nothing in it will have a finish line.',
  },
  {
    id: 'lifestyle',
    title: 'The shape of your week',
    unlocks: 'Every placement decision the scheduler makes comes from this section.',
    skipPrice: 'Skip — and the plan guesses at your hours, which it will get wrong.',
  },
  {
    id: 'health',
    title: 'Health and food',
    unlocks: 'Your markers, and the eight components behind them.',
    skipPrice: 'Skip — your markers will read a few of ten instead of most of them.',
  },
  {
    id: 'training',
    title: 'Training',
    unlocks: 'The level you actually start at, rather than the bottom.',
    skipPrice: 'Skip — and Ren starts you at the foundation, whatever you can already do.',
  },
  {
    id: 'money',
    title: 'Money',
    unlocks: 'The dated money year, and one transfer that happens without you.',
    skipPrice: 'Skip — Nell has nothing to work with and the money coach stays empty.',
  },
  {
    id: 'work',
    title: 'Work',
    unlocks: 'The named bet, and thinking time that survives the calendar.',
    skipPrice: 'Skip — and work blocks get placed without knowing what they are for.',
  },
];

export const SECTION_ORDER: SetupSection[] = SETUP_SECTIONS.map((s) => s.id);

/**
 * Which section every question belongs to.
 *
 * A map rather than a field on each step, so the 37 step definitions stay
 * about what they ask. Completeness is enforced by a test: a step added
 * without a section fails the build rather than quietly appearing last.
 */
export const SECTION_OF: Record<string, SetupSection> = {
  /*
   * §1 — where you're starting.
   *
   * `name` and `weekShape` open it, and they are here rather than in
   * lifestyle for two reasons. The soft one: sixteen questions about
   * somebody's drinking and ambitions before asking their name, and then
   * greeting them by it at question seventeen, reads as a form that
   * learned manners late.
   *
   * The hard one: `lessOf` and `moreOf` compute their OPTIONS from
   * `weekShape`, and `moreOf` also reads `household`. Asked before either,
   * a retiree gets a shift worker's answers and a parent gets a list with
   * no children in it. A test derives this rather than trusting the
   * comment — any step whose options, placeholder, prompt or skipIf change
   * with an earlier answer has to be asked after it. It is what caught
   * `household`, which had been left in §4 where it read fine.
   */
  name: 'habits',
  weekShape: 'habits',
  household: 'habits',
  kidsCount: 'habits',
  partnerName: 'habits',
  lessOf: 'habits',
  smokingStatus: 'habits',
  drinkingBand: 'habits',
  mind: 'habits',

  // §2 — what you already do
  existingHabits: 'positives',
  moreOf: 'positives',
  walkingPace: 'positives',

  // §3 — what you are after
  ambition: 'goals',
  ambitionTarget: 'goals',
  vision: 'goals',
  priorities: 'goals',

  // §4 — the shape of the week
  workDays: 'lifestyle',
  workHours: 'lifestyle',
  weekAnchors: 'lifestyle',
  sleep: 'lifestyle',
  sleepQuality: 'lifestyle',
  energy: 'lifestyle',
  capacity: 'lifestyle',
  constraints: 'lifestyle',

  // §5 — health and food
  birthYear: 'health',
  age: 'health',
  sexAtBirth: 'health',
  weight: 'health',
  selfRatedHealth: 'health',
  pressure: 'health',
  foodAim: 'health',
  foodTrouble: 'health',

  // §6 — training
  trainingDays: 'training',
  trainingExperience: 'training',
  trainingSetup: 'training',

  // §7 — money
  money: 'money',
  moneyAutomation: 'money',

  // §8 — work
  workStyle: 'work',
};

export function sectionOf(step: InterviewStep): SetupSection {
  // Anything unmapped goes to lifestyle rather than nowhere. The test
  // above is what stops this being used.
  return SECTION_OF[step.id] ?? 'lifestyle';
}

export interface SetupStep {
  step: InterviewStep;
  section: SetupSection;
  /** True on the first question of its section, which is where the header
   *  and the skip offer belong. */
  opensSection: boolean;
}

/**
 * Every question, in section order, minus the ones this person's answers
 * have ruled out.
 *
 * Note what is NOT filtered: `core`. The spine still exists and
 * `activeSteps` still describes it — it is the set without which the
 * scheduler cannot build a correct first week, which is a real thing worth
 * naming and is used to decide what a half-finished setup can still
 * produce. It is no longer what setup asks, because setup asks everything.
 */
export function setupSteps(answers: InterviewAnswers): SetupStep[] {
  const out: SetupStep[] = [];
  for (const section of SECTION_ORDER) {
    const inSection = INTERVIEW_STEPS.filter(
      (s) => sectionOf(s) === section && !s.skipIf?.(answers),
    );
    inSection.forEach((step, i) => {
      out.push({ step, section, opensSection: i === 0 });
    });
  }
  return out;
}

/** The section definition, for the header and the skip price. */
export function sectionDef(id: SetupSection): SetupSectionDef {
  return SETUP_SECTIONS.find((s) => s.id === id) ?? SETUP_SECTIONS[0];
}

/**
 * Which sections still have an unanswered question in them.
 *
 * Drives the eight-dot spine: a filled dot is a section with nothing left
 * in it, whether that is because it was answered or because it was
 * skipped. Both are finished, and the app does not distinguish between
 * them in the UI — a skip is a decision, not a debt.
 */
export function sectionsRemaining(answers: InterviewAnswers): Set<SetupSection> {
  const out = new Set<SetupSection>();
  for (const { step, section } of setupSteps(answers)) {
    if (!isAnswered(answers, step.id)) out.add(section);
  }
  return out;
}

export function isAnswered(answers: InterviewAnswers, id: string): boolean {
  const v = answers[id];
  if (v === undefined) return false;
  return Array.isArray(v) ? v.length > 0 : v.length > 0;
}

/**
 * What a half-finished setup can still build.
 *
 * Skipping is allowed everywhere, so the plan has to survive it. This is
 * the honest report: the spine questions still missing after everything
 * the person chose to answer.
 */
export function spineGaps(answers: InterviewAnswers): InterviewStep[] {
  return INTERVIEW_STEPS.filter(
    (s) => isCore(s, answers) && !s.skipIf?.(answers) && !isAnswered(answers, s.id),
  );
}

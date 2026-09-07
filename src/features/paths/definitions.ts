/**
 * Paths — guided domain programs (docs/PATHS_BRIEF.md).
 *
 * A path is: a promise, a short intake where EVERY answer changes the
 * plan, optional personal numbers where the maths uses them, and a hub
 * that explains the week instead of just blocking time. Builders lean on
 * the goal planner and the evidence library so a path is a real goal with
 * real routines — adapted, learned-on, and reviewed like everything else.
 */

import { behaviourInfo } from '@/features/behaviours/catalog';
import {
  ifThenPlan,
  primaryTrigger,
  replacementOf,
  triggersOf,
  type ReplacementKey,
  type TriggerKey,
} from '@/features/behaviours/tonight';
import { KIDS_ONLY, OUTINGS, composition, familyVariant, withoutMatching } from '@/features/family/composition';
import { buildGoalPlan, type GoalPlan, type ParsedGoal } from '@/features/goals/goalPlanner';
import { protocolById, toRoutine } from '@/features/knowledge/protocols';
import {
  DOMAIN_QUESTIONS,
  RECOVERY_QUESTIONS,
  answered,
  type DomainQuestion,
} from '@/features/knowledge/questionBank';
import { moneySteps } from '@/features/money/plan';
import { sessionsPerWeekFloor } from '@/features/training/programme';
import { newId, toHHMM, toMinutes } from '@/lib/dates';
import type { BehaviourKey, LifeProfile, Routine } from '@/types/domain';

import { fitLadderToBudget, ladderFor } from './programme';
import { LEVEL_ORDER, type PathLevel } from './level';

export type PathId =
  | 'training'
  | 'nutrition'
  | 'money'
  | 'work'
  | 'recovery'
  | 'relationship'
  | 'family';

/** A path build is a goal plan, plus optionally the behaviour it protects. */
export type PathBuild = GoalPlan & { behaviour?: BehaviourKey };

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
  build: (answers: Record<string, string>, profile: LifeProfile | null) => PathBuild;
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

/** The library practices behind a list of ids, as routines for this goal. */
function routinesFor(ids: string[], profile: LifeProfile | null, goalId: string): Routine[] {
  const routines: Routine[] = [];
  for (const id of ids) {
    const protocol = protocolById(id);
    if (protocol) routines.push(toRoutine(protocol, profile, goalId));
  }
  return routines;
}

/** Weekend-only windows: nothing weekday-anchored will survive. */
function weekendOnly(routines: Routine[]): void {
  for (const r of routines) r.days = r.days.filter((d) => d === 0 || d === 6);
}

/**
 * Who the relationship coach is about. The intake asks; an answer saved
 * before it did is from someone who was on the partner build, and stays
 * there — the friends build is only ever chosen, never inferred. "Not
 * sure what to call it" gets the early-days build: the cheap practices,
 * and nothing that presumes a state to review.
 */
function relationshipWith(answers: Record<string, string>): 'partner' | 'early' | 'solo' {
  const raw = answers.with;
  if (raw === 'early' || raw === 'solo' || raw === 'unsure') return raw === 'unsure' ? 'early' : raw;
  return 'partner';
}

/** Ladder milestones that only make sense with a partner in the picture. */
const PARTNER_ONLY = /\bboth\b|together/i;

/**
 * The level a build is for.
 *
 * Threaded through `answers` rather than added as a parameter because the
 * answers object is what every caller already carries — the store, the
 * hub, the simulation and the tests — and a new positional argument would
 * have been silently dropped by all of them. An unrecognised or absent
 * value means foundation: a person we know nothing about gets the thin
 * programme, never the heavy one.
 */
function levelFromAnswers(answers: Record<string, string>): PathLevel {
  const raw = answers.level as PathLevel | undefined;
  return raw && LEVEL_ORDER.includes(raw) ? raw : 'foundation';
}

/**
 * Every pathway's build runs through here.
 *
 * Before this existed, an audit of 7,000 profiles found 100% of builds
 * identical across all four levels in all seven pathways: `LEVEL_BLURB`
 * promised the user something specific changed at each rung and nothing
 * did. Applying the ladder centrally is what stops that regressing the
 * next time a pathway is added.
 */
function withLadder(
  path: PathId,
  plan: PathBuild,
  answers: Record<string, string>,
  profile: LifeProfile | null,
  /**
   * The pathway has already decided to be small on purpose.
   *
   * The relationship pathway shrinks itself when someone says things are
   * hard or that there is no window, and that rule predates the ladder and
   * outranks it: a person telling us it is bad does not need three more
   * calendar blocks. The first version of the ladder added to those plans
   * anyway, and the existing journey tests caught it.
   *
   * But suppressing it entirely was too blunt, and the pathway audit found
   * the cost: for 46% of relationship profiles — everyone in a hard patch
   * or without a window — all four levels produced an identical build. The
   * level did nothing at all, while LEVEL_BLURB went on promising them
   * something specific changed at each rung. That is the exact defect the
   * ladder exists to prevent, reintroduced by the guard against it.
   *
   * So suppression now means "add no calendar blocks", not "ignore the
   * rung". The milestones and the framing still come from the level,
   * because they are what the rung is actually about and they cost nobody
   * an evening.
   */
  suppress = false,
): PathBuild {
  const level = levelFromAnswers(answers);
  const ladder = ladderFor(path, level, profile, plan.goal.id);
  const existingTitles = new Set(plan.routines.map((r) => r.title));
  // A rung's `covers` names either a protocol id or a session type as
  // `session:<type>` — the same identity mergeRoutines competes on.
  const existingProtocols = new Set(
    plan.routines.flatMap((r) => [
      ...(r.protocolId ? [r.protocolId] : []),
      ...(r.sessionType ? [`session:${r.sessionType}`] : []),
    ]),
  );
  const added = ladder.routines.filter((r, i) => {
    if (existingTitles.has(r.title)) return false;
    // A rung must not re-prescribe a practice the pathway already
    // scheduled under a different name.
    const covers = ladder.covers[i] ?? [];
    return !covers.some((c) => existingProtocols.has(c));
  });
  const routines = suppress
    ? plan.routines
    : [...plan.routines, ...fitLadderToBudget(added, level)];
  const existingMilestones = plan.goal.milestones ?? [];
  const existingMilestoneTitles = new Set(existingMilestones.map((m) => m.title));
  return {
    ...plan,
    routines,
    goal: {
      ...plan.goal,
      // The family goal plan and the family foundation rung both promise
      // "One outing that actually happened"; the same step twice reads as a
      // bug and can only be ticked once. The pathway's own wording wins.
      milestones: [
        ...existingMilestones,
        ...ladder.milestones.filter((m) => !existingMilestoneTitles.has(m.title)),
      ],
      routineIds: routines.map((r) => r.id),
    },
  };
}

export const PATHS: Record<PathId, PathDefinition> = {
  training: {
    id: 'training',
    title: 'Training',
    promise:
      'A program sized to your real week — strength first, easy cardio when you’re ready, every session pre-decided so the gym door needs no willpower.',
    questions: DOMAIN_QUESTIONS.fitness ?? [],
    personalNumbers: [
      {
        key: 'age',
        label: 'Age',
        why: 'Past 45 the program protects you with longer warm-ups and conservative loading.',
      },
    ],
    build: (answers, profile) =>
      withLadder('training', buildGoalPlan(parsed('Training that sticks', 'fitness', 'health'), profile, undefined, answers), answers, profile),
    insights: (answers, profile) => {
      const lines: string[] = [];
      if (answers.experience === 'new') {
        lines.push('Two 30-minute sessions you keep beat three you skip. Volume comes later — consistency first.');
      } else if (answers.experience === 'consistent') {
        lines.push('Strength three days, easy cardio twice — the easy, steady work is the piece most lifters skip, and it pays the longest.');
      } else {
        lines.push('Three days, main lifts first. The coach shrinks a session when time collapses — it never cancels it.');
      }
      const floor = sessionsPerWeekFloor(answers.frequency);
      if (floor >= 3) {
        lines.push(
          `You already train ${answers.frequency === '5+' ? 'five or more' : 'three or four'} days a week, so the block keeps that cadence rather than starting you over — what changes is the structure: loads that move on purpose, and an easier week that lets them stick.`,
        );
      }
      if (answered(answers, 'limiter', 'nothing')) {
        lines.push('Nothing to fix, then. The block adds progression, not volume: each week asks a little more than the last, and the retest at the end tells you what it bought.');
      }
      if (answered(answers, 'limiter', 'plateau')) {
        lines.push('A plateau is usually a dose problem. The load changes every week of the block, the fourth week backs off, and the retest says whether the number moved — or why it did not.');
      }
      if (answered(answers, 'limiter', 'time')) {
        lines.push('Time is your limiter, so nothing in this program needs more than 30–45 minutes, warm-up included.');
      }
      if (answered(answers, 'limiter', 'boredom')) {
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
          { value: 'unsure', label: 'Not sure — just eat better than I do now' },
        ],
      },
      {
        key: 'cooking',
        question: 'Weeknight cooking reality?',
        options: [
          { value: 'quick', label: '15 minutes, tops' },
          { value: 'normal', label: 'Half an hour is fine' },
          { value: 'enjoy', label: 'I actually enjoy it' },
          { value: 'varies', label: 'It depends entirely on the week' },
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
      // `cooking` was asked and then ignored — dead across the whole audit
      // sample. Someone who never cooks does not need a cook-ahead block;
      // they need the decision made before they are hungry.
      if (answers.cooking === 'quick') {
        plan.routines.push({
          id: newId('r'),
          goalId: plan.goal.id,
          title: 'Decide tomorrow\u2019s food before you are hungry',
          area: 'health',
          days: [1, 2, 3, 4, 5],
          durationMin: 5,
          preferredStart: '20:30',
          preferredEnd: '22:00',
          energy: 'evening',
          flexible: true,
          protected: false,
          tier: 'should',
          active: true,
        });
        plan.goal.milestones = [
          ...(plan.goal.milestones ?? []),
          { id: newId('ms'), title: 'Five weeknights decided in advance', done: false },
        ];
      } else if (answers.cooking === 'enjoy') {
        plan.routines.push({
          id: newId('r'),
          goalId: plan.goal.id,
          title: 'Batch one protein source for the week',
          area: 'health',
          days: [0],
          durationMin: 40,
          preferredStart: '15:00',
          preferredEnd: '18:00',
          energy: 'evening',
          flexible: true,
          protected: false,
          tier: 'could',
          active: true,
        });
      }
      return withLadder('nutrition', plan, answers, profile);
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
      // The second number, beside protein: the developing rung promised
      // "protein and fibre targets known" and the fibre half never reached
      // a screen. About 30 g is the library's rounding of the Lancet range.
      lines.push('About 30 g of fibre a day — beans, lentils, oats, fruit, skins. The best-supported food number there is, and the shopping list carries it.');
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
      'One automatic transfer on payday, a target with a date, and a weekly number that moves it. The goal gets paid before the month starts; willpower budgeting is not a system.',
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
      {
        // Asked here rather than after the build: the first two steps are
        // sized from it, and the review found the hub asking it under a
        // program that had just been built without it.
        key: 'buffer',
        question: 'If income stopped, how long could you keep going?',
        options: [
          { value: 'none', label: 'Under a month' },
          { value: 'some', label: 'One to three months' },
          { value: 'solid', label: 'Three months or more' },
        ],
      },
    ],
    build: (answers, profile) => {
      const plan = buildGoalPlan(parsed('Money, running itself', 'finance', 'admin'), profile, undefined, answers);
      // The money coach owns its steps: one list, in order, from the
      // answers (src/features/money/plan.ts). The goal planner's generic
      // finance milestones said the same things in different words, and
      // the hub was showing both lists.
      const now = new Date().toISOString();
      const milestones = moneySteps(answers).map((s) => ({
        id: newId('ms'),
        title: s.title,
        done: s.done,
        doneAt: s.done ? now : undefined,
      }));
      return withLadder('money', { ...plan, goal: { ...plan.goal, milestones } }, answers, profile);
    },
    insights: (answers) => {
      const lines: string[] = [];
      if (answers.automation === 'no') {
        lines.push('First move, this week: automate one transfer on the day pay lands. Even a small one. Everything after that is watching, not discipline.');
      } else if (answers.automation === 'partial') {
        lines.push('Finish the automation: every recurring decision you delete is a decision that cannot go wrong on a bad week.');
      } else {
        lines.push('Automation is running, so the weekly check-in is about catching drift early, not forcing behaviour.');
      }
      if (answers.buffer === 'none') {
        lines.push('Under a month of buffer means the buffer is the goal. Everything else waits until one month is banked, somewhere you can reach it.');
      } else if (answers.buffer === 'some') {
        lines.push('One to three months banked: grow it to three, the figure Moneysmart suggests, then the surplus goes to work.');
      } else if (answers.buffer === 'solid') {
        lines.push('Three months or more banked. The buffer question is answered; the check-in is about putting the surplus to work.');
      }
      if (answers.mode === 'debt') {
        lines.push('The order: list every rate, pick one payoff order you will finish, automate the extra payment against the first debt. A card or buy-now-pay-later balance comes before any investing; a student loan (HELP) is indexed once a year in June and sits later.');
      } else {
        lines.push('The order after the buffer: expensive debt, then investing the boring way, low cost, spread wide, every month, untouched. Whether that means extra on the home loan, more into super, or outside both depends on your tax rate, your age and your loan, and that choice belongs with a licensed adviser. Education, never financial advice.');
      }
      if (answers.mode === 'saving') {
        lines.push('Name the amount and the date on this screen. People who write a specific target save more than people who mean to, and the coach turns it into a monthly amount and dated steps.');
      }
      if (answers.mode === 'clarity' || answers.mode === 'getting_on_top' || answers.mode === 'unsure') {
        lines.push('One place, one monthly number. Clarity comes before every good money decision.');
      }
      if (answers.mode === 'lasting') {
        lines.push('Making it last is a drawdown question: how much comes out each year and from where. Writing it down is education; setting it is a licensed adviser conversation.');
      }
      if (answered(answers, 'leak', 'recurring')) {
        lines.push('Subscriptions run for years on inattention. Listing every one is a single evening; cancelling the dead ones is usually the fastest money in this whole program.');
      }
      if (answers.raise === 'absorbed') {
        lines.push('The last rise was absorbed. The defence that works is deciding the share of the next one before it lands.');
      }
      lines.push('Each week, one number: what went in. Small and weekly beats big and never.');
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
          { value: 'physical', label: 'On my feet, hands-on work' },
          { value: 'varies', label: 'No two weeks are the same' },
        ],
      },
      {
        // Asked in the intake rather than left to the hub's question card:
        // the block is built from it, and the insight below promises where
        // the focus block goes. A promise the build did not keep was the
        // finding that put it here.
        key: 'meetingLoad',
        question: 'How much of your week is meetings?',
        options: [
          { value: 'none', label: 'Hardly any' },
          { value: 'light', label: 'Under a quarter' },
          { value: 'half', label: 'Around half' },
          { value: 'heavy', label: 'Most of it' },
        ],
      },
    ],
    build: (answers, profile) => {
      const plan = buildGoalPlan(parsed('A week that produces', 'business', 'work'), profile, undefined, answers);
      const workStart = profile?.workStart ?? '09:00';
      /** Add a library practice once, or reshape the one already there. */
      const shape = (protocolId: string, patch: Partial<Routine> = {}) => {
        const existing = plan.routines.find((r) => r.protocolId === protocolId);
        if (existing) {
          Object.assign(existing, patch);
          return;
        }
        const protocol = protocolById(protocolId);
        if (protocol) plan.routines.push({ ...toRoutine(protocol, profile, plan.goal.id), ...patch });
      };

      // Makers get the focus block even when focus isn't the named
      // bottleneck — the growth block alone doesn't protect making time.
      // Every style except manager, including physical: whether a trade
      // should get a thinking block carved from the work day is a product
      // decision (QA report, PW-O3) and is left exactly as it was.
      if (answers.style !== 'manager') {
        if (answers.meetingLoad === 'heavy') {
          // Before the first call, or it does not happen: the block moves
          // to the start of the work day, and the window stays tight so
          // the scheduler cannot drift it into the meetings.
          shape('deep-work', {
            preferredStart: workStart,
            preferredEnd: toHHMM((toMinutes(workStart) + 75) % 1440),
          });
        } else if (answers.meetingLoad === 'light' || answers.meetingLoad === 'none') {
          // A light week is an asset: a third making block, not one.
          shape('deep-work', { days: [1, 2, 4] });
        } else {
          shape('deep-work');
        }
      }
      // A manager in a heavy week has no block to move; what they own is
      // the meeting list, so the week gets a slot for cutting one.
      if (answers.style === 'manager' && answers.meetingLoad === 'heavy') {
        shape('meeting-trim');
      }

      // Each bottleneck answer changes the plan or it is not worth asking.
      // Focus is handled by the goal planner (the focus block); sales and
      // delivery change the milestones there. The rest were asked and
      // ignored until now.
      if (answered(answers, 'bottleneck', 'admin')) shape('message-batching');
      if (answered(answers, 'bottleneck', 'people')) shape('delegation-pass');
      if (answered(answers, 'bottleneck', 'visibility')) shape('work-made-visible');
      if (answered(answers, 'bottleneck', 'direction')) shape('week-preview');

      // `team` and `bigBet` were both asked and both ignored. Someone
      // leading people and someone working alone need different weeks, and
      // a named big bet is the only thing that makes a growth block about
      // something rather than about working.
      if (answers.team === 'directs' || answers.team === 'leaders') {
        plan.routines.push({
          id: newId('r'),
          goalId: plan.goal.id,
          title: 'One-on-ones — the work only you can do',
          area: 'work',
          days: [2],
          durationMin: 45,
          preferredStart: '10:00',
          preferredEnd: '15:00',
          energy: 'midday',
          flexible: true,
          protected: false,
          duringWork: true,
          tier: 'should',
          active: true,
        });
        plan.goal.milestones = [
          ...(plan.goal.milestones ?? []),
          { id: newId('ms'), title: 'Every direct report has a standing slot', done: false },
        ];
      }
      if (answers.bigBet === 'signing' || answers.bigBet === 'maybe') {
        plan.goal.milestones = [
          ...(plan.goal.milestones ?? []),
          { id: newId('ms'), title: 'The big bet written in one sentence', done: false },
          { id: newId('ms'), title: 'First visible progress on it', done: false },
        ];
      }
      return withLadder('work', plan, answers, profile);
    },
    insights: (answers, profile) => {
      const lines: string[] = [];
      const workStart = profile?.workStart ?? '09:00';
      if (answers.style === 'maker' || answers.style === 'mixed') {
        lines.push('Mornings are for making. Meetings that can move, move after lunch.');
      }
      if (answers.style === 'manager') {
        lines.push('Your leverage is the weekly review: one lever named, one thing stopped, every week.');
      }
      if (answers.style === 'varies' || answers.style === 'physical') {
        lines.push('The week does not repeat, so the plan is small: close each shift knowing the next one’s first move, and a modest focus target rather than a maker’s.');
      }
      if (answered(answers, 'bottleneck', 'sales')) {
        lines.push('The growth block opens with the sales levers until that milestone is done.');
      }
      if (answered(answers, 'bottleneck', 'delivery')) {
        lines.push('Fix the delivery bottleneck before chasing growth — capacity first, then volume.');
      }
      if (answered(answers, 'bottleneck', 'focus')) {
        lines.push('“No time to think” is a calendar problem. The focus block is the fix, and it’s protected.');
      }
      if (answered(answers, 'bottleneck', 'admin')) {
        lines.push('Messages go in batches — one booked slot a day, closed in between. Graded C: one small trial found lower daily stress.');
      }
      if (answered(answers, 'bottleneck', 'people')) {
        lines.push('Too much sits with you, so a weekly delegation pass is on the calendar: one recurring thing handed over with an owner and a date.');
      }
      if (answered(answers, 'bottleneck', 'visibility')) {
        lines.push('A short written note each week to the people your work affects — plain facts travel further than adjectives.');
      }
      if (answered(answers, 'bottleneck', 'direction')) {
        lines.push('Busy but not sure it is the right busy: fifteen Sunday minutes name the three things that matter before the inbox names them for you.');
      }
      if (answers.meetingLoad === 'heavy' && answers.style !== 'manager') {
        lines.push(`Meetings own most of the week — the focus block sits at ${workStart}, before the first call, or it doesn’t happen.`);
      } else if (answers.meetingLoad === 'heavy') {
        lines.push('Meetings own most of the week, and they are yours: fifteen minutes on Friday cuts or shortens one.');
      } else if (answers.meetingLoad === 'light' || answers.meetingLoad === 'none') {
        lines.push('A light meeting load is an asset: three protected making blocks, not two.');
      }
      lines.push('The weekly review closes the loop: what moved, what ate the block, the one lever for next week — and next week changes from the answers.');
      return lines;
    },
  },

  recovery: {
    id: 'recovery',
    title: 'Habits & urges',
    promise:
      'Not willpower — engineering. Name the moment the urge usually wins, put a rehearsed answer in that exact window, and let IntentNorth learn your real triggers from what you log.',
    // The questions live in the question bank beside the other intakes;
    // the trigger is multi-answer there because an urge answered at 9pm is
    // stress AND boredom.
    questions: RECOVERY_QUESTIONS,
    build: (answers, profile): PathBuild => {
      const behaviour = (answers.behaviour ?? 'doomscrolling') as BehaviourKey;
      const info = behaviourInfo(behaviour);
      const now = new Date().toISOString();
      const goalId = newId('g');

      // The rehearsed answer lives in the actual risk window. More than
      // one trigger can be true; the first named leads the hour until the
      // log finds the real one.
      const trigger = primaryTrigger(answers);
      const start =
        trigger === 'stress'
          ? '12:45'
          : trigger === 'social'
            ? '17:30'
            : trigger === 'boredom'
              ? '19:45'
              : '20:30';
      // "Help me pick" is matched to the trigger: a boredom urge gets
      // something for the hands, a social one a message, a tired one the
      // smallest thing. It used to hand everyone the breath reset.
      const replacement = replacementOf(answers);
      const routineByReplacement: Record<ReplacementKey, Partial<Routine> & { title: string }> = {
        breathe: { title: 'The urge answer: two-minute reset', durationMin: 5, sessionType: 'breathe' },
        walk: { title: 'The urge answer: walk it off', durationMin: 20 },
        read: { title: 'The urge answer: read instead', durationMin: 20 },
        message: { title: 'The urge answer: message someone real', durationMin: 10 },
        // 'tidy' and 'water' were offered on the intake and then handed the
        // breath reset, so two of the six taps changed nothing.
        tidy: { title: 'The urge answer: one small job with your hands', durationMin: 10 },
        water: { title: 'The urge answer: make a drink, slowly', durationMin: 5 },
      };
      const base = routineByReplacement[replacement];
      const routine: Routine = {
        id: newId('r'),
        title: base.title,
        area: 'health',
        goalId,
        days: [0, 1, 2, 3, 4, 5, 6],
        durationMin: base.durationMin ?? 10,
        preferredStart: start,
        preferredEnd: start,
        energy: 'any',
        flexible: true,
        protected: false,
        sessionType: base.sessionType,
        tier: profile?.capacity === 'minimal' ? 'could' : 'should',
        active: true,
      };

      const built: PathBuild = {
        goal: {
          id: goalId,
          title: info.intentionTemplate,
          area: 'health',
          domain: 'behaviour',
          milestones: [
            {
              id: newId('ms'),
              title: 'Name the moment it usually starts',
              done: triggersOf(answers).some((t) => t !== 'unsure'),
            },
            {
              id: newId('ms'),
              title: 'Choose the replacement and make it easy',
              done: !!answers.replacement && answers.replacement !== 'unsure',
            },
            { id: newId('ms'), title: 'Seven days with the urge answered', done: false },
            { id: newId('ms'), title: 'Four steady weeks', done: false },
          ],
          status: 'active',
          createdAt: now,
          routineIds: [routine.id],
        },
        routines: [routine],
        behaviour,
      };
      return { ...withLadder('recovery', built, answers, profile), behaviour };
    },
    insights: (answers) => {
      const lines: string[] = [];
      // The plan leads. An if-then sentence is the best-replicated single
      // technique in this whole area, and a plan in the person's own words
      // is the one that gets kept; the hub says so and Today lets them
      // write it.
      const plan = ifThenPlan(answers);
      lines.push(
        plan.ownWords
          ? `Your plan: ${plan.text}`
          : `Your plan, from your answers: ${plan.text} Put it in your own words on Today — plans in your words are the ones that get kept.`,
      );
      const triggerLine: Record<TriggerKey, string> = {
        stress: 'Stress is the trigger, so the answer sits mid-workday — a rehearsed reset before the evening arrives already depleted.',
        boredom: 'Boredom urges want stimulation, not sedation — the replacement gives your hands and mind something real.',
        social: 'Social triggers are decided in advance: know your drink, your line, and your exit before you arrive.',
        evening: 'Evening at home is the classic window. The replacement is scheduled right into it — same time, every night.',
        // 'tired' and 'lowmood' are on the intake and had no line, so the
        // hub showed a blank where the first sentence should have been.
        tired: 'Running on empty is when the urge costs least to give in to — the answer is small on purpose, because a tired evening cannot carry a big one.',
        lowmood: 'A bad day makes the habit feel like relief. The replacement is something kind that is not the habit, and logging the day is what shows the pattern.',
        unsure: 'Not sure of the trigger? Log each urge with one tap and IntentNorth will find the pattern within two weeks.',
      };
      // One line per trigger named, so the second thing they told us is
      // answered too.
      const triggers = triggersOf(answers);
      for (const t of triggers.length > 0 ? triggers : (['unsure'] as TriggerKey[])) {
        lines.push(triggerLine[t]);
      }
      lines.push('One miss is noise. Two in a row is the fork — that’s when IntentNorth steps in, not with shame, with a plan.');
      if (answers.wave === 'evening') {
        lines.push('Your urges run long, so the answer isn’t outlasting one wave — it’s changing the evening’s shape before it starts.');
      } else {
        lines.push('Urges crest and fall in about 10 minutes. The replacement doesn’t have to beat the habit — it has to outlast the wave.');
      }
      lines.push('Wins are counted on Today and never reset. A slip is one event, and the next hour is the plan.');
      // The clinical line, per behaviour. Dependence is a doctor's call;
      // helplines are named generically because the app does not know
      // which country the phone is in.
      if (answers.behaviour === 'alcohol') {
        lines.push('Honest scope: this is structure for cutting down. If drinking feels out of control, or a day without brings shakes, sweats or a racing heart, talk to someone qualified — that’s strength, not failure.');
      }
      if (answers.behaviour === 'vaping' || answers.behaviour === 'smoking') {
        lines.push('A GP or a quitline can add nicotine replacement to this plan, which roughly doubles the odds. IntentNorth is here for the pattern, not instead of that.');
      }
      if (answers.behaviour === 'gambling') {
        lines.push('A gambling block on the bank card and self-exclusion do more than any plan on this screen. A free, confidential helpline is the right first call, and it asks for no name.');
      }
      return lines;
    },
    sessionLabel: 'Breathe through an urge',
    sessionRoute: '/session/breathe',
  },
  relationship: {
    id: 'relationship',
    title: 'Relationship',
    promise:
      'Small, repeatable attention rather than a grand gesture you never schedule — the five minutes at the door, one thing named out loud, and one unhurried conversation a month.',
    questions: DOMAIN_QUESTIONS.relationship ?? [],
    build: (answers, profile) => {
      const withWhom = relationshipWith(answers);
      const noWindow = answers.window === 'none';

      // Nobody right now: the coach is about the people they chose, not a
      // partner they do not have. Friends practices, and the ladder adds
      // no partner-shaped calendar blocks on top.
      if (withWhom === 'solo') {
        const plan = buildGoalPlan(
          parsed('Closer to the people I chose', 'friends', 'enjoyment'),
          profile,
          undefined,
          answers,
        );
        const ids = noWindow
          ? ['friend-unprompted-message', 'good-news-response']
          : ['friend-reach-out', 'good-news-response', 'standing-shared-activity'];
        const routines = routinesFor(ids, profile, plan.goal.id);
        if (answers.window === 'weekend') weekendOnly(routines);
        const built = withLadder(
          'relationship',
          { goal: { ...plan.goal, routineIds: routines.map((r) => r.id) }, routines },
          answers,
          profile,
          true,
        );
        return {
          ...built,
          goal: {
            ...built.goal,
            milestones: (built.goal.milestones ?? []).filter((m) => !PARTNER_ONLY.test(m.title)),
          },
        };
      }

      const plan = buildGoalPlan(
        parsed('More present with the person I chose', 'relationship', 'relationship'),
        profile,
        undefined,
        answers,
      );
      // A hard answer must SHRINK the plan, not grow it. Someone telling us
      // things are bad does not need six more calendar blocks; they need the
      // two smallest ones and an honest pointer to a professional.
      const hard = answers.temperature === 'hard';
      const conflict = answers.obstacle === 'conflict' || answers.temperature === 'tense';
      const drifting = answers.obstacle === 'drift' || answers.temperature === 'drifting';
      let ids: string[];
      if (hard || noWindow) {
        ids = ['partner-reunion', 'partner-appreciation'];
      } else if (withWhom === 'early') {
        // Early days: the cheap practices, and something new together. The
        // monthly state-of-us waits until there is a state to talk about.
        ids = ['partner-appreciation', 'partner-novelty', 'turning-toward'];
      } else if (conflict) {
        // The written third-person look at the last argument is the one
        // version of repair with a trial behind it; rehearsing a phrase is
        // not, so it gives way.
        ids = ['conflict-reappraisal-write', 'partner-reunion', 'partner-appreciation'];
      } else if (answers.obstacle === 'work') {
        ids = ['partner-reunion', 'partner-appreciation', 'state-of-us'];
      } else {
        ids = ['partner-appreciation', 'partner-checkin-weekly', 'state-of-us'];
        // Drifting is mostly small openings going unanswered.
        if (drifting) ids.push('turning-toward');
      }

      const routines = routinesFor(ids, profile, plan.goal.id);
      // Weekend-only windows: nothing weekday-anchored will survive.
      if (answers.window === 'weekend') weekendOnly(routines);
      return withLadder(
        'relationship',
        { goal: { ...plan.goal, routineIds: routines.map((r) => r.id) }, routines },
        answers,
        profile,
        hard || noWindow,
      );
    },
    insights: (answers) => {
      const lines: string[] = [];
      const withWhom = relationshipWith(answers);
      if (withWhom === 'solo') {
        lines.push(
          'No partner in this one, so it is about the people you chose: one plan made a week, the good news answered properly, and a standing thing with the same faces.',
        );
        lines.push('Friendship research is mostly people followed over years, graded B to D. Worth doing; not a law.');
        return lines;
      }
      if (withWhom === 'early') {
        lines.push(
          answers.with === 'unsure'
            ? 'Not sure what it is yet, so nothing here assumes: say the specific thing out loud, answer the small things, do something new together, and see.'
            : 'Early days, so the cheap practices: say the specific thing out loud, and do something neither of you has done. The monthly state-of-us can wait until there is a state to talk about.',
        );
      }
      if (answers.temperature === 'hard') {
        lines.push(
          'This one is kept deliberately small. Two five-minute practices, nothing more — and if the same conversation keeps ending badly, counselling is worth it and will do more than any plan here can.',
        );
      }
      if (answers.obstacle === 'work') {
        lines.push('The reunion is your lever: the first five minutes home set the tone for the whole evening.');
      }
      if (answers.obstacle === 'conflict' || answers.temperature === 'tense') {
        lines.push(
          'Repair comes before connection. The one version that has been tested is ten written minutes on the last argument, as a fair outsider would see it — that is what is on your Sunday.',
        );
      }
      if (answers.obstacle === 'drift' || answers.temperature === 'drifting') {
        lines.push('Drifting is mostly small openings going unanswered. Looking up when they say something is the cheapest practice in the app.');
      }
      if (answers.window === 'none') {
        lines.push('You told me there’s almost no window, so nothing here needs one. Both practices fit inside five minutes.');
      }
      lines.push('Evidence here is honest: mostly observational, graded C to E. These are worth testing on yourselves, not laws.');
      return lines;
    },
  },

  family: {
    id: 'family',
    title: 'Family & adventure',
    promise:
      'The weekend that actually happens, one-on-one time with each child, and the next trip planned early enough that looking forward to it counts.',
    questions: DOMAIN_QUESTIONS.family ?? [],
    build: (answers, profile) => {
      const comp = composition(answers, profile);
      const variant = familyVariant(comp);
      const stretched = answers.blocker === 'stretched';
      const plan = buildGoalPlan(
        parsed(
          variant === 'carer'
            ? 'Enough left of me for the people I look after'
            : 'Time with them that I don’t keep postponing',
          'family',
          'family',
        ),
        profile,
        undefined,
        answers,
      );

      let ids: string[];
      switch (variant) {
        case 'carer':
          // The carer's own recovery goes in first. Everything else in this
          // coach depends on there being something left of them.
          ids = ['carer-own-hours', 'carer-ask-for-cover', 'carer-ten-minutes'];
          if (comp.kidsAtHome) {
            ids.push(comp.teens && !comp.underFive && !comp.primary ? 'teen-side-by-side' : 'family-ritual-anchor');
          }
          if (stretched && comp.kidsAtHome) ids.push('parent-regulation-pause');
          break;
        case 'teens':
          // Side by side, on their terms, one real decision a week. No
          // three-hour Saturday outing: that was written for a nine-year-old.
          ids =
            answers.blocker === 'energy'
              ? ['teen-side-by-side', 'device-free-meal']
              : answers.blocker === 'scattered'
                ? ['device-free-meal', 'teen-side-by-side', 'family-screen-agreement']
                : ['teen-side-by-side', 'teen-their-call', 'device-free-meal'];
          if (stretched) ids.push('parent-regulation-pause');
          break;
        case 'youngKids':
          // Low energy is a real constraint: lead with the small unmoveable
          // ritual rather than a three-hour adventure nobody has left in them.
          // Stretched thin is a different constraint again: calm first, then
          // the minutes they lead, and no outing at all.
          ids = stretched
            ? ['parent-regulation-pause', 'child-led-play', 'family-ritual-anchor']
            : answers.blocker === 'energy'
              ? ['family-ritual-anchor', 'device-free-meal']
              : answers.blocker === 'scattered'
                ? ['device-free-meal', 'family-adventure', 'one-on-one-child']
                : answers.blocker === 'logistics'
                  ? ['family-adventure', 'trip-anticipation', 'one-on-one-child']
                  : ['family-adventure', 'one-on-one-child', 'device-free-meal'];
          break;
        case 'grandparent':
          ids = ['family-ritual-anchor', 'family-memory-review', 'trip-anticipation'];
          break;
        case 'noKids':
          // A couple gets the couple's version of adventure; someone on
          // their own gets adventure with people in it.
          ids = comp.partner
            ? ['partner-novelty', 'trip-anticipation']
            : ['standing-shared-activity', 'trip-anticipation'];
          break;
      }
      if (comp.adultKids) ids.push('adult-child-standing-call');

      const routines: Routine[] = [];
      for (const id of ids) {
        // Anyone with kids already has the device-free family dinner on the
        // plan from the interview, every night. Adding the weekday version
        // here put two dinners on one evening.
        if (id === 'device-free-meal' && profile?.kidsCount) continue;
        const protocol = protocolById(id);
        if (protocol) routines.push(toRoutine(protocol, profile, plan.goal.id));
      }
      if (variant === 'grandparent') {
        const ritual = routines.find((r) => r.protocolId === 'family-ritual-anchor');
        if (ritual) ritual.title = 'The standing day with the grandchildren';
      }
      // Under-fives can't sustain a three-hour outing or a 25-minute sit.
      // A multi-answer question: a family with an under-five and a
      // primary-schooler tapped both, and the outing is still sized to the
      // youngest.
      if (comp.underFive) {
        for (const r of routines) {
          if (r.protocolId === 'family-adventure') r.durationMin = 90;
          if (r.protocolId === 'one-on-one-child') r.durationMin = 15;
        }
      }
      // `goodWeekend` was asked and then ignored across the whole audit
      // sample. It is the one answer that says what this family actually
      // enjoys, and a plan that ignores it prescribes somebody else's
      // Saturday. For a carer it is optional: what they enjoy, not what
      // they owe.
      const weekendShape: Record<string, { title: string; durationMin: number; start: string; end: string }> = {
        outdoors: { title: 'Get outside together \u2014 anywhere green', durationMin: 90, start: '09:00', end: '12:00' },
        slow: { title: 'A slow morning nobody has to be anywhere for', durationMin: 90, start: '08:30', end: '11:00' },
        people: { title: 'Have someone over \u2014 low effort, real company', durationMin: 120, start: '11:00', end: '15:00' },
        making: { title: 'Build or make something together', durationMin: 75, start: '10:00', end: '14:00' },
      };
      const wk = answers.goodWeekend ? weekendShape[answers.goodWeekend] : undefined;
      if (wk) {
        routines.push({
          id: newId('r'),
          goalId: plan.goal.id,
          title: wk.title,
          area: 'family',
          days: [6],
          durationMin: wk.durationMin,
          preferredStart: wk.start,
          preferredEnd: wk.end,
          energy: 'morning',
          flexible: true,
          protected: false,
          tier: variant === 'carer' ? 'could' : 'should',
          active: true,
        });
      }
      let built = withLadder(
        'family',
        { goal: { ...plan.goal, routineIds: routines.map((r) => r.id) }, routines },
        answers,
        profile,
      );
      // The ladder is written once for the pathway and promises one-on-one
      // time with each child and an outing in every diary. Neither survives
      // a household that cannot use it.
      if (!comp.kidsAtHome && !comp.grandkids) built = withoutMatching(built, KIDS_ONLY);
      if (variant === 'carer') built = withoutMatching(built, OUTINGS);
      return built;
    },
    insights: (answers, profile) => {
      const lines: string[] = [];
      const comp = composition(answers, profile);
      const variant = familyVariant(comp);
      if (variant === 'carer') {
        lines.push(
          'Your own recovery comes first here, on purpose. The two hours that are yours go in the week before anything else, because everyone you look after depends on there being something left of you. If you are past tired, your GP this week beats any plan here.',
        );
      }
      if (variant === 'teens') {
        lines.push(
          'Written for teenagers: side by side rather than face to face, one real decision a week that is theirs, and no Saturday outing they would rather not be seen on.',
        );
      }
      if (variant === 'grandparent') {
        lines.push('Built around the grandchildren: one standing day that is always the same, and the photos afterwards.');
      }
      if (variant === 'noKids') {
        lines.push(
          comp.partner
            ? 'No kids in this one, so no kids’ practices: something new to both of you each week, and the next trip planned early enough that looking forward to it counts.'
            : 'Adventure for one, with people in it: a standing weekly thing with the same faces, and the next trip planned early.',
        );
      }
      if (comp.adultKids) {
        lines.push('The standing call is theirs to cancel and yours to keep. Regular beats long.');
      }
      if (answers.blocker === 'stretched') {
        lines.push('Calm first: a breath before the hardest hour, then the minutes they lead. Every parent loses it sometimes; it does not undo anything.');
      }
      if (answers.blocker === 'energy') {
        lines.push('Small and repeatable beats big and abandoned — one unmoveable ritual, not a packed weekend.');
      }
      if (answers.blocker === 'logistics' && variant === 'youngKids') {
        lines.push('Your problem is deciding, not caring. The outing goes in the calendar before the week starts, or it doesn’t happen.');
      }
      // A multi-answer question: a family with an under-five and a
      // primary-schooler tapped both, and the outing is still sized to the
      // youngest.
      if (comp.underFive && variant === 'youngKids') {
        lines.push('Sized to the youngest: 90-minute adventures and 15-minute one-on-ones. An outing nobody enjoyed is worse than a slow morning at home.');
      }
      lines.push('Much of this research is correlational — settled families sustain rituals as much as rituals settle families. Graded C and D, and said plainly.');
      return lines;
    },
  },
};

export const PATH_ORDER: PathId[] = [
  'training',
  'nutrition',
  'money',
  'work',
  'recovery',
  'relationship',
  'family',
];

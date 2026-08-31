/**
 * Paths — guided domain programs (docs/PATHS_BRIEF.md).
 *
 * A path is: a promise, a short intake where EVERY answer changes the
 * plan, optional personal numbers where the maths uses them, and a hub
 * that explains the week instead of just blocking time. Builders lean on
 * the goal planner and the evidence library so a path is a real goal with
 * real routines — adapted, learned-on, and reviewed like everything else.
 */

import { BEHAVIOUR_CATALOG, behaviourInfo } from '@/features/behaviours/catalog';
import { buildGoalPlan, type GoalPlan, type ParsedGoal } from '@/features/goals/goalPlanner';
import { protocolById, toRoutine } from '@/features/knowledge/protocols';
import { DOMAIN_QUESTIONS, type DomainQuestion } from '@/features/knowledge/questionBank';
import { newId } from '@/lib/dates';
import type { BehaviourKey, LifeProfile, Routine } from '@/types/domain';

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
      if (answers.mode !== 'debt') {
        lines.push(
          'Investing, the boring way that works: automate it, keep costs low, spread wide, and let time compound. Picking winners is a hobby, not a plan. (Education, never financial advice.)',
        );
        lines.push('Order of operations: emergency buffer → expensive debt → then investing.');
      }
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
      if (answers.buffer === 'none') {
        lines.push('Under a month of buffer means the buffer IS the goal — everything else waits until one month is banked.');
      } else if (answers.buffer === 'some') {
        lines.push('One to three months of buffer: grow it to three, then the surplus goes to work.');
      } else if (answers.buffer === 'solid') {
        lines.push('Three-plus months banked — the buffer question is answered; the check-in is about putting the surplus to work.');
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
      if (answers.meetingLoad === 'heavy') {
        lines.push('Meetings own most of the week — the deep-work block sits before the first call, or it doesn’t happen.');
      } else if (answers.meetingLoad === 'light') {
        lines.push('Light meeting load is an asset: two protected making blocks, not one.');
      }
      lines.push('The weekly review closes the loop: what moved, what stalled, the one lever for next week.');
      return lines;
    },
  },

  recovery: {
    id: 'recovery',
    title: 'Habits & urges',
    promise:
      'Not willpower — engineering. Name the moment the urge usually wins, put a rehearsed answer in that exact window, and let INTENT learn your real triggers from what you log.',
    questions: [
      {
        key: 'behaviour',
        question: 'Which habit are we working on first?',
        // Mirrors BEHAVIOUR_CATALOG rather than restating a subset of it —
        // a habit missing from this list was a habit the path could not
        // start on, which is how `shopping` ended up trackable in Settings
        // and unreachable here.
        options: BEHAVIOUR_CATALOG.map((b) => ({ value: b.key, label: b.label })),
      },
      {
        key: 'trigger',
        question: 'When does it usually win?',
        options: [
          { value: 'stress', label: 'Stress' },
          { value: 'boredom', label: 'Boredom' },
          { value: 'social', label: 'Social settings' },
          { value: 'evening', label: 'Evenings, at home' },
          { value: 'unsure', label: 'Honestly not sure' },
        ],
      },
      {
        key: 'replacement',
        question: 'What could stand in its place?',
        options: [
          { value: 'breathe', label: 'A two-minute breath reset' },
          { value: 'walk', label: 'A short walk' },
          { value: 'read', label: 'Reading' },
          { value: 'message', label: 'Messaging someone real' },
          { value: 'unsure', label: 'Help me pick' },
        ],
      },
    ],
    build: (answers, profile): PathBuild => {
      const behaviour = (answers.behaviour ?? 'doomscrolling') as BehaviourKey;
      const info = behaviourInfo(behaviour);
      const now = new Date().toISOString();
      const goalId = newId('g');

      // The rehearsed answer lives in the actual risk window.
      const start =
        answers.trigger === 'stress'
          ? '12:45'
          : answers.trigger === 'social'
            ? '17:30'
            : answers.trigger === 'boredom'
              ? '19:45'
              : '20:30';
      const replacement = answers.replacement === 'unsure' ? 'breathe' : (answers.replacement ?? 'breathe');
      const routineByReplacement: Record<string, Partial<Routine> & { title: string }> = {
        breathe: { title: 'The urge answer: two-minute reset', durationMin: 5, sessionType: 'breathe' },
        walk: { title: 'The urge answer: walk it off', durationMin: 20 },
        read: { title: 'The urge answer: read instead', durationMin: 20 },
        message: { title: 'The urge answer: message someone real', durationMin: 10 },
      };
      const base = routineByReplacement[replacement] ?? routineByReplacement.breathe;
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

      return {
        goal: {
          id: goalId,
          title: info.intentionTemplate,
          area: 'health',
          domain: 'behaviour',
          milestones: [
            { id: newId('ms'), title: 'Name the moment it usually starts', done: answers.trigger !== 'unsure' },
            { id: newId('ms'), title: 'Choose the replacement and make it easy', done: answers.replacement !== 'unsure' },
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
    },
    insights: (answers) => {
      const lines: string[] = [];
      const triggerLine: Record<string, string> = {
        stress: 'Stress is the trigger, so the answer sits mid-workday — a rehearsed reset before the evening arrives already depleted.',
        boredom: 'Boredom urges want stimulation, not sedation — the replacement gives your hands and mind something real.',
        social: 'Social triggers are decided in advance: know your drink, your line, and your exit before you arrive.',
        evening: 'Evening at home is the classic window. The replacement is scheduled right into it — same time, every night.',
        unsure: 'Not sure of the trigger? Log each urge with one tap and INTENT will find the pattern within two weeks.',
      };
      lines.push(triggerLine[answers.trigger ?? 'unsure']);
      lines.push('One miss is noise. Two in a row is the fork — that’s when INTENT steps in, not with shame, with a plan.');
      if (answers.wave === 'evening') {
        lines.push('Your urges run long, so the answer isn’t outlasting one wave — it’s changing the evening’s shape before it starts.');
      } else {
        lines.push('Urges crest and fall in about 10 minutes. The replacement doesn’t have to beat the habit — it has to outlast the wave.');
      }
      if (answers.behaviour === 'alcohol') {
        lines.push('Honest scope: this is structure for cutting down. If drinking feels out of control, talk to someone qualified — that’s strength, not failure.');
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
      const noWindow = answers.window === 'none';
      const ids = hard || noWindow
        ? ['partner-reunion', 'partner-appreciation']
        : answers.obstacle === 'conflict' || answers.temperature === 'tense'
          ? ['repair-rehearsal', 'partner-reunion', 'partner-appreciation']
          : answers.obstacle === 'work'
            ? ['partner-reunion', 'partner-appreciation', 'state-of-us']
            : ['partner-appreciation', 'partner-checkin-weekly', 'state-of-us'];

      const routines: Routine[] = [];
      for (const id of ids) {
        const protocol = protocolById(id);
        if (protocol) routines.push(toRoutine(protocol, profile, plan.goal.id));
      }
      // Weekend-only windows: nothing weekday-anchored will survive.
      if (answers.window === 'weekend') {
        for (const r of routines) r.days = r.days.filter((d) => d === 0 || d === 6);
      }
      return {
        goal: { ...plan.goal, routineIds: routines.map((r) => r.id) },
        routines,
      };
    },
    insights: (answers) => {
      const lines: string[] = [];
      if (answers.temperature === 'hard') {
        lines.push(
          'This one is kept deliberately small. Two five-minute practices, nothing more — and if the same conversation keeps ending badly, a couples therapist will do more than any plan here can.',
        );
      }
      if (answers.obstacle === 'work') {
        lines.push('The reunion is your lever: the first five minutes home set the tone for the whole evening.');
      }
      if (answers.obstacle === 'conflict') {
        lines.push('Repair comes before connection. Stable couples aren’t the ones who avoid conflict — they’re the ones who cool it early.');
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
      const plan = buildGoalPlan(
        parsed('Time with them that I don’t keep postponing', 'family', 'family'),
        profile,
        undefined,
        answers,
      );
      // Low energy is a real constraint: lead with the small unmoveable
      // ritual rather than a three-hour adventure nobody has left in them.
      const ids =
        answers.blocker === 'energy'
          ? ['family-ritual-anchor', 'device-free-meal']
          : answers.blocker === 'scattered'
            ? ['device-free-meal', 'family-adventure', 'one-on-one-child']
            : answers.blocker === 'logistics'
              ? ['family-adventure', 'trip-anticipation', 'one-on-one-child']
              : ['family-adventure', 'one-on-one-child', 'device-free-meal'];

      const routines: Routine[] = [];
      for (const id of ids) {
        const protocol = protocolById(id);
        if (protocol) routines.push(toRoutine(protocol, profile, plan.goal.id));
      }
      // Under-fives can't sustain a three-hour outing or a 25-minute sit.
      if (answers.ages === 'under5') {
        for (const r of routines) {
          if (r.protocolId === 'family-adventure') r.durationMin = 90;
          if (r.protocolId === 'one-on-one-child') r.durationMin = 15;
        }
      }
      if (answers.horizon === 'booked' || answers.horizon === 'choosing') {
        const trip = protocolById('trip-anticipation');
        if (trip && !routines.some((r) => r.protocolId === 'trip-anticipation')) {
          routines.push(toRoutine(trip, profile, plan.goal.id));
        }
      }
      return {
        goal: { ...plan.goal, routineIds: routines.map((r) => r.id) },
        routines,
      };
    },
    insights: (answers) => {
      const lines: string[] = [];
      if (answers.blocker === 'energy') {
        lines.push('Small and repeatable beats big and abandoned — one unmoveable ritual, not a packed weekend.');
      }
      if (answers.blocker === 'logistics') {
        lines.push('Your problem is deciding, not caring. The outing goes in the calendar before the week starts, or it doesn’t happen.');
      }
      if (answers.ages === 'under5') {
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

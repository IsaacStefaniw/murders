/**
 * Every intake answer, every rung, every household — built.
 *
 * The pathway audit samples answers at random. This is the exhaustive
 * version for the deep QA pass: every combination of every option each
 * pathway declares, at every level, for a family household and a solo
 * one on a minimal week. A build that throws, prescribes one practice
 * under two names, or ignores an answer it asked for is a defect a real
 * person would meet on their first day with that coach.
 */

import { BEHAVIOUR_CATALOG, behaviourInfo } from '@/features/behaviours/catalog';
import { protocolById } from '@/features/knowledge/protocols';
import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import type { InterviewAnswers } from '@/features/onboarding/script';
import { PATHS, PATH_ORDER, type PathBuild, type PathId } from '@/features/paths/definitions';
import { LEVEL_ORDER } from '@/features/paths/level';
import { fitLadderToBudget, ladderFor } from '@/features/paths/programme';
import { mergeRoutines } from '@/features/planner/mergeRoutines';
import type { LifeProfile, Routine } from '@/types/domain';

const base: LifeProfile = {
  firstName: 'Sam',
  priorities: ['health', 'family', 'work'],
  people: [
    { id: 'p', name: 'Alex', relation: 'partner' },
    { id: 'k', name: 'The kids', relation: 'child' },
  ],
  workDays: [1, 2, 3, 4, 5],
  workStart: '09:00',
  workEnd: '17:30',
  wakeTime: '06:30',
  sleepTime: '22:30',
  energyProfile: 'morning',
  capacity: 'steady',
  trainingDaysPerWeek: 3,
  trainingDurationMin: 45,
  trainingPreference: 'gym',
  moreOf: [],
  lessOf: [],
  age: 41,
  weightKg: 82,
  kidsCount: 2,
  createdAt: '2026-01-05T08:00:00.000Z',
  updatedAt: '2026-01-05T08:00:00.000Z',
};

/** A solo person on a minimal week: no partner, no kids, nothing spare. */
const solo: LifeProfile = { ...base, people: [], kidsCount: undefined, capacity: 'minimal' };

/** Every combination of the pathway's own options, one value per question. */
function allCombos(path: PathId): Record<string, string>[] {
  let out: Record<string, string>[] = [{}];
  for (const q of PATHS[path].questions) {
    const next: Record<string, string>[] = [];
    for (const acc of out) {
      for (const opt of q.options) next.push({ ...acc, [q.key]: opt.value });
    }
    out = next;
  }
  return out;
}

/** The identities a build must not repeat: title, protocol, and session type. */
function collisions(routines: Routine[]): string[] {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const r of routines) {
    const keys = [
      `title:${r.title}`,
      ...(r.protocolId ? [`protocol:${r.protocolId}`] : []),
      ...(r.sessionType ? [`session:${r.sessionType}`] : []),
    ];
    for (const k of keys) {
      if (seen.has(k)) dupes.push(k);
      seen.add(k);
    }
  }
  return dupes;
}

function orphans(routines: Routine[]): string[] {
  return routines
    .filter((r) => r.protocolId && !protocolById(r.protocolId))
    .map((r) => `${r.title} → ${r.protocolId}`);
}

describe.each(PATH_ORDER)('%s — every answer combination at every level', (path) => {
  const combos = allCombos(path);

  it('has a real matrix to walk', () => {
    expect(combos.length).toBeGreaterThan(0);
  });

  it.each([
    ['a family on a steady week', base],
    ['someone solo on a minimal week', solo],
  ])('builds for %s without throwing, duplicating or orphaning', (_label, profile) => {
    const failures: string[] = [];
    for (const answers of combos) {
      for (const level of LEVEL_ORDER) {
        let build: PathBuild;
        try {
          build = PATHS[path].build({ ...answers, level }, profile);
        } catch (e) {
          failures.push(`${JSON.stringify(answers)}@${level} threw: ${String(e)}`);
          continue;
        }
        if (build.routines.length === 0) failures.push(`${JSON.stringify(answers)}@${level} no routines`);
        for (const d of collisions(build.routines)) failures.push(`${JSON.stringify(answers)}@${level} duplicate ${d}`);
        for (const o of orphans(build.routines)) failures.push(`${JSON.stringify(answers)}@${level} orphan ${o}`);
        // The goal points at exactly the routines it was built with.
        const ids = new Set(build.routines.map((r) => r.id));
        for (const id of build.goal.routineIds) {
          if (!ids.has(id)) failures.push(`${JSON.stringify(answers)}@${level} routineIds names a missing routine`);
        }
        // A milestone title is a promise; the same promise twice reads as a bug.
        const ms = (build.goal.milestones ?? []).map((m) => m.title);
        if (new Set(ms).size !== ms.length) failures.push(`${JSON.stringify(answers)}@${level} duplicate milestone`);
      }
    }
    expect(failures.slice(0, 10)).toEqual([]);
  });

  it('never hands out an insight that is not a sentence', () => {
    for (const answers of combos) {
      for (const profile of [base, solo]) {
        const lines = PATHS[path].insights(answers, profile);
        expect(lines.length).toBeGreaterThan(0);
        for (const line of lines) {
          expect({ answers, line: typeof line === 'string' && line.length > 10 ? 'ok' : line }).toEqual({
            answers,
            line: 'ok',
          });
        }
      }
    }
  });

  it('gives a minimal week only the required rungs, never the optional ones', () => {
    for (const level of LEVEL_ORDER) {
      const ladder = ladderFor(path, level, solo, 'g');
      for (const r of ladder.routines) expect(['must', 'should']).toContain(r.tier);
      // At minimal capacity the budget has nothing optional to trim, so
      // the fit is the identity.
      expect(fitLadderToBudget(ladder.routines, level)).toHaveLength(ladder.routines.length);
    }
  });

  it('every rung adds a routine or a milestone and says why', () => {
    let prevRoutines = -1;
    let prevMilestones = -1;
    for (const [i, level] of LEVEL_ORDER.entries()) {
      const ladder = ladderFor(path, level, base, 'g');
      expect(ladder.notes).toHaveLength(i + 1);
      const grew =
        ladder.routines.length > prevRoutines || ladder.milestones.length > prevMilestones;
      expect({ path, level, grew }).toEqual({ path, level, grew: true });
      expect(ladder.routines.length).toBeGreaterThanOrEqual(prevRoutines);
      expect(ladder.milestones.length).toBeGreaterThanOrEqual(prevMilestones);
      prevRoutines = ladder.routines.length;
      prevMilestones = ladder.milestones.length;
    }
  });
});

/**
 * The interview's routines and a pathway's, merged the way the store does
 * it. One of each practice must survive, whatever the person answered.
 */
describe('a pathway merged into the interview plan', () => {
  const interviews: InterviewAnswers[] = [
    {
      name: 'Sam',
      weekShape: 'employed',
      priorities: ['health', 'family', 'work'],
      capacity: 'steady',
      household: ['partner', 'kids'],
      kidsCount: '2',
      workDays: ['1', '2', '3', '4', '5'],
      workHours: '09:00-17:30',
      sleep: '06:30-22:30',
      energy: 'morning',
      trainingDays: '3',
      mind: ['breathing', 'meditation'],
      moreOf: ['Deep work', 'Cooking real food', 'Time with the kids'],
      lessOf: ['doomscrolling'],
      foodAim: 'weight',
      money: 'checkin',
      ambition: 'Get strong again',
    },
    {
      name: 'Jo',
      weekShape: 'retired',
      priorities: ['health', 'relationship'],
      capacity: 'minimal',
      household: ['partner'],
      sleep: '06:30-22:30',
      energy: 'evening',
      trainingDays: '2',
      existingHabits: ['walking', 'meditation'],
      ambition: 'Keep moving',
    },
    {
      name: 'Kim',
      weekShape: 'selfDirected',
      priorities: ['work', 'health'],
      capacity: 'push',
      household: ['solo'],
      workDays: ['1', '2', '3', '4', '5'],
      workHours: '08:30-17:00',
      sleep: '05:30-21:45',
      energy: 'morning',
      trainingDays: '5',
      trainingExperience: 'consistent',
      existingHabits: ['workout', 'running'],
      workStyle: 'maker',
      ambition: 'Grow the business to $2m revenue',
    },
  ];

  const activeCollisions = (routines: Routine[]) => {
    const active = routines.filter((r) => r.active !== false);
    const seen = new Map<string, number>();
    for (const r of active) {
      const keys = [`title:${r.title}`, ...(r.protocolId ? [`protocol:${r.protocolId}`] : [])];
      for (const k of keys) seen.set(k, (seen.get(k) ?? 0) + 1);
    }
    const dupes = [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k);
    // Two breath practices can coexist — the wind-down and an urge answer
    // are different tools at different hours. Anything else runs once.
    const bySession = new Map<string, number>();
    for (const r of active) if (r.sessionType) bySession.set(r.sessionType, (bySession.get(r.sessionType) ?? 0) + 1);
    for (const [s, n] of bySession) if (n > (s === 'breathe' ? 2 : 1)) dupes.push(`session:${s}×${n}`);
    return dupes;
  };

  it.each(PATH_ORDER)('%s leaves one of each practice active after the merge', (path) => {
    const failures: string[] = [];
    for (const interview of interviews) {
      const plan = buildLifeOperatingPlan(interview);
      let routines = plan.routines;
      const startedGoalIds = new Map<PathId, string>();
      for (const s of plan.pathStarts) {
        const built = PATHS[s.id].build(s.answers, plan.profile);
        startedGoalIds.set(s.id, built.goal.id);
        routines = mergeRoutines(routines, built.routines);
      }
      // Restarting a pathway drops its previous goal first, which is what
      // the store does; the merge alone cannot tell a rung from a rung.
      const started = plan.pathStarts.find((s) => s.id === path);
      const retired = started
        ? routines.map((r) => (r.goalId && r.goalId === startedGoalIds.get(started.id) ? { ...r, active: false } : r))
        : routines;
      for (const answers of allCombos(path)) {
        for (const level of ['foundation', 'advanced'] as const) {
          const merged = mergeRoutines(retired, PATHS[path].build({ ...answers, level }, plan.profile).routines);
          const dupes = activeCollisions(merged);
          if (dupes.length > 0) failures.push(`${interview.name}/${JSON.stringify(answers)}@${level}: ${dupes.join(', ')}`);
          const stray = orphans(merged);
          if (stray.length > 0) failures.push(`${interview.name}: orphan ${stray.join(', ')}`);
        }
      }
    }
    expect(failures.slice(0, 10)).toEqual([]);
  });
});

describe('households without kids and without a partner', () => {
  const nobody: LifeProfile = { ...base, people: [], kidsCount: undefined };
  const partnerOnly: LifeProfile = {
    ...base,
    people: [{ id: 'p', name: 'Alex', relation: 'partner' }],
    kidsCount: undefined,
  };

  it('family builds for a household with no children on the profile', () => {
    for (const answers of allCombos('family')) {
      const build = PATHS.family.build(answers, nobody);
      expect(build.routines.length).toBeGreaterThan(0);
      expect(collisions(build.routines)).toEqual([]);
    }
  });

  it('family with a partner and no kids keeps one dinner after the interview merge', () => {
    const plan = buildLifeOperatingPlan({ household: ['partner'], partnerName: 'Alex', sleep: '06:30-22:30' });
    const merged = mergeRoutines(plan.routines, PATHS.family.build({ blocker: 'work' }, partnerOnly).routines);
    const dinners = merged.filter((r) => r.active !== false && r.protocolId === 'device-free-meal');
    expect(dinners).toHaveLength(1);
  });

  it('relationship builds for someone with nobody on the profile, at every level', () => {
    for (const answers of allCombos('relationship')) {
      for (const level of LEVEL_ORDER) {
        const build = PATHS.relationship.build({ ...answers, level }, nobody);
        expect(build.routines.length).toBeGreaterThan(0);
        expect(collisions(build.routines)).toEqual([]);
      }
    }
  });

  it('a weekend-only window keeps every relationship routine on the weekend', () => {
    for (const temperature of ['good', 'drifting', 'tense', 'hard']) {
      for (const obstacle of ['kids', 'work', 'drift', 'conflict']) {
        const build = PATHS.relationship.build({ temperature, obstacle, window: 'weekend' }, base);
        for (const r of build.routines.filter((x) => !x.ladderRung)) {
          expect(r.days.every((d) => d === 0 || d === 6)).toBe(true);
        }
      }
    }
  });
});

describe('the family intake', () => {
  it('sizes the outing to the youngest when more than one age is picked', () => {
    // `ages` is a multi-answer question; a family with an under-five and a
    // primary-schooler tapped both, and the under-five still cannot do a
    // three-hour outing.
    const mixed = PATHS.family.build({ ages: 'primary,under5', blocker: 'work' }, base);
    const outing = mixed.routines.find((r) => r.protocolId === 'family-adventure')!;
    expect(outing.durationMin).toBe(90);
    const one = mixed.routines.find((r) => r.protocolId === 'one-on-one-child')!;
    expect(one.durationMin).toBe(15);
  });

  it('every good-weekend answer puts a different Saturday on the plan', () => {
    const titles = new Set(
      ['outdoors', 'slow', 'people', 'making'].map(
        (goodWeekend) => PATHS.family.build({ goodWeekend }, base).routines.find((r) => r.days.join() === '6' && !r.protocolId)?.title,
      ),
    );
    expect(titles.size).toBe(4);
    expect(titles.has(undefined)).toBe(false);
  });
});

describe('the recovery pathway across the whole catalogue', () => {
  const recovery = PATHS.recovery;
  const triggers = recovery.questions.find((q) => q.key === 'trigger')!.options.map((o) => o.value);
  const replacements = recovery.questions.find((q) => q.key === 'replacement')!.options.map((o) => o.value);

  it('offers every behaviour the app can track', () => {
    const offered = recovery.questions.find((q) => q.key === 'behaviour')!.options.map((o) => o.value);
    expect(offered).toEqual(BEHAVIOUR_CATALOG.map((b) => b.key));
  });

  it.each(BEHAVIOUR_CATALOG.map((b) => b.key))('%s × every trigger × every replacement', (behaviour) => {
    for (const trigger of triggers) {
      for (const replacement of replacements) {
        for (const profile of [base, solo]) {
          const build = recovery.build({ behaviour, trigger, replacement }, profile);
          expect(build.behaviour).toBe(behaviour);
          expect(build.goal.title).toBe(behaviourInfo(behaviour).intentionTemplate);
          const answer = build.routines[0];
          expect(answer.title).toMatch(/^The urge answer/);
          expect(answer.days).toHaveLength(7);
          expect(answer.tier).toBe(profile.capacity === 'minimal' ? 'could' : 'should');
          expect(collisions(build.routines)).toEqual([]);
        }
      }
    }
  });

  it('gives each replacement its own answer — never the same tool under a different tap', () => {
    // 'unsure' is allowed to fall back to the breath reset; nothing else is.
    const titles = new Map<string, string>();
    for (const replacement of replacements.filter((r) => r !== 'unsure')) {
      const build = recovery.build({ behaviour: 'doomscrolling', trigger: 'evening', replacement }, base);
      titles.set(replacement, build.routines[0].title);
    }
    expect(new Set(titles.values()).size).toBe(titles.size);
  });

  it('answers every trigger with a sentence about that trigger', () => {
    for (const trigger of triggers) {
      const lines = recovery.insights({ behaviour: 'doomscrolling', trigger, replacement: 'walk' }, base);
      expect(lines.every((l) => typeof l === 'string' && l.length > 20)).toBe(true);
    }
    // Each trigger gets its own first line, not the fallback for "not sure".
    const firstLines = new Set(
      triggers.map((trigger) => recovery.insights({ behaviour: 'doomscrolling', trigger }, base)[0]),
    );
    expect(firstLines.size).toBe(triggers.length);
  });

  it('covers a session type: the breath rung is skipped when the answer is already a breath', () => {
    const breath = recovery.build({ behaviour: 'vaping', trigger: 'stress', replacement: 'breathe', level: 'foundation' }, base);
    expect(breath.routines.filter((r) => r.sessionType === 'breathe')).toHaveLength(1);
    expect(breath.routines.some((r) => /Two-minute reset/.test(r.title))).toBe(false);
    const walk = recovery.build({ behaviour: 'vaping', trigger: 'stress', replacement: 'walk', level: 'foundation' }, base);
    expect(walk.routines.some((r) => /Two-minute reset/.test(r.title))).toBe(true);
  });
});

describe('nutrition, money and work — the whole intake', () => {
  it('nutrition: every aim × cooking × trouble builds; the eating window only for weight', () => {
    const aims = PATHS.nutrition.questions[0].options.map((o) => o.value);
    const cooking = PATHS.nutrition.questions[1].options.map((o) => o.value);
    const troubles = ['evenings', 'snacking', 'drinks', 'skipping', 'nowhere', ''];
    for (const aim of aims) {
      for (const cook of cooking) {
        for (const trouble of troubles) {
          const answers: Record<string, string> = { aim, cooking: cook };
          if (trouble) answers.trouble = trouble;
          const build = PATHS.nutrition.build(answers, base);
          expect(build.routines.some((r) => r.protocolId === 'kitchen-closed')).toBe(aim === 'weight');
          expect(build.routines.some((r) => r.protocolId === 'meal-sketch')).toBe(true);
          expect(collisions(build.routines)).toEqual([]);
        }
      }
    }
  });

  it('money: every mode × automation reshapes the milestones', () => {
    const modes = ['saving', 'debt', 'clarity', 'unsure'];
    const automation = ['yes', 'partial', 'no'];
    for (const mode of modes) {
      const byAutomation = automation.map((a) => PATHS.money.build({ mode, automation: a }, base).goal.milestones!.map((m) => m.title).join('|'));
      expect(new Set(byAutomation).size).toBe(automation.length);
    }
    const debt = PATHS.money.build({ mode: 'debt', automation: 'no' }, base).goal.milestones!.map((m) => m.title);
    expect(debt).toContain('List every debt with its rate');
    expect(debt).toContain('One transfer automated on payday');
    // The check-in is the one routine the pathway itself owns.
    for (const mode of modes) {
      expect(PATHS.money.build({ mode, automation: 'yes' }, base).routines.some((r) => r.protocolId === 'money-checkin')).toBe(true);
    }
  });

  it('work: every style builds; deep work for makers, one-on-ones for people leaders', () => {
    const styles = PATHS.work.questions.find((q) => q.key === 'style')!.options.map((o) => o.value);
    const teams = PATHS.work.questions.find((q) => q.key === 'team')!.options.map((o) => o.value);
    for (const style of styles) {
      for (const team of teams) {
        const build = PATHS.work.build({ style, team, bottleneck: 'delivery', bigBet: 'no' }, base);
        // Managers run on the review; hands-on work gets no carve (Isaac, 7 Sep 2026).
        expect(build.routines.some((r) => r.protocolId === 'deep-work')).toBe(style !== 'manager' && style !== 'physical');
        expect(build.routines.some((r) => /One-on-ones/.test(r.title))).toBe(team === 'directs' || team === 'leaders');
        expect(build.routines.some((r) => r.protocolId === 'weekly-business-review')).toBe(true);
        expect(collisions(build.routines)).toEqual([]);
      }
    }
    const bet = PATHS.work.build({ style: 'maker', team: 'solo', bigBet: 'signing' }, base);
    expect(bet.goal.milestones!.map((m) => m.title)).toContain('The big bet written in one sentence');
  });
});

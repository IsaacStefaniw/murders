/**
 * Forty goals, the way people actually type them.
 *
 * `goalPlanner.test.ts` pins one sentence per domain. This is the corpus:
 * plain, short, sometimes vague sentences from every area, each with the
 * domain a person would expect the app to hear, then the milestones the
 * composer drafts for it, and the evidence pass that ticks a rung from a
 * reading and unticks it when the reading is corrected.
 */

import { assessGoal, composeFromText, describeCheckin, describeDoneWhen } from '@/features/goals/composer';
import { buildGoalPlan, parseGoal, type ParsedGoal } from '@/features/goals/goalPlanner';
import { observe, type MetricObservation } from '@/features/model/metrics';
import type { Goal, LifeProfile } from '@/types/domain';

const PROFILE = { weightKg: 86, workDays: [1, 2, 3, 4, 5], trainingDaysPerWeek: 3 } as unknown as LifeProfile;

const CORPUS: [string, ParsedGoal['domain']][] = [
  // Health and fitness
  ['Get strong again', 'fitness'],
  ['Run a 10k', 'fitness'],
  ['Run a half marathon in October', 'fitness'],
  ['Bench 100kg', 'fitness'],
  ['Deadlift 200kg', 'fitness'],
  ['Lose 5kg', 'fitness'],
  ['Get to 80kg', 'fitness'],
  ['Lose some weight before summer', 'fitness'],
  ['Go to the gym three times a week', 'fitness'],
  ['Sleep better', 'health'],
  ['Fix my sleep', 'health'],
  ['Lower my blood pressure', 'health'],
  ['Meditate every day', 'health'],
  ['More energy in the afternoons', 'health'],
  ['Get my stress down', 'health'],
  // Habits and urges
  ['Stop vaping', 'behaviour'],
  ['Drink less on weeknights', 'behaviour'],
  ['Quit smoking', 'behaviour'],
  ['Cut down on coffee', 'behaviour'],
  ['Stop doomscrolling at night', 'behaviour'],
  // Work and career
  ['Grow the business to $2m revenue', 'business'],
  ['Land three new clients this quarter', 'business'],
  ['Launch the new product by March', 'business'],
  ['Get promoted', 'career'],
  ['Get a new job', 'career'],
  ['Ask for a pay rise', 'career'],
  // Money
  ['Save $20k for a house deposit', 'finance'],
  ['Pay off the credit card', 'finance'],
  ['Pay off the mortgage faster', 'finance'],
  ['Build an emergency fund', 'finance'],
  ['Stick to a budget', 'finance'],
  // Relationship, family, friends
  ['More date nights with my wife', 'relationship'],
  ['Be more present with my partner', 'relationship'],
  ['Spend more time with the kids', 'family'],
  ['Call mum every Sunday', 'family'],
  ['See my friends more', 'friends'],
  ['Catch up with old mates', 'friends'],
  // Experience and personal
  ['Plan a trip to Japan', 'experience'],
  ['A weekend away every quarter', 'experience'],
  ['Write a book', 'personal'],
  ['Learn Spanish', 'personal'],
  ['Read twelve books this year', 'personal'],
];

describe('parseGoal hears the domain a person meant', () => {
  it.each(CORPUS)('"%s" → %s', (text, domain) => {
    const parsed = parseGoal(text);
    expect(parsed.domain).toBe(domain);
    expect(parsed.title.length).toBeGreaterThan(0);
    expect(parsed.title[0]).toBe(parsed.title[0].toUpperCase());
  });

  it('reads the number and the deadline where there is one', () => {
    expect(parseGoal('Save $20k for a house deposit').target).toBe('$20k');
    expect(parseGoal('Bench 100kg').target).toBe('100kg');
    expect(parseGoal('Run a half marathon in October').timeframe).toBeUndefined();
    expect(parseGoal('Launch the new product by March').timeframe?.toLowerCase()).toBe('by march');
    expect(parseGoal('Read twelve books this year').timeframe?.toLowerCase()).toBe('this year');
    expect(parseGoal('Get fit in 12 weeks').timeframe?.toLowerCase()).toBe('in 12 weeks');
  });

  it('strips the "I want to" and keeps the rest', () => {
    expect(parseGoal('I want to get promoted').title).toBe('Get promoted');
    expect(parseGoal('i want a new job').title).toBe('A new job');
  });
});

describe('every goal in the corpus gets a draft it can be held to', () => {
  it.each(CORPUS)('"%s" drafts milestones with conditions and a check-in', (text) => {
    const { goal, routines } = composeFromText(text, PROFILE);
    expect(goal.milestones).toBeDefined();
    expect(goal.milestones!.length).toBeGreaterThan(0);
    const titles = goal.milestones!.map((m) => m.title);
    expect(new Set(titles).size).toBe(titles.length);
    for (const m of goal.milestones!) {
      expect(m.doneWhen).toBeDefined();
      expect(m.done).toBe(false);
      expect(describeDoneWhen(m.doneWhen).length).toBeGreaterThan(0);
    }
    for (const c of goal.checkins ?? []) expect(describeCheckin(c).length).toBeGreaterThan(0);
    // A behaviour goal runs through intentions; everything else gets a session.
    if (goal.domain !== 'behaviour') {
      expect(routines.length).toBeGreaterThan(0);
      expect(goal.checkins?.length ?? 0).toBeGreaterThan(0);
    }
    for (const r of routines) {
      expect(r.goalId).toBe(goal.id);
      expect(r.days.length).toBeGreaterThan(0);
      expect(r.durationMin).toBeGreaterThan(0);
    }
    expect(goal.routineIds.sort()).toEqual(routines.map((r) => r.id).sort());
  });

  it('the plain planner never leaves a fitness or business goal without rungs', () => {
    for (const [text, domain] of CORPUS) {
      const { goal } = buildGoalPlan(parseGoal(text), PROFILE);
      if (['fitness', 'business', 'career', 'finance', 'relationship', 'family', 'experience', 'behaviour'].includes(domain)) {
        expect({ text, milestones: (goal.milestones ?? []).length > 0 }).toEqual({ text, milestones: true });
      }
    }
  });
});

describe('assessGoal ticks from a reading and unticks from a correction', () => {
  const at = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400e3).toISOString();
  const reading = (key: string, value: number, daysAgo: number): MetricObservation => ({
    ...observe(key, value),
    at: at(daysAgo),
  });

  it('a body-weight rung (at or under) ticks at 79.5 and unticks when the reading is corrected to 85', () => {
    const goal = composeFromText('Get to 80kg', PROFILE).goal;
    const rung = goal.milestones!.find((m) => m.doneWhen?.kind === 'metric')!;
    const first = assessGoal(goal, { metrics: [reading('body.weight', 79.5, 2)], planEvents: [] });
    expect(first.autoDone).toContain(rung.id);
    expect(first.autoUndone).toEqual([]);

    // The store marks it done; a later, corrected reading no longer satisfies it.
    const ticked: Goal = {
      ...goal,
      milestones: goal.milestones!.map((m) => (m.id === rung.id ? { ...m, done: true, doneAt: at(2) } : m)),
    };
    const corrected = assessGoal(ticked, {
      metrics: [reading('body.weight', 79.5, 2), reading('body.weight', 85, 1)],
      planEvents: [],
    });
    expect(corrected.autoUndone).toEqual([rung.id]);
    expect(corrected.autoDone).toEqual([]);
  });

  it('a savings rung (at or over) ticks at 12,000 and unticks when the amount is corrected to 3,000', () => {
    const goal = composeFromText('Save $40k for the house deposit', PROFILE).goal;
    const key = `goal.${goal.id}.saved`;
    const first = assessGoal(goal, { metrics: [reading(key, 12000, 2)], planEvents: [] });
    expect(first.autoDone).toHaveLength(2);
    const ticked: Goal = {
      ...goal,
      milestones: goal.milestones!.map((m) => (first.autoDone.includes(m.id) ? { ...m, done: true, doneAt: at(2) } : m)),
    };
    const corrected = assessGoal(ticked, { metrics: [reading(key, 12000, 2), reading(key, 3000, 1)], planEvents: [] });
    expect(corrected.autoUndone.sort()).toEqual(first.autoDone.sort());
    expect(corrected.state).toBe('on-track');
  });

  it('never unticks a rung the person confirmed by hand', () => {
    const goal = composeFromText('Run a marathon', PROFILE).goal;
    const confirm = goal.milestones!.find((m) => m.doneWhen?.kind === 'confirm')!;
    const ticked: Goal = {
      ...goal,
      milestones: goal.milestones!.map((m) => (m.id === confirm.id ? { ...m, done: true, doneAt: at(1) } : m)),
    };
    expect(assessGoal(ticked, { metrics: [], planEvents: [] }).autoUndone).toEqual([]);
  });

  it('the latest reading decides, whatever order the readings arrived in', () => {
    const goal = composeFromText('Get to 80kg', PROFILE).goal;
    const rung = goal.milestones!.find((m) => m.doneWhen?.kind === 'metric')!;
    const out = assessGoal(goal, {
      metrics: [reading('body.weight', 85, 1), reading('body.weight', 79, 3)],
      planEvents: [],
    });
    expect(out.autoDone).not.toContain(rung.id);
  });
});

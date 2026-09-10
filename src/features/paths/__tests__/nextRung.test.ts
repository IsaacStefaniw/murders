import { offerableRungs } from '@/features/paths/ladder';
import {
  COUPLE_LADDER,
  FRIENDSHIP_LADDER,
  MIND_LADDER,
  RESEARCH_LADDERS,
  TRAINING_LADDER,
  TRAINING_OVER_65_LADDER,
  TRAINING_START_LADDER,
} from '@/features/paths/ladders.research';
import {
  ALL_LADDERS,
  laddersFor,
  laddersForPillar,
  nextRung,
  nextRungForPath,
  SOLID_OCCURRENCES,
  solidityFrom,
} from '@/features/paths/nextRung';
import { protocolById } from '@/features/knowledge/protocols';
import { addDays, todayKey } from '@/lib/dates';
import type { DailyPlan, LifeProfile, Routine } from '@/types/domain';

const routine = (id: string, protocolId: string): Routine =>
  ({ id, protocolId, title: protocolId, days: [1], durationMin: 30 }) as Routine;

/** A plan history with `times` completions of a routine, most recent first. */
function history(routineId: string, times: number, today = todayKey()): Record<string, DailyPlan> {
  const plans: Record<string, DailyPlan> = {};
  for (let i = 0; i < times; i++) {
    const date = addDays(today, -i);
    plans[date] = {
      date,
      items: [{ id: `i${i}`, date, routineId, status: 'completed' }],
    } as unknown as DailyPlan;
  }
  return plans;
}

describe('every rung points at a practice that exists', () => {
  it.each(ALL_LADDERS.map((l) => [l.id, l] as const))('%s', (_id, ladder) => {
    // A ladder is only worth consulting if its rungs are reachable. The work
    // ladders shipped mostly dormant because they were written against an
    // unmerged library; the research ones must not.
    expect(offerableRungs(ladder).length).toBeGreaterThan(0);
  });

  it('the research ladders are entirely live — none of them is dormant', () => {
    for (const ladder of RESEARCH_LADDERS) {
      for (const rung of ladder.rungs) {
        for (const id of rung.protocolIds) {
          expect(protocolById(id)).toBeDefined();
        }
      }
    }
  });

  it('every rung is numbered in order, so the ordering claim is real', () => {
    for (const ladder of ALL_LADDERS) {
      const ns = ladder.rungs.map((r) => r.n);
      expect(ns).toEqual([...ns].sort((a, b) => a - b));
    }
  });

  it('every ladder says something when somebody is stuck', () => {
    for (const ladder of ALL_LADDERS) expect(ladder.whenStuck.length).toBeGreaterThan(20);
  });
});

describe('which ladder a person is on', () => {
  const noProfile = null;
  const aged = (age: number) => ({ age }) as LifeProfile;

  it('puts someone who does not train on the starting ladder, not a low rung', () => {
    const [first] = laddersFor('training', { frequency: '0' }, noProfile);
    expect(first).toBe(TRAINING_START_LADDER);
    // And its first rung asks for three hard minutes, not a gym.
    expect(first.rungs[0].protocolIds).toContain('exercise-snacks');
  });

  it('puts someone already training on the main ladder', () => {
    expect(laddersFor('training', { frequency: '3-4' }, noProfile)[0]).toBe(TRAINING_LADDER);
  });

  it('age beats frequency, so an older regular trainer still gets balance work', () => {
    // Otherwise the best-evidenced thing in the pillar is skipped for the
    // person it was actually trialled on.
    const [first] = laddersFor('training', { frequency: '3-4' }, aged(70));
    expect(first).toBe(TRAINING_OVER_65_LADDER);
    expect(first.rungs[0].protocolIds).toContain('steady-on-your-feet');
  });

  it('gives someone with no partner the friendship ladder only', () => {
    expect(laddersFor('relationship', { with: 'solo' }, noProfile)).toEqual([FRIENDSHIP_LADDER]);
  });

  it('gives a couple the couple ladder first', () => {
    expect(laddersFor('relationship', { with: 'partner' }, noProfile)[0]).toBe(COUPLE_LADDER);
  });

  it('admits money has no researched ladder rather than inventing one', () => {
    expect(laddersFor('money', {}, noProfile)).toEqual([]);
    expect(nextRungForPath('money', {}, noProfile, [], {})).toBeNull();
  });

  it('finds ladders by pillar for the hubs that are not one of the seven', () => {
    expect(laddersForPillar('skill').map((l) => l.id)).toContain('skill-learning');
    expect(laddersForPillar('mind')).toContain(MIND_LADDER);
  });
});

describe('what counts as solid', () => {
  const routines = [routine('r1', 'one-small-act')];

  it('needs the practice to have actually happened, not to be scheduled', () => {
    const solid = solidityFrom(routines, {});
    expect(solid('one-small-act')).toBe(false);
  });

  it('counts a practice solid once it has happened enough', () => {
    const solid = solidityFrom(routines, history('r1', SOLID_OCCURRENCES));
    expect(solid('one-small-act')).toBe(true);
  });

  it('one short of the bar is not solid', () => {
    const solid = solidityFrom(routines, history('r1', SOLID_OCCURRENCES - 1));
    expect(solid('one-small-act')).toBe(false);
  });

  it('ignores completions from outside the window', () => {
    const today = todayKey();
    const old = addDays(today, -60);
    const plans = {
      [old]: { date: old, items: [{ id: 'x', date: old, routineId: 'r1', status: 'completed' }] },
    } as unknown as Record<string, DailyPlan>;
    expect(solidityFrom(routines, plans, today)('one-small-act')).toBe(false);
  });
});

describe('the rung the coach offers', () => {
  it('offers rung one to somebody who has done nothing', () => {
    const next = nextRung(MIND_LADDER, () => false);
    expect(next.rung?.n).toBe(1);
    // Deliberately not meditation: rung 4 exists and is not offered here.
    expect(next.rung?.protocolIds).toContain('one-small-act');
  });

  it('never offers a rung above the first one that is not solid', () => {
    // Solid at rung 3 but not rung 2 — the ladder must still say rung 2.
    const solid = (id: string) => id === 'one-small-act' || id === 'compassion-break';
    expect(nextRung(MIND_LADDER, solid).rung?.n).toBe(2);
  });

  it('counts a rung solid when ANY of its practices is — they are alternatives', () => {
    const solid = (id: string) => id === 'evening-journal';
    const next = nextRung(MIND_LADDER, (id) => id === 'one-small-act' || solid(id));
    expect(next.rung?.n).toBe(3);
  });

  it('says so at the top rather than going quiet', () => {
    const next = nextRung(MIND_LADDER, () => true);
    expect(next.rung).toBeNull();
    expect(next.line).toMatch(/top of what this ladder has/);
  });

  it('carries the safety gate on every connection ladder', () => {
    for (const ladder of [COUPLE_LADDER, FRIENDSHIP_LADDER]) {
      const next = nextRung(ladder, () => false);
      expect(next.gate?.routeTo).toContain('1800 737 732');
    }
  });

  it('asks about sleep before offering anything in the mind pillar', () => {
    expect(nextRung(MIND_LADDER, () => false).gate?.ask).toMatch(/sleep/i);
  });

  it('speaks the rung’s own coach line where it has one', () => {
    expect(nextRung(MIND_LADDER, () => false).line).toBe(
      'Not because you feel like it. That is rather the point.',
    );
  });
});

describe('end to end, for a pathway', () => {
  it('moves a person up as their history fills in', () => {
    const routines = [routine('r1', 'less-processed-same-food')];
    const answers = {};
    const cold = nextRungForPath('nutrition', answers, null, routines, {});
    expect(cold?.rung?.n).toBe(1);

    const warm = nextRungForPath(
      'nutrition',
      answers,
      null,
      routines,
      history('r1', SOLID_OCCURRENCES),
    );
    expect(warm?.rung?.n).toBe(2);
  });
});

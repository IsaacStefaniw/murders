import {
  assessNutrition,
  buildNutritionPlan,
  FIBRE_TARGET_G,
  normaliseAim,
  proteinTarget,
} from '@/features/nutrition/plan';
import type { MetricObservation } from '@/features/model/metrics';

const weighIn = (value: number, daysAgo: number): MetricObservation => ({
  id: `mo-${daysAgo}-${value}`,
  key: 'body.weight',
  value,
  at: new Date(Date.now() - daysAgo * 86400e3).toISOString(),
  source: 'user',
});

describe('proteinTarget', () => {
  it('scales with weight and aim', () => {
    const fatloss = proteinTarget('weight', 90)!;
    expect(fatloss.minG).toBe(162); // 1.8 g/kg — high protein protects muscle in a deficit
    expect(fatloss.maxG).toBe(198);
    expect(fatloss.meals).toBe(3);

    const muscle = proteinTarget('muscle', 75)!;
    expect(muscle.minG).toBe(135);
    expect(muscle.meals).toBe(4);
    expect(muscle.perMealG).toBe(35); // rounded to 5g

    const energy = proteinTarget('energy', 90)!;
    expect(energy.minG).toBe(144); // 1.6 g/kg
  });

  it('returns null without a weight — never a fake number', () => {
    expect(proteinTarget('weight')).toBeNull();
    expect(proteinTarget('weight', 0)).toBeNull();
  });
});

describe('buildNutritionPlan', () => {
  it('gives different ladders for different aims', () => {
    const fatloss = buildNutritionPlan({ aim: 'weight', weightKg: 90 });
    const muscle = buildNutritionPlan({ aim: 'muscle', weightKg: 75 });
    expect(fatloss.levers[0].id).toBe('kitchen-closed');
    expect(muscle.levers[0].id).toBe('fourth-feed');
    expect(fatloss.levers.map((l) => l.id)).not.toEqual(muscle.levers.map((l) => l.id));
  });

  it('promotes the trouble counter-lever to the front', () => {
    const drinks = buildNutritionPlan({ aim: 'weight', trouble: 'drinks' });
    expect(drinks.levers[0].id).toBe('liquid-calories');
    const skipping = buildNutritionPlan({ aim: 'energy', trouble: 'skipping' });
    expect(skipping.levers[0].id).toBe('protein-breakfast');
    // No duplicate when the promoted lever was already in the ladder.
    const ids = drinks.levers.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('runs exactly one live→next frontier from leverLevel', () => {
    const plan = buildNutritionPlan({ aim: 'weight', leverLevel: 2 });
    expect(plan.levers.map((l) => l.state)).toEqual([
      'live',
      'live',
      'next',
      'later',
      'later',
      'later',
    ]);
    const fresh = buildNutritionPlan({ aim: 'weight' });
    expect(fresh.levers[0].state).toBe('next');
  });

  /**
   * "Not sure — just eat better than I do now" is an intake option. It
   * used to reach `LADDER['unsure']` and throw, so the most honest answer
   * on the intake crashed the coach the moment the hub opened.
   */
  it('treats "not sure" as the gentle default and says so, instead of crashing', () => {
    expect(normaliseAim('unsure')).toBe('energy');
    expect(normaliseAim(undefined)).toBe('energy');
    expect(normaliseAim('weight')).toBe('weight');
    const plan = buildNutritionPlan({ aim: 'unsure', weightKg: 80 });
    expect(plan.aim).toBe('energy');
    expect(plan.aimNote).toMatch(/not sure is a fine answer/i);
    expect(plan.proteinTarget).not.toBeNull();
    expect(buildNutritionPlan({ aim: 'energy', weightKg: 80 }).aimNote).toBeUndefined();
    expect(() => assessNutrition({ aim: 'unsure' }, [])).not.toThrow();
    expect(assessNutrition({ aim: 'unsure' }, []).verdict).toBe('steady');
  });

  it('puts fibre on every ladder, linked to its library entry, and shows the number', () => {
    for (const aim of ['energy', 'weight', 'muscle'] as const) {
      const plan = buildNutritionPlan({ aim });
      const fibre = plan.levers.find((l) => l.id === 'fibre-30');
      expect(fibre?.protocolId).toBe('fibre-30');
      expect(plan.fibreTargetG).toBe(FIBRE_TARGET_G);
    }
    expect(FIBRE_TARGET_G).toBe(30);
  });

  it('"drinks carry it" brings water first and the drink-free days second, once each', () => {
    const plan = buildNutritionPlan({ aim: 'weight', trouble: 'drinks' });
    expect(plan.levers.slice(0, 2).map((l) => l.id)).toEqual(['liquid-calories', 'drink-free-days']);
    expect(plan.levers.filter((l) => l.id === 'drink-free-days')).toHaveLength(1);
    // The water lever now points at the library entry that carries its evidence.
    expect(plan.levers[0].protocolId).toBe('default-drink-water');
    // On the energy ladder, where drink-free days was not already present, it is still added once.
    const energy = buildNutritionPlan({ aim: 'energy', trouble: 'drinks' });
    expect(energy.levers.filter((l) => l.id === 'drink-free-days')).toHaveLength(1);
    expect(energy.levers[1].detail).toMatch(/ten standard drinks a week/);
  });

  it('the eating-window lever no longer claims the window does the work', () => {
    const plan = buildNutritionPlan({ aim: 'weight' });
    const kitchen = plan.levers.find((l) => l.id === 'kitchen-closed')!;
    expect(kitchen.detail).not.toMatch(/does the work/);
    expect(kitchen.detail).toMatch(/not magic/);
  });
});

describe('assessNutrition — the trend decides, never one day', () => {
  const inputs = { aim: 'weight' as const, weightKg: 90 };

  it('demands data before judging', () => {
    expect(assessNutrition(inputs, []).verdict).toBe('need-data');
    expect(assessNutrition(inputs, [weighIn(90, 1)]).verdict).toBe('need-data');
    expect(assessNutrition(inputs, [weighIn(90, 5), weighIn(90, 1)]).verdict).toBe('need-data');
  });

  it('flat over three weeks of readings → tighten (advance the ladder)', () => {
    const flat = [weighIn(90, 20), weighIn(90.2, 14), weighIn(89.9, 7), weighIn(90.1, 1)];
    const a = assessNutrition(inputs, flat);
    expect(a.verdict).toBe('tighten');
    expect(a.advanceLever).toBe(true);
  });

  it('a sustainable downward trend → on-track, change nothing', () => {
    const steady = [weighIn(90, 20), weighIn(89.4, 13), weighIn(89, 7), weighIn(88.6, 1)];
    const a = assessNutrition(inputs, steady);
    expect(a.verdict).toBe('on-track');
    expect(a.advanceLever).toBe(false);
  });

  it('losing faster than ~1% a week → ease, protect muscle', () => {
    const crash = [weighIn(90, 20), weighIn(87, 10), weighIn(85.5, 1)];
    expect(assessNutrition(inputs, crash).verdict).toBe('ease');
  });

  it('one heavy day inside a downward trend does not flip the verdict', () => {
    const withSpike = [weighIn(90, 20), weighIn(89.2, 10), weighIn(90.4, 4), weighIn(88.9, 1)];
    expect(assessNutrition(inputs, withSpike).verdict).toBe('on-track');
  });

  it('muscle aim: slow gain is on-track, a slide says eat more', () => {
    const gaining = [weighIn(75, 20), weighIn(75.3, 10), weighIn(75.6, 1)];
    expect(assessNutrition({ aim: 'muscle', weightKg: 75 }, gaining).verdict).toBe('on-track');
    const sliding = [weighIn(75, 20), weighIn(74.5, 10), weighIn(74.2, 1)];
    const a = assessNutrition({ aim: 'muscle', weightKg: 75 }, sliding);
    expect(a.verdict).toBe('tighten');
    expect(a.advanceLever).toBe(true);
  });

  it('energy aim never judges by the scale', () => {
    expect(assessNutrition({ aim: 'energy' }, []).verdict).toBe('steady');
  });
});

/**
 * The nutrition ladder for every aim, cooking answer, trouble and level.
 *
 * One lever live at a time is the whole doctrine; this checks the frontier
 * holds wherever the intake lands, that a promoted lever never appears
 * twice, and that a level past the end of the ladder is reported honestly.
 */

import { buildNutritionPlan, proteinTarget, type NutritionAim, type NutritionInputs } from '@/features/nutrition/plan';
import { protocolById } from '@/features/knowledge/protocols';

const AIMS: NutritionAim[] = ['energy', 'weight', 'muscle'];
const COOKING: NutritionInputs['cooking'][] = [undefined, 'quick', 'normal', 'enjoy'];
const TROUBLE: NutritionInputs['trouble'][] = [undefined, 'evenings', 'snacking', 'drinks', 'skipping', 'nowhere'];

describe('the ladder across the whole intake', () => {
  it('keeps one frontier, no duplicate lever, and a level that fits', () => {
    for (const aim of AIMS) {
      for (const cooking of COOKING) {
        for (const trouble of TROUBLE) {
          for (const leverLevel of [undefined, 0, 1, 2, 3, 4, 9]) {
            const plan = buildNutritionPlan({ aim, cooking, trouble, leverLevel, weightKg: 80 });
            const ids = plan.levers.map((l) => l.id);
            expect(new Set(ids).size).toBe(ids.length);
            const live = plan.levers.filter((l) => l.state === 'live').length;
            const next = plan.levers.filter((l) => l.state === 'next').length;
            const level = Math.max(0, leverLevel ?? 0);
            expect(live).toBe(Math.min(level, ids.length));
            expect(next).toBe(level < ids.length ? 1 : 0);
            expect(plan.leverLevel).toBe(Math.min(level, ids.length));
            // Live levers come before the next one, which comes before the rest.
            const order = plan.levers.map((l) => l.state).join(',');
            expect(order).toMatch(/^(live,)*(next(,later)*)?$|^(live(,live)*)$/);
            for (const l of plan.levers) {
              expect(l.title.length).toBeGreaterThan(5);
              expect(l.detail.length).toBeGreaterThan(10);
              if (l.protocolId) expect(protocolById(l.protocolId)).toBeDefined();
            }
            expect(plan.plate.length).toBeGreaterThan(20);
          }
        }
      }
    }
  });

  it('the trouble answer puts its counter-lever first, for every aim it applies to', () => {
    const expected: Record<string, string> = {
      evenings: 'kitchen-closed',
      snacking: 'protein-breakfast',
      drinks: 'liquid-calories',
      skipping: 'protein-breakfast',
    };
    for (const aim of AIMS) {
      for (const [trouble, lever] of Object.entries(expected)) {
        const plan = buildNutritionPlan({ aim, trouble: trouble as NutritionInputs['trouble'] });
        expect({ aim, trouble, first: plan.levers[0].id }).toEqual({ aim, trouble, first: lever });
      }
      // "It's mostly fine" changes nothing.
      expect(buildNutritionPlan({ aim, trouble: 'nowhere' }).levers.map((l) => l.id)).toEqual(
        buildNutritionPlan({ aim }).levers.map((l) => l.id),
      );
    }
  });

  it('the protein target is honest about missing weight and scales per aim', () => {
    for (const aim of AIMS) {
      expect(proteinTarget(aim, undefined)).toBeNull();
      expect(proteinTarget(aim, 0)).toBeNull();
      expect(proteinTarget(aim, -5)).toBeNull();
      for (const w of [45, 60, 80, 120]) {
        const t = proteinTarget(aim, w)!;
        expect(t.minG).toBeLessThan(t.maxG);
        expect(t.minG).toBeGreaterThanOrEqual(Math.round(w * 1.6));
        expect(t.maxG).toBeLessThanOrEqual(Math.round(w * 2.2));
        expect(t.perMealG % 5).toBe(0);
        expect(t.meals).toBe(aim === 'muscle' ? 4 : 3);
      }
    }
  });
});

import {
  AMOUNTS_WRITTEN_FOR,
  batchPlan,
  keepsWell,
  MAX_NIGHTS_PER_COOK,
  scaleAmount,
  scaleAmounts,
} from '@/features/modalities/meals/batch';
import { DISHES } from '@/features/modalities/meals/food';
import type { Dish } from '@/features/modalities/meals/food';

const byTitle = new Map(DISHES.map((d) => [d.title, d]));

describe('scaling a shopping amount', () => {
  it('does arithmetic on a bare weight, where there is no plural to get wrong', () => {
    expect(scaleAmount('500 g', 2)).toBe('1 kg');
    expect(scaleAmount('400 g', 2)).toBe('800 g');
    expect(scaleAmount('1.2 kg', 2)).toBe('2.4 kg');
  });

  it('carries millilitres up to litres the same way', () => {
    expect(scaleAmount('500 ml', 2)).toBe('1 l');
    expect(scaleAmount('250 ml', 3)).toBe('750 ml');
  });

  it('multiplies in plain sight where a sentence would go wrong', () => {
    // "3 tin" and "2 small whole birds, about 1.2 kg" are both wrong in
    // ways that make an app look careless in a supermarket aisle.
    expect(scaleAmount('1 tin', 3)).toBe('1 tin × 3');
    expect(scaleAmount('2 fillets', 2)).toBe('2 fillets × 2');
    expect(scaleAmount('1 small whole bird, about 1.2 kg', 2)).toBe(
      '1 small whole bird, about 1.2 kg × 2',
    );
  });

  it('leaves everything alone at a factor of one', () => {
    for (const a of ['500 g', '1 tin', '2 fillets']) expect(scaleAmount(a, 1)).toBe(a);
  });

  it('scales a whole dish at once', () => {
    const scaled = scaleAmounts({ 'beef mince': '500 g', 'kidney beans': '1 tin' }, 2);
    expect(scaled).toEqual({ 'beef mince': '1 kg', 'kidney beans': '1 tin × 2' });
  });

  it('handles a dish that states no amounts', () => {
    expect(scaleAmounts(undefined, 3)).toEqual({});
  });
});

describe('which dishes are worth cooking a lot of', () => {
  it('reads the tags that were already on every record', () => {
    const batchy = DISHES.find((d) => d.tags.includes('batch_friendly'))!;
    expect(keepsWell(batchy)).toBe(true);
  });

  it('does not reject a dish that keeps badly — it just does not prefer it', () => {
    const fresh = { tags: ['salad'] } as unknown as Dish;
    expect(keepsWell(fresh)).toBe(false);
  });
});

describe('rearranging the week into a few cooks', () => {
  const week = (n: number): Record<number, string> =>
    Object.fromEntries(
      Array.from({ length: n }, (_, i) => [i, DISHES[i % DISHES.length].title]),
    );

  it('covers every dinner', () => {
    const plan = batchPlan({ dinners: week(7), cookSessions: 2, eaters: 2 }, byTitle);
    const covered = plan.runs.flatMap((r) => r.days);
    expect(covered.length).toBe(7);
    expect(new Set(covered).size).toBe(7);
  });

  it('says how many evenings it gives back', () => {
    const plan = batchPlan({ dinners: week(6), cookSessions: 2, eaters: 2 }, byTitle);
    expect(plan.eveningsSaved).toBe(6 - plan.runs.length);
    expect(plan.line).toMatch(/evenings you are not cooking/);
  });

  it('never asks anybody to eat the same dinner more than four nights', () => {
    const plan = batchPlan({ dinners: week(7), cookSessions: 1, eaters: 2 }, byTitle);
    for (const run of plan.runs) expect(run.servings).toBeLessThanOrEqual(MAX_NIGHTS_PER_COOK);
  });

  it('gives consecutive days to a run, so no fridge decisions', () => {
    const plan = batchPlan({ dinners: week(6), cookSessions: 2, eaters: 2 }, byTitle);
    for (const run of plan.runs) {
      for (let i = 1; i < run.days.length; i++) {
        expect(run.days[i]).toBe(run.days[i - 1] + 1);
      }
    }
  });

  it('scales the shop by servings and eaters together', () => {
    // Amounts are written for two, so four dinners for two people is a
    // shop for eight — a factor of four.
    const plan = batchPlan({ dinners: week(4), cookSessions: 1, eaters: 2 }, byTitle);
    expect(plan.runs[0].factor).toBe((4 * 2) / AMOUNTS_WRITTEN_FOR);
  });

  it('does not double a single person’s shop', () => {
    // Two dinners for one person is exactly what the record was written
    // for, so nothing is scaled at all.
    const plan = batchPlan({ dinners: week(2), cookSessions: 1, eaters: 1 }, byTitle);
    expect(plan.runs[0].factor).toBe(1);
  });

  it('prefers the dish in the run that actually keeps', () => {
    const fresh = DISHES.find((d) => !keepsWell(d))!;
    const keeps = DISHES.find((d) => keepsWell(d))!;
    const plan = batchPlan(
      { dinners: { 1: fresh.title, 2: keeps.title }, cookSessions: 1, eaters: 2 },
      byTitle,
    );
    expect(plan.runs[0].title).toBe(keeps.title);
  });

  it('falls back to what the week planned when nothing keeps', () => {
    const fresh = DISHES.filter((d) => !keepsWell(d)).slice(0, 2);
    const plan = batchPlan(
      { dinners: { 1: fresh[0].title, 2: fresh[1].title }, cookSessions: 1, eaters: 2 },
      byTitle,
    );
    expect(plan.runs[0].title).toBe(fresh[0].title);
  });

  it('says so honestly when there is nothing to batch', () => {
    const plan = batchPlan({ dinners: week(3), cookSessions: 3, eaters: 2 }, byTitle);
    expect(plan.eveningsSaved).toBe(0);
    expect(plan.line).toMatch(/Nothing to batch/);
  });

  it('copes with an empty week', () => {
    const plan = batchPlan({ dinners: {}, cookSessions: 2, eaters: 2 }, byTitle);
    expect(plan.runs).toEqual([]);
    expect(plan.line).toMatch(/No dinners planned/);
  });

  it('never asks for more cooks than there are dinners', () => {
    const plan = batchPlan({ dinners: week(2), cookSessions: 5, eaters: 2 }, byTitle);
    expect(plan.runs.length).toBeLessThanOrEqual(2);
  });
});

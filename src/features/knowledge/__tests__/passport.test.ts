/**
 * A grade with no history is an opinion.
 *
 * Any app can print a letter beside a practice. Very few will show you
 * the letter they used to print, on the same screen, with the reason they
 * were wrong — and fewer still when fourteen of the seventeen changes go
 * the expensive way. That asymmetry is the claim; this test is what stops
 * it quietly becoming a list of upgrades.
 */
import { PROTOCOLS, EVIDENCE_ORDER } from '@/features/knowledge/protocols';
import { REGRADES, regradeTally, regradesFor } from '@/features/knowledge/regrades';
import { TIME_BACK, timeBackFor } from '@/features/knowledge/timeBack';

it('records a regrade against a practice that actually exists', () => {
  const ids = new Set(PROTOCOLS.map((p) => p.id));
  const orphans = Object.keys(REGRADES).filter((id) => !ids.has(id));
  expect(orphans).toEqual([]);
});

it('ends every regrade history at the grade the library now publishes', () => {
  // The failure this guards is the passport telling one story while the
  // card shows another letter — which is worse than having no passport.
  const wrong: string[] = [];
  for (const [id, history] of Object.entries(REGRADES)) {
    const now = PROTOCOLS.find((p) => p.id === id)!.evidenceLevel;
    const last = history[history.length - 1].to;
    if (last !== now) wrong.push(`${id}: history ends at ${last}, card says ${now}`);
  }
  expect(wrong).toEqual([]);
});

it('gives every regrade a reason a reader could check', () => {
  for (const history of Object.values(REGRADES)) {
    for (const r of history) {
      expect(r.why.length).toBeGreaterThan(60);
      expect(r.on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(EVIDENCE_ORDER).toContain(r.from);
      expect(EVIDENCE_ORDER).toContain(r.to);
      expect(r.from).not.toBe(r.to);
    }
  }
});

it('publishes more downgrades than upgrades, which is the costly half', () => {
  const t = regradeTally();
  expect(t.total).toBe(17);
  expect(t.down).toBeGreaterThan(t.up);
});

it('returns nothing for a practice whose grade has never moved', () => {
  expect(regradesFor('morning-light')).toEqual([]);
});

describe('time back', () => {
  it('says what the evidence found rather than mocking the belief', () => {
    for (const t of TIME_BACK) {
      expect(t.finding.length).toBeGreaterThan(80);
      // Never smug. Somebody reading this has been doing the thing, often
      // on good faith and someone else's advice, and the round's own
      // contract says the grade and the encouragement are different fields.
      expect(`${t.claim} ${t.finding}`).not.toMatch(/\bmyth\b|nonsense|waste of time|you were wrong/i);
    }
  });

  it('claims minutes only for the practice, never for the benefit', () => {
    for (const t of TIME_BACK) {
      if (t.minutesPerWeek === undefined) continue;
      expect(t.minutesPerWeek).toBeGreaterThan(0);
      expect(t.minutesPerWeek).toBeLessThan(600);
    }
  });

  it('rotates so the same one is not shown every week', () => {
    const weeks = ['2026-W36', '2026-W37', '2026-W38', '2026-W39'];
    const shown = new Set(weeks.map((w) => timeBackFor(w)?.id));
    expect(shown.size).toBeGreaterThan(1);
  });

  it('is silent rather than inventing one when the pillar has none', () => {
    expect(timeBackFor('2026-W36', ['wealth'])).toBeNull();
  });
});

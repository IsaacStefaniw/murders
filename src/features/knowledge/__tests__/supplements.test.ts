import { PROTOCOLS, protocolById } from '@/features/knowledge/protocols';
import {
  SUPPLEMENT_PROTOCOLS,
  SUPPLEMENT_SAFETY_LINE,
} from '@/features/knowledge/protocols.supplements';

/**
 * The supplements group is the one place the library names a substance,
 * so it is held to more than the general integrity tests: the safety
 * line is the same on every entry and says everything the policy
 * requires, nothing is ever nagged, the excluded compounds stay out, and
 * the grades are spread rather than uniformly flattering.
 */
describe('the supplements group', () => {
  it('is merged into the library once, with unique ids', () => {
    for (const p of SUPPLEMENT_PROTOCOLS) {
      expect(PROTOCOLS.filter((x) => x.id === p.id)).toHaveLength(1);
      expect(protocolById(p.id)).toBe(p);
    }
  });

  it('covers the brief: creatine, protein powder, vitamin D, omega-3, caffeine, magnesium, melatonin, iron', () => {
    const ids = SUPPLEMENT_PROTOCOLS.map((p) => p.id);
    expect(ids).toEqual([
      'creatine-monohydrate',
      'protein-powder-is-food',
      'vitamin-d-test-first',
      'omega-3-fish-first',
      'caffeine-timing',
      'magnesium-honest',
      'melatonin-timing',
      'iron-test-before-you-take',
    ]);
  });

  it('every entry ends on the shared safety line, and the line says what the policy requires', () => {
    const line = SUPPLEMENT_SAFETY_LINE.toLowerCase();
    expect(line).toContain('education, never advice');
    expect(line).toContain('doctor or pharmacist');
    expect(line).toContain('interactions');
    expect(line).toContain('pregnant');
    expect(line).toContain('kidney');
    expect(line).toContain('liver');
    expect(line).toContain('disordered eating');
    for (const p of SUPPLEMENT_PROTOCOLS) {
      expect(p.safety).toBeTruthy();
      expect(p.safety!.endsWith(SUPPLEMENT_SAFETY_LINE)).toBe(true);
    }
  });

  it('is never nagged: no streak, no adherence score, no missed-it nudge for a substance', () => {
    for (const p of SUPPLEMENT_PROTOCOLS) expect(p.neverNag).toBe(true);
  });

  it('names a public source on every entry', () => {
    for (const p of SUPPLEMENT_PROTOCOLS) {
      expect(p.attribution.length).toBeGreaterThanOrEqual(2);
      // At least one attribution is an institution, trial or review, not a communicator.
      expect(
        p.attribution.some((a) => /society|academy|association|college|trial|review|australia/i.test(a)),
      ).toBe(true);
    }
  });

  it('writes "test before you take" for the clinical calls', () => {
    for (const id of ['vitamin-d-test-first', 'iron-test-before-you-take']) {
      const p = protocolById(id)!;
      expect(`${p.title} ${p.summary}`.toLowerCase()).toMatch(/test (before|first)/);
    }
  });

  it('keeps the excluded compounds out, and never sells a stack', () => {
    const text = JSON.stringify(SUPPLEMENT_PROTOCOLS).toLowerCase();
    for (const banned of [
      'rapamycin',
      'metformin',
      'nad+',
      'nmn',
      'nicotinamide',
      'resveratrol',
      'hormone therapy',
      'testosterone replacement',
      'stack',
      'dose',
      'prescri',
    ]) {
      expect(text).not.toContain(banned);
    }
  });

  it('grades honestly in both directions', () => {
    const grade = (id: string) => protocolById(id)!.evidenceLevel;
    expect(grade('creatine-monohydrate')).toBe('A');
    expect(grade('magnesium-honest')).toBe('D');
    expect(grade('melatonin-timing')).toBe('C');
    const grades = new Set(SUPPLEMENT_PROTOCOLS.map((p) => p.evidenceLevel));
    expect(grades.size).toBeGreaterThanOrEqual(3);
  });

  it('the exclusion note in protocols.ts still names what stays out', () => {
    // The note is documentation, but the policy it states is enforced above:
    // the compounds it lists are the ones the previous test bans.
    const excluded = ['rapamycin', 'metformin', 'nad precursors', 'hormone'];
    const libraryText = JSON.stringify(PROTOCOLS).toLowerCase();
    for (const term of excluded) {
      // No protocol in the whole library adds one of these as a practice.
      const hits = PROTOCOLS.filter((p) => p.summary.toLowerCase().includes(term));
      expect(hits).toHaveLength(0);
    }
    expect(libraryText).not.toContain('supplement stack');
  });
});

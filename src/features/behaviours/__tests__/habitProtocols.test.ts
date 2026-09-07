/**
 * The habits coach's own practices: free by the id rule, last in the
 * library, graded honestly, and carrying the clinical line every one.
 */

import { HABIT_PROTOCOLS } from '@/features/knowledge/protocols.habits';
import { PROTOCOLS, protocolById, toRoutine } from '@/features/knowledge/protocols';
import { isAlwaysFreeProtocol, isAlwaysFreeRoutine, splitLibrary } from '@/features/plus/entitlement';

describe('the urge and habit practices', () => {
  it('are four, every id starts with urge, and every one is free forever', () => {
    expect(HABIT_PROTOCOLS.length).toBe(4);
    for (const p of HABIT_PROTOCOLS) {
      expect(p.id.startsWith('urge-')).toBe(true);
      expect(isAlwaysFreeProtocol(p.id)).toBe(true);
      expect(isAlwaysFreeRoutine(toRoutine(p, null))).toBe(true);
    }
    const { open } = splitLibrary(PROTOCOLS, false);
    for (const p of HABIT_PROTOCOLS) expect(open.has(p.id)).toBe(true);
  });

  it('are appended at the end of the library, in order, and resolve by id', () => {
    const tail = PROTOCOLS.slice(-HABIT_PROTOCOLS.length).map((p) => p.id);
    expect(tail).toEqual(HABIT_PROTOCOLS.map((p) => p.id));
    for (const p of HABIT_PROTOCOLS) expect(protocolById(p.id)).toBe(p);
  });

  it('claim no more than B, and say in the why what the grade rests on', () => {
    for (const p of HABIT_PROTOCOLS) {
      expect(['B', 'C']).toContain(p.evidenceLevel);
      expect(p.why).toMatch(/Graded|so C|rather than a trial|holds the A/);
      expect(p.attribution.length).toBeGreaterThan(0);
      expect(p.goalDomains).toContain('behaviour');
    }
  });

  it('every one draws the clinical line: a doctor, a helpline named generically, nothing charged', () => {
    for (const p of HABIT_PROTOCOLS) {
      expect(p.safety).toBeTruthy();
      expect(p.safety!.toLowerCase()).toMatch(/doctor/);
      expect(p.safety!.toLowerCase()).toMatch(/helpline/);
      expect(p.safety!).toMatch(/never charges/);
      expect(p.safety!).not.toMatch(/\d{4}/);
    }
  });

  it('the as-needed ones never nag: no streak, no missed-it, no push', () => {
    for (const id of ['urge-stand-in', 'urge-ten-minutes-first', 'urge-next-hour']) {
      expect(protocolById(id)!.neverNag).toBe(true);
    }
  });

  it('keeps the library’s grading honest after being added', () => {
    const strong = PROTOCOLS.filter((p) => p.evidenceLevel === 'A' || p.evidenceLevel === 'B');
    expect(strong.length).toBeLessThan(PROTOCOLS.length / 2);
  });
});

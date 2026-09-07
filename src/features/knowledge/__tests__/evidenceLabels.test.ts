import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  EVIDENCE_LABELS,
  EVIDENCE_NOTE,
  EVIDENCE_ORDER,
  EVIDENCE_PLAIN,
  EVIDENCE_PRECISE,
  PROTOCOLS,
  evidenceLine,
  type EvidenceLevel,
} from '@/features/knowledge/protocols';

const root = join(__dirname, '..', '..', '..', '..');
const library = readFileSync(join(root, 'src/app/library.tsx'), 'utf8');

/**
 * The grades, in plain words the first time they appear.
 *
 * The grade sentence was the most-flagged piece of jargon in the third
 * persona round after "Zone 2". The fix is not to drop the precision — it
 * is the differentiator, and no competitor prints a grade on the screen
 * that hands you the practice — but to lead with what the letter means and
 * keep the research wording behind the dash.
 */
describe('every grade leads with the plain words', () => {
  it('is a plain half, then the precise half', () => {
    for (const level of EVIDENCE_ORDER) {
      expect(EVIDENCE_LABELS[level]).toBe(`${EVIDENCE_PLAIN[level]} — ${EVIDENCE_PRECISE[level]}`);
    }
  });

  it('the plain half is short, ordinary words', () => {
    for (const level of EVIDENCE_ORDER) {
      const plain = EVIDENCE_PLAIN[level];
      expect(plain.split(' ').length).toBeLessThanOrEqual(5);
      // The words reviewers stopped on. The precise half may be technical;
      // the half they read at a glance may not be.
      expect(plain).not.toMatch(/meta-analys|observational|heuristic|efficacy|randomi/i);
    }
  });

  it('covers A to E and nothing else', () => {
    expect(EVIDENCE_ORDER).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(Object.keys(EVIDENCE_LABELS).sort()).toEqual(['A', 'B', 'C', 'D', 'E']);
    for (const level of EVIDENCE_ORDER) expect(evidenceLine(level).startsWith(`${level} · `)).toBe(true);
  });

  it('never calls a practice a prescription, whatever the grade', () => {
    for (const level of EVIDENCE_ORDER) {
      expect(EVIDENCE_LABELS[level]).not.toMatch(/prescri/i);
      expect(EVIDENCE_LABELS[level]).not.toMatch(/cure|guarantee|proven to work/i);
    }
  });
});

/**
 * The honest close. It is only worth saying because it is true of the
 * library, so the library is asked.
 */
describe('the honest note about the grades', () => {
  it('says most of the library is not an A, and that is the case', () => {
    expect(EVIDENCE_NOTE).toMatch(/not an A/i);
    const graded = PROTOCOLS.map((p) => p.evidenceLevel as EvidenceLevel);
    const aGrade = graded.filter((l) => l === 'A').length;
    expect(graded.length).toBeGreaterThan(50);
    expect(aGrade).toBeLessThan(graded.length / 2);
  });
});

/** Explained where they first appear, not in a help screen nobody opens. */
describe('the library explains the letters where they are shown', () => {
  it('opens a short explainer listing every grade and the honest note', () => {
    expect(library).toContain('<Disclosure');
    expect(library).toContain('What these letters mean');
    expect(library).toContain('EVIDENCE_ORDER.map');
    expect(library).toContain('evidenceLine(level)');
    expect(library).toContain('EVIDENCE_NOTE');
  });

  it('keeps the grade, the source and where it stops together on a card', () => {
    const block = library.slice(library.indexOf('styles.evidence'), library.indexOf('title={active'));
    expect(block).toContain('Evidence {protocol.evidenceLevel}');
    expect(block).toMatch(/Source ·/);
    expect(block).toMatch(/Where it stops ·/);
    // Every practice shows all three, including the ones with no caution
    // written on them: a missing third line reads as a missing limit.
    expect(block).toContain('protocol.safety');
    expect(block).toContain('protocol.attribution');
  });
});

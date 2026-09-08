/**
 * The numbers we publish are the numbers in the code.
 *
 * The App Store description, the website evidence page, the film scripts
 * and four briefs all quoted 177 practices, 145 safety lines and 188 named
 * people. Every one of those was a count of `protocols.ts` alone, taken
 * before the money, people, habits, work and supplement files existed —
 * so all three understated the library by roughly an eighth, in copy that
 * said in the same breath that it was "counted from the shipped code".
 *
 * An outside reviewer found it by noticing two of our own documents
 * disagreed. This test is so the next one does not have to.
 *
 * If these fail: the library changed, which is fine and expected. Update
 * the published copy listed in the failure message, then update the
 * numbers here. Do not just change the numbers.
 */
import { PROTOCOLS } from '@/features/knowledge/protocols';

/**
 * Every place a figure below is published. Keep this list current.
 *
 *   docs/APP_STORE.md — the App Store description
 *   web/app/evidence/page.tsx — page metadata
 *   web/components/intent-motion/PositioningMotion.tsx
 *   docs/FILM_BRIEF.md, MOTION_BRIEF.md, AGENCY_BRIEF.md
 *   docs/MARKETING_ENGINE.md, PROBLEM_STATEMENT.md, SEO_RESEARCH_BRIEF.md
 *   docs/film/film7-45s-intent.py, film8-18s-vertical.py, film9-30s-plain.py
 *
 * A failure here means the library changed, which is fine and expected.
 * Update the published copy above FIRST, then the numbers here. Changing
 * only the numbers defeats the point of the test.
 */

it('publishes the real practice count — 317', () => {
  expect(PROTOCOLS.length).toBe(317);
});

it('publishes the real safety-line count — 278', () => {
  expect(PROTOCOLS.filter((p) => p.safety).length).toBe(278);
});

it('publishes the real number of people credited — 249', () => {
  const names = new Set<string>();
  for (const p of PROTOCOLS) for (const n of p.attribution ?? []) names.add(n);
  expect(names.size).toBe(249);
});

it('publishes the real grade spread — A15 B100 C120 D70 E12', () => {
  const spread: Record<string, number> = {};
  for (const p of PROTOCOLS) spread[p.evidenceLevel] = (spread[p.evidenceLevel] ?? 0) + 1;
  expect(spread).toEqual({ A: 15, B: 100, C: 120, D: 70, E: 12 });
});

it('publishes the real "Mixed or weaker" count on the evidence page — 202', () => {
  expect(PROTOCOLS.filter((p) => p.evidenceLevel >= 'C').length).toBe(202);
});

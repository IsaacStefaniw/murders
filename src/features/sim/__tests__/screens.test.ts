/**
 * The render pass, as a gate.
 *
 * These are the rules the third harness enforces, run on every commit
 * rather than on demand. Each was written after something reached a phone:
 * a pelvic floor practice given the most prominent slot on a man's Today
 * screen, a meditation that asked you to close your eyes and to glance at
 * the screen, and work options so terse they read as a different app's.
 */

import { checkCopy, checkLibrary, checkQuestions, type Finding } from '@/features/sim/screens';
import { PROTOCOLS } from '@/features/knowledge/protocols';

describe('every intake question is a real question', () => {
  it('has no findings', () => {
    const out: Finding[] = [];
    checkQuestions(out);
    expect(out.map((f) => `${f.screen}: ${f.rule} — ${f.detail}`)).toEqual([]);
  });
});

describe('every library entry can be judged by a reader', () => {
  it('has no findings', () => {
    const out: Finding[] = [];
    checkLibrary(out);
    expect(out.map((f) => `${f.screen}: ${f.rule} — ${f.detail}`)).toEqual([]);
  });
});

describe('practices for particular bodies are labelled, never guessed at', () => {
  it('names who each one is for', () => {
    // The app does not ask anybody's sex and must not infer it. The
    // protection is that these are labelled and kept out of the default
    // browse, so they are reached deliberately rather than stumbled into.
    for (const id of ['pelvic-floor-training', 'pregnancy-keep-moving', 'cycle-symptom-log']) {
      const p = PROTOCOLS.find((x) => x.id === id);
      expect(p?.appliesTo).toBeTruthy();
    }
  });

  it('keeps them out of the general lists', () => {
    const general = PROTOCOLS.filter((p) => !p.appliesTo).map((p) => p.id);
    expect(general).not.toContain('pelvic-floor-training');
  });
});

describe('copy rules', () => {
  it('catches an instruction that contradicts itself', () => {
    const out: Finding[] = [];
    // The shipped meditation setup screen, verbatim.
    checkCopy(
      'meditate',
      'Get comfortable and close your eyes. The guidance appears on screen — you can glance at it when you like.',
      out,
    );
    expect(out.map((f) => f.rule)).toContain('no contradictory instruction');
  });

  it('catches the public word the product refuses to use', () => {
    const out: Finding[] = [];
    checkCopy('anywhere', 'Your prescription for the week', out);
    expect(out.map((f) => f.rule)).toContain('no "prescription"');
  });

  it('catches jargon that needs a manual', () => {
    const out: Finding[] = [];
    checkCopy('anywhere', 'Keep the working sets at RPE 8', out);
    expect(out[0]?.rule).toMatch(/no manual required/);
  });

  it('passes ordinary copy', () => {
    const out: Finding[] = [];
    checkCopy('anywhere', 'Ten minutes outside, before the first meeting.', out);
    expect(out).toEqual([]);
  });
});

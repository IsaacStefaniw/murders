/**
 * The journal arm's own guards.
 *
 * Two of these exist because of mistakes made earlier in this project
 * rather than because of anything hypothetical: a claim drawn from too
 * little data, and a window asserted without measuring it.
 */

import {
  ASSUMED_WINDOW,
  CLEAR_IS_DATA,
  CONCEALMENT_NOTE,
  QUESTIONS,
  TRACKED,
  standing,
} from '@/features/me/journal';
import { MIN_EVENTS_FOR_PATTERN } from '@/features/behaviours/patterns';
import { BEHAVIOUR_CATALOG } from '@/features/behaviours/catalog';

describe('the questions', () => {
  it('asks exactly four, and when is first', () => {
    // Four, because a fifth is a form somebody abandons. `when` first
    // because hotWindow is a function of the hour and nothing else, so an
    // entry without a time never contributes to a window.
    expect(QUESTIONS).toHaveLength(4);
    expect(QUESTIONS[0].id).toBe('when');
  });

  it('every question fills a real BehaviourEvent field', () => {
    const fields = new Set(['occurredAt', 'trigger', 'context', 'detail', 'size']);
    const stray = QUESTIONS.filter((q) => !fields.has(q.fills)).map((q) => q.id);
    expect({ stray }).toEqual({ stray: [] });
  });

  it('fills no field twice', () => {
    const filled = QUESTIONS.map((q) => q.fills);
    expect(new Set(filled).size).toBe(filled.length);
  });

  it('every question says why it is asked', () => {
    const unexplained = QUESTIONS.filter((q) => q.because.trim().length < 20).map((q) => q.id);
    expect({ unexplained }).toEqual({ unexplained: [] });
  });
});

describe('what it is allowed to claim', () => {
  it('refuses a pattern below the threshold the engine itself uses', () => {
    // The whole point. `patterns.ts` returns null below 4 and this must
    // not say something more confident than the engine behind it.
    for (let n = 0; n < MIN_EVENTS_FOR_PATTERN; n += 1) {
      expect(standing(n)).not.toMatch(/enough for the hours/);
    }
    expect(standing(MIN_EVENTS_FOR_PATTERN)).toMatch(/enough for the hours/);
  });

  it('says something true at zero entries rather than nothing', () => {
    expect(standing(0).length).toBeGreaterThan(20);
  });

  it('never scolds', () => {
    // Rule 7. These three strings are the only prose this module ships,
    // so they are the only place a scold could get in.
    const banned = /\bshould have\b|\bfailed\b|\byou need to\b|\bjust\b.*\bwillpower\b|\bdiscipline\b/i;
    for (const s of [CLEAR_IS_DATA, CONCEALMENT_NOTE, standing(0), standing(1), standing(9)]) {
      expect(s).not.toMatch(banned);
    }
  });
});

describe('the tracked behaviours', () => {
  it('are real catalog keys', () => {
    const known = new Set(BEHAVIOUR_CATALOG.map((b) => b.key));
    const unknown = TRACKED.filter((k) => !known.has(k));
    expect({ unknown }).toEqual({ unknown: [] });
  });

  it('every tracked behaviour has an assumed window, labelled as assumed', () => {
    for (const key of TRACKED) {
      const w = ASSUMED_WINDOW[key];
      expect({ key, hasWindow: Boolean(w) }).toEqual({ key, hasWindow: true });
      // The note must exist, because a window with no provenance is a
      // measurement claim the log cannot support from one entry.
      expect(w.note.length).toBeGreaterThan(20);
    }
  });

  it('records that BOTH windows were contradicted rather than hiding it', () => {
    // Corrected three times and always earlier: 20:30, then 18:00, then
    // ~16:40 once he said "closer to straight after work". The assertion
    // is that it is now inside the first hour after work AND that the
    // note still records having been wrong, rather than on the exact
    // digits, which have moved three times and may move again.
    const from = ASSUMED_WINDOW.alcohol.from;
    expect(from >= '16:30' && from <= '17:30').toBe(true);
    expect(ASSUMED_WINDOW.alcohol.note).toMatch(/not one logged event/i);
    expect(ASSUMED_WINDOW.alcohol.note).toMatch(/THREE TIMES|corrected/i);
  });

  it('records that the vaping window was contradicted rather than hiding it', () => {
    // Entry 1 put the vape inside 17:30-20:30, where profile.ts had
    // modelled it as downstream of the drink in the quiet window. The
    // module must carry that correction, not quietly keep the old model.
    expect(ASSUMED_WINDOW.vaping.note).toMatch(/first real entry|contradict/i);
    expect(ASSUMED_WINDOW.vaping.from).toBe('17:30');
  });
});

/**
 * The Coaches tab's two sentences.
 *
 * The second one makes a claim about what the person said — "which you
 * ranked first" — so the tests are mostly about not making that claim
 * wrongly, and about the house rules: counted, never graded, and silent
 * when there is nothing to observe.
 */

import { PATH_ORDER, PATHS, type PathId } from '@/features/paths/definitions';
import { coachNames, coachStates, hubHeadline, hubUnmetLine } from '@/features/paths/hub';
import type { LifeArea } from '@/types/domain';

/** A started-coaches map shaped like the store's, with only what matters. */
const started = (...ids: PathId[]): Partial<Record<PathId, unknown>> =>
  Object.fromEntries(ids.map((id) => [id, { startedAt: '2026-08-01', answers: {}, goalId: 'g' }]));

const ALEX: LifeArea[] = ['health', 'work', 'growth'];

describe('which coaches are running', () => {
  it('splits started from never started, in definition order', () => {
    const s = coachStates(started('recovery', 'training'), ALEX);
    expect(s.running).toEqual(['training', 'recovery']);
    expect(s.idle).toEqual(['nutrition', 'money', 'work', 'relationship', 'family']);
  });

  it('counts nothing as running on a fresh account', () => {
    const s = coachStates({}, ALEX);
    expect(s.running).toEqual([]);
    expect(s.idle).toEqual(PATH_ORDER);
  });

  it('treats an explicitly undefined entry as not running', () => {
    // Partial records can carry the key with no value; `in` would lie here.
    const s = coachStates({ training: undefined }, ALEX);
    expect(s.running).toEqual([]);
  });
});

describe('the unmet priority', () => {
  it('names the idle coaches of the best-ranked priority', () => {
    // Alex: health first, and the habits coach is the only one running.
    const s = coachStates(started('recovery'), ALEX);
    expect(s.unmet).toEqual(['training', 'nutrition']);
    expect(s.unmetRank).toBe(1);
    expect(hubUnmetLine(s)).toBe(
      'Training and Nutrition work on health, which you ranked first.',
    );
  });

  it('moves down the ranking once an area is fully covered', () => {
    const s = coachStates(started('training', 'nutrition', 'recovery'), ALEX);
    // Health is done; work is next and its coach is idle.
    expect(s.unmetRank).toBe(2);
    expect(hubUnmetLine(s)).toBe(
      'Work & leadership works on work, which you ranked second.',
    );
  });

  it('says nothing once every ranked area is fully covered', () => {
    // Fully, not partly: an area counts as unmet while ANY of its coaches
    // is idle, which is deliberate — health has three and running one of
    // them does not make "Nutrition works on health" untrue.
    const s = coachStates(started('training', 'nutrition', 'recovery', 'work'), ['health', 'work']);
    expect(s.unmet).toEqual([]);
    expect(s.unmetRank).toBeNull();
    expect(hubUnmetLine(s)).toBeNull();
  });

  it('still speaks when an area is only partly covered', () => {
    const s = coachStates(started('training', 'work'), ['health', 'work']);
    expect(s.unmet).toEqual(['nutrition', 'recovery']);
    expect(s.unmetRank).toBe(1);
  });

  it('says nothing when the person ranked nothing', () => {
    expect(hubUnmetLine(coachStates(started('recovery'), []))).toBeNull();
    expect(hubUnmetLine(coachStates(started('recovery'), null))).toBeNull();
  });

  it('ignores priorities no coach works in', () => {
    // 'growth' and 'enjoyment' have no pathway. Ranking them must not
    // produce a sentence about a coach that does not exist.
    const s = coachStates(started('training', 'nutrition', 'recovery'), ['growth', 'health']);
    expect(s.unmet).toEqual([]);
    expect(hubUnmetLine(s)).toBeNull();
  });

  it('uses the order the person gave, not the definition order', () => {
    const s = coachStates(started(), ['work', 'health']);
    expect(s.unmet).toEqual(['work']);
    expect(s.unmetRank).toBe(1);
  });
});

describe('the headline', () => {
  it('names one running coach and counts the rest', () => {
    expect(hubHeadline(coachStates(started('recovery'), ALEX))).toBe(
      'Habits & urges is running. The other six are not.',
    );
  });

  it('names two or three, with the right verb', () => {
    expect(hubHeadline(coachStates(started('training', 'recovery'), ALEX))).toBe(
      'Training and Habits & urges are running. The other five are not.',
    );
    expect(hubHeadline(coachStates(started('training', 'nutrition', 'recovery'), ALEX))).toBe(
      'Training, Nutrition and Habits & urges are running. The other four are not.',
    );
  });

  it('flips to naming the idle ones once most are running', () => {
    const s = coachStates(started('training', 'nutrition', 'money', 'work', 'recovery'), ALEX);
    expect(hubHeadline(s)).toBe(
      '5 of seven running — Relationship and Family & adventure are not.',
    );
  });

  it('uses the singular when exactly one is left', () => {
    const ids = PATH_ORDER.filter((p) => p !== 'family');
    expect(hubHeadline(coachStates(started(...ids), ALEX))).toBe(
      '6 of seven running — Family & adventure is not.',
    );
  });

  it('is never silent at either end', () => {
    expect(hubHeadline(coachStates({}, ALEX))).toBe('None of the seven are running yet.');
    expect(hubHeadline(coachStates(started(...PATH_ORDER), ALEX))).toBe('All seven are running.');
  });
});

describe('coachNames', () => {
  it('joins with a comma and a final and', () => {
    expect(coachNames(['training'])).toBe('Training');
    expect(coachNames(['training', 'nutrition'])).toBe('Training and Nutrition');
    expect(coachNames(['training', 'nutrition', 'money'])).toBe('Training, Nutrition and Money');
  });

  it('is empty for nothing rather than throwing', () => {
    expect(coachNames([])).toBe('');
  });

  it('uses the coach titles the rest of the app shows', () => {
    // A hand-written name here would drift from PATHS the first time one
    // is renamed, and the sentence claims to be about the same coach.
    expect(coachNames(['recovery'])).toBe(PATHS.recovery.title);
  });
});

describe('the house rules', () => {
  /** Every sentence this module can produce, across the whole state space. */
  const everySentence = (): string[] => {
    const out: string[] = [];
    const priorityShapes: (LifeArea[] | null)[] = [
      ALEX,
      ['work', 'family'],
      ['relationship'],
      ['growth', 'enjoyment'],
      [],
      null,
    ];
    // Every subset of the seven coaches is 128 cases — cheap, and it means
    // no phrasing branch goes unexercised.
    for (let mask = 0; mask < 1 << PATH_ORDER.length; mask += 1) {
      const ids = PATH_ORDER.filter((_, i) => mask & (1 << i));
      for (const priorities of priorityShapes) {
        const s = coachStates(started(...ids), priorities);
        out.push(hubHeadline(s));
        const unmet = hubUnmetLine(s);
        if (unmet) out.push(unmet);
      }
    }
    return out;
  };

  it('never scolds, scores or counts a streak', () => {
    // No percentage, no grade, no second-person accusation, no "still" or
    // "again" — the tab reports a state, it does not mark the person.
    const banned = /%|score|streak|failed|behind|only|again|still|should|weeks? wasted/i;
    for (const line of everySentence()) {
      expect(line).not.toMatch(banned);
    }
  });

  it('never leaves a gap or a stray undefined in a sentence', () => {
    for (const line of everySentence()) {
      expect(line).not.toMatch(/undefined|null|NaN|\s{2,}|\s\./);
      expect(line.trim()).toBe(line);
      expect(line).not.toBe('');
    }
  });

  it('always ends in a full stop', () => {
    for (const line of everySentence()) {
      expect(line.endsWith('.')).toBe(true);
    }
  });
});

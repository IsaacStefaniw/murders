import { COACH_VOICES, coachLine, voiceFor } from '@/features/coaches/voices';
import { PATH_ORDER, PATHS } from '@/features/paths/definitions';
import { dayResult } from '@/features/review/dayReview';
import { weekGrid } from '@/features/review/weekReview';
import { CONNECTION_AREAS } from '@/features/review/weeklyChanges';
import type { DailyPlan, PlanItem } from '@/types/domain';

/**
 * The seven coaches, as people.
 *
 * These tests are about character rather than logic, and that is the
 * point: the failure mode here is not a crash, it is seven entries
 * drifting back into feature copy until they are configuration screens
 * wearing the word coach again.
 */

describe('every path has a coach', () => {
  it('covers all seven, with nobody left as a title', () => {
    for (const id of PATH_ORDER) {
      expect(COACH_VOICES[id]).toBeDefined();
      expect(voiceFor(id)).toBe(COACH_VOICES[id]);
    }
    expect(Object.keys(COACH_VOICES).sort()).toEqual(Object.keys(PATHS).sort());
  });

  it('gives each one a name nobody else has', () => {
    const names = PATH_ORDER.map((id) => COACH_VOICES[id].name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('the refusal', () => {
  /**
   * The line that makes a coach trustworthy is the one about what it will
   * not do to get what it wants. A refusal phrased as a feature ("I focus
   * on strength") is not a refusal, so it has to be a negative and it has
   * to be in the first person.
   */
  it('is first person and is actually a refusal', () => {
    for (const id of PATH_ORDER) {
      const { refusal, name } = COACH_VOICES[id];
      expect(`${name}: ${refusal}`).toMatch(/I will never/);
      expect(refusal.endsWith('.')).toBe(true);
    }
  });

  it('is different for every coach', () => {
    const refusals = PATH_ORDER.map((id) => COACH_VOICES[id].refusal);
    expect(new Set(refusals).size).toBe(refusals.length);
  });

  /**
   * Two refusals name things the code already guarantees. If either
   * mechanism is ever removed, the coach becomes a liar — so they are
   * pinned here, where the removal will be noticed.
   */
  it('is kept by the code, not just written in it', () => {
    // Sol keeps no streak, so neither review may compute or report one —
    // and neither may quietly hand back a percentage instead.
    expect(COACH_VOICES.recovery.refusal).toMatch(/never keep a streak/);
    const item = (over: Partial<PlanItem>): PlanItem =>
      ({
        id: `pi-${over.start}`,
        date: '2026-09-14',
        start: '07:00',
        end: '07:45',
        title: 'Strength',
        area: 'health',
        tier: 'should',
        status: 'completed',
        fixed: false,
        ...over,
      }) as PlanItem;
    const plans: Record<string, DailyPlan> = {
      '2026-09-14': { date: '2026-09-14', items: [item({}), item({ start: '10:00' })] } as DailyPlan,
    };
    const day = dayResult(plans, '2026-09-14');
    const week = weekGrid(plans, '2026-09-14', '2026-09-20');
    for (const result of [day, week]) {
      expect(Object.keys(result).join(' ')).not.toMatch(/streak|rate|percent|score/i);
    }
    expect(day.line).not.toMatch(/%|streak/i);
    expect(week.line).not.toMatch(/%|streak/i);

    // Bo will not move the family down the list, and the pruner will not
    // rest the last routine holding up a connection area.
    expect(COACH_VOICES.family.refusal).toMatch(/never move your family down the list/);
    expect(CONNECTION_AREAS.has('family')).toBe(true);
  });
});

describe('the other four lines', () => {
  it('opens by saying who it is', () => {
    for (const id of PATH_ORDER) {
      const { name, opener } = COACH_VOICES[id];
      expect(opener).toContain(name);
    }
  });

  it('asks for exactly one thing, not a list', () => {
    for (const id of PATH_ORDER) {
      // A semicolon or a bulleted-sounding "and also" is a list wearing a
      // sentence. One ask is the whole rule.
      expect(COACH_VOICES[id].ask).not.toMatch(/;|\band also\b/);
      expect(COACH_VOICES[id].ask.length).toBeLessThan(160);
    }
  });

  it('never refers to a coach as he or she', () => {
    // A person reading this should be able to hear whoever they want.
    for (const id of PATH_ORDER) {
      const v = COACH_VOICES[id];
      const all = [v.opener, v.promise, v.ask, v.refusal, v.discipline].join(' ');
      expect(all).not.toMatch(/\b(he|she|him|her|his|hers)\b/i);
    }
  });
});

describe('the one-liner for a list', () => {
  it('leads with the name and says what they know', () => {
    expect(coachLine('training')).toBe('Ren · strength and conditioning');
    for (const id of PATH_ORDER) {
      expect(coachLine(id)).toBe(`${COACH_VOICES[id].name} · ${COACH_VOICES[id].discipline}`);
    }
  });

  /**
   * Deliberately not the promise. Seven promises side by side is a feature
   * matrix, and nobody chooses a person from one.
   */
  it('is not the promise', () => {
    for (const id of PATH_ORDER) {
      expect(coachLine(id)).not.toContain(COACH_VOICES[id].promise);
    }
  });
});

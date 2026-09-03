/**
 * The pathway ladder.
 *
 * These lock the four properties the 7,000-profile audit was run to
 * establish (docs/PATHWAY_HONING_BRIEF.md). Each one was FALSE before the
 * ladder existed, so each is a regression test for a defect that shipped.
 */

import { PATHS } from '@/features/paths/definitions';
import type { Weekday } from '@/types/domain';
import { LEVEL_BLURB, LEVEL_ORDER } from '@/features/paths/level';
import { fitLadderToBudget, ladderFor, rungFor } from '@/features/paths/programme';
import { PATH_IDS, answersFor, makeProfile, sameShape, shapeOf } from '@/features/sim/pathways';

const profileOf = (i: number) => makeProfile(i).profile;
const fixedRng = (v: number) => () => v;

describe('every pathway is a real ladder', () => {
  it.each(PATH_IDS)('%s builds differently at all four levels', (path) => {
    const profile = profileOf(11);
    const answers = answersFor(path, fixedRng(0.4));
    const shapes = LEVEL_ORDER.map((level) => shapeOf(PATHS[path].build({ ...answers, level }, profile)));
    for (let i = 1; i < shapes.length; i += 1) {
      expect(sameShape(shapes[i], shapes[i - 1])).toBe(false);
    }
  });

  it.each(PATH_IDS)('%s is additive — a higher rung never drops a lower rung’s work', (path) => {
    const profile = profileOf(12);
    const goalId = 'g-test';
    for (let i = 1; i < LEVEL_ORDER.length; i += 1) {
      const lower = ladderFor(path, LEVEL_ORDER[i - 1], profile, goalId);
      const higher = ladderFor(path, LEVEL_ORDER[i], profile, goalId);
      const higherTitles = new Set(higher.routines.map((r) => r.title));
      for (const r of lower.routines) expect(higherTitles.has(r.title)).toBe(true);
    }
  });

  /**
   * Every rung has to change something. It does NOT have to change the
   * calendar.
   *
   * This assertion used to demand a routine from every rung, on the
   * reasoning that a rung adding nothing cannot keep the promise in its
   * blurb. That reasoning is right about the promise and wrong about the
   * remedy, and enforcing it is what caused three separate defects: to
   * satisfy "every rung adds a routine", a monthly money hour, a quarterly
   * allocation review and a seasonal relationship review were each written
   * as a weekly block. A monthly review scheduled fifty-two times a year
   * is not a monthly review, and the person is the one left to notice.
   *
   * So a rung must add a routine OR a milestone, and a pathway must add
   * real routines somewhere across its four levels. What it may no longer
   * do is invent a weekly block to fill a slot.
   */
  it.each(PATH_IDS)('%s gives every rung a milestone and a reason', (path) => {
    let routinesAcrossLadder = 0;
    for (const level of LEVEL_ORDER) {
      const rung = rungFor(path, level);
      expect(rung.milestones.length).toBeGreaterThan(0);
      expect(rung.note.length).toBeGreaterThan(20);
      expect(LEVEL_BLURB[path][level].length).toBeGreaterThan(0);
      expect(rung.routines.length + rung.milestones.length).toBeGreaterThan(0);
      routinesAcrossLadder += rung.routines.length;
    }
    // A ladder made entirely of milestones would be a checklist, not a
    // programme.
    expect(routinesAcrossLadder).toBeGreaterThan(0);
  });
});

describe('every pathway produces something usable', () => {
  it.each(PATH_IDS)('%s always returns routines and milestones', (path) => {
    for (let i = 0; i < 60; i += 1) {
      const profile = profileOf(i);
      const answers = { ...answersFor(path, fixedRng((i % 9) / 10)), level: LEVEL_ORDER[i % 4] };
      const build = PATHS[path].build(answers, profile);
      expect(build.routines.length).toBeGreaterThan(0);
      expect((build.goal.milestones ?? []).length).toBeGreaterThan(0);
    }
  });

  it.each(PATH_IDS)('%s never prescribes the same practice twice', (path) => {
    for (let i = 0; i < 40; i += 1) {
      const titles = PATHS[path]
        .build({ ...answersFor(path, fixedRng((i % 7) / 8)), level: 'advanced' }, profileOf(i))
        .routines.map((r) => r.title);
      expect(new Set(titles).size).toBe(titles.length);
    }
  });
});

describe('every intake question changes the programme', () => {
  // The intake screen says so on its face: "Every question here changes the
  // program — that's why they're asked." Eight of twenty-one did not.
  it.each(PATH_IDS)('%s has no dead questions', (path) => {
    const def = PATHS[path];
    for (const q of def.questions) {
      // Live means "moves the build for SOMEBODY", not for everybody. A
      // question can be conditionally relevant — a training limiter only
      // bites at some experience levels — and demanding it move every
      // profile would push the code toward answering questions it should
      // be ignoring. This mirrors how the 7,000-profile audit measures it.
      let moved = false;
      for (let i = 0; i < 25 && !moved; i += 1) {
        const profile = profileOf(100 + i);
        const base: Record<string, string> = {
          ...answersFor(path, fixedRng((i % 9) / 10)),
          level: 'established',
        };
        const baseShape = shapeOf(def.build(base, profile));
        moved = q.options.some((opt) => {
          if (opt.value === base[q.key]) return false;
          return !sameShape(shapeOf(def.build({ ...base, [q.key]: opt.value }, profile)), baseShape);
        });
      }
      expect(`${path}.${q.key} moves the build: ${moved}`).toBe(`${path}.${q.key} moves the build: true`);
    }
  });
});

describe('the ladder allowance', () => {
  it('drops optional work before required work', () => {
    const heavy = Array.from({ length: 8 }, (_, i) => ({
      id: `r${i}`,
      title: `Optional ${i}`,
      area: 'health' as const,
      days: [1] as const,
      durationMin: 60,
      preferredStart: '07:00',
      preferredEnd: '09:00',
      energy: 'morning' as const,
      flexible: true,
      protected: false,
      tier: i < 2 ? ('should' as const) : ('could' as const),
      active: true,
    })).map((r) => ({ ...r, days: [...r.days] }));

    const fitted = fitLadderToBudget(heavy, 'foundation');
    // Both required blocks survive; the optional ones give way.
    expect(fitted.filter((r) => r.tier === 'should')).toHaveLength(2);
    expect(fitted.length).toBeLessThan(heavy.length);
  });

  it('never counts re-labelled time against the budget', () => {
    // A device-free family meal is dinner eaten differently, not three
    // extra hours a week, and charging the budget for it would cut
    // something genuinely additive to make room for time nobody gets back.
    const meal = {
      id: 'r-meal',
      title: 'The device-free family meal',
      area: 'family' as const,
      days: [1, 2, 3, 4, 5] as Weekday[],
      durationMin: 40,
      preferredStart: '18:00',
      preferredEnd: '19:30',
      energy: 'evening' as const,
      flexible: true,
      protected: false,
      protocolId: 'device-free-meal',
      tier: 'could' as const,
      active: true,
    };
    expect(fitLadderToBudget([meal], 'foundation')).toHaveLength(1);
  });
});

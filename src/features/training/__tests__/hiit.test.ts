/**
 * "I think HIIT should be planned but then also selectable or changeable.
 * Have different HIIT options as well."
 *
 * These pin the library's shape and the two gates on it: all-out protocols
 * need a base behind them, and nothing at all is offered where a
 * constraint vetoes hard intervals.
 */

import {
  HIIT_SESSIONS,
  defaultHiit,
  hiitById,
  hiitOptions,
  whyNoIntervals,
} from '@/features/training/hiit';
import { buildProgramme, type TrainingInputs } from '@/features/training/programme';

describe('the library', () => {
  it('offers real variety rather than one shape renamed', () => {
    expect(HIIT_SESSIONS.length).toBeGreaterThanOrEqual(6);
    const shapes = new Set(HIIT_SESSIONS.map((s) => `${s.workSec}/${s.restSec}/${s.rounds}`));
    expect(shapes.size).toBe(HIIT_SESSIONS.length);
  });

  it('describes effort in what a person can feel, never as a heart rate', () => {
    // A percentage of max heart rate needs a measured max almost nobody
    // has. A number that precise about a number that rough is a lie with
    // decimal places.
    for (const s of HIIT_SESSIONS) {
      expect(s.effort).not.toMatch(/% of (your )?(max|maximum|peak)/i);
      expect(s.effort).not.toMatch(/\bbpm\b|heart rate|zone \d/i);
    }
  });

  it('says where each one comes from and what it costs in time', () => {
    for (const s of HIIT_SESSIONS) {
      expect(s.origin.length).toBeGreaterThan(60);
      expect(s.watchFor.length).toBeGreaterThan(20);
      expect(s.totalMin).toBeGreaterThan(0);
      expect(s.modes.length).toBeGreaterThan(0);
    }
  });

  it('keeps Tabata in its real form', () => {
    // Everything sold as "Tabata" bears no relation to the 1996 protocol.
    // It is here as what it actually was, on a bike or a rower, or not at all.
    const tabata = hiitById('tabata')!;
    expect(tabata.workSec).toBe(20);
    expect(tabata.restSec).toBe(10);
    expect(tabata.rounds).toBe(8);
    expect(tabata.demand).toBe('allOut');
    expect(tabata.modes).toEqual(['bike', 'row']);
    expect(tabata.origin).toMatch(/1996/);
  });

  it('keeps the four-by-four to the published shape', () => {
    const s = hiitById('four-by-four')!;
    expect(s.workSec).toBe(240);
    expect(s.restSec).toBe(180);
    expect(s.rounds).toBe(4);
  });
});

describe('what gets offered', () => {
  it('withholds the all-out protocols until there is a base', () => {
    const noBase = hiitOptions(undefined, { hasBase: false }).map((s) => s.id);
    expect(noBase).not.toContain('tabata');
    expect(noBase).not.toContain('sprint-intervals');
    expect(noBase).toContain('four-by-four');

    const withBase = hiitOptions(undefined, { hasBase: true }).map((s) => s.id);
    expect(withBase).toContain('tabata');
  });

  it('offers nothing at all beside a heart condition, pregnancy or injury', () => {
    // A veto rather than a scaling — the answer there is easy pace, and
    // showing a shorter list would read as merely fewer options.
    expect(hiitOptions(['heart'], { hasBase: true })).toEqual([]);
    expect(hiitOptions(['pregnancy'], { hasBase: true })).toEqual([]);
    expect(hiitOptions(['recovering'], { hasBase: true })).toEqual([]);
    expect(whyNoIntervals(['heart'])).toMatch(/doctor/i);
    expect(whyNoIntervals(undefined)).toBeNull();
  });

  it('offers only low-impact shapes where joints are the issue', () => {
    const options = hiitOptions(['joints'], { hasBase: true });
    expect(options.length).toBeGreaterThan(0);
    for (const s of options) expect(s.modes).toContain('lowImpact');
    expect(options.map((s) => s.id)).not.toContain('hill-repeats');
  });

  it('does not offer a session longer than the time there is', () => {
    const options = hiitOptions(undefined, { minutesAvailable: 30 });
    for (const s of options) expect(s.totalMin).toBeLessThanOrEqual(30);
    expect(options.map((s) => s.id)).not.toContain('four-by-four');
    expect(options.map((s) => s.id)).toContain('ten-by-one');
  });
});

describe('the one planned by default', () => {
  it('is the four-by-four where it fits, because it has the most behind it', () => {
    expect(defaultHiit(undefined)?.id).toBe('four-by-four');
  });

  it('falls back to a shorter one when the day is shorter', () => {
    expect(defaultHiit(undefined, { minutesAvailable: 30 })?.id).toBe('ten-by-one');
    // Play with the pace is the elastic one — no rounds to finish — so it
    // is what is left when nothing structured fits the window.
    expect(defaultHiit(undefined, { minutesAvailable: 20 })?.id).toBe('fartlek');
  });

  it('offers nothing when the window is too short for any of them', () => {
    // Distinguishable from the veto: hiitOptions is empty either way, but
    // whyNoIntervals is silent here, so the caller can say "not in fifteen
    // minutes" rather than implying a medical reason.
    expect(hiitOptions(undefined, { minutesAvailable: 15 })).toEqual([]);
    expect(whyNoIntervals(undefined)).toBeNull();
  });

  it('never defaults to an all-out protocol', () => {
    const chosen = defaultHiit(undefined, { hasBase: true });
    expect(chosen?.demand).not.toBe('allOut');
  });

  it('is nothing where intervals are vetoed', () => {
    expect(defaultHiit(['heart'], { hasBase: true })).toBeNull();
  });
});

/* ── The choice actually reaching the block ───────────────────────────── */

describe('a chosen session in the built block', () => {
  const base: TrainingInputs = {
    goal: 'fitter',
    experience: 'consistent',
    daysAvailable: 4,
    sessionMin: 60,
    equipment: 'gym',
  };

  const conditioning = (inputs: TrainingInputs, week = 1) =>
    buildProgramme(inputs).weeks[week - 1].sessions.find((s) => s.title === 'Conditioning')!;

  it('builds the block\u2019s own default when nothing was chosen', () => {
    const session = conditioning(base);
    expect(session.exercises.some((e) => e.name === 'Cardio: hard intervals')).toBe(true);
  });

  it('builds the chosen one instead', () => {
    const session = conditioning({ ...base, hiitId: 'thirty-thirty' });
    const work = session.exercises.find((e) => e.name.includes('thirty on'))!;
    expect(work).toBeTruthy();
    expect(work.sets).toBe(12);
    expect(work.reps).toMatch(/30 seconds hard/);
  });

  it('adds a round in the peak week, like the lifting days do', () => {
    const peak = conditioning({ ...base, hiitId: 'four-by-four' }, 3);
    expect(peak.exercises.find((e) => e.name.includes('four by four'))!.sets).toBe(5);
  });

  it('lets the deload week win over the choice', () => {
    // Week four is the one built to let everything catch up. A preference
    // is not a reason to run hard intervals through it.
    const deload = conditioning({ ...base, hiitId: 'tabata' }, 4);
    expect(deload.exercises.every((e) => !e.name.includes('tabata'))).toBe(true);
    expect(deload.exercises[0].name).toMatch(/easy pace/);
  });

  it('lets a constraint veto win over the choice', () => {
    // A preference does not outrank rulesOutHardIntervals.
    const session = conditioning({ ...base, hiitId: 'tabata', constraints: ['heart'] });
    expect(session.exercises.every((e) => !e.name.includes('tabata'))).toBe(true);
    expect(session.note).toMatch(/Easy pace only/);
  });

  it('ignores an id that is not in the library', () => {
    const session = conditioning({ ...base, hiitId: 'made-up' });
    expect(session.exercises.some((e) => e.name === 'Cardio: hard intervals')).toBe(true);
  });
});

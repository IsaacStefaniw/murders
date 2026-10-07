/**
 * The sentence that replaced the numeral.
 *
 * Isaac, after using build 21: **"These scores are meaningless."** He was
 * reading *Physical activity 60 · Nicotine 50 · Sleep (no data) · BMI 70*.
 * `docs/NEXT_SESSION.md` §1 — the headline verdict above every other
 * defect in that document — asks for the sentence that replaces the
 * numeral, and rules out adding another footnote under it.
 *
 * So these tests are about whether the sentence is a message: does it name
 * where the person is AND the thing that would move them.
 */

import { nextActivityStep, standingFor } from '@/features/health/standing';
import { BMI_UNDERWEIGHT } from '@/features/health/conditioning';

describe('the exact rows Isaac called meaningless', () => {
  it('turns "Nicotine 50" into something a person can act on', () => {
    // 50 is `quit1to5y` on the published table.
    expect(standingFor({ key: 'nicotine', nicotine: 'quit1to5y' })).toBe(
      'Halfway back. Five years clear is the next step up, and it arrives by waiting.',
    );
  });

  it('turns "Physical activity 60" into the gap that closes it', () => {
    // 60 is 60–89 minutes a week.
    const said = standingFor({ key: 'activity', minutes: 70 })!;
    expect(said).toBe('The next step up the table is 90 minutes a week — 20 more than this.');
  });

  it('turns "BMI 70" into the cut point it sits against', () => {
    // 70 is 25 ≤ BMI < 30.
    expect(standingFor({ key: 'bmi', bmi: 27.4 })).toBe(
      'The nearest cut point on the table is 25, and this is 27.4.',
    );
  });
});

describe('activity', () => {
  it('says the table stops paying, rather than inventing a target above it', () => {
    expect(standingFor({ key: 'activity', minutes: 250 })).toMatch(/stops paying above 150/);
    expect(nextActivityStep(250)).toBeNull();
  });

  it('walks the table’s own steps, not round numbers', () => {
    expect(nextActivityStep(0)).toBe(1);
    expect(nextActivityStep(20)).toBe(30);
    expect(nextActivityStep(100)).toBe(120);
    expect(nextActivityStep(149)).toBe(150);
  });
});

describe('nicotine', () => {
  it('has something true to say at every rung', () => {
    for (const status of ['never', 'quit5y', 'quit1to5y', 'inhaledNicotine', 'smokesNow'] as const) {
      const said = standingFor({ key: 'nicotine', nicotine: status })!;
      expect(said.length).toBeGreaterThan(20);
      expect(said.endsWith('.')).toBe(true);
    }
  });

  it('does not offer a step that nobody can take', () => {
    // Never-having-used-it is above quit-5-years and is not reachable.
    expect(standingFor({ key: 'nicotine', nicotine: 'quit5y' })).toMatch(
      /not a step anybody can take/,
    );
  });

  it('says the vaping band is a status, not a count', () => {
    expect(standingFor({ key: 'nicotine', nicotine: 'inhaledNicotine' })).toMatch(
      /twice a week or twenty times/,
    );
  });
});

describe('sleep', () => {
  it('names the window and places the person inside it', () => {
    expect(standingFor({ key: 'sleep', sleepHours: 7.6 })).toMatch(/full marks, and this is inside/);
  });

  it('says the window has an upper end, which is the surprising half', () => {
    expect(standingFor({ key: 'sleep', sleepHours: 9.5 })).toMatch(/upper end/);
  });

  it('gives the shortfall in minutes a night, not in score points', () => {
    expect(standingFor({ key: 'sleep', sleepHours: 6.5 })).toBe(
      'Full marks starts at seven hours. This is 30 minutes a night short of it.',
    );
  });
});

describe('body mass index', () => {
  it('handles the underweight end from the same constant the scorer uses', () => {
    expect(standingFor({ key: 'bmi', bmi: BMI_UNDERWEIGHT - 0.1 })).toMatch(
      new RegExp(`starts at ${BMI_UNDERWEIGHT}`),
    );
  });

  it('says you are inside the band rather than scoring you within it', () => {
    expect(standingFor({ key: 'bmi', bmi: 22 })).toMatch(/healthy band, which runs to 25/);
  });
});

describe('the blood components', () => {
  it('names the top band for each', () => {
    expect(standingFor({ key: 'bloodPressure', systolic: 118, diastolic: 76 })).toMatch(
      /under 120 over 80/,
    );
    expect(standingFor({ key: 'lipids', nonHdlMmol: 3.0 })).toMatch(/under 3.4/);
    expect(standingFor({ key: 'glucose', hba1cPct: 5.2 })).toMatch(/under 5.7%/);
  });

  it('names the next step up, where there is one', () => {
    expect(standingFor({ key: 'bloodPressure', systolic: 145, diastolic: 92 })).toMatch(
      /Under 140 over 90 is the next step up/,
    );
  });

  /**
   * The medication deduction is in the published table and is the first
   * thing an app is tempted to quietly drop, because it makes the number
   * worse for the people doing the right thing about it.
   */
  it('owns the treatment deduction rather than hiding it', () => {
    expect(
      standingFor({ key: 'bloodPressure', systolic: 118, diastolic: 76, bpMedication: true }),
    ).toMatch(/deducts 20 points/);
    expect(standingFor({ key: 'lipids', nonHdlMmol: 3.0, lipidMedication: true })).toMatch(
      /Less 20/,
    );
  });

  it('branches glucose on the diagnosis, as the table does', () => {
    expect(standingFor({ key: 'glucose', hba1cPct: 6.4, diabetes: true })).toMatch(/under 7%/);
  });
});

describe('what it refuses to say', () => {
  const everySentence = (): string[] => {
    const out: (string | null)[] = [
      ...[0, 20, 70, 100, 140, 150, 400].map((m) => standingFor({ key: 'activity', minutes: m })),
      ...(['never', 'quit5y', 'quit1to5y', 'inhaledNicotine', 'smokesNow'] as const).map((n) =>
        standingFor({ key: 'nicotine', nicotine: n }),
      ),
      ...[3, 4.5, 5.5, 6.5, 7.5, 9.5, 11].map((h) => standingFor({ key: 'sleep', sleepHours: h })),
      ...[17, 22, 27, 32, 37, 45].map((b) => standingFor({ key: 'bmi', bmi: b })),
      standingFor({ key: 'bloodPressure', systolic: 118, diastolic: 76 }),
      standingFor({ key: 'bloodPressure', systolic: 165, diastolic: 105 }),
      standingFor({ key: 'lipids', nonHdlMmol: 5.2 }),
      standingFor({ key: 'glucose', hba1cPct: 6.1 }),
    ];
    return out.filter((x): x is string => x !== null);
  };

  it('never grades the person, only places them on a table', () => {
    // "Good" and "poor" are judgements of a person. A rung on a published
    // table is information. The house rules forbid the first.
    const banned = /\b(good|bad|poor|excellent|well done|great|worrying|concerning|should|must)\b/i;
    for (const line of everySentence()) {
      expect(line).not.toMatch(banned);
    }
  });

  it('never prints a score out of a hundred, which is the whole point', () => {
    for (const line of everySentence()) {
      expect(line).not.toMatch(/out of 100|\bscore\b|\bpoints\b(?! for being on treatment)/i);
    }
  });

  it('is a whole sentence every time, with nothing missing from it', () => {
    for (const line of everySentence()) {
      expect(line.endsWith('.')).toBe(true);
      expect(line).not.toMatch(/undefined|NaN|null|\s{2,}/);
      expect(line.trim()).toBe(line);
    }
  });
});

describe('where there is nothing measured', () => {
  it('says nothing rather than writing about an absent figure', () => {
    // A component with no reading already carries a `blocked` line saying
    // what would give it one. A second sentence about the absence is the
    // footnote problem §1 rules out, in a new place.
    expect(standingFor({ key: 'activity', minutes: null })).toBeNull();
    expect(standingFor({ key: 'nicotine', nicotine: null })).toBeNull();
    expect(standingFor({ key: 'sleep', sleepHours: null })).toBeNull();
    expect(standingFor({ key: 'bmi', bmi: null })).toBeNull();
    expect(standingFor({ key: 'bloodPressure', systolic: null, diastolic: null })).toBeNull();
    expect(standingFor({ key: 'lipids', nonHdlMmol: null })).toBeNull();
    expect(standingFor({ key: 'glucose', hba1cPct: null })).toBeNull();
  });

  it('has nothing to say about diet, which the app never scores', () => {
    // The construct wants a dietary-pattern questionnaire this app does
    // not run, so there is no table to place anybody on.
    expect(standingFor({ key: 'diet' })).toBeNull();
  });
});

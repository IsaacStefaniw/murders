import {
  BALANCE_LABEL,
  BALANCE_NOTE,
  PROTOCOLS,
  isBalance,
  justification,
  protocolById,
} from '@/features/knowledge/protocols';
import { maySuggest } from '@/features/coaches/interrupt';

/**
 * Evidence is a barometer, not the whole truth.
 *
 * Isaac: "There are things that are not plausible to study but constitute
 * a well balanced life — evidenced more holistically than specifically.
 * E.g. connection → lower stress → healthy relationship with spouse.
 * These things you can ladder up to: date nights, creating family
 * holidays, activities with family, activities with friends. This is about
 * balance. Not measurable science."
 *
 * The library had that error in its shape: one grade field and nothing
 * else, so a scale built for treatments was being applied to a marriage.
 * These tests hold the correction in place.
 */

const balance = () => PROTOCOLS.filter(isBalance);

describe('practices that are not research claims', () => {
  it('exist, and are a small honest minority rather than an escape hatch', () => {
    expect(balance().length).toBeGreaterThan(0);
    // If this ever creeps past a twentieth of the library, somebody is
    // using it to avoid grading things that could be graded.
    expect(balance().length).toBeLessThan(PROTOCOLS.length / 20);
  });

  it('each says why it belongs, in its own terms', () => {
    for (const p of balance()) {
      expect(p.balance).toBeTruthy();
      expect(p.balance!.length).toBeGreaterThan(60);
      // It may name the research in order to say the research does not
      // settle it — `what-the-break-is-for` does exactly that. What it may
      // never do is REST on evidence, because then it is not a balance
      // reason, it is a badly written evidence one.
      expect(p.balance!).not.toMatch(
        /studies show|research shows|evidence shows|shown to|proven to|associated with/i,
      );
    }
  });

  it('never claims a grade it does not have', () => {
    for (const p of balance()) {
      // The letter is still carried for the parts of the app that count
      // and sort by one; it must sit at the bottom so that even a leak
      // could not overclaim.
      expect(p.evidenceLevel >= 'D').toBe(true);
    }
  });

  it('says what it is instead of a letter, everywhere the reason is shown', () => {
    for (const p of balance()) {
      expect(justification(p)).toBe(BALANCE_LABEL);
      expect(justification(p)).not.toMatch(/\b[ABCDE]\b/);
    }
  });

  it('leaves the rest of the library graded exactly as before', () => {
    const graded = PROTOCOLS.filter((p) => !isBalance(p));
    for (const p of graded) {
      expect(justification(p)).toContain(p.evidenceLevel);
      expect(p.balance).toBeUndefined();
    }
  });

  it('has a note that refuses to dress itself up', () => {
    expect(BALANCE_NOTE).toMatch(/never will be/);
  });
});

/**
 * The gap this was really about. The family coach had eight offerable
 * practices to the health coach's hundred and thirty, and my first reading
 * — "those shelves need more graded practices" — was the wrong diagnosis.
 */
describe('what a coach may offer', () => {
  it('offers a practice on either kind of reason', () => {
    expect(maySuggest(protocolById('strength')!)).toBe(true);
    expect(maySuggest(protocolById('partner-checkin-weekly')!)).toBe(true);
  });

  it('still refuses a weak practice that IS making an evidence claim', () => {
    const weakEvidence = PROTOCOLS.find(
      (p) => !isBalance(p) && (p.evidenceLevel === 'D' || p.evidenceLevel === 'E'),
    )!;
    expect(maySuggest(weakEvidence)).toBe(false);
  });

  it('gives the family and relationship coaches something to say', () => {
    for (const area of ['family', 'relationship', 'enjoyment'] as const) {
      const offerable = PROTOCOLS.filter((p) => p.area === area && maySuggest(p));
      expect(offerable.length).toBeGreaterThan(0);
    }
  });
});

/** The rungs Isaac named, which the library did not have. */
describe('the ladder up', () => {
  it('has the night that is the two of you', () => {
    const p = protocolById('date-night')!;
    expect(p).toBeDefined();
    expect(isBalance(p)).toBe(true);
    expect(p.area).toBe('relationship');
  });

  it('has making the next family trip exist', () => {
    const p = protocolById('family-holiday-plan')!;
    expect(p).toBeDefined();
    expect(isBalance(p)).toBe(true);
    expect(p.area).toBe('family');
  });

  it('never nags about either — a missed fortnight is a fortnight', () => {
    for (const id of ['date-night', 'family-holiday-plan']) {
      expect(protocolById(id)!.neverNag).toBe(true);
    }
  });
});

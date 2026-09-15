import { protocolById, protocolsForDomain } from '@/features/knowledge/protocols';
import { CADENCE_LABEL, moneyYear, monthLabel } from '@/features/money/year';
import { PATHS } from '@/features/paths/definitions';
import type { LifeProfile } from '@/types/domain';

/**
 * Forty finance protocols, written and cited and graded, and the money
 * coach built none of them.
 *
 * `goalDomains` was read by a test and by `pillarsForDomain` — by nothing
 * that puts a practice in front of a person. And it could not have been
 * routed anyway: the intake never asked about a mortgage, a super account,
 * a HELP debt or a salary. These tests are about both halves.
 */

const TODAY = '2026-09-15';

describe('the library that was orphaned', () => {
  it('is still forty practices deep', () => {
    expect(protocolsForDomain('finance').length).toBeGreaterThanOrEqual(35);
  });

  it('now reaches somebody, rather than sitting on a shelf', () => {
    const year = moneyYear(
      { homeLoan: 'mortgage', superAccounts: 'one', helpDebt: 'yes', incomeShape: 'salary' },
      TODAY,
    );
    expect(year.length).toBeGreaterThanOrEqual(8);
    for (const e of year) expect(protocolById(e.protocolId)).toBeDefined();
  });
});

describe('the four taps', () => {
  const base = { homeLoan: 'renting', superAccounts: 'none', helpDebt: 'no', incomeShape: 'salary' };
  const ids = (over: Record<string, string>) =>
    moneyYear({ ...base, ...over }, TODAY).map((e) => e.protocolId);

  it('a mortgage brings the offset check, which nothing else does', () => {
    expect(ids({ homeLoan: 'mortgage' })).toContain('offset-is-linked');
    expect(ids({})).not.toContain('offset-is-linked');
  });

  it('super brings the July settings session and the May question', () => {
    expect(ids({ superAccounts: 'several' })).toEqual(
      expect.arrayContaining(['super-four-settings', 'super-before-june']),
    );
    expect(ids({})).not.toContain('super-four-settings');
  });

  it('a HELP debt brings the one month that changes the figure', () => {
    const withHelp = moneyYear({ ...base, helpDebt: 'yes' }, TODAY);
    const help = withHelp.find((e) => e.protocolId === 'help-debt-timing')!;
    expect(help).toBeDefined();
    // Indexed on the first of June, so it is dated to June.
    expect(monthLabel(help.dueOn)).toBe('June');
    expect(ids({})).not.toContain('help-debt-timing');
  });

  it('invoicing brings the tax and receipts jobs, and a salary does not', () => {
    expect(ids({ incomeShape: 'selfEmployed' })).toEqual(
      expect.arrayContaining(['tax-set-aside', 'receipts-as-you-go', 'pay-yourself-a-salary']),
    );
    expect(ids({ incomeShape: 'salary' })).not.toContain('tax-set-aside');
    // And a salary gets the refund question that an invoicer does not.
    expect(ids({ incomeShape: 'salary' })).toContain('refund-precommit');
    expect(ids({ incomeShape: 'selfEmployed' })).not.toContain('refund-precommit');
  });
});

describe('the dates', () => {
  it('never puts anything in the past', () => {
    for (const today of ['2026-01-05', '2026-06-30', '2026-12-31']) {
      const year = moneyYear({ superAccounts: 'one', helpDebt: 'yes', incomeShape: 'salary' }, today);
      for (const e of year) expect(e.dueOn >= today).toBe(true);
    }
  });

  it('comes back in date order', () => {
    const year = moneyYear(
      { homeLoan: 'mortgage', superAccounts: 'one', helpDebt: 'yes', incomeShape: 'variable' },
      TODAY,
    );
    const dates = year.map((e) => e.dueOn);
    expect([...dates].sort()).toEqual(dates);
  });

  it('pins the tax-year jobs to the Australian tax year', () => {
    const year = moneyYear({ superAccounts: 'one', helpDebt: 'yes', incomeShape: 'salary' }, TODAY);
    const at = (id: string) => monthLabel(year.find((e) => e.protocolId === id)!.dueOn);
    expect(at('super-four-settings')).toBe('July');
    expect(at('super-before-june')).toBe('May');
    expect(at('refund-precommit')).toBe('May');
    expect(at('help-debt-timing')).toBe('June');
  });

  it('starts the recurring ones soon rather than today', () => {
    const year = moneyYear({ homeLoan: 'mortgage' }, TODAY);
    const offset = year.find((e) => e.protocolId === 'offset-is-linked')!;
    expect(offset.dueOn > TODAY).toBe(true);
    expect(offset.cadence).toBe('quarterly');
  });
});

describe('what it says, and what it refuses to say', () => {
  const year = moneyYear(
    { homeLoan: 'mortgage', superAccounts: 'one', helpDebt: 'yes', incomeShape: 'selfEmployed', mode: 'debt' },
    TODAY,
  );

  it('names the person’s own answer back, on every entry', () => {
    for (const e of year) {
      expect(e.because.length).toBeGreaterThan(20);
      expect(CADENCE_LABEL[e.cadence]).toBeDefined();
    }
  });

  /**
   * In Australia GENERAL advice is licensed too, and "education, never
   * financial advice" is not a safe harbour. Every entry is a prompt to
   * check, decide or ask — never what to hold, how much to contribute, or
   * which product to use.
   */
  it('never tells anybody what to buy, hold or contribute', () => {
    for (const e of year) {
      const text = `${e.title} ${e.summary} ${e.because}`;
      expect(text).not.toMatch(/\b(you should (buy|hold|invest|switch|contribute)|we recommend|the best fund|put it in)\b/i);
    }
  });

  it('is empty-able, and does not pad itself out', () => {
    // Renting, salaried, no HELP, no super answer: two entries that apply
    // to everybody, and the app does not invent more.
    const thin = moneyYear(
      { homeLoan: 'renting', superAccounts: 'none', helpDebt: 'no', incomeShape: 'salary' },
      TODAY,
    );
    expect(thin.length).toBeLessThanOrEqual(4);
  });
});

describe('through the build', () => {
  const profile = { firstName: 'Isaac', createdAt: '2026-01-01T00:00:00.000Z' } as LifeProfile;

  it('puts the year on the goal as dated steps', () => {
    const plan = PATHS.money.build(
      { mode: 'saving', homeLoan: 'mortgage', superAccounts: 'one', helpDebt: 'yes', incomeShape: 'salary' },
      profile,
    );
    const dated = (plan.goal.milestones ?? []).filter((m) => m.dueDate);
    expect(dated.length).toBeGreaterThanOrEqual(6);
    expect(dated.some((m) => m.title === protocolById('offset-is-linked')!.title)).toBe(true);
    // The how comes from the protocol, so a step always says what to do.
    for (const m of dated) expect((m.how ?? '').length).toBeGreaterThan(10);
  });

  it('gives a renter on a salary a shorter year, not a padded one', () => {
    const rich = PATHS.money.build(
      { mode: 'saving', homeLoan: 'mortgage', superAccounts: 'several', helpDebt: 'yes', incomeShape: 'selfEmployed' },
      profile,
    );
    const thin = PATHS.money.build(
      { mode: 'saving', homeLoan: 'renting', superAccounts: 'none', helpDebt: 'no', incomeShape: 'salary' },
      profile,
    );
    const dated = (p: typeof rich) => (p.goal.milestones ?? []).filter((m) => m.dueDate).length;
    expect(dated(rich)).toBeGreaterThan(dated(thin));
  });
});

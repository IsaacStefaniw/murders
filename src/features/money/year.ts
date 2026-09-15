/**
 * Your money year — a dated decision list that needs no bank feed.
 *
 * ── The finding this exists for ─────────────────────────────────────────
 *
 * Forty finance protocols are written, cited and graded in this library —
 * offset linkage, super settings, HELP timing, refund pre-commitment, the
 * lot — and the money coach builds none of them. `goalDomains` is read by
 * a test and by `pillarsForDomain`, and by nothing that puts a practice in
 * front of a person. The best money content in the app was orphaned.
 *
 * It could not have been targeted anyway: the intake never asked whether
 * somebody has a mortgage, a super account, a HELP debt or a salary, so
 * there was nothing to route on. Four taps fix that, and this module is
 * what they switch on.
 *
 * ── Why a year, and why dates ───────────────────────────────────────────
 *
 * Almost none of this is weekly. A super review is a July job, HELP is
 * indexed on the first of June, a refund is decided in May before it is
 * spent in August, and checking an offset is actually linked is a
 * quarterly two minutes worth plausibly four figures. A routine with
 * `days: Weekday[]` cannot express any of that, which is most of why the
 * content sat unused: the only shelf the app had was the wrong shape.
 *
 * So it is a list with dates on it. Nothing here connects to a bank,
 * reads a balance, or needs an account — every item is a decision the
 * person makes and the app remembers the date for.
 *
 * ── The line this module does not cross ─────────────────────────────────
 *
 * Every entry is a prompt to check, decide or ask. Not one of them says
 * what to hold, how much to contribute, or which product to use. In
 * Australia general advice is licensed too, and "education, never
 * financial advice" is not a safe harbour — so the content stays on the
 * side of the line where the person, or their adviser, makes the call.
 */

import { protocolById } from '@/features/knowledge/protocols';
import { addDays } from '@/lib/dates';

export type MoneyCadence = 'once' | 'quarterly' | 'yearly';

export interface MoneyYearEntry {
  protocolId: string;
  title: string;
  /** What to do, from the protocol. */
  summary: string;
  cadence: MoneyCadence;
  /** The date this is next due. */
  dueOn: string;
  /** Why THIS person has it. Never generic — it names their own answer. */
  because: string;
}

/**
 * The Australian financial year, which is what most of this is pinned to.
 *
 * July is when a new year's settings can be changed; HELP is indexed on
 * the first of June; a refund is decided in May, before it lands.
 */
const MONTH = {
  may: 5,
  june: 6,
  july: 7,
} as const;

/** The next occurrence of a month, counted from today. Never in the past. */
function nextMonth(today: string, month: number, day = 1): string {
  const year = Number(today.slice(0, 4));
  const candidate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return candidate >= today
    ? candidate
    : `${year + 1}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Quarterly things start soon rather than today: nothing is due on signup. */
const SOON_DAYS = 7;

interface Candidate {
  id: string;
  cadence: MoneyCadence;
  /** Month 1–12 for a dated one; absent means "soon, then on its cadence". */
  month?: number;
  because: string;
  when: (answers: Record<string, string>) => boolean;
}

const has = (answers: Record<string, string>, key: string, value: string) =>
  (answers[key] ?? '').split(',').includes(value);

/**
 * Everything the year can contain, and the answer that earns each one.
 *
 * Order is the order they appear in when they fall on the same date, and
 * it is deliberate: the things that stop money leaking come before the
 * things that make it grow, and anything with a legal deadline comes
 * before anything without one.
 */
const CANDIDATES: Candidate[] = [
  {
    id: 'offset-is-linked',
    cadence: 'quarterly',
    because: 'You have a mortgage. An offset that is not actually linked is the most expensive silent mistake in Australian home lending.',
    when: (a) => a.homeLoan === 'mortgage',
  },
  {
    id: 'payday-automation',
    cadence: 'once',
    because: 'You said the transfers are manual. Everything else here is easier once one of them is not.',
    when: (a) => a.automation === 'no' || a.automation === 'partial',
  },
  {
    id: 'two-accounts-one-label',
    cadence: 'once',
    because: 'One account to spend from and one to save into, set up once, is what makes the transfer stick.',
    when: (a) => a.automation === 'no',
  },
  {
    id: 'help-debt-timing',
    cadence: 'yearly',
    month: MONTH.june,
    because: 'You have a HELP debt. It is indexed on the first of June, which makes May the only month a voluntary payment changes the figure.',
    when: (a) => a.helpDebt === 'yes',
  },
  {
    id: 'help-in-the-picture',
    cadence: 'quarterly',
    because: 'A HELP balance that never appears in the position check is a debt you have stopped seeing.',
    when: (a) => a.helpDebt === 'yes',
  },
  {
    id: 'super-four-settings',
    cadence: 'yearly',
    month: MONTH.july,
    because: 'July is when a super year starts, and the four settings are the only ones you can change without an adviser.',
    when: (a) => a.superAccounts === 'one' || a.superAccounts === 'several' || a.superAccounts === 'unsure',
  },
  {
    id: 'super-before-june',
    cadence: 'yearly',
    month: MONTH.may,
    because: 'Anything voluntary has to land before the year closes, and that is a question for your accountant rather than for this app.',
    when: (a) => a.superAccounts === 'one' || a.superAccounts === 'several',
  },
  {
    id: 'refund-precommit',
    cadence: 'yearly',
    month: MONTH.may,
    because: 'A refund decided in May goes where you meant it to. A refund decided in August is already spent.',
    when: (a) => a.incomeShape !== 'selfEmployed',
  },
  {
    id: 'tax-set-aside',
    cadence: 'quarterly',
    because: 'You work for yourself, so the tax is yours to hold back — on the day each payment lands, not at the end of the year.',
    when: (a) => a.incomeShape === 'selfEmployed',
  },
  {
    id: 'receipts-as-you-go',
    cadence: 'quarterly',
    because: 'Working for yourself, five minutes a week of photographing receipts is the difference between a deduction and a shoebox.',
    when: (a) => a.incomeShape === 'selfEmployed',
  },
  {
    id: 'pay-yourself-a-salary',
    cadence: 'once',
    because: 'Irregular income is a cashflow problem before it is a saving problem, and a steady draw is what turns one into the other.',
    when: (a) => a.incomeShape === 'selfEmployed' || a.incomeShape === 'variable',
  },
  {
    id: 'overtime-to-the-transfer',
    cadence: 'once',
    because: 'You said the income moves. A budget built on the base roster makes every extra shift a win rather than a baseline.',
    when: (a) => a.incomeShape === 'variable',
  },
  {
    id: 'bill-smoothing',
    cadence: 'once',
    because: 'One afternoon on the phone, once, and the bills stop arriving in lumps.',
    when: (a) => has(a, 'leak', 'bills') || a.homeLoan === 'mortgage',
  },
  {
    id: 'subscription-audit',
    cadence: 'quarterly',
    because: 'You said subscriptions are where it goes. They run for years on inattention.',
    when: (a) => has(a, 'leak', 'recurring'),
  },
  {
    id: 'renewal-sweep',
    cadence: 'quarterly',
    because: 'Every renewal that rolls over unexamined is a price somebody else chose for you.',
    when: () => true,
  },
  {
    id: 'net-worth-check',
    cadence: 'quarterly',
    because: 'One figure, four times a year, is the only measure here that cannot be fooled by a good month.',
    when: () => true,
  },
  {
    id: 'cover-inventory',
    cadence: 'yearly',
    month: MONTH.july,
    because: 'Insurance bought for the life you had five years ago is the cover you do not have now.',
    when: (a) => a.homeLoan === 'mortgage' || a.superAccounts === 'one' || a.superAccounts === 'several',
  },
  {
    id: 'hardship-number-known',
    cadence: 'once',
    because: 'Knowing the number before you need it is the whole point, and you never need it on a good week.',
    when: (a) => a.buffer === 'none' || a.mode === 'debt',
  },
  {
    id: 'debt-order-review',
    cadence: 'quarterly',
    because: 'You said debt is the job. One order, chosen once and finished, beats three started.',
    when: (a) => a.mode === 'debt',
  },
  {
    id: 'shared-money-agreement',
    cadence: 'yearly',
    month: MONTH.july,
    because: 'Money agreements go stale quietly, and the yearly version of the conversation is much cheaper than the other kind.',
    when: (a) => a.household === 'partner' || has(a, 'household', 'partner'),
  },
];

/**
 * The year, from what they said.
 *
 * Returns the entries in date order. An empty year is possible and honest
 * — somebody renting, on a salary, with no HELP and no super answer gets
 * the two that apply to everyone, and the app does not pad it out.
 */
export function moneyYear(
  answers: Record<string, string>,
  today: string,
): MoneyYearEntry[] {
  const entries: MoneyYearEntry[] = [];
  for (const c of CANDIDATES) {
    if (!c.when(answers)) continue;
    const protocol = protocolById(c.id);
    // A candidate naming a protocol that no longer exists is a bug, not a
    // reason to render half an entry.
    if (!protocol) continue;
    entries.push({
      protocolId: c.id,
      title: protocol.title,
      summary: protocol.summary,
      cadence: c.cadence,
      dueOn: c.month ? nextMonth(today, c.month) : addDays(today, SOON_DAYS),
      because: c.because,
    });
  }
  return entries.sort((a, b) => a.dueOn.localeCompare(b.dueOn));
}

/** How a cadence reads. "Once" says so, because it is the good news. */
export const CADENCE_LABEL: Record<MoneyCadence, string> = {
  once: 'Once, then never again',
  quarterly: 'Four times a year',
  yearly: 'Once a year',
};

/** The month a dated entry belongs to, for grouping. */
export function monthLabel(dateKey: string): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[Number(dateKey.slice(5, 7)) - 1] ?? dateKey;
}

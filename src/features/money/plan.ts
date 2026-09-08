/**
 * Money — a planning engine, not a budget app.
 *
 * Three pure pieces, all education and never financial advice:
 *
 * - `moneySteps` turns the intake answers into the person's steps, in the
 *   order the maths supports: automate first, one month banked, the
 *   expensive debt, then whatever their own answers said leaks. The
 *   pathway rungs add the later steps (three months, investing running by
 *   itself, the raise). One list, owned here, so the hub and the goal
 *   never show two.
 * - `savingsPlan` takes a target, a date and what is there now and says
 *   what a month has to be, where the current pace lands, and the dated
 *   milestones in between. This is the helper the goal planner calls when
 *   somebody types "$100k by 2029".
 * - `assessMoney` judges the one monthly number, the savings rate, by its
 *   trend rather than by a good or bad month.
 */

import { answeredValues } from '@/features/knowledge/questionBank';
import { latest, trend, type MetricObservation, type Trend } from '@/features/model/metrics';
import { addDays, dateKeyToDate, toDateKey } from '@/lib/dates';

// ── The steps, in order ─────────────────────────────────────────────────

export interface MoneyStep {
  id: string;
  title: string;
  detail: string;
  /** The person told us this is already true. Never inferred. */
  done: boolean;
}

const step = (id: string, title: string, detail: string, done = false): MoneyStep => ({
  id,
  title,
  detail,
  done,
});

/**
 * What each step means, in a sentence the hub shows under the one step
 * under the spotlight. Keyed by title because the rung milestones in
 * programme.ts share these titles and have no id of their own.
 */
const STEP_DETAIL: Record<string, string> = {
  'One transfer automated on payday':
    'Money that moves itself cannot lose an argument with a bad day. Set it for the day pay lands, even if the amount is small. Everything after this is watching, not willpower.',
  'Every recurring decision automated or deleted':
    'Finish the automation. Every transfer or bill that still needs a decision is a decision that can go wrong on a bad week.',
  'Transfers already run themselves':
    'Automation is running. The weekly check-in is now about catching drift early, not forcing behaviour.',
  'One month of expenses, banked':
    'The first month turns an emergency back into an inconvenience. Somewhere you can reach it: a savings account, or an offset account if you have a home loan. Which one suits you is a question for a licensed adviser.',
  'Three months of expenses, banked':
    'Three months is where money stress stops driving decisions, and the figure Moneysmart suggests for a buffer.',
  'List every debt with its rate':
    'Every balance, its rate and its minimum on one page. A credit card or buy-now-pay-later balance usually costs far more than any saving earns, so it comes before investing. A student loan (HELP) is different: it is indexed once a year, in June, and sits later in the order.',
  'The extra payment automated against the first debt':
    'Highest rate first costs least on paper; smallest balance first gets finished more often. Pick one order you will finish and automate the extra payment against the first debt only. If a lender is chasing, a free financial counsellor is the next step, not an app.',
  'Every account in one place':
    'One list of every account and what is in it. Clarity comes before every good money decision.',
  'The monthly number known':
    'What comes in and what goes out in a normal month, roughly. It is the number the buffer and the target are both sized from.',
  'The target and the date written down':
    'People who write a specific amount and a date save more than people who mean to. Name it below and the coach turns it into a monthly amount and dated steps.',
  'The first goal named':
    'Pick one thing: a buffer, a debt gone, a deposit. One named goal beats three vague ones.',
  'A drawdown plan written down':
    'How much comes out each year, from where, and what changes if markets fall. Writing it down is education; setting it is a licensed adviser conversation.',
  'Every subscription listed, the dead ones cancelled':
    'Recurring charges run for years on inattention. List every one and cancel what you would not sign up for again today. Check what a cancellation ends before you cancel insurance.',
  'A 72-hour wait on anything unplanned':
    'Optional spending over a limit you set goes on a list and waits three days. Buy only what still earns it.',
  'Two weeks of everyday spend written down':
    'Not a budget: a fortnight of watching where the everyday money actually goes. The number usually surprises people, and that is the point.',
  'Every bill checked against a better deal':
    'Energy, insurance, phone, internet: once a year each, compared against what a new customer pays. The government comparison sites are free.',
  'A night-out number set before going out':
    'A figure decided before the first round, in cash or on a card with nothing else on it. The evening stays fun; the morning stays honest.',
  'One month of spending looked at, once':
    'One statement, one evening, one highlighter. Not to feel bad; to know.',
  'A share of the next rise chosen before it lands':
    'Decide now what share of the next pay rise goes straight to the transfer. Committing money you do not hold yet avoids the sting of giving up money you do.',
  'The rest of the next rise sent to the transfer':
    'Some of the last rise stuck. Decide now that the next one goes to the transfer before life expands to meet it.',
  'The last rise went to the goal':
    'The raise rule is already yours. Keep it written down for the next one.',
  'A share of the first rise decided now':
    'The first rise is when lifestyle quietly expands. Decide the share before it happens and it never has to be a sacrifice.',
  'A savings rate you know':
    'The share of income kept each month. Roughly is fine; the trend over a quarter is what matters.',
  'Investing set up to run by itself':
    'Once the buffer is banked and the expensive debt is gone, the boring way works: low cost, spread wide, every month, untouched. Whether that is extra into your home loan, into super, or outside both depends on your tax rate, your age and your loan. That choice is a licensed adviser conversation. Education, never financial advice.',
  'The transfer raised a notch':
    'When the trend has held for a quarter, move the automatic transfer up one percent. Future you gets the raise.',
};

/** The sentence under a step, if the coach has one for it. */
export function stepDetail(title: string): string | undefined {
  return STEP_DETAIL[title];
}

/**
 * The person's steps from their intake answers, in order.
 *
 * Nothing is ticked unless the answer said so: "transfers run themselves"
 * ticks the transfer step because the person said it, and a saver never
 * sees a debt step at all rather than a ticked one. Titles are shared with
 * the pathway rungs in programme.ts so the two never duplicate.
 */
export function moneySteps(answers: Record<string, string>): MoneyStep[] {
  const out: MoneyStep[] = [];
  const d = (title: string) => STEP_DETAIL[title] ?? '';

  if (answers.automation === 'yes') {
    out.push(step('automate', 'Transfers already run themselves', d('Transfers already run themselves'), true));
  } else if (answers.automation === 'partial') {
    out.push(step('automate', 'Every recurring decision automated or deleted', d('Every recurring decision automated or deleted')));
  } else {
    out.push(step('automate', 'One transfer automated on payday', d('One transfer automated on payday')));
  }

  const buffer = answers.buffer;
  out.push(step('buffer-1', 'One month of expenses, banked', d('One month of expenses, banked'), buffer === 'some' || buffer === 'solid'));
  if (buffer === 'solid') {
    out.push(step('buffer-3', 'Three months of expenses, banked', d('Three months of expenses, banked'), true));
  }

  switch (answers.mode) {
    case 'debt':
      out.push(step('debt-list', 'List every debt with its rate', d('List every debt with its rate')));
      out.push(step('debt-pay', 'The extra payment automated against the first debt', d('The extra payment automated against the first debt')));
      break;
    case 'clarity':
    case 'getting_on_top':
      out.push(step('accounts', 'Every account in one place', d('Every account in one place')));
      out.push(step('monthly', 'The monthly number known', d('The monthly number known')));
      break;
    case 'saving':
      out.push(step('target', 'The target and the date written down', d('The target and the date written down')));
      break;
    case 'unsure':
      out.push(step('accounts', 'Every account in one place', d('Every account in one place')));
      out.push(step('first-goal', 'The first goal named', d('The first goal named')));
      break;
    case 'lasting':
      out.push(step('monthly', 'The monthly number known', d('The monthly number known')));
      out.push(step('drawdown', 'A drawdown plan written down', d('A drawdown plan written down')));
      break;
    default:
      break;
  }

  const LEAK: Record<string, [string, string]> = {
    recurring: ['leak-recurring', 'Every subscription listed, the dead ones cancelled'],
    impulse: ['leak-impulse', 'A 72-hour wait on anything unplanned'],
    everyday: ['leak-everyday', 'Two weeks of everyday spend written down'],
    bills: ['leak-bills', 'Every bill checked against a better deal'],
    social: ['leak-social', 'A night-out number set before going out'],
    unknown: ['leak-unknown', 'One month of spending looked at, once'],
  };
  for (const value of answeredValues(answers, 'leak')) {
    const hit = LEAK[value];
    if (hit) out.push(step(hit[0], hit[1], d(hit[1])));
  }

  switch (answers.raise) {
    case 'absorbed':
      out.push(step('raise', 'A share of the next rise chosen before it lands', d('A share of the next rise chosen before it lands')));
      break;
    case 'some':
      out.push(step('raise', 'The rest of the next rise sent to the transfer', d('The rest of the next rise sent to the transfer')));
      break;
    case 'saved':
      out.push(step('raise', 'The last rise went to the goal', d('The last rise went to the goal'), true));
      break;
    case 'notyet':
      out.push(step('raise', 'A share of the first rise decided now', d('A share of the first rise decided now')));
      break;
    default:
      break;
  }

  return out;
}

// ── The target: amount, date, and the steps between ─────────────────────

export interface SavingsPlanInput {
  /** Dollars wanted. */
  target: number;
  /** The date it is wanted by, as YYYY-MM-DD. */
  byDate: string;
  /** Dollars there now. */
  startingBalance: number;
  /** What goes in per month at the moment, if known. */
  monthlyCapacity?: number;
  /** Annual interest on the balance, as a percent. Zero when unknown. */
  ratePct?: number;
  /** A normal month's expenses, so "a month banked" can be a step. */
  monthlyExpenses?: number;
  /** Today, injectable for tests. */
  today?: string;
}

export interface SavingsMilestone {
  id: string;
  title: string;
  amount: number;
  /** When the pace used for dating gets there; null when already there or never. */
  date: string | null;
  reached: boolean;
}

export interface SavingsPlan {
  /** Whole months between today and the date, at least one. */
  monthsToDate: number;
  /** What a month has to be to land on the date. */
  monthlyNeeded: number;
  weeklyNeeded: number;
  /** Where the current pace lands, or null when nothing is going in. */
  landsOn: string | null;
  /** True when the current pace lands on or before the date; null when the pace is unknown. */
  onTrack: boolean | null;
  milestones: SavingsMilestone[];
  /** The honest one-liner: where this rate lands, and what the date needs. */
  sentence: string;
}

const round = (n: number) => Math.round(n);

/** Whole calendar months from one date key to another, floored at one. */
/**
 * Whole calendar months from one day to another, never fewer than one:
 * the number of monthly transfers between them. The goal composer counts
 * with this too, so a goal and the money hub never disagree about the same
 * money.
 */
export function monthsBetween(from: string, to: string): number {
  const a = dateKeyToDate(from);
  const b = dateKeyToDate(to);
  let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) months -= 1;
  return Math.max(1, months);
}

function addMonths(dateKey: string, months: number): string {
  const d = dateKeyToDate(dateKey);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  // Land on the same day of the month where it exists, else the last day.
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toDateKey(d);
}

/** "March 2028". */
export function formatMonth(dateKey: string): string {
  return dateKeyToDate(dateKey).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
}

/** "$100,000". */
export const dollars = (n: number): string => `$${round(n).toLocaleString('en-AU')}`;

/** Months of a monthly amount, with interest, until the balance reaches the target. Null when it never does. */
function monthsToReach(balance: number, target: number, monthly: number, monthlyRate: number): number | null {
  if (balance >= target) return 0;
  if (monthly <= 0 && (monthlyRate <= 0 || balance <= 0)) return null;
  let b = balance;
  for (let n = 1; n <= 1200; n += 1) {
    b = b * (1 + monthlyRate) + monthly;
    if (b >= target) return n;
  }
  return null;
}

/** The monthly amount that lands exactly on the target after n months. */
function monthlyFor(balance: number, target: number, n: number, monthlyRate: number): number {
  if (monthlyRate <= 0) return Math.max(0, (target - balance) / n);
  const growth = (1 + monthlyRate) ** n;
  return Math.max(0, ((target - balance * growth) * monthlyRate) / (growth - 1));
}

/**
 * A target, a date and what is there now, turned into the plan.
 *
 * The milestones come early and small first (the first thousand, the first
 * month of expenses) because that is where the evidence says a step does
 * the most, then by quarter of the way. Each is dated at the pace that
 * will actually be used: what goes in now when we know it, otherwise the
 * pace the date needs.
 */
export function savingsPlan(input: SavingsPlanInput): SavingsPlan {
  const today = input.today ?? toDateKey(new Date());
  const target = Math.max(0, input.target);
  const balance = Math.max(0, input.startingBalance);
  const monthlyRate = Math.max(0, input.ratePct ?? 0) / 1200;
  const byDate = input.byDate < today ? addDays(today, 1) : input.byDate;

  const monthsToDate = monthsBetween(today, byDate);
  // Rounded up, so that many transfers of this amount reach the target on
  // the date rather than landing a few dollars short a month later.
  const monthlyNeeded = Math.ceil(monthlyFor(balance, target, monthsToDate, monthlyRate));
  const weeklyNeeded = round((monthlyNeeded * 12) / 52);

  const capacity = input.monthlyCapacity;
  const paceKnown = capacity !== undefined && Number.isFinite(capacity);
  const pace = paceKnown ? Math.max(0, capacity) : monthlyNeeded;

  const monthsAtPace = monthsToReach(balance, target, pace, monthlyRate);
  const landsOn = monthsAtPace === null ? null : addMonths(today, monthsAtPace);
  const onTrack = !paceKnown ? null : landsOn !== null && landsOn <= byDate;

  // The rungs: first $1k, $2,000, a month of expenses, then by quarters,
  // with three-quarters so the last stretch is never the longest.
  //
  // $2,000 is not a round number somebody liked. It is the amount the ABS
  // asks households about, and the line that separates a household able to
  // absorb a bad week from one that cannot — in Australia and in two other
  // countries' data. About one in five Australian households could not
  // raise it. Reaching it is the rung that turns an emergency back into an
  // inconvenience, and it deserves to be marked.
  const rungs: { id: string; title: string; amount: number }[] = [];
  const push = (id: string, title: string, amount: number) => {
    const a = round(amount);
    if (a <= 0 || a > target) return;
    if (rungs.some((r) => Math.abs(r.amount - a) < Math.max(1, target * 0.02))) return;
    rungs.push({ id, title, amount: a });
  };
  push('first-1k', 'The first $1,000', 1000);
  push('first-2k', 'Two thousand, in reach', 2000);
  if (input.monthlyExpenses && input.monthlyExpenses > 0) {
    push('one-month', 'A month of expenses banked', input.monthlyExpenses);
  }
  push('tenth', 'A tenth of the way', target * 0.1);
  push('quarter', 'A quarter there', target * 0.25);
  push('half', 'Halfway', target * 0.5);
  push('three-quarters', 'Three quarters', target * 0.75);
  if (target > 0 && !rungs.some((r) => r.amount === round(target))) {
    rungs.push({ id: 'done', title: 'Done', amount: round(target) });
  }
  rungs.sort((a, b) => a.amount - b.amount);
  const last = rungs[rungs.length - 1];
  if (last && last.id !== 'done') last.title = 'Done';

  const milestones: SavingsMilestone[] = rungs.map((r) => {
    const reached = balance >= r.amount;
    const n = reached ? 0 : monthsToReach(balance, r.amount, pace, monthlyRate);
    return {
      id: r.id,
      title: r.title,
      amount: r.amount,
      date: reached || n === null ? null : addMonths(today, n),
      reached,
    };
  });

  let sentence: string;
  if (balance >= target) {
    sentence = `${dollars(balance)} is already past ${dollars(target)}. Done.`;
  } else if (!paceKnown) {
    sentence = `To land on ${formatMonth(byDate)} you need ${dollars(monthlyNeeded)} a month, about ${dollars(weeklyNeeded)} a week.`;
  } else if (pace <= 0 || landsOn === null) {
    sentence = `Nothing is going in yet. To land on ${formatMonth(byDate)} you need ${dollars(monthlyNeeded)} a month, about ${dollars(weeklyNeeded)} a week.`;
  } else if (onTrack) {
    sentence = `At ${dollars(pace)} a month you land on ${formatMonth(landsOn)}, ahead of ${formatMonth(byDate)}.`;
  } else {
    sentence = `At ${dollars(pace)} a month you land on ${formatMonth(landsOn)}. To land on ${formatMonth(byDate)} you need ${dollars(monthlyNeeded)} a month.`;
  }

  return { monthsToDate, monthlyNeeded, weeklyNeeded, landsOn, onTrack, milestones, sentence };
}

/**
 * What goes in per month, from the weekly check-ins: the average of the
 * last eight weeks' entries scaled to a month. Undefined until there is one.
 */
export function monthlyCapacityFrom(metrics: MetricObservation[], now: Date = new Date()): number | undefined {
  const cutoff = new Date(now.getTime() - 56 * 86400e3).toISOString();
  const recent = metrics.filter((o) => o.key === 'finance.weeklyIn' && o.at >= cutoff);
  if (recent.length === 0) return undefined;
  const perWeek = recent.reduce((n, o) => n + o.value, 0) / recent.length;
  return round((perWeek * 52) / 12);
}

// ── The monthly number: savings rate, judged by trend ───────────────────

export interface MoneyAssessment {
  verdict: 'on-track' | 'nudge' | 'need-data';
  message: string;
  rate: number | null;
  trend: Trend | null;
}

export function assessMoney(metrics: MetricObservation[]): MoneyAssessment {
  const last = latest(metrics, 'finance.savingsRate');
  const t = trend(metrics, 'finance.savingsRate', 90);

  if (!last) {
    return {
      verdict: 'need-data',
      message:
        'Optional, once a month: what share of income got kept. Roughly is fine. The trend over a quarter does the motivating, not any one month.',
      rate: null,
      trend: t,
    };
  }
  if (t?.direction === 'up' || last.value >= 15) {
    return {
      verdict: 'on-track',
      message:
        t?.direction === 'up'
          ? `Savings rate climbing ${t.from}% → ${t.to}% — the automation is doing its quiet work.`
          : `Keeping ${last.value}% — a strong rate. The check-in is now about catching drift, not forcing behaviour.`,
      rate: last.value,
      trend: t,
    };
  }
  return {
    verdict: 'nudge',
    message: `${last.value}% kept last month. No judgement — the honest move is one automated transfer a notch higher, not a stricter budget. (Education, never financial advice.)`,
    rate: last.value,
    trend: t,
  };
}

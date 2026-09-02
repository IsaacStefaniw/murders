/**
 * Money v2 — a planning engine, not a budget app.
 *
 * The whole path is an ORDERED ladder: automate → one month of buffer →
 * kill expensive debt → three months of buffer → automate investing →
 * raise the rate. The user's answers (mode, automation, buffer) mark
 * steps already done and put exactly one step under the spotlight. One
 * number is measured — the savings rate — and the trend, not a good or
 * bad month, is what IntentNorth reads.
 *
 * Education, never financial advice.
 */

import { latest, trend, type MetricObservation, type Trend } from '@/features/model/metrics';

export interface MoneyInputs {
  mode?: string; // 'saving' | 'debt' | 'clarity'
  automation?: 'yes' | 'partial' | 'no';
  buffer?: 'none' | 'some' | 'solid';
}

export interface MoneyStep {
  id: string;
  title: string;
  detail: string;
  state: 'done' | 'now' | 'later';
}

interface StepDef {
  id: string;
  title: string;
  detail: string;
  doneWhen: (i: MoneyInputs) => boolean;
}

const STEPS: StepDef[] = [
  {
    id: 'automate',
    title: 'Automate one transfer on payday',
    detail:
      'Money that moves itself can’t lose an argument with a bad day. Everything after this is observation, not discipline.',
    doneWhen: (i) => i.automation === 'yes',
  },
  {
    id: 'buffer-1',
    title: 'One month of expenses, banked',
    detail: 'The first month of buffer converts emergencies back into inconveniences.',
    doneWhen: (i) => i.buffer === 'some' || i.buffer === 'solid',
  },
  {
    id: 'kill-debt',
    title: 'Kill the expensive debt',
    detail:
      'List every rate, pay the highest first, automate the extra payment. No investment reliably beats an expensive interest rate.',
    doneWhen: (i) => i.mode !== 'debt',
  },
  {
    id: 'buffer-3',
    title: 'Grow the buffer to three months',
    detail: 'Three months is where money stress stops driving decisions.',
    doneWhen: (i) => i.buffer === 'solid',
  },
  {
    id: 'invest',
    title: 'Automate the boring investing',
    detail:
      'Low cost, spread wide, every month, untouched. Picking winners is a hobby; time in the market is the plan.',
    doneWhen: () => false,
  },
  {
    id: 'raise-rate',
    title: 'Raise the rate one notch',
    detail:
      'When the trend has held for a quarter, move the automatic transfer up a percent. Future-you gets the raise.',
    doneWhen: () => false,
  },
];

export function buildMoneyLadder(inputs: MoneyInputs): MoneyStep[] {
  let spotlightGiven = false;
  return STEPS.map((s) => {
    if (s.doneWhen(inputs)) return { id: s.id, title: s.title, detail: s.detail, state: 'done' as const };
    const state = spotlightGiven ? ('later' as const) : ('now' as const);
    spotlightGiven = true;
    return { id: s.id, title: s.title, detail: s.detail, state };
  });
}

// ── The one number: savings rate, judged by trend ───────────────────────

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
        'One number matters here: what share of income got kept last month. Log it after each payday — the trend does the motivating.',
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

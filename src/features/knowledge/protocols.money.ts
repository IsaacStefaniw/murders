/**
 * Money practices added in the coach review, September 2026.
 *
 * Same rules as the rest of the library: an idea in our own words, a grade
 * with its reasoning, a plain-words safety line that names a licensed
 * professional wherever the subject touches debt, investing or a position
 * number, and never a product, platform, ticker or return figure.
 * Education, never financial advice.
 */

import type { Protocol } from './protocols';

export const MONEY_PROTOCOLS: Protocol[] = [
  {
    id: 'buffer-first',
    evidenceLevel: 'B',
    title: 'One month banked before anything else',
    pillar: 'wealth',
    area: 'admin',
    goalDomains: ['finance', 'behaviour'],
    summary: 'Until one month of expenses is sitting somewhere you can reach, the automatic transfer goes there and nowhere else.',
    why: 'Households with even a small cash buffer report less financial stress and are far less likely to sell investments or borrow at high rates when a car or a tooth breaks; that comes from large surveys in several countries, consistent but observational. Australian government guidance suggests three months as the target. The first month does most of the work: it turns an emergency back into an inconvenience.',
    attribution: ['Moneysmart (ASIC)', 'Tim Ferriss'],
    days: [5],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '18:00', windowMin: 120 },
    energy: 'evening',
    tier: 'should',
    safety: 'Where the buffer sits, a savings account, an offset account against a home loan, or somewhere else, depends on your loan, your tax and how quickly you may need it, and that is a licensed adviser or accountant question. Education, never financial advice.',
  },
  {
    id: 'named-target',
    evidenceLevel: 'B',
    title: 'A target with an amount and a date',
    pillar: 'wealth',
    area: 'admin',
    goalDomains: ['finance', 'personal'],
    summary: 'Write the amount, the date and what is there now, and let the coach turn it into a monthly figure and dated steps.',
    why: 'A large study of savers on a banking app found that people who set a specific saving goal put away more than matched users who did not, and the effect held up when the same people were compared before and after setting one. That sits on decades of goal-setting research: a specific, dated target with feedback beats a vague intention. Sub-goals help most early, when the first small step is close, so the steps start at the first thousand rather than at a quarter of the way.',
    attribution: ['Antonio Gargano', 'Alberto Rossi', 'Edwin Locke', 'Gary Latham'],
    days: [0],
    durationMin: 15,
    anchor: { kind: 'fixed', start: '10:30', windowMin: 120 },
    energy: 'morning',
    tier: 'could',
    safety: 'The monthly figure is arithmetic on the numbers you give, not a forecast of returns, and it assumes no interest unless you enter a rate. Whether the target itself is the right use of the money is a licensed adviser conversation. Education, never financial advice.',
  },
  {
    id: 'help-debt-timing',
    evidenceLevel: 'C',
    title: 'Know the student loan date before paying extra',
    pillar: 'wealth',
    area: 'admin',
    goalDomains: ['finance'],
    summary: 'Once a year, before June, look at your student loan (HELP) balance, the indexation rate and whether a voluntary payment is worth it that year at all.',
    why: 'An Australian student loan carries no interest but is indexed once a year on 1 June, and compulsory repayments come out of pay above a threshold. That shape is why the usual order puts it after a cash buffer and after any expensive debt: a voluntary payment only changes anything if it lands before indexation, and a buffer or a card balance usually matters more. This is arithmetic from the published rules rather than a trial of anything.',
    attribution: ['Moneysmart (ASIC)'],
    days: [6],
    durationMin: 20,
    anchor: { kind: 'fixed', start: '10:00', windowMin: 180 },
    energy: 'morning',
    tier: 'could',
    safety: 'Whether a voluntary payment beats keeping the money elsewhere depends on your income, your other debts and the year’s indexation, and an accountant or licensed adviser can run your numbers. The thresholds and rates change each year; check the government site rather than a memory of them. Education, never financial advice.',
  },
];

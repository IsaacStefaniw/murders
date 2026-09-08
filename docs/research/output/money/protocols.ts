/**
 * Money round — candidate protocols. NOT wired into the app.
 *
 * Written 2026-09-08 against docs/research/BRIEF-money.md, the rewritten
 * docs/research/README.md and docs/research/COMMUNICATORS.md, with the
 * recovery-round REVIEW.md applied from the start (no event-shaped cards,
 * grades on the practice not the paper, copy voiced for the person about
 * to do it). Every object is valid against the Protocol interface in
 * src/features/knowledge/protocols.ts and is meant to be pasted into
 * MONEY_PROTOCOLS after review. Each id has a row in sources.md beside
 * this file. findings.md carries the rest, including proposed regrades
 * and copy fixes to the existing eleven.
 *
 * The two hard constraints from the brief were checked by hand against
 * the same rules the test file applies: every card touching debt,
 * investing or a position names a licensed professional in `safety`
 * (matching /adviser|professional|accountant|charity/), and no card
 * anywhere contains any of the seven banned wealth substrings from the
 * test file, nor a product, platform, ticker or return figure. Dollar
 * amounts appear only where they are a government survey threshold,
 * never a return. Cap amounts, rates and thresholds that change each
 * year are described, never quoted.
 *
 * Australian audience throughout: super, 30 June, offset, HELP, the free
 * financial-counselling line, MoneySmart and the ATO as reference points.
 *
 * Nothing here reaches a phone until a human has read it.
 *
 * Grade spread: A 0 · B 6 · C 5 · D 11 · E 0 (22 candidates).
 * Time-back: 4 of 22.
 * Pillar: wealth 22 (areas admin 18 · relationship 2 · health 1 · growth 1).
 */

import type { Protocol } from '@/features/knowledge/protocols';

export const MONEY_CANDIDATES: Protocol[] = [
  // ── AUTOMATION, ESCALATION, PRE-COMMITMENT ────────────────────────────
  // The strongest behavioural evidence in personal finance lives here:
  // defaults and pre-commitment in real workplaces with real money. The
  // app already carries payday-automation and raise-precommit; these four
  // add the pieces those cards leave out — the refund, the date, the
  // unit, and the ten-second check that the transfer actually ran.
  {
    id: 'refund-precommit',
    evidenceLevel: 'B',
    title: 'Decide the tax refund in May',
    pillar: 'wealth',
    area: 'admin',
    goalDomains: ['finance', 'behaviour'],
    summary:
      'One May morning, before you lodge: write down what share of any refund goes straight to the transfer, and tell the app the number.',
    why: 'A refund is the easiest money you will ever save, because you never had it in your hands. In a large randomised trial inside a free tax-filing service, people who were asked to choose a share of their refund for savings before it arrived deposited far more of it, and the effect was concentrated in the people who decided early. That is why this card sits in May rather than July: the decision has to land before the money does. Any share counts, and a refund that goes to a card balance or the buffer is the same win.',
    attribution: ['Stephen Roll', 'Michal Grinstein-Weiss', 'Moneysmart (ASIC)'],
    days: [6],
    durationMin: 15,
    anchor: { kind: 'fixed', start: '10:00', windowMin: 180 },
    energy: 'morning',
    tier: 'could',
    safety: 'Whether a refund is best sent to a debt, an offset account, super or savings depends on your loan, your tax position and the year, and that is an accountant or licensed adviser question. Lodge by the date the ATO sets, and if a refund is smaller than expected, nothing here has gone wrong. Education, never financial advice.',
  },
  {
    id: 'fresh-start-date',
    evidenceLevel: 'B',
    title: 'Pick the date the transfer steps up',
    pillar: 'wealth',
    area: 'admin',
    goalDomains: ['finance', 'behaviour'],
    summary:
      'Once a quarter: choose a date that feels like a beginning — your birthday, 1 July, 1 January — and book a small step-up in the transfer for that day.',
    why: 'People find it much easier to agree to save more later than to save more now, and a date that reads as a fresh start makes the later version stick. In a randomised mail-out to six thousand university staff, offering the increase on a fresh-start date raised the number who signed up for a later increase by about half, without reducing the number who increased straight away, and the extra contributions were still there eight months on. Keep the step small; in a study where the default was set aggressively, most people abandoned it. A step you barely notice, dated to a day you will remember, is the version that lasts.',
    attribution: ['Katy Milkman', 'Hengchen Dai', 'John Beshears', 'Shlomo Benartzi'],
    days: [6],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '10:30', windowMin: 180 },
    energy: 'morning',
    tier: 'could',
    safety: 'The step-up is a habit mechanism, not an allocation plan; whether the extra should go to savings, a loan or super is a licensed adviser or accountant question. Education, never financial advice.',
  },
  {
    id: 'per-day-framing',
    evidenceLevel: 'B',
    title: 'Say the number per day',
    pillar: 'wealth',
    area: 'admin',
    goalDomains: ['finance', 'behaviour'],
    summary:
      'Whenever you set or raise the transfer, divide it by the days in the pay period and decide at that size. The transfer still goes out per pay.',
    why: 'The same amount feels different in different units, and the smaller unit is the one people say yes to. In a randomised sign-up experiment on a savings app, offering the identical deposit as a daily figure rather than a monthly one roughly quadrupled the number who enrolled, and it closed the gap between the highest and lowest earners entirely. The coach already shows your target as a weekly number; per day is smaller still. Decide there, then let the fortnightly transfer do the work.',
    attribution: ['Hal Hershfield', 'Shlomo Benartzi', 'Ben Felix'],
    days: [5],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '18:00', windowMin: 120 },
    energy: 'evening',
    tier: 'could',
    safety: 'This changes how a number feels, not what the right number is; the amount you can afford to commit is arithmetic on your own income and expenses, and a licensed adviser or financial counsellor can check it with you. Education, never financial advice.',
  },
  {
    id: 'day-after-payday-glance',
    evidenceLevel: 'B',
    title: 'Ten seconds the day after pay lands',
    pillar: 'wealth',
    area: 'admin',
    goalDomains: ['finance', 'behaviour'],
    summary:
      'The morning after pay day: open the account, confirm the transfer ran, glance at the goal bar. Done. Nothing to fix unless the transfer failed.',
    why: 'Across 138 randomised trials, people who monitored progress towards a goal reached it more often, and the effect was strongest when the check was recorded rather than just thought about. In a savings app, users who could see a goal saved more than matched users who could not. The trick is what you check: not the whole budget, just whether the automatic thing happened. Generic reminders to save do almost nothing in rich-country bank trials; a look at your own transfer the day it should have landed is a different act, because it catches a failed transfer while it is still one missed fortnight.',
    attribution: ['Benjamin Harkin', 'Antonio Gargano', 'Alberto Rossi'],
    days: [5],
    durationMin: 5,
    anchor: { kind: 'wake', offsetMin: 90, windowMin: 240 },
    energy: 'morning',
    tier: 'should',
    safety: 'A glance is a check, not a decision; if the transfer keeps failing because money is short, that is a sign to talk to a free financial counsellor or a licensed adviser rather than to push harder. Education, never financial advice.',
  },

  // ── THE FIRST BUFFER, SIZED BY THE DATA ───────────────────────────────
  {
    id: 'two-thousand-first',
    evidenceLevel: 'C',
    title: 'The first two thousand',
    pillar: 'wealth',
    area: 'admin',
    goalDomains: ['finance', 'behaviour'],
    summary:
      'Until there is two thousand dollars you could reach within a week, that is the whole goal. Then one month of expenses, then three. Each rung is a real finish line.',
    why: 'The national statistics office asks Australian households one question about resilience: could you raise two thousand dollars within a week for something important? About one in five say no, and that share has grown. The figure is not arbitrary; a large American survey found the typical worst shock in a year, a car, a tooth, a rental bond, was about that size, and bank data on six million families put the buffer that absorbs a normal bad month at roughly six weeks of take-home pay. Three-to-six months is a convention nobody derived. Two thousand, then a month, then three, is the same ladder with the first rung low enough to reach. Crossing it is the moment an emergency turns back into an inconvenience.',
    attribution: ['Scott Pape', 'Annamaria Lusardi', 'Moneysmart (ASIC)', 'Ben Felix'],
    days: [5],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '18:00', windowMin: 120 },
    energy: 'evening',
    tier: 'should',
    safety: 'Where the buffer sits and whether it should come before or after an expensive debt depends on your rates and your loan, which is a licensed adviser, accountant or free financial counsellor conversation. If two thousand feels a long way off right now, the free National Debt Helpline counsellors help with exactly that and sell nothing. Education, never financial advice.',
  },

  // ── ACCOUNTS AND LABELS ───────────────────────────────────────────────
  {
    id: 'two-accounts-one-label',
    evidenceLevel: 'C',
    title: 'Two accounts, and the emergency one is for using',
    pillar: 'wealth',
    area: 'admin',
    goalDomains: ['finance', 'behaviour'],
    summary:
      'Set up once: spending in one account, saving in another, the transfer landing in the second on pay day. Name the emergency money for emergencies, and mean it.',
    why: 'Money in a separate place with a name on it gets spent differently; that is the best-established finding in the whole behavioural-finance literature, and in a field experiment with daily-wage workers, cash split into two labelled envelopes was saved at nearly twice the rate of the same cash in one. Two cautions from the same research: too many sacred labels make people borrow at high rates rather than touch their own savings, so keep the labels few, and the emergency account has to be one you are allowed to use, or it is not doing its job. The Australian version of this is the bucket system, and its structure is sound even though the percentages are decoration.',
    attribution: ['Scott Pape', 'Richard Thaler', 'Abigail Sussman', 'Ramit Sethi', 'Moneysmart (ASIC)'],
    days: [6],
    durationMin: 20,
    anchor: { kind: 'fixed', start: '10:00', windowMin: 180 },
    energy: 'morning',
    tier: 'should',
    safety: 'Which kinds of account, and whether an offset account against a home loan should be one of them, depends on your loan and your tax and is a licensed adviser or accountant question; the app never names a product. Education, never financial advice.',
  },
  {
    id: 'future-self-ten-minutes',
    evidenceLevel: 'C',
    title: 'Ten minutes with the older you',
    pillar: 'wealth',
    area: 'growth',
    goalDomains: ['finance', 'personal'],
    summary:
      'Once a quarter, before the raise card: write a short note to yourself at sixty-five. What do they thank you for? What do they wish you had left alone?',
    why: 'People who feel connected to their future self save more for them, and making that person vivid, a letter, a photo, a few concrete sentences about their Tuesday, moves the feeling. The famous laboratory studies were small and used pretend money; the honest number comes from a randomised trial with fifty thousand retirement savers, where a glimpse of the aged self lifted one-off contributions by a modest but real amount. So the ritual is worth ten minutes a quarter, not a lifestyle. Do it just before you decide what share of the next raise to keep, because that is the decision it is built to help.',
    attribution: ['Hal Hershfield', 'Ben Felix'],
    days: [6],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '10:00', windowMin: 180 },
    energy: 'morning',
    tier: 'could',
    safety: 'A letter changes how a decision feels, not which decision is right; what to do with retirement money is a licensed adviser conversation. Education, never financial advice.',
  },

  // ── SUPER AND THE AUSTRALIAN CALENDAR ─────────────────────────────────
  // Compulsory super is a default that already works; the controllable
  // part is four settings and one date. Nothing here quotes a cap or a
  // rate, because they change every July.
  {
    id: 'super-four-settings',
    evidenceLevel: 'C',
    title: 'The four super settings you can actually change',
    pillar: 'wealth',
    area: 'admin',
    goalDomains: ['finance'],
    summary:
      'One July session a year: how many accounts you have, what each charges, which investment option you are in, and what insurance is running inside it.',
    why: 'You cannot touch your super for decades, which is exactly why it is worth twenty minutes a year: small settings compound for a working life. The Productivity Commission found a third of all accounts were unintended duplicates, costing members billions a year in doubled fees and insurance, and that a typical worker carrying one spare account for a career retires meaningfully poorer for it. The tax office lists every account in your name, including lost ones, in your online services. Fees, the default option and the insurance you may not know you are paying for are the other three; the tax office publishes a comparison of default products, and the regulator tests them each year and tells members in writing when one fails.',
    attribution: ['Productivity Commission', 'Moneysmart (ASIC)', 'Australian Taxation Office'],
    days: [6],
    durationMin: 25,
    anchor: { kind: 'fixed', start: '10:00', windowMin: 180 },
    energy: 'morning',
    tier: 'could',
    safety: 'Consolidating accounts can cancel insurance you would struggle to get back, and choosing an investment option is an investment decision, so read the insurance before you merge anything and take the option question to a licensed adviser. The app never names a fund or a product. Education, never financial advice.',
  },
  {
    id: 'super-before-june',
    evidenceLevel: 'D',
    title: 'The 30 June super question',
    pillar: 'wealth',
    area: 'admin',
    goalDomains: ['finance'],
    summary:
      'Each May, one question for your accountant or adviser: is a voluntary super contribution worth it for me this year, and by what date must it land?',
    why: 'Australia gives two windows for putting extra into super, one before tax and one after, and both have annual caps, a lodging step and, for lower incomes, a government top-up. The rules change each July and the money has to reach the fund before 30 June to count for the year, which is why this card is a May question rather than a June scramble. This is arithmetic from the published rules, not a trial; the reason it earns a card is that the decision only exists if someone asks it in time.',
    attribution: ['Moneysmart (ASIC)', 'Australian Taxation Office'],
    days: [6],
    durationMin: 15,
    anchor: { kind: 'fixed', start: '10:30', windowMin: 180 },
    energy: 'morning',
    tier: 'could',
    safety: 'Whether a contribution suits you, which kind, and how much under this year’s cap are questions for an accountant or licensed adviser; the caps, thresholds and top-up rules change every year, so check the ATO site rather than a memory of them. Education, never financial advice.',
  },
  {
    id: 'receipts-as-you-go',
    evidenceLevel: 'D',
    title: 'The receipt goes in the day you get it',
    pillar: 'wealth',
    area: 'admin',
    goalDomains: ['finance', 'business'],
    summary:
      'Friday, five minutes: photograph the week’s work receipts into the tax office app, and log any hours worked from home while you still remember them.',
    why: 'The tax office accepts a photo as a record, but it does not accept a guess: above a modest total you need written evidence for every work expense, and hours worked from home have to be recorded as they happen, not reconstructed in July. Five minutes a week is the whole system. The reward is a tax return that takes an hour instead of a weekend, and deductions you would otherwise have talked yourself out of claiming.',
    attribution: ['Australian Taxation Office', 'Moneysmart (ASIC)'],
    days: [5],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '16:30', windowMin: 120 },
    energy: 'any',
    tier: 'could',
    duringWork: true,
    safety: 'What is deductible in your situation is an accountant question; the app helps you keep the records, nothing more. Education, never financial advice.',
  },
  {
    id: 'offset-is-linked',
    evidenceLevel: 'D',
    title: 'Two minutes: is the offset actually linked?',
    pillar: 'wealth',
    area: 'admin',
    goalDomains: ['finance'],
    summary:
      'Once a quarter, and always after a refinance: check in the banking app that the offset account is linked to the loan and that the interest charged is falling.',
    why: 'An offset account only works if the lender is subtracting it from the loan every day, and the regulator found lenders that simply had not linked the accounts, so customers paid interest on money that was sitting right there. The check is two minutes and free. If you refinanced recently, do it this week; that is when links most often quietly break.',
    attribution: ['Moneysmart (ASIC)'],
    days: [1],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '19:00', windowMin: 120 },
    energy: 'evening',
    tier: 'could',
    safety: 'Whether an offset suits your loan at all, given any higher rate or fees attached to it, is a licensed adviser or mortgage broker question; if the link is missing, raise it with the lender in writing and, if that fails, with the free financial complaints authority. Education, never financial advice.',
  },
  {
    id: 'cover-inventory',
    evidenceLevel: 'D',
    title: 'Know what would pay out',
    pillar: 'wealth',
    area: 'admin',
    goalDomains: ['finance', 'family'],
    summary:
      'Once a year, and after a partner, a child, a mortgage or a change in hours: list the life, disability and income cover you hold, inside super and out, with its waiting period and who it goes to.',
    why: 'Most Australians hold some death cover by default through super and far less than they think for being unable to work; industry estimates put millions under-covered for income protection. The bigger point is that default cover can switch itself off, when an account goes quiet for sixteen months or a balance drops below a threshold, and about six in ten members have never said who the money should go to. Nobody has trialled an annual insurance review, so this is a D by mechanism: an hour a year that catches a lapse before it matters, and gives a family the answer to a question they hope never to ask.',
    attribution: ['Moneysmart (ASIC)', 'Productivity Commission'],
    days: [6],
    durationMin: 40,
    anchor: { kind: 'fixed', start: '10:00', windowMin: 180 },
    energy: 'morning',
    tier: 'could',
    safety: 'How much cover you need, which definition, and whether to hold it inside or outside super is a licensed adviser question; the app never names an insurer or a product, and cancelling anything before the replacement is in force is the one mistake this card exists to prevent. Education, never financial advice.',
  },

  // ── DEBT ──────────────────────────────────────────────────────────────
  // debt-order-review already carries the snowball-versus-avalanche
  // answer; the round's findings propose a copy update to it rather than
  // a second card. What was missing was the route into help, written as
  // something you know before you need it.
  {
    id: 'hardship-number-known',
    evidenceLevel: 'D',
    title: 'Know the free number before you need it',
    pillar: 'wealth',
    area: 'admin',
    goalDomains: ['finance', 'behaviour'],
    summary:
      'Once, then once a year: save the National Debt Helpline number and read the one-page hardship rules, so that a bad month starts with a phone call instead of a missed payment.',
    why: 'Australian lenders are required to consider a hardship request, respond within three weeks, and give written reasons and the complaints route if they say no. Most people do not know that, so they go quiet, and going quiet is the expensive option. The helpline is free, confidential and staffed by financial counsellors who sell nothing; two-thirds of the people who call resolve the problem they called about. Knowing the number changes nothing on a good month and everything on a bad one. That is the whole practice.',
    attribution: ['Moneysmart (ASIC)', 'Financial Counselling Australia'],
    days: [1],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '19:00', windowMin: 120 },
    energy: 'evening',
    tier: 'could',
    neverNag: true,
    safety: 'If a payment is going to be missed, tell the lender before the date and call the National Debt Helpline on 1800 007 007, or Mob Strong Debt Help on 1800 808 488 for Aboriginal and Torres Strait Islander peoples; a free financial counsellor is a licensed professional in your corner, and this app is not one. Education, never financial advice.',
  },

  // ── STRESS AND SLEEP ──────────────────────────────────────────────────
  {
    id: 'money-worry-to-paper',
    evidenceLevel: 'C',
    title: 'The money worry goes on paper, not to bed',
    pillar: 'wealth',
    area: 'health',
    goalDomains: ['finance', 'health', 'behaviour'],
    summary:
      'If money is what your head does at eleven at night: five minutes before bed, write the one next action and the day you will do it. Then the worry has somewhere to live that is not you.',
    why: 'Financial strain shows up in the sleep lab as longer time to fall asleep and more waking, and debt is one of the more consistent things associated with low mood in a review of sixty-five studies. Causation runs both ways and a habit app will not untangle it, but the writing part has a randomised trial of its own: people who spent five minutes writing tomorrow’s to-do list fell asleep faster than people who wrote about what they had already done, and the more specific the list, the faster they slept. A money worry is a to-do list wearing a disguise. Write the next action and the day.',
    attribution: ['Michael Scullin'],
    days: [0, 1, 2, 3, 4, 5, 6],
    durationMin: 5,
    anchor: { kind: 'sleep', offsetMin: 30, windowMin: 60 },
    energy: 'evening',
    tier: 'could',
    sessionType: 'journal',
    safety: 'This is a sleep tool, not a debt plan; if the worry is a bill you cannot pay, the free National Debt Helpline on 1800 007 007 is the next action, and a financial counsellor there is the professional to call. If low mood is the larger problem, your GP is the right first door. Educational structure, not medical advice.',
  },

  // ── COUPLES ───────────────────────────────────────────────────────────
  {
    id: 'shared-money-agreement',
    evidenceLevel: 'B',
    title: 'Decide together what is shared',
    pillar: 'wealth',
    area: 'relationship',
    goalDomains: ['finance', 'relationship'],
    summary:
      'Once, then yearly: agree which money is pooled, what each of you spends without asking, and the amount above which you check with each other.',
    why: 'This is one of the few money questions with a randomised trial behind it. Two hundred and thirty engaged couples were assigned to a joint account, separate accounts, or their own choice, and followed for two years: the couples with the joint account did not show the usual early-marriage slide in relationship quality, and the others did. A six-study series of nearly forty thousand people found the same pattern, strongest for couples under financial strain. The version that survives contact with real life is a shared hub plus a no-questions amount each, and the agreement matters more than the structure: financial disagreement predicts separation more strongly than any other kind of argument.',
    attribution: ['Jenny Olson', 'Scott Rick', 'Ramit Sethi', 'Ben Felix'],
    days: [6],
    durationMin: 45,
    anchor: { kind: 'fixed', start: '10:00', windowMin: 180 },
    energy: 'morning',
    tier: 'could',
    safety: 'Joint accounts and joint debts carry legal and tax consequences, especially if a relationship ends; a licensed adviser or a family lawyer can explain them before you sign anything. If money is being used to control you, that is family violence and 1800RESPECT on 1800 737 732 is the number. Education, never financial advice.',
  },
  {
    id: 'money-date',
    evidenceLevel: 'D',
    title: 'The monthly money conversation',
    pillar: 'wealth',
    area: 'relationship',
    goalDomains: ['finance', 'relationship'],
    summary:
      'First Sunday of the month, thirty minutes, something nice to drink: the goal, the big spends coming up, and one thing to sort out. Nothing gets raised at the checkout.',
    why: 'Money arguments are not the most common kind, but they run longer, come back more often and get resolved less than any other topic, and the couples who disagree about money most are the ones most likely to separate. Nobody has trialled a scheduled conversation, so the practice is a D on honest grading. What the evidence does say is that the disagreement is the risk, not the money, and a fixed time with an agenda is how experienced couples stop the disagreement from happening in the car park. Some of this is the ritual itself, and the ritual works.',
    attribution: ['Scott Pape', 'Ramit Sethi'],
    days: [0],
    durationMin: 30,
    anchor: { kind: 'fixed', start: '18:30', windowMin: 90 },
    energy: 'evening',
    tier: 'could',
    safety: 'A conversation is not a plan; anything involving debts, investing or a position number goes to a licensed adviser or accountant with both of you in the room. Education, never financial advice.',
  },

  // ── LUMPY INCOME ──────────────────────────────────────────────────────
  // Founders, tradespeople, casuals, shift workers on overtime. Every
  // budget assumes a salary; these two cards manufacture one.
  {
    id: 'pay-yourself-a-salary',
    evidenceLevel: 'D',
    title: 'Pay yourself a salary from the pile',
    pillar: 'wealth',
    area: 'admin',
    goalDomains: ['finance', 'business', 'behaviour'],
    summary:
      'Every dollar that comes in lands in a holding account. Once a fortnight, a fixed amount moves to the spending account, set at a low month, not an average one.',
    why: 'Bank data on six million families found month-to-month income swings of about a third are normal, and that people spend the good months as if they were the new normal. A fixed transfer to yourself turns a lumpy income into a wage you can plan against, and the pile that builds behind it becomes the buffer that carries the quiet quarter. The trick is the number: set the salary at what a poor month can support, and let the surplus sit until the buffer reaches about six weeks of take-home, the amount that absorbs a bad month and a big bill arriving together. Nobody has trialled this, and it is what every accountant and financial counsellor tells a sole trader on day one.',
    attribution: ['Ramit Sethi', 'Scott Pape', 'Moneysmart (ASIC)'],
    days: [5],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '17:30', windowMin: 120 },
    energy: 'evening',
    tier: 'should',
    safety: 'Whether the holding account should be a business account, a personal one or an offset, and how drawings interact with company tax, is an accountant question and differs for sole traders and companies. Education, never financial advice.',
  },
  {
    id: 'tax-set-aside',
    evidenceLevel: 'D',
    title: 'The tax share leaves on the day the invoice is paid',
    pillar: 'wealth',
    area: 'admin',
    goalDomains: ['finance', 'business'],
    summary:
      'Same day every payment lands: move the share your accountant gave you for tax and GST to an account you do not spend from. Then the rest is yours.',
    why: 'The most common way a good year on your own becomes a bad one is a tax bill in October for money spent in March. Australian sole traders pay tax by instalment on a schedule the tax office sets, and GST quarterly if registered, so the money is never really yours until the share is out. Doing it the day the invoice is paid, rather than monthly, is what makes it painless: you never see the gross figure long enough to plan around it. Practitioner practice, not a trial, and the practitioners are unanimous.',
    attribution: ['Australian Taxation Office', 'Scott Pape'],
    days: [1, 2, 3, 4, 5],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '16:00', windowMin: 180 },
    energy: 'any',
    tier: 'should',
    duringWork: true,
    neverNag: true,
    safety: 'The share to set aside depends on your income, structure and whether you are registered for GST, and only an accountant can give you the number; instalment amounts and dates come from the ATO, not from memory. Education, never financial advice.',
  },

  // ── TIME BACK ─────────────────────────────────────────────────────────
  // Four cards, about a fifth of the round. Each returns minutes to the
  // person and points them at the thing that works instead.
  {
    id: 'latte-maths-retired',
    evidenceLevel: 'D',
    title: 'Stop doing coffee maths',
    pillar: 'wealth',
    area: 'admin',
    goalDomains: ['finance', 'behaviour'],
    summary:
      'You can keep the coffee. When you catch yourself totting up small daily spends, put the minute into one fixed cost instead: the insurance, the plan, the subscription that renewed itself.',
    why: 'The idea that a daily coffee is the difference between comfort and poverty was never a research finding; it is arithmetic that only works with an implausible daily amount and a generous return nobody is offering. The evidence points elsewhere. People underestimate their exceptional spending, the once-off things that feel like exceptions every time, far more than their routine spending, and the fixed costs, housing, insurance, subscriptions, set the floor. The automatic transfer does more than a year of skipped coffees, and it costs nothing you will miss on a Tuesday.',
    attribution: ['Ramit Sethi', 'Abigail Sussman'],
    days: [3],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '12:30', windowMin: 120 },
    energy: 'midday',
    tier: 'could',
    neverNag: true,
    safety: 'Reviewing a fixed cost is not a reason to cancel cover before its replacement is in force; anything involving insurance, debt or investments is a licensed adviser conversation first. Education, never financial advice.',
  },
  {
    id: 'tracking-is-a-mirror',
    evidenceLevel: 'D',
    title: 'The tracker is a mirror, not the plan',
    pillar: 'wealth',
    area: 'admin',
    goalDomains: ['finance', 'behaviour'],
    summary:
      'Keep the budgeting app if you like it, and use it once a month for three things: fee lines, the exceptional spends, and whether the transfer ran. Turn off the daily balance pings.',
    why: 'Seeing your own transactions does something real: in one country where a budgeting app launched, users paid fewer bank fees and penalties afterwards. What it does not do is make people save; the saving came from setting a goal and automating the transfer, in every study that separated the two. Frequent budget-remaining feedback can even backfire, with people who were told their standing every other day spending more towards the end of the period. So the app is the mirror. The regulator’s own budget is five steps and the last one is a transfer on pay day; the tracker is how you check the mirror monthly, and you get the daily minutes back.',
    attribution: ['Moneysmart (ASIC)', 'Ramit Sethi'],
    days: [0],
    durationMin: 15,
    anchor: { kind: 'fixed', start: '10:00', windowMin: 180 },
    energy: 'morning',
    tier: 'could',
    safety: 'Third-party budgeting tools ask for access to your bank data, and neither the regulator nor this app vets them; read what they keep and what they charge before you connect an account. Education, never financial advice.',
  },
  {
    id: 'willpower-retired',
    evidenceLevel: 'B',
    title: 'You do not need more willpower',
    pillar: 'wealth',
    area: 'admin',
    goalDomains: ['finance', 'behaviour'],
    summary:
      'When a money decision feels like a test of self-control, ask a different question: what one automatic rule would make this decision disappear? Then set that up and stop testing yourself.',
    why: 'The idea that willpower is a tank that runs dry was one of the most famous findings in psychology, and when two preregistered replications across fifty-nine laboratories and more than five thousand people tried to find it, the effect was indistinguishable from zero. Meanwhile the real evidence for what changes saving is boring and strong: transfers that happen by default, and commitments made in advance. So a decision you keep having to win is a decision you have not automated yet. That is not a character flaw; it is a setup task, and it takes ten minutes.',
    attribution: ['Richard Thaler', 'Shlomo Benartzi', 'Ramit Sethi'],
    days: [3],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '19:00', windowMin: 120 },
    energy: 'evening',
    tier: 'could',
    neverNag: true,
    safety: 'Automating a transfer is a habit; deciding where the money should go is a licensed adviser or accountant question. Education, never financial advice.',
  },
  {
    id: 'round-ups-are-a-starter',
    evidenceLevel: 'D',
    title: 'Round-ups count as zero in the plan',
    pillar: 'wealth',
    area: 'admin',
    goalDomains: ['finance', 'behaviour'],
    summary:
      'Keep round-ups if they make saving feel good. Once, check the fees against the balance and who actually owns what you are buying. Then count them as zero and let the transfer carry the goal.',
    why: 'Nobody has measured whether round-up features add to what people save or quietly replace it, so the honest grade is early days. What the regulator does say is that fees on small balances bite harder than on large ones, that some services hold the assets rather than you, and that switching can force a sale. None of that makes round-ups bad; the regulator calls them a way to start a habit, and a habit starter is a fine thing to be. It just is not a plan. The plan is the transfer with a date on it.',
    attribution: ['Moneysmart (ASIC)'],
    days: [6],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '11:00', windowMin: 180 },
    energy: 'morning',
    tier: 'could',
    neverNag: true,
    safety: 'A round-up service that invests is an investment product, and whether one suits you, its fees and what happens to your money if the provider fails are licensed adviser questions; the app names none of them. Education, never financial advice.',
  },
];

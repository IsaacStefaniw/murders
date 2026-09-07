/**
 * Work practices added by the work and leadership review (September 2026).
 *
 * Kept in their own file so the review's additions can be read as one
 * list, with the same sourcing policy as the rest of the library
 * (docs/KNOWLEDGE.md): practices in IntentNorth's own words, credit rather
 * than endorsement, a grade for the research and not the messenger.
 *
 * Grading here is deliberately modest. The switching-cost literature
 * behind a protected block is good, but the block as a scheduled practice
 * has not been trialled; the one controlled result in this area is the
 * email trial behind message batching, and it is a single small study.
 */

import type { Protocol } from './protocols';

export const WORK_PROTOCOLS: Protocol[] = [
  {
    id: 'meeting-free-morning',
    evidenceLevel: 'D',
    title: 'One meeting-free morning',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['business', 'career'],
    summary: 'One morning a week booked solid with no meetings, from the start of the day to lunch, held like a client appointment.',
    why: 'Every switch between tasks costs time and the cost grows with how hard the task is — that part is well replicated in the lab, and attention left on an unfinished task carries into the next one. A single meeting in the middle of a morning splits it into two halves too short for anything hard. The mechanism is good evidence; a booked morning as the fix is practitioner advice, and a survey of companies that adopted meeting-free days reported large gains but asked only the companies that chose to do it.',
    attribution: ['Paul Graham', 'Cal Newport'],
    days: [3],
    durationMin: 120,
    anchor: { kind: 'fixed', start: '09:00', windowMin: 30 },
    energy: 'morning',
    tier: 'could',
    duringWork: true,
    safety: 'For work you control. If the meetings are not yours to move, the honest version is one hour before the first call, not a whole morning.',
  },
  {
    id: 'message-batching',
    evidenceLevel: 'C',
    title: 'Messages in batches',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['business', 'career', 'behaviour'],
    summary: 'Email and messages at set times — three a day — and closed in between. One booked slot stands for the rule.',
    why: 'In a two-week trial, people limited to checking email three times a day reported lower daily stress in that week than in the week they checked freely, and lower stress went with better wellbeing across the board. One study of 124 adults, so a moderate grade, and most of them found the limit hard to keep — which is why this is a booked slot rather than a resolution.',
    attribution: ['Kostadin Kushlev', 'Elizabeth Dunn', 'Cal Newport'],
    days: [1, 2, 3, 4, 5],
    durationMin: 20,
    anchor: { kind: 'fixed', start: '11:30', windowMin: 90 },
    energy: 'any',
    tier: 'could',
    duringWork: true,
    safety: 'If your role is answering people — support, on-call, a front desk — three checks a day is not available to you and this practice does not apply.',
  },
  {
    id: 'meeting-trim',
    evidenceLevel: 'D',
    title: 'Cut or shorten one meeting',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['business', 'career'],
    summary: 'Fifteen minutes a week on the recurring meetings you own: one cancelled, shortened, or turned into a written update.',
    why: 'Meeting load is where most of a heavy week goes, and the survey evidence — people in back-to-back meetings report more stress and less sense of getting anything done — is consistent but observational. What is firmer is that people reliably fix things by adding rather than removing, so a standing slot for subtraction is the only way it happens. Practitioner advice with a plausible mechanism, graded as such.',
    attribution: ['Steven Rogelberg', 'Leidy Klotz'],
    days: [5],
    durationMin: 15,
    anchor: { kind: 'fixed', start: '15:00', windowMin: 120 },
    energy: 'any',
    tier: 'could',
    duringWork: true,
    safety: 'Only meetings you own or can propose changes to. Cutting someone else’s meeting is a conversation, not a calendar edit.',
  },
];

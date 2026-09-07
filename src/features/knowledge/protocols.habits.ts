/**
 * Urge and habit practices — the free-forever set.
 *
 * Every id here starts with `urge`, which is the rule the entitlement
 * enforces (`isAlwaysFreeProtocol`): free in the library, free to add,
 * free to run. Nothing in this file may be locked, and a test pins it.
 *
 * Four practices, one per gap the research audit found in the coach:
 * the plan for tonight in the person's own words, a stand-in matched to
 * the trigger, a pause before acting, and the hour after a slip. Grades
 * are honest — one B, three Cs — because the daily forms of these are
 * moderators inside larger trials or field studies, not trials of their
 * own. The one-week if-then plan already holds the A in this library.
 *
 * Same sourcing policy as protocols.ts (docs/KNOWLEDGE.md): ideas, not
 * text; credit, not endorsement; education, never treatment.
 */

import type { Protocol } from './protocols';

/**
 * The clinical line, once. Dependence is a doctor's call, and helplines are
 * named generically because the app does not know which country the phone
 * is in.
 */
const DEPENDENCE_LINE =
  'Support for a habit you can safely change on your own, and nothing more. Daily use, shakes, sweating, a racing heart or bad anxiety without it, or not being able to stop once started, is a doctor’s call — and stopping suddenly after heavy daily drinking can be dangerous. Free, confidential helplines exist in most countries for drinking, drugs and gambling; a doctor or pharmacist can name the one where you live. IntentNorth never charges for any of this.';

export const HABIT_PROTOCOLS: Protocol[] = [
  {
    id: 'urge-tonight-plan',
    evidenceLevel: 'B',
    title: 'Tonight, in your own words',
    pillar: 'mind',
    area: 'health',
    goalDomains: ['behaviour', 'health'],
    summary: 'Early in the evening, one written line for tonight — “when X happens, I do Y” — naming the moment you expect and the thing you will actually do.',
    why: 'Naming the exact cue and the exact response ahead of time is the best-replicated finding in behaviour change: about ninety-four studies pooled to a medium-to-large effect. Inside those studies the plans that worked best were contingent — an if and a then — were made by people who wanted the goal, and had been rehearsed at least once. Writing tonight’s line is that rehearsal. Two details carry the weight: the cue must be a real moment (the sofa at nine, the fourth round at the same table), and the then must be something you do, because a plan written as “I will not” leaves nothing to do with the moment. Graded B rather than A because the daily, one-night form is a moderator inside those trials rather than a trial of its own; the weekly three-moment plan in this library holds the A.',
    attribution: ['Peter Gollwitzer', 'Paschal Sheeran'],
    days: [0, 1, 2, 3, 4, 5, 6],
    durationMin: 5,
    anchor: { kind: 'sleep', offsetMin: 180, windowMin: 90 },
    energy: 'evening',
    tier: 'should',
    sessionType: 'journal',
    safety: DEPENDENCE_LINE,
  },
  {
    id: 'urge-stand-in',
    evidenceLevel: 'C',
    title: 'A stand-in that fits the trigger',
    pillar: 'mind',
    area: 'health',
    goalDomains: ['behaviour', 'health'],
    summary: 'When the urge lands, do the one thing you chose for this trigger for one to three minutes — long breaths out for stress, something for your hands when bored, your drink, your line and your exit decided before a social night, the smallest thing and bed when tired.',
    why: 'Habit reversal training — notice the cue, then perform a competing action that cannot happen at the same time as the habit, held for a minute or three — is the best-supported approach for repetitive habits like nail biting and hair pulling, and matching the action to the cue is part of the method rather than a flourish. The matching is what the evidence on triggers supports: a stress urge is arousal looking for an exit and falls to a long exhale; boredom wants stimulation, not sedation; a social urge is decided before arriving, because the refusal that works is the one rehearsed; a tired evening cannot carry a big answer, so it gets a small one. Graded C because the trials are in body-focused habits, and carrying the method to drinking, vaping and scrolling is a reasonable extension rather than a tested one.',
    attribution: ['Nathan Azrin', 'Douglas Woods'],
    days: [0, 1, 2, 3, 4, 5, 6],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '20:00', windowMin: 180 },
    energy: 'any',
    tier: 'should',
    neverNag: true,
    safety: DEPENDENCE_LINE,
  },
  {
    id: 'urge-ten-minutes-first',
    evidenceLevel: 'C',
    title: 'Ten minutes first',
    pillar: 'mind',
    area: 'health',
    goalDomains: ['behaviour', 'health'],
    summary: 'Before acting on the urge, ten minutes and one change of place — the phone in another room, a glass of water, a different chair — and then decide.',
    why: 'A pause between the pull and the act is the one in-the-moment phone finding with real numbers behind it. When a short wait and a question were put in front of a chosen app, people abandoned about a third of the opens they had started and tried to open it about a third less often, across tens of thousands of uses. The wait is not the point; deciding after it is, because the decision the habit was making for you gets made by you. The ten minutes is a rule of thumb, and the phone data is a field study rather than a randomised trial, so C. What it does not do is make the urge go away — it puts a gap where the habit had none.',
    attribution: ['David Grüning', 'Philipp Lorenz-Spreen', 'Wendy Wood'],
    days: [0, 1, 2, 3, 4, 5, 6],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '20:30', windowMin: 180 },
    energy: 'any',
    tier: 'could',
    neverNag: true,
    safety: DEPENDENCE_LINE,
  },
  {
    id: 'urge-next-hour',
    evidenceLevel: 'C',
    title: 'After a slip, the next hour',
    pillar: 'mind',
    area: 'health',
    goalDomains: ['behaviour', 'health'],
    summary: 'When it has already happened: water, a different room, the stand-in you chose, and bed at the usual time. The next hour is the whole plan, and nothing restarts from zero.',
    why: 'One slip rarely does the damage on its own. What predicts the slide is the account given of it — that the run is dead, that this proves something permanent, so the rest of the night may as well go the same way. In the smoking relapse work the guilt after a first lapse did not predict relapse; the drop in confidence after later ones did, and putting the blame on the setup rather than the self protected against the next one. So the hour after a slip is where the story gets written, and a short, specific hour writes a short story: one event, one fixable cause, the ordinary night resumed. Graded C because the evidence is observational and about interpretation, not a trial of the hour itself. Counters that reset to zero hand the story its ending, which is why IntentNorth counts wins and never resets anything.',
    attribution: ['G. Alan Marlatt', 'Katie Witkiewitz'],
    days: [0, 1, 2, 3, 4, 5, 6],
    durationMin: 5,
    anchor: { kind: 'sleep', offsetMin: 120, windowMin: 120 },
    energy: 'evening',
    tier: 'could',
    neverNag: true,
    safety: DEPENDENCE_LINE,
  },
];

/**
 * Work & Leadership round — candidate protocols. NOT wired into the app.
 *
 * Written 2026-09-08 against docs/research/BRIEF-work.md, the contract in
 * docs/research/README.md, the roster in COMMUNICATORS.md, and the
 * restructured pipeline in docs/research/output/corpus/PIPELINE.md. Three
 * verified ledgers sit in ledgers/ beside this file; sources.md carries a
 * row per card and findings.md the rest.
 *
 * Two decisions from the brief shaped every card here.
 *
 * 1. HALF THIS AUDIENCE IS NOT AT A DESK. Every practice that touches the
 *    end of work is defined against the end of THIS PERSON'S work window,
 *    never a clock hour. Shift cards carry `timeAnchored: true` so the
 *    scheduler treats the hour as part of what they are. The existing
 *    `shutdown-ritual` sits at a fixed 17:10, which is a nine-to-five
 *    assumption; findings.md proposes the fix rather than duplicating it.
 *
 * 2. WHERE THE JOB IS THE CAUSE, THE COACH SAYS SO. The burnout evidence
 *    is unusually clean and it does not favour us: organisation-directed
 *    interventions move the needle roughly two and a half times as far as
 *    individual ones, and in people who already have burnout the pooled
 *    individual trials show no effect at all. No card here implies a
 *    person can breathe their way out of an unsustainable role.
 *
 * On attribution. This round found something the pipeline now records: the
 * four best-evidenced researchers in this pillar — Sonnentag, Maslach,
 * Amabile, Edmondson — return zero podcast episodes between them across
 * the whole transcript corpus, while the burnout tag returns twenty
 * episodes by no burnout researcher. So several of the strongest cards
 * here ship with an EMPTY attribution, deliberately. Crediting a
 * recognisable name for a researcher's work would be exactly the failure
 * the contract warns about, and a false credit is worse than an empty one.
 *
 * Grade spread: A 2 · B 9 · C 12 · D 3 · E 0 (26 candidates), which is
 * 42% A and B against the library's 40%.
 *
 * The first draft came out at 69% A and B and was regraded down before
 * anything else in this round was written. The cause is worth recording
 * because it will recur: these ledgers are unusually strong, and it is
 * easy to hand a card the grade of the meta-analysis behind it instead of
 * the grade of the practice on it. Counting the gaps under eleven hours
 * is not the intervention that was trialled, because reducing them is,
 * and an employer does that. Keeping a weekday shape while out of work is
 * a correlate in the pooled data, not a randomised arm. Ten cards moved
 * down on that reasoning and findings.md itemises every one.
 *
 * Time-back: 5 of 26.
 * Pillars: mind 8 · leadership 18. Areas: work 26.
 * 20 of the 26 ship with an empty attribution, deliberately.
 *
 * Nothing here reaches a phone until a human has read it.
 */

import type { Protocol } from '@/features/knowledge/protocols';

export const WORK_CANDIDATES: Protocol[] = [
  // ── RECOVERY FROM WORK ────────────────────────────────────────────────
  // The best-evidenced block in the pillar, and the one with no famous
  // name attached to it. Three independent meta-analyses covering tens of
  // thousands of workers agree on the direction.
  {
    id: 'move-after-the-hard-one',
    evidenceLevel: 'C',
    title: 'Move first, decide later',
    pillar: 'mind',
    area: 'work',
    goalDomains: ['behaviour', 'health'],
    summary:
      'On the days work was heaviest, go straight into twenty minutes of moving before you sit down. Walking counts. Ten minutes counts.',
    why: 'There is a good reason the session gets skipped after a hard day, and it is not the one everybody assumes. A diary study following employees across hundreds of days found the thing that predicted skipping was not being physically tired. It was still being mentally at work. So the decision is the hard part, not the exercise, which is why this card asks you to start moving before you decide anything. Movement is one of the few off-work activities that shows up consistently in the recovery research, and the version that works is the one you chose.',
    attribution: [],
    days: [1, 2, 3, 4, 5],
    durationMin: 20,
    anchor: { kind: 'fixed', start: '17:30', windowMin: 180, timeAnchored: true },
    energy: 'any',
    tier: 'should',
    safety: 'On a night rotation this competes with sleep, and sleep wins. After a run of nights, take the sleep and move after it rather than before.',
  },
  {
    id: 'days-off-are-not-saturday',
    evidenceLevel: 'C',
    title: 'Protect the days off you actually have',
    pillar: 'mind',
    area: 'work',
    goalDomains: ['behaviour', 'friends'],
    summary:
      'One block on each stretch of days off: something with people in it, and the errands kept out of it. Whatever day of the week that lands on.',
    why: 'A study of eighty-seven emergency service workers followed them across their days off and found what predicted coming back worse rather than better. Not the work. It was the days off filling with hassles, and the absence of people in them. Two things follow. Time off is not automatically recovery, and the calendar version of a weekend is irrelevant if yours falls on a Tuesday. This card exists because most advice about weekends quietly assumes you get Saturday.',
    attribution: [],
    days: [6],
    durationMin: 90,
    anchor: { kind: 'fixed', start: '11:00', windowMin: 300, timeAnchored: true },
    energy: 'any',
    tier: 'should',
  },
  {
    id: 'holiday-lift-and-fade',
    evidenceLevel: 'C',
    title: 'The holiday works, and it fades',
    pillar: 'mind',
    area: 'work',
    goalDomains: ['behaviour', 'experience'],
    summary:
      'Before a break: write the one thing about work you want to be different when you get back. The rest of the lift is not meant to last.',
    why: 'Pooled holiday studies find a real improvement in wellbeing during the break and a return close to baseline soon after going back. Both halves are normal. Knowing the second half in advance is worth something, because the alternative is reading an ordinary fade as evidence you wasted the leave or that something is wrong with you. Nothing is. A holiday is a rest, not a repair, and if you come back to the same job you come back to the same job. That is what the one thing is for.',
    attribution: [],
    days: [0],
    durationMin: 15,
    anchor: { kind: 'fixed', start: '10:00', windowMin: 180 },
    energy: 'morning',
    tier: 'could',
    sessionType: 'journal',
  },

  // ── BURNOUT, HONESTLY ─────────────────────────────────────────────────
  {
    id: 'burnout-is-not-a-personal-failing',
    evidenceLevel: 'B',
    title: 'This one is not yours to fix alone',
    pillar: 'mind',
    area: 'work',
    goalDomains: ['behaviour', 'career'],
    summary:
      'If you are burnt out: name which part of the job is doing it, and who has the authority to change it. That sentence is the work. Not another evening practice.',
    why: 'This is the clearest finding in the whole pillar and it does not flatter an app. Across pooled controlled trials, changes to the job move burnout roughly two and a half times as far as anything aimed at the individual. In workers who already meet the threshold, the pooled individual trials show no effect on exhaustion or cynicism at all. So the honest thing to say is that a breathing practice is not the treatment for an unsustainable role, and being unable to fix it on your own is not a shortfall in you. What does help is getting specific about which part of it is wrong, because that is the thing that can be raised, and vague exhaustion cannot be.',
    attribution: ['Christina Maslach', 'Adam Grant'],
    days: [0],
    durationMin: 20,
    anchor: { kind: 'fixed', start: '11:00', windowMin: 240 },
    energy: 'morning',
    tier: 'could',
    neverNag: true,
    sessionType: 'journal',
    safety: 'Burnout and depression overlap and this card cannot tell them apart. If the flatness is there on days off too, or you are not safe, that is a GP conversation rather than a work one. Lifeline is 13 11 14.',
  },

  // ── FEEDBACK ──────────────────────────────────────────────────────────
  {
    id: 'keep-it-about-the-work',
    evidenceLevel: 'C',
    title: 'Steer it back to the work',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['career', 'behaviour', 'business'],
    summary:
      'When feedback arrives, ask one question about the thing itself: what would have made it better? If the conversation turns to what you are like, turn it back.',
    why: 'The largest analysis of feedback ever assembled, over six hundred effects, found something nobody expects: more than a third of feedback interventions made performance worse. The mechanism is the useful part. Feedback helps when attention lands on the task and hurts when it lands on the self, because a person defending their character has stopped thinking about the work. You cannot control how it is delivered. You can control which of those two things you ask about, and one question is usually enough to move it.',
    attribution: ['Adam Grant'],
    days: [1, 2, 3, 4, 5],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '14:00', windowMin: 240 },
    energy: 'any',
    tier: 'could',
    duringWork: true,
    neverNag: true,
  },
  {
    id: 'a-rating-is-one-persons-view',
    evidenceLevel: 'C',
    title: 'A rating is mostly about the rater',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['career', 'behaviour'],
    summary:
      'After a review that stung: write what was actually about the work, and what was about the person writing it. Act on the first list.',
    why: 'When researchers decomposed thousands of performance ratings to see what they were actually measuring, the largest share by far was the individual quirks of whoever was doing the rating. The share attributable to the performance being rated was roughly a fifth. That is not a reason to dismiss feedback, and the first list on this card is the real one. It is a reason not to reorganise your sense of yourself around one number from one person, which is what a bad review invites you to do on the day you get it.',
    attribution: ['Marcus Buckingham'],
    days: [6],
    durationMin: 15,
    anchor: { kind: 'fixed', start: '10:00', windowMin: 240 },
    energy: 'morning',
    tier: 'could',
    neverNag: true,
    sessionType: 'journal',
  },

  // ── JOB CRAFTING ──────────────────────────────────────────────────────
  {
    id: 'job-crafting-two-columns',
    evidenceLevel: 'B',
    title: 'Change one thing about the job itself',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['career', 'behaviour', 'business'],
    summary:
      'Monthly, two columns: one change that helps the work, one change that helps you. Pick one from each and do them this month.',
    why: 'Reshaping your own role, the tasks, the framing, who you do them with, has been tested as an intervention rather than just described, and it raises engagement reliably. The detail that matters is why this card has two columns. The trials that worked asked people to plan for the organisation and for themselves together; the versions covering only one side did much less. So it is not a card about making work nicer. It is a card about making a change you can defend to the person who approves it.',
    attribution: ['Amy Wrzesniewski', 'Jane Dutton', 'Adam Grant'],
    days: [0],
    durationMin: 25,
    anchor: { kind: 'fixed', start: '10:30', windowMin: 240 },
    energy: 'morning',
    tier: 'could',
    duringWork: true,
  },
  {
    id: 'take-on-the-harder-thing',
    evidenceLevel: 'C',
    title: 'Add the harder thing, not just remove the annoying one',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['career', 'business', 'behaviour'],
    summary:
      'Once a quarter, name one genuinely harder piece of work to take on. Ask for it. Do not wait to be offered it.',
    why: 'When the parts of job crafting were separated out and tested against how other people rated the work, one part carried almost all of the performance link: taking on more challenging demands. Cutting the annoying parts, which is the version most people mean by the phrase, performed weakest and did not even group statistically with the others. That is a genuinely useful asymmetry. Reducing the irritating bits of a job makes it less irritating. Adding a harder bit is the one that shows up in what other people see.',
    attribution: [],
    days: [6],
    durationMin: 20,
    anchor: { kind: 'fixed', start: '10:00', windowMin: 240 },
    energy: 'morning',
    tier: 'could',
    duringWork: true,
  },

  // ── SHIFT WORK, AS WORK ───────────────────────────────────────────────
  // The recovery round already wrote the sleep side. These are the roster
  // and arrangement cards, cross-referenced not duplicated.
  {
    id: 'count-the-quick-returns',
    evidenceLevel: 'C',
    title: 'Count the gaps under eleven hours',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['career', 'health', 'behaviour'],
    summary:
      'When next week’s roster lands, mark every gap between shifts shorter than eleven hours. Write the number down. That number is the thing to raise.',
    why: 'The short turnaround between two shifts has a name in the research and a threshold attached to it, and eleven hours is the figure both a large registry study and a hospital trial used. Fewer of them means less sleep lost and less fatigue on shift. The trial is also honest about size: halving them bought a real but modest improvement, not a transformation. You mostly cannot change your own roster, which is exactly why this card is about counting rather than fixing. Turning up to a roster conversation with a number is a different conversation from turning up tired.',
    attribution: [],
    days: [0],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '18:00', windowMin: 300, timeAnchored: true },
    energy: 'any',
    tier: 'could',
    neverNag: true,
    safety: 'Fatigue is a hazard your employer has a legal duty to manage, not a personal weakness. Break entitlements come from your award or agreement rather than from the Act, so read yours before the conversation.',
  },
  {
    id: 'plan-the-ride-home',
    evidenceLevel: 'C',
    title: 'The drive home is the last shift',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['health', 'behaviour', 'family'],
    summary:
      'Before a run of nights starts, arrange how you get home after the last one. A lift, a nap first, a different way. Decide it now, not at seven in the morning.',
    why: 'Driving after a night shift is measurably dangerous, and the reason this card fires days early is that the moment you need the decision is the worst possible moment to make it. At the end of the last night you are impaired, you want to be home, and the arrangement is no longer arrangeable. Four days earlier it costs one message. This is the arrangement; the app already carries the card about not driving, and they are meant to work together.',
    attribution: [],
    days: [1],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '16:00', windowMin: 300, timeAnchored: true },
    energy: 'any',
    tier: 'should',
    neverNag: true,
    safety: 'If you are already at the end of the run with nothing arranged, sleep before driving rather than pushing through. A nap in the car park is not a failure, it is the correct answer.',
  },
  {
    id: 'ask-for-forward-rotation',
    evidenceLevel: 'C',
    title: 'Three words for the roster conversation',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['career', 'health'],
    summary:
      'Before any roster or agreement discussion, take three things that have evidence behind them: forward rotation, faster rotation, and a say in your own shifts.',
    why: 'Most of what gets argued about in roster consultations has nothing behind it. Three things do. Rotating forwards rather than backwards, rotating quickly rather than slowly, and letting people have some say in their own shifts all show up in the review evidence as better for sleep and health. That is a short list and it is worth knowing precisely because it is short. Going in with three specific asks that a manager can look up is a different position from going in with a complaint.',
    attribution: [],
    days: [2],
    durationMin: 15,
    anchor: { kind: 'fixed', start: '12:00', windowMin: 300, timeAnchored: true },
    energy: 'any',
    tier: 'could',
    duringWork: true,
    neverNag: true,
    safety: 'None of this is a promise the answer will be yes, and a roster you cannot change is not a personal failure. Everything an individual can do sits at the bottom of the safety hierarchy; the design of the roster sits near the top, and that is the employer’s job.',
  },

  // ── TRANSITIONS ───────────────────────────────────────────────────────
  // Redundancy and job loss. Every card here is neverNag: a missed day
  // during this means nothing and the app must not add to the pile.
  {
    id: 'the-weekday-shape',
    evidenceLevel: 'B',
    title: 'A start time, a finish time, and one thing outside',
    pillar: 'mind',
    area: 'work',
    goalDomains: ['career', 'behaviour', 'health'],
    summary:
      'While you are between jobs: a fixed time you start, a fixed time you stop, and one reason to leave the house. Every weekday.',
    why: 'When researchers pooled hundreds of studies on what protects wellbeing during unemployment, the strongest things were not about the job search at all. They were having a structure to the day, keeping contact with people, and having ways of coping. The applications matter for getting work. The shape of the day is what keeps you well enough to keep making them. This is the best-evidenced card in the round and it asks nothing about your search.',
    attribution: [],
    days: [1, 2, 3, 4, 5],
    durationMin: 30,
    anchor: { kind: 'wake', offsetMin: 60, windowMin: 180 },
    energy: 'morning',
    tier: 'should',
    neverNag: true,
    safety: 'Job loss is a genuine loss and it is normal for this to be hard. If the low mood is not lifting, your GP is the right door, and Lifeline is 13 11 14.',
  },
  {
    id: 'rehearse-dont-just-send',
    evidenceLevel: 'B',
    title: 'Practise it out loud, with someone',
    pillar: 'mind',
    area: 'work',
    goalDomains: ['career', 'behaviour'],
    summary:
      'One block a week: say your answers out loud to an actual person, and have them push back. Not another hour of applications.',
    why: 'The pooled trials of job-search programmes give an unusually specific instruction. Programmes that taught the skills alone did not work. Programmes that offered encouragement alone did not work. Programmes that did both roughly tripled the odds of finding work. Practising out loud with someone who will push back is the cheapest thing that contains both halves, because it is a skill rehearsal and it is another person in your corner on the same afternoon.',
    attribution: [],
    days: [3],
    durationMin: 45,
    anchor: { kind: 'fixed', start: '10:00', windowMin: 300 },
    energy: 'morning',
    tier: 'should',
    neverNag: true,
  },
  {
    id: 'name-the-rejection-first',
    evidenceLevel: 'C',
    title: 'Write the knockbacks before they arrive',
    pillar: 'mind',
    area: 'work',
    goalDomains: ['career', 'behaviour'],
    summary:
      'Once at the start, then monthly: write the three knockbacks you expect, and one line each on what you will do the day after.',
    why: 'A large randomised job-search trial built this in deliberately and named it as one of the active parts: telling people the setbacks were coming and having them plan for them in advance. It works for the same reason if-then plans work generally, which the app already uses elsewhere. A rejection you planned for is an event. A rejection you did not is a verdict. Writing them down beforehand does not make them pleasant, it makes them survivable on the day.',
    attribution: [],
    days: [0],
    durationMin: 15,
    anchor: { kind: 'fixed', start: '11:00', windowMin: 240 },
    energy: 'morning',
    tier: 'could',
    neverNag: true,
    sessionType: 'journal',
  },
  {
    id: 'list-the-doors-once',
    evidenceLevel: 'D',
    title: 'Write down the doors in week one',
    pillar: 'mind',
    area: 'work',
    goalDomains: ['career', 'finance'],
    summary:
      'Once, early: write down which government and support services exist for your situation, before you need them and before it feels urgent.',
    why: 'Australia has income support, career transition help for people over forty-five, and separate programmes for younger workers and for parents. None of it is hard to find and all of it is harder to face in week six than in week one, when it is still an administrative task rather than an admission. This card is a list, not advice, and it exists because the cost of writing it down early is ten minutes and the cost of not having it later is much higher.',
    attribution: [],
    days: [1],
    durationMin: 15,
    anchor: { kind: 'fixed', start: '10:00', windowMin: 300 },
    energy: 'morning',
    tier: 'could',
    neverNag: true,
    safety: 'What you are eligible for and what any of it pays are questions for Services Australia, not for this app. If money is the immediate problem, the National Debt Helpline on 1800 007 007 is free and its financial counsellors sell nothing.',
  },

  // ── MEETINGS ──────────────────────────────────────────────────────────
  {
    id: 'start-at-the-minute',
    evidenceLevel: 'B',
    title: 'Start it at the minute it says',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['business', 'career', 'behaviour'],
    summary:
      'Any meeting you run starts on time, even with people missing. Especially with people missing.',
    why: 'A field study measured what a late start actually costs and the answer was not just goodwill. Meetings that began around ten minutes late produced ideas that were rated worse in quality and less workable, not merely fewer of them. That makes starting on time the best-supported meeting practice there is and also the only free one. Everything else on the list costs preparation. This costs a decision you make once and then hold.',
    attribution: ['Steven Rogelberg'],
    days: [1, 2, 3, 4, 5],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '09:00', windowMin: 480 },
    energy: 'any',
    tier: 'could',
    duringWork: true,
    neverNag: true,
  },
  {
    id: 'stand-for-the-short-ones',
    evidenceLevel: 'B',
    title: 'Stand up for the short ones',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['business', 'behaviour'],
    summary:
      'For a quick status meeting, take the chairs away. Expect it to be shorter, not better.',
    why: 'When sitting and standing meetings were compared directly, the sitting ones ran about a third longer and produced decisions of the same quality. That is a real saving and it is worth being precise about what it buys. In the same study the standing groups were slightly less satisfied and used slightly less of the information they had. So this is a card about reclaiming minutes from a status update, not a better way to make a decision, and it should never be used for the meeting where something difficult gets worked out.',
    attribution: [],
    days: [1, 2, 3, 4, 5],
    durationMin: 15,
    anchor: { kind: 'fixed', start: '09:30', windowMin: 300 },
    energy: 'any',
    tier: 'could',
    duringWork: true,
    neverNag: true,
  },
  {
    id: 'cameras-off-is-fine-here',
    evidenceLevel: 'B',
    title: 'Say that cameras off is fine',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['business', 'career', 'behaviour'],
    summary:
      'On a heavy day of calls, say out loud that cameras are optional. If you run the meeting, you are the one who can.',
    why: 'A field experiment that actually manipulated the camera found that keeping it on across a day of calls left people more tired, and that the tiredness showed up in how much they spoke and engaged. The effect was larger for women and for newer staff, which is the part that turns this from a personal tip into something a person running the meeting should say. Someone junior asking to turn their camera off is taking a risk. Someone senior saying it is fine here removes the risk for everybody at once.',
    attribution: [],
    days: [1, 2, 3, 4, 5],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '09:00', windowMin: 300 },
    energy: 'any',
    tier: 'could',
    duringWork: true,
    neverNag: true,
  },
  {
    id: 'ten-minutes-after-the-bad-one',
    evidenceLevel: 'C',
    title: 'Ten minutes after the bad one',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['business', 'behaviour'],
    summary:
      'After a meeting that went badly, book ten minutes before the next thing. Not to fix it. To stop carrying it into the next hour.',
    why: 'The cost of a bad meeting does not stop when the meeting does, and survey work on this finds the need to recover afterwards tracks how poor and how irrelevant the meeting felt. What that costs in minutes is not established, and the confident figure that circulates does not trace to anything, so this card does not give you one. What it gives you is the shape: the next hour is where the damage actually lands, and ten booked minutes is a cheap way to keep it out.',
    attribution: [],
    days: [1, 2, 3, 4, 5],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '11:00', windowMin: 420 },
    energy: 'any',
    tier: 'could',
    duringWork: true,
    neverNag: true,
  },

  // ── NON-DESK WORK ─────────────────────────────────────────────────────
  {
    id: 'heat-work-week',
    evidenceLevel: 'B',
    title: 'Build into the heat over a week',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['health', 'behaviour', 'career'],
    summary:
      'First hot week of the season: build up exposure over several days, plan where the shade and the breaks are, and learn the early warning signs.',
    why: 'Working in heat measurably raises the risk of injury and of losing productivity, and the body does adapt, but it adapts over about a week rather than in a day. Planning that week deliberately is the difference between adapting and being caught out on the first thirty-eight degree day. The cheap controls are the ones with the evidence: building up gradually, planned breaks in shade, and knowing what the early signs feel like before they become an emergency.',
    attribution: [],
    days: [1],
    durationMin: 15,
    anchor: { kind: 'fixed', start: '06:30', windowMin: 240, timeAnchored: true },
    energy: 'morning',
    tier: 'should',
    duringWork: true,
    safety: 'Rescheduling or stopping work in extreme heat is the first control in the Australian hierarchy, not the last, and it is the employer’s call to make available. Confusion, stopping sweating, or collapse are emergencies: call 000. If you take medication that affects sweating or fluid balance, ask your pharmacist before a hot run of days.',
  },
  {
    id: 'the-break-is-for-how-you-feel',
    evidenceLevel: 'A',
    title: 'Take the break for the right reason',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['health', 'behaviour'],
    summary:
      'Take the break because it makes the afternoon feel better. Take a longer one after heavy work. Do not take it to get more done.',
    why: 'Pooled trials of short work breaks found a clear improvement in how energetic and how tired people felt, and no reliable improvement in how much they produced, except on the easiest tasks. That is worth knowing rather than hiding, because the productivity promise is the thing that makes people feel guilty about breaks and then skip them. Feeling better through the afternoon is a good enough reason on its own. The other finding is practical: after genuinely heavy work, ten minutes was not enough, and longer breaks did more.',
    attribution: [],
    days: [1, 2, 3, 4, 5],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '10:30', windowMin: 300, timeAnchored: true },
    energy: 'any',
    tier: 'should',
    duringWork: true,
  },

  // ── TIME BACK ─────────────────────────────────────────────────────────
  // Five of twenty-two, about the fifth the contract asks for.
  {
    id: 'stop-building-sandwiches',
    evidenceLevel: 'D',
    title: 'Stop building the feedback sandwich',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['business', 'career', 'behaviour'],
    summary:
      'You can stop wrapping criticism in praise. Say the thing about the work, plainly and kindly, and keep every sentence about the work.',
    why: 'The whole empirical literature on the praise-criticism-praise structure is about three studies. One found it changed what people thought of the feedback and not what they did with it. Another found a benefit in ninety-one students where the authors could not tell whether it came from the structure or simply from there being something positive in the message at all. Meanwhile the big feedback analysis shows that feedback fails when attention moves from the task to the person, and wrapping a criticism in unrelated praise is a technique for making a conversation more about the person. The alternative is not bluntness. It is staying on the work.',
    attribution: ['Kim Scott'],
    days: [2],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '14:00', windowMin: 300 },
    energy: 'any',
    tier: 'could',
    duringWork: true,
    neverNag: true,
  },
  {
    id: 'write-alone-then-pool',
    evidenceLevel: 'A',
    title: 'Write alone first, then pool',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['business', 'career', 'behaviour'],
    summary:
      'Before any idea meeting, everyone writes alone for five minutes. Then pool. Skip the open round-the-table brainstorm.',
    why: 'Groups brainstorming out loud reliably produce fewer and worse ideas than the same people working alone and combining afterwards. That has held up across decades of studies, and the pattern inside it is immediately usable: the loss gets bigger with bigger groups, bigger when someone is watching, and bigger when people speak rather than write. So the fix is not a better facilitator. It is five quiet minutes with a pen before anybody talks, which costs nothing and is the version that tests better.',
    attribution: [],
    days: [1, 2, 3, 4, 5],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '10:00', windowMin: 360 },
    energy: 'any',
    tier: 'could',
    duringWork: true,
    neverNag: true,
  },
  {
    id: 'stop-worrying-about-multitasking',
    evidenceLevel: 'C',
    title: 'Stop worrying about multitasking either way',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['behaviour', 'career'],
    summary:
      'You cannot train yourself to multitask, and you have not damaged your brain by trying. Keep the one thing that does hold: switching costs, so batch the switches.',
    why: 'Two beliefs circulate here and neither survives. There is no good evidence that multitasking improves with practice. There is also no solid evidence for the frightening half, that heavy multitaskers have worse attention: the original finding did not replicate cleanly and the pooled association went away once small-study effects were corrected for. What does hold is that switching between tasks costs something each time, which the app already covers. That is the whole of it, and it means the guilt was doing no work.',
    attribution: [],
    days: [3],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '12:00', windowMin: 300 },
    energy: 'any',
    tier: 'could',
    neverNag: true,
  },
  {
    id: 'the-personality-workshop',
    evidenceLevel: 'D',
    title: 'The personality test is not a team plan',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['business', 'career'],
    summary:
      'You can skip building a team around type letters. Keep the conversation the workshop started, and drop the instrument.',
    why: 'The popular workplace type instruments give unstable results on retest and there is no body of evidence that a type predicts how someone performs or how a team does. That is not the same as saying the day was worthless. Getting a team to talk openly about how each of them prefers to work is genuinely useful, and it is the conversation doing that, not the letters. Keep the conversation, have it for free, and spend the budget on something with evidence behind it.',
    attribution: [],
    days: [6],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '11:00', windowMin: 300 },
    energy: 'any',
    tier: 'could',
    neverNag: true,
  },
  {
    id: 'the-open-plan-promise',
    evidenceLevel: 'B',
    title: 'Open plan did not make you talk more',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['business', 'behaviour'],
    summary:
      'If the open office is not producing the collaboration it promised, that is the normal result. Book the conversation you need rather than waiting to bump into it.',
    why: 'Two companies were measured with wearable sensors and message logs before and after moving to open plan, which is a much better test than asking people how they feel about it. Face-to-face interaction fell by around seventy percent, and electronic messaging rose to replace it. People appear to withdraw when they lose the ability to control who can see and hear them. So the collaboration the layout promised does not arrive by proximity, and waiting to bump into someone is not a plan. Ask for the ten minutes.',
    attribution: [],
    days: [4],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '10:00', windowMin: 360 },
    energy: 'any',
    tier: 'could',
    duringWork: true,
    neverNag: true,
  },
];

/**
 * Training round — candidate protocols. NOT wired into the app.
 *
 * Written 2026-09-08 under the restructured pipeline. Gate 1 mined
 * nutrition and training together from the shared corpus index; Gate 2
 * verified every paper at registry level. Ledgers in ledgers/, a row per
 * card in sources.md, the rest in findings.md, episodes.md and ladder.md.
 *
 * EIGHT cards, not fifteen. The brief calls this the coach Isaac rates
 * highest and says the job is depth and honesty, not rescue. The round's
 * single most important output is not a card at all — it is the regrade
 * of `strength-minimum-weekly` from A to B, which is recorded in the
 * recovery round because that is where the card lives.
 *
 * TWO THINGS SHAPED THE COPY.
 *
 * 1. The brief's number-one topic is the least training that still works,
 *    and the review addressing it directly turns out to be much smaller
 *    than its title: six studies, a single-reviewer search, within-group
 *    pre-post with no controls, men only. Its authors' own phrase is
 *    "suboptimal, yet significant", and `one-set-week` uses it, because
 *    it is the honest and the encouraging framing at the same time.
 *
 * 2. The strongest evidence in the whole pillar — 219 randomised trials
 *    and 167,864 people on preventing falls — has zero podcast coverage.
 *    It ships with an empty attribution, and it is the best card here.
 *
 * Every card carries a safety line; the integrity test enforces it on
 * this pillar and it is right to.
 *
 * Grade spread: A 0 · B 2 · C 5 · D 1 · E 0 (8 candidates).
 * Nothing was graded up. The pillar moves from 48% to 43% A and B.
 *
 * Nothing here reaches a phone until a human has read it.
 */

import type { Protocol } from '@/features/knowledge/protocols';

export const TRAINING_CANDIDATES: Protocol[] = [
  {
    id: 'one-set-week',
    evidenceLevel: 'C',
    title: 'The week that collapsed',
    pillar: 'training',
    area: 'health',
    goalDomains: ['fitness', 'health', 'behaviour'],
    summary:
      'When the week falls apart: one hard set each of a squat, a press and a pull, twice or three times. Fifteen minutes. That is the whole session.',
    why: 'A review that went looking for the least training that still builds strength found that a single hard set per exercise, done a couple of times a week, produces real gains. The authors\' own phrase for it is "suboptimal, yet significant", and that is exactly the right framing: this is not your best week and it still counts. Be aware the review is small, six studies, no control groups and men only, so treat the size of the gain as roughly right rather than precise. What is not in doubt is the direction. Fifteen minutes beats the zero you were considering.',
    attribution: [],
    days: [1, 4],
    durationMin: 15,
    anchor: { kind: 'fixed', start: '17:30', windowMin: 240 },
    energy: 'any',
    tier: 'should',
    sessionType: 'workout',
    safety: 'Close to failure is not grinding. Stop the set when your form changes, not when the rep fails. Two lighter ramping sets first, because one working set does not mean a cold one. Never push through joint pain. Educational structure, not medical advice.',
  },
  {
    id: 'steady-on-your-feet',
    evidenceLevel: 'B',
    title: 'Steady on your feet',
    pillar: 'training',
    area: 'health',
    goalDomains: ['health', 'fitness'],
    summary:
      'Past sixty-five: two or three sessions a week that mix balance work with resistance work, kept up for at least three months.',
    why: 'This is the best-evidenced thing in the whole training pillar and almost nobody talks about it. A network analysis of two hundred and nineteen randomised trials covering a hundred and sixty-seven thousand people found that balance and resistance work together is what prevents falls. Three things in it make this warmer than it sounds. It was the format participants preferred over the alternatives. Doing it alone rather than in a group was also preferred, with high confidence, so home is the version people actually want. And adding more components did not add benefit, which means nobody needs a programme. The honest caveat is that the trials were supervised and ran longer than three months, so this is the unsupervised approximation of a supervised thing.',
    attribution: [],
    days: [1, 3, 5],
    durationMin: 25,
    anchor: { kind: 'fixed', start: '10:00', windowMin: 300 },
    energy: 'any',
    tier: 'should',
    sessionType: 'workout',
    safety: 'Something solid within reach for every set — a bench, a worktop, a door frame. No eyes-closed balance work unless somebody is with you. If you have fallen in the last year, feel dizzy on standing, or take medication that affects balance, start this with a doctor or physiotherapist rather than alone; the trials behind it were supervised and people at real risk should be too. Educational structure, not medical advice.',
  },
  {
    id: 'exercise-snacks',
    evidenceLevel: 'B',
    title: 'Three short hard bursts',
    pillar: 'training',
    area: 'health',
    goalDomains: ['fitness', 'health', 'behaviour'],
    summary:
      'If you do no formal exercise at all: three to five bursts of about a minute, hard, spread through the day. Stairs, a hill, anything that makes talking difficult.',
    why: 'For someone doing nothing, the gap between nothing and a little is the biggest gap there is, and it does not require a gym or a change of clothes. Short vigorous bursts scattered through an ordinary day improve fitness in randomised trials, and very large activity-tracker studies find that brief bursts occurring naturally in daily life track lower mortality. This is explicitly the card for people who are not going to start training, and the bursts have to be genuinely hard for about a minute. Walking to the shops does not count; walking up the hill to the shops fast does.',
    attribution: [],
    days: [0, 1, 2, 3, 4, 5, 6],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '09:00', windowMin: 600 },
    energy: 'any',
    tier: 'should',
    safety: 'Hard means hard for you: breathing too heavily to hold a conversation, not flat out. If you have a heart condition, chest pain on exertion, or have been inactive for years, talk to a doctor before adding vigorous bursts. Stop for chest pain, unusual breathlessness or dizziness and get it looked at. Educational structure, not medical advice.',
  },
  {
    id: 'add-one-to-your-estimate',
    evidenceLevel: 'C',
    title: 'You have one more than you think',
    pillar: 'training',
    area: 'health',
    goalDomains: ['fitness', 'behaviour'],
    summary:
      'On the last set of a lift you know well: when you feel you have two reps left, you probably have three. Do one of them.',
    why: 'People are reliably conservative about how close they are to failure, and the size of the error has been measured: about one repetition, in the same direction almost every time. That matters because most of what makes a set productive happens in the last few hard repetitions, so a consistent one-rep underestimate means quietly training a bit easier than you think you are. This is a calibration nudge rather than an instruction to grind, and it applies to the last set of a movement you are confident in, not to a new lift or a heavy single.',
    attribution: [],
    days: [1, 4],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '17:30', windowMin: 300 },
    energy: 'any',
    tier: 'could',
    safety: 'Only on a lift you know well, with the bar in a position you can safely fail or rack. Not on a heavy single, not on a new movement, and not when you are alone under a loaded bar without safety pins. Form changing is the signal to stop regardless of how many reps you think are left. Educational structure, not medical advice.',
  },
  {
    id: 'two-in-the-tank-for-strength',
    evidenceLevel: 'C',
    title: 'Leave two in the tank',
    pillar: 'training',
    area: 'health',
    goalDomains: ['fitness', 'health'],
    summary:
      'If what you want is to be stronger rather than bigger, stop each set about two repetitions short. You do not have to go to failure.',
    why: 'Training to the point where the next repetition is impossible feels like the serious option and mostly is not. When proximity to failure was compared directly, strength gains were similar whether people stopped a couple of reps short or went all the way, while going to failure cost more fatigue and made the next session worse. Size is a slightly different question and does respond to pushing closer. So if strength is the goal, stopping short is not the soft version, it is the version that lets you do the next session properly.',
    attribution: [],
    days: [1, 4],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '17:30', windowMin: 300 },
    energy: 'any',
    tier: 'could',
    safety: 'Leaving repetitions is the conservative choice and needs no caution of its own. The usual applies: warm up, stop when form changes, and do not train through joint pain. Educational structure, not medical advice.',
  },
  {
    id: 'move-one-lift-fast',
    evidenceLevel: 'C',
    title: 'Move one lift fast',
    pillar: 'training',
    area: 'health',
    goalDomains: ['fitness', 'health'],
    summary:
      'Past sixty: on one exercise a session, drive the lifting phase as fast as you can while keeping the lowering slow and controlled.',
    why: 'Strength and power are not the same thing, and power fades earlier. Power is what catches you when you trip and what gets you out of a low chair, so it is worth training on purpose rather than hoping it comes along with everything else. The way to train it is not heavier, it is faster: same weight, intent to move it quickly on the way up. The trials here are smaller than the falls-prevention evidence and one of them overstates its own non-significant results, so treat this as a sensible addition to work you are already doing rather than a replacement for it.',
    attribution: [],
    days: [1, 4],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '10:00', windowMin: 300 },
    energy: 'any',
    tier: 'could',
    safety: 'Fast on the way up, controlled on the way down, and never a rushed or bouncing descent, which is where people get hurt. Not on a maximal load. If you have joint replacements, osteoporosis, or a history of back or shoulder injury, run this past a physiotherapist first. Educational structure, not medical advice.',
  },
  {
    id: 'load-the-tendons',
    evidenceLevel: 'C',
    title: 'Slow and heavy, through the full range',
    pillar: 'training',
    area: 'health',
    goalDomains: ['fitness', 'health'],
    summary:
      'Once or twice a week, include one exercise done slowly and heavily through a long range. Tendons adapt to load, and they need a different kind of it.',
    why: 'Tendons are slower to adapt than muscle, and the thing they adapt to is high strain rather than high volume or high speed. That is why the achy tendon usually shows up when training has been going well: the muscle got stronger faster than the tissue attaching it. Slow heavy work through a long range is what the evidence points at. It is not a treatment for a painful tendon, which is a different problem needing a different plan, and the studies here are modest, so this is a sensible inclusion rather than a guarantee.',
    attribution: [],
    days: [2],
    durationMin: 15,
    anchor: { kind: 'fixed', start: '17:30', windowMin: 300 },
    energy: 'any',
    tier: 'could',
    safety: 'This is for healthy tendons. A tendon that is already painful, swollen, or worse the morning after is a physiotherapist conversation, not a heavier session. Build the load over weeks rather than sessions, because tendons adapt more slowly than the muscles pulling on them. Educational structure, not medical advice.',
  },
  {
    id: 'ride-on-cardio-days',
    evidenceLevel: 'D',
    title: 'Ride rather than run on cardio days',
    pillar: 'training',
    area: 'health',
    goalDomains: ['fitness'],
    summary:
      'If you are lifting for strength and also doing cardio, put the cardio on a bike rather than a run where you can, and not right before legs.',
    why: 'Doing endurance work alongside lifting costs a little of the strength and size you would otherwise get, and the size of that cost depends on what kind of cardio and when. Running appears to cost more than cycling, plausibly because of the eccentric loading, and the interference is smaller when the two are further apart in the day or the week. The effect is modest and the evidence is a set of small studies rather than anything definitive, so this is a preference rather than a rule, and doing the cardio you will actually do beats optimising which kind.',
    attribution: [],
    days: [3],
    durationMin: 30,
    anchor: { kind: 'fixed', start: '17:00', windowMin: 300 },
    energy: 'any',
    tier: 'could',
    safety: 'Nothing here asks anyone to train harder, so the only caution is the ordinary one: if cardio is new to you and you have a heart condition or risk factors, start it with a doctor. Educational structure, not medical advice.',
  },
];

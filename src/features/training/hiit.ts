/**
 * Interval sessions, as a library you choose from rather than one shape
 * the app decided on.
 *
 * Isaac: "I think HIIT should be planned but then also selectable or
 * changeable. Have different HIIT options as well."
 *
 * Until now the block built exactly one conditioning session per distance
 * goal and that was that. Which is a fair default and a poor offer: hard
 * intervals are the single most protocol-sensitive thing in the programme,
 * and the right one depends on equipment, joints, how long you have, and
 * how much punishment you are actually up for on a Tuesday.
 *
 * ── WHY THESE EIGHT ─────────────────────────────────────────────────────
 *
 * Every session here is a named protocol from a published trial, not a
 * shape invented to fill a grid. Each carries where it came from and what
 * that trial actually found, because the gap between "this is the Tabata
 * protocol" and what Tabata's group actually did is enormous and almost
 * universally misrepresented — theirs was 170% of VO₂max on a cycle
 * ergometer in competitive speed skaters, which is not four minutes of
 * burpees in a class.
 *
 * ── THE HONESTY RULES ───────────────────────────────────────────────────
 *
 * 1. Effort is described in what a person can FEEL — breathing, whether
 *    they could speak, how the last round should land — never as a heart
 *    rate percentage. Percentage of max heart rate needs a measured max,
 *    almost nobody has one, and 220-minus-age has a standard deviation of
 *    about 10 beats either way. A number that precise about a number that
 *    rough is a lie with decimal places.
 *
 * 2. The all-out protocols are gated. Tabata and Wingate sprints are
 *    genuinely maximal efforts studied in trained people; offering them
 *    beside a gentle walk-jog as though they were the same kind of choice
 *    is how somebody gets hurt. They need a base behind them, and they are
 *    never offered where a constraint rules out hard intervals.
 *
 * 3. Nothing here is offered at all beside a heart condition, a pregnancy
 *    or an injury being recovered from. That is `rulesOutHardIntervals`,
 *    already the rule for the programme's own conditioning day, and it is
 *    a veto rather than a scaling: the answer there is easy pace.
 */

import type { EvidenceLevel } from '@/features/knowledge/protocols';
import { rulesOutHardIntervals } from '@/features/training/constraints';
import type { PhysicalConstraint } from '@/types/domain';

/** What you can do a session on. 'any' means the shape does not care. */
export type CardioMode = 'any' | 'bike' | 'row' | 'run' | 'lowImpact';

export const MODE_LABEL: Record<CardioMode, string> = {
  any: 'Anything',
  bike: 'Bike',
  row: 'Rower',
  run: 'Running',
  lowImpact: 'Easy on the joints',
};

/**
 * How hard the session is, which decides what it needs behind it.
 *
 *  - moderate: safe as a first interval session for anybody cleared to
 *    exercise. You finish able to hold a conversation again within a
 *    minute.
 *  - hard: needs some aerobic base. The standard research protocols.
 *  - allOut: maximal. Needs months of consistent work behind it, and is
 *    not offered otherwise.
 */
export type HiitDemand = 'moderate' | 'hard' | 'allOut';

export interface HiitSession {
  id: string;
  /** Plain name, in the words people use for it. */
  name: string;
  /** The shape in one line, e.g. "4 min hard / 3 min easy × 4". */
  shape: string;
  workSec: number;
  restSec: number;
  rounds: number;
  warmupMin: number;
  cooldownMin: number;
  /** Warm-up, work, recoveries and cool-down, rounded to the minute. */
  totalMin: number;
  demand: HiitDemand;
  /** Modes this shape actually works on. */
  modes: CardioMode[];
  /** What "hard" means here, in what you can feel. Never a heart rate. */
  effort: string;
  /** What the recovery should look like, which people get wrong. */
  recovery: string;
  evidenceLevel: EvidenceLevel;
  /** Where it comes from and what the trial actually found. */
  origin: string;
  /** Who should pick this one. */
  suits: string;
  /** The thing that most often goes wrong with this session. */
  watchFor: string;
}

export const HIIT_SESSIONS: HiitSession[] = [
  {
    id: 'four-by-four',
    name: 'Four by four',
    shape: '4 minutes hard / 3 minutes easy × 4',
    workSec: 240,
    restSec: 180,
    rounds: 4,
    warmupMin: 10,
    cooldownMin: 5,
    totalMin: 42,
    demand: 'hard',
    modes: ['any', 'bike', 'row', 'run', 'lowImpact'],
    effort:
      'Hard enough that you can get out three or four words, not a sentence. The fourth minute should feel like it is asking something of you; if minute four feels the same as minute one, go harder next round.',
    recovery:
      'Keep moving through the three minutes, gently. Standing still lets your heart rate drop further than the next interval wants it to.',
    evidenceLevel: 'B',
    origin:
      'The Norwegian protocol. In Wisløff and colleagues’ 2007 trial in Circulation, twenty-seven people with heart failure after a heart attack did this three times a week for twelve weeks and improved their peak oxygen uptake by 46%, against 14% for the group doing steady moderate work. That population is the point and the caveat both: a striking result, in patients, under supervision, and a small trial.',
    suits:
      'The default. If you are going to do one interval session a week and want the one with the most evidence behind it, this is it.',
    watchFor:
      'Going too hard in round one and fading. The session works because all four rounds are the same; the first should feel almost too easy to be worth it.',
  },
  {
    id: 'ten-by-one',
    name: 'Ten by one',
    shape: '1 minute hard / 1 minute easy × 10',
    workSec: 60,
    restSec: 60,
    rounds: 10,
    warmupMin: 3,
    cooldownMin: 2,
    totalMin: 25,
    demand: 'hard',
    modes: ['any', 'bike', 'row', 'lowImpact'],
    effort:
      'Hard, and by round seven you will want it to be over. A minute is short enough that you can push properly and long enough that it counts.',
    recovery: 'Pedal or move easily for the minute. It is not long — start the next one on time.',
    evidenceLevel: 'B',
    origin:
      'The practical HIIT protocol out of Gibala’s lab at McMaster, built deliberately as a version of the all-out work that ordinary people could actually do. Replicated repeatedly in small trials in sedentary adults and in type 2 diabetes.',
    suits:
      'A short week. Twenty-five minutes door to door, no equipment assumptions, and it is the most forgiving of the hard sessions — a minute is over before form falls apart.',
    watchFor:
      'Treating it as ten sprints. It is ten hard minutes, not ten maximal ones; pace it so round ten is still honest.',
  },
  {
    id: 'thirty-thirty',
    name: 'Thirty on, thirty off',
    shape: '30 seconds hard / 30 seconds easy × 12',
    workSec: 30,
    restSec: 30,
    rounds: 12,
    warmupMin: 10,
    cooldownMin: 5,
    totalMin: 27,
    demand: 'hard',
    modes: ['any', 'run', 'bike', 'row'],
    effort:
      'Brisk and strong rather than all-out — the pace you could hold for about six minutes if you had to, held for thirty seconds at a time.',
    recovery: 'Keep jogging or spinning through the thirty seconds. This one lives or dies on the recovery staying active.',
    evidenceLevel: 'C',
    origin:
      'Billat’s 30/30, developed in running research as a way to accumulate time near maximal oxygen uptake without the session falling apart. Well established in coaching practice; the trial base is smaller and mostly in runners.',
    suits:
      'Runners, and anybody who finds four-minute intervals mentally brutal. The work is over before you can talk yourself out of it.',
    watchFor:
      'Sprinting the thirty seconds. At a true sprint you will not finish twelve, and finishing twelve is the session.',
  },
  {
    id: 'ten-twenty-thirty',
    name: 'Ten, twenty, thirty',
    shape: '30s easy, 20s moderate, 10s near-sprint — five in a row, three or four times',
    workSec: 60,
    restSec: 120,
    rounds: 4,
    warmupMin: 8,
    cooldownMin: 5,
    totalMin: 33,
    demand: 'hard',
    modes: ['run', 'any', 'bike'],
    effort:
      'Read it backwards: the ten seconds is the point and it is nearly flat out. The thirty and twenty before it are the run-up, not the session.',
    recovery: 'Two minutes walking or very easy between blocks of five. Take all of it.',
    evidenceLevel: 'C',
    origin:
      'Gunnarsson and Bangsbo’s 10-20-30 concept, tested in trained recreational runners who cut their training volume by half, ran faster over 5km, and improved several blood markers. Small, and in runners who already had a base.',
    suits:
      'Somebody who likes running and is bored. It is the most playful of these and the time passes fastest.',
    watchFor:
      'The thirty seconds drifting up to a jog. It is meant to be genuinely easy — that is what pays for the ten.',
  },
  {
    id: 'hill-repeats',
    name: 'Hill repeats',
    shape: '45 seconds up hard / walk down × 8',
    workSec: 45,
    restSec: 105,
    rounds: 8,
    warmupMin: 10,
    cooldownMin: 5,
    totalMin: 35,
    demand: 'hard',
    modes: ['run', 'any'],
    effort:
      'Strong and controlled up the hill. The gradient does the work of making it hard, so you do not have to chase speed.',
    recovery: 'Walk back down, properly slowly. The walk down is the interval timer.',
    evidenceLevel: 'C',
    origin:
      'Long-standing endurance coaching practice rather than one named trial. The mechanism is well understood — a gradient raises effort at a lower speed, which means a lower landing force per stride than flat running at the same effort.',
    suits:
      'Runners whose knees or shins complain about flat intervals, and anybody with a hill and no equipment. Gentler on impact than it feels.',
    watchFor:
      'Running down the hill. Downhill running is the highest-load thing in the session and the reason people get sore from this one.',
  },
  {
    id: 'fartlek',
    name: 'Play with the pace',
    shape: 'Pick a landmark, go hard to it, ease off to the next. Twelve minutes of that, or as long as you like.',
    workSec: 0,
    restSec: 0,
    rounds: 0,
    warmupMin: 5,
    cooldownMin: 3,
    // The only elastic session here: it has no rounds to finish, so it is
    // whatever length the day has. Twenty minutes is the honest floor at
    // which it is still worth calling a session, and it is why this is
    // what gets offered when nothing structured fits.
    totalMin: 20,
    demand: 'moderate',
    modes: ['run', 'any', 'bike'],
    effort:
      'Harder than comfortable on the surges. There is no target — the lamp post decides how long the interval is, and that is the whole idea.',
    recovery: 'Until you feel like going again. Genuinely.',
    evidenceLevel: 'D',
    origin:
      'Fartlek — Swedish for speed play — from 1930s Swedish distance coaching. Nobody has run a trial on it because it has no fixed protocol to trial; it is here because unstructured hard-easy work is still hard-easy work, and it is the session people actually do when a rigid one would have been skipped.',
    suits:
      'A first interval session ever, a day when the structured one feels like too much, or anybody who hates a timer.',
    watchFor:
      'Nothing much. This one is hard to get wrong, which is rather the point of it.',
  },
  {
    id: 'tabata',
    name: 'Tabata',
    shape: '20 seconds all-out / 10 seconds rest × 8',
    workSec: 20,
    restSec: 10,
    rounds: 8,
    warmupMin: 10,
    cooldownMin: 5,
    totalMin: 19,
    demand: 'allOut',
    modes: ['bike', 'row'],
    effort:
      'Everything you have, eight times, on four minutes of clock. If you can finish round eight at the same output as round one you did not start hard enough — and that is not a recommendation so much as a warning about what this actually is.',
    recovery: 'Ten seconds. That is not a typo and it is why this is the hardest thing on the list.',
    evidenceLevel: 'C',
    origin:
      'Tabata and colleagues, 1996: competitive speed skaters on a cycle ergometer at about 170% of VO₂max, four days a week for six weeks, and anaerobic capacity rose 28%. Almost everything sold as "Tabata" bears no relation to that — the protocol is a specific maximal effort on a bike in trained athletes, not a four-minute class format. It is here in its real form or not at all.',
    suits:
      'Somebody with months of consistent conditioning behind them, on a bike or a rower where output is controlled and there is nothing to trip over.',
    watchFor:
      'Doing it on your feet, or doing it with a barbell. Maximal effort plus fatigue plus a loaded movement is where injuries come from. Bike or rower.',
  },
  {
    id: 'sprint-intervals',
    name: 'Sprint intervals',
    shape: '20 seconds all-out / 2 minutes very easy × 3',
    workSec: 20,
    restSec: 120,
    rounds: 3,
    warmupMin: 2,
    cooldownMin: 3,
    totalMin: 10,
    demand: 'allOut',
    modes: ['bike', 'row'],
    effort:
      'Three genuinely maximal twenty-second efforts. One minute of hard work in a ten-minute session, and it will not feel like a small thing.',
    recovery: 'Two minutes of very easy spinning. Take every second — the sprints are only maximal if the recovery was real.',
    evidenceLevel: 'B',
    origin:
      'Gibala’s group, PLOS One 2016: twelve weeks of this against forty-five minutes of moderate cycling, and peak oxygen uptake rose 19% in both, with the sprint group doing a fifth of the exercise volume. Small (about two dozen sedentary men) and worth noting the endpoint was fitness and cardiometabolic markers, not anything longer-term.',
    suits:
      'The genuinely time-poor week, on a bike or rower, with a base already there. Ten minutes, and one of the better-supported results in the field.',
    watchFor:
      'That "all-out" means all-out. Three-quarter effort turns this into ten minutes of nothing much; it is the intensity, not the format, that the trial tested.',
  },
];

export function hiitById(id: string): HiitSession | undefined {
  return HIIT_SESSIONS.find((s) => s.id === id);
}

/**
 * The sessions worth offering this person.
 *
 * Empty where a constraint vetoes hard intervals — the caller shows easy
 * pace instead, and says why, rather than showing a shorter list as though
 * the person had simply been given fewer options.
 */
export function hiitOptions(
  constraints: PhysicalConstraint[] | undefined,
  opts: { hasBase?: boolean; minutesAvailable?: number } = {},
): HiitSession[] {
  if (rulesOutHardIntervals(constraints)) return [];
  const { hasBase = false, minutesAvailable } = opts;
  return HIIT_SESSIONS.filter((s) => {
    if (s.demand === 'allOut' && !hasBase) return false;
    if (minutesAvailable !== undefined && s.totalMin > minutesAvailable) return false;
    // Impact work is not the thing to offer somebody managing joints.
    if (constraints?.includes('joints') && !s.modes.includes('lowImpact')) return false;
    return true;
  });
}

/**
 * The one to plan when the person has not chosen.
 *
 * Four by four where it fits, because it has the most behind it. Ten by one
 * where the day is shorter. Play with the pace where neither fits, since a
 * short unstructured session is still a session.
 */
export function defaultHiit(
  constraints: PhysicalConstraint[] | undefined,
  opts: { hasBase?: boolean; minutesAvailable?: number } = {},
): HiitSession | null {
  const options = hiitOptions(constraints, opts);
  if (options.length === 0) return null;
  for (const id of ['four-by-four', 'ten-by-one', 'thirty-thirty', 'fartlek']) {
    const found = options.find((s) => s.id === id);
    if (found) return found;
  }
  return options[0];
}

/** Why nothing is offered, when nothing is. Said plainly, never as a lock. */
export function whyNoIntervals(constraints: PhysicalConstraint[] | undefined): string | null {
  if (!rulesOutHardIntervals(constraints)) return null;
  return 'Hard intervals are not offered beside what you told us you are managing. That is a line rather than a setting — easy, talking-pace work is the conditioning here, and it is not a lesser version of this. Your doctor is the person who can change that answer.';
}

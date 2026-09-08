/**
 * Deterministic scheduling engine.
 *
 * The engine — not an LLM — decides where activities can legally go. It
 * computes free windows around fixed commitments, then places flexible
 * routines into those windows honouring preferred times, priority tiers,
 * buffers, and a hard rule that a day is never fully packed. AI layers on
 * top of this can prioritise, explain, and suggest trade-offs among valid
 * placements, but can never invent an invalid schedule.
 */

import { bandFor, demandOf, overlapWith, type DayEnergy, type EnergyPlacement } from '@/lib/scheduling/energy';
import { dateKeyToDate, toHHMM, toMinutes, newId, weekdayOf } from '@/lib/dates';
import type { DailyPlan, LifeArea, PlanItem, PlanTier, Routine } from '@/types/domain';

export type { DayEnergy, EnergyPlacement } from '@/lib/scheduling/energy';

export interface FixedCommitment {
  title: string;
  start: string;
  end: string;
  area?: PlanItem['area'];
  sessionType?: PlanItem['sessionType'];
  /** Carried when the commitment is a carved-out routine (a growth block):
   * without these the plan item can't launch its session or feed learning. */
  routineId?: string;
  goalId?: string;
}

export interface DayContext {
  date: string; // "YYYY-MM-DD"
  wakeTime: string;
  sleepTime: string;
  fixed: FixedCommitment[];
  routines: Routine[];
  /** goalId → the goal's next step; stamped as `focus` on goal-linked items
   * so every block on the plan knows what it is moving forward. */
  goalFocus?: Record<string, string>;
  /**
   * Routine id → evidence rank, best first, for routines backed by a
   * protocol. The planner builds it; see evidenceRankFor(). Omitted, the
   * day is placed and cut exactly as it was before evidence existed.
   */
  evidenceRank?: Record<string, number>;
  /** Minutes of breathing room enforced between scheduled items. */
  bufferMin?: number;
  /**
   * Fraction of free time that must remain unscheduled (0..1).
   * Days need slack; the engine refuses to fill every minute.
   */
  reservedFreeFraction?: number;
  /**
   * The user's life areas, most important first — the answer to the
   * interview's second question.
   *
   * Until this existed, that answer was captured, shown back on the plan
   * review, handed to an AI layer that is switched off, and then ignored by
   * the only code that could act on it. The interview says, in as many
   * words, "when two things want the same hour, family wins"; what actually
   * decided was whichever routine happened to have the narrower preferred
   * window. The promise was not merely unimplemented, it was contradicted.
   */
  priorities?: LifeArea[];
  /**
   * Where this person's energy sits today — peak, dip and second wind, as
   * `energyShape` computes them from the wake time and the chronotype
   * answer. Optional: a day built without it places exactly as before.
   *
   * It is a tie-break and only ever a tie-break. See
   * `src/lib/scheduling/energy.ts` for what that means and why.
   */
  energy?: DayEnergy;
}

export interface Window {
  start: number; // minutes from midnight
  end: number;
}

const DEFAULT_BUFFER_MIN = 15;
const DEFAULT_RESERVED_FRACTION = 0.25;
/** Don't schedule flexible items into slivers shorter than this. */
const MIN_USEFUL_WINDOW = 20;
/**
 * The floor for the second placement pass.
 *
 * Twenty minutes is the right size for a gap the first pass will consider:
 * below it a window is a sliver, and filling slivers is how a plan becomes
 * a wall. But a five-minute practice that has already failed to get a real
 * window is not competing for one any more — the choice is an eighteen-minute
 * gap or nothing at all, and nothing at all is the worse plan. Nothing in
 * the library is shorter than five minutes, so this is the smallest gap
 * that can ever hold anything.
 */
const MIN_SECOND_PASS_WINDOW = 5;

const TIER_ORDER: Record<PlanTier, number> = { must: 0, should: 1, could: 2 };

/** Free windows between wake and sleep, minus fixed commitments and buffers. */
export function computeFreeWindows(
  fixed: FixedCommitment[],
  wakeTime: string,
  sleepTime: string,
  bufferMin: number = DEFAULT_BUFFER_MIN,
  /** Shortest gap worth returning. Lower it to see the slivers. */
  minWindowMin: number = MIN_USEFUL_WINDOW,
): Window[] {
  const dayStart = toMinutes(wakeTime);
  let dayEnd = toMinutes(sleepTime);
  if (dayEnd <= dayStart) dayEnd += 1440; // sleep after midnight

  const busy = fixed
    .map((f) => {
      let start = toMinutes(f.start);
      let end = toMinutes(f.end);
      if (end < start) end += 1440;
      // Pad commitments with buffer so items don't butt up against them.
      return { start: start - bufferMin, end: end + bufferMin };
    })
    .sort((a, b) => a.start - b.start);

  const windows: Window[] = [];
  let cursor = dayStart;
  for (const b of busy) {
    if (b.start > cursor) {
      windows.push({ start: cursor, end: Math.min(b.start, dayEnd) });
    }
    cursor = Math.max(cursor, b.end);
    if (cursor >= dayEnd) break;
  }
  if (cursor < dayEnd) windows.push({ start: cursor, end: dayEnd });

  return windows.filter((w) => w.end - w.start >= minWindowMin);
}

export interface Placement {
  routine: Routine;
  start: number;
  end: number;
  /**
   * Where the routine ASKED to go, when it did not get it.
   *
   * The visible half of arbitration is almost never a drop. A day rarely
   * refuses something outright — flexible routines simply spill into
   * whatever gap is left, so five things competing for one evening all get
   * placed and the person is told nothing. What actually happened is that
   * four of them MOVED, and which one kept its hour is the decision worth
   * naming.
   */
  movedFrom?: number;
}

/**
 * Where a routine's life area sits in what the user said matters.
 *
 * Anything outside the chosen three ranks last, and anything with no area
 * ranks after that — an unclassified routine should never beat something
 * the person explicitly named.
 */
export function areaRank(area: LifeArea | undefined, priorities: LifeArea[] = []): number {
  if (!area) return priorities.length + 1;
  const i = priorities.indexOf(area);
  return i === -1 ? priorities.length : i;
}

export interface PlacementResult {
  placements: Placement[];
  unplaced: Routine[];
  /** Routines the energy shape actually moved, and the band it moved them to. */
  energy: EnergyPlacement[];
}

export interface PlacementOptions {
  /**
   * The same day's free windows, computed without the twenty-minute floor.
   * Only the second pass looks at them, and only for routines the first
   * pass could not seat at all. Omitted, the second pass runs over the
   * ordinary windows and simply finds less.
   */
  fineWindows?: Window[];
  /** The person's peak, dip and second wind. A tie-break; see energy.ts. */
  energy?: DayEnergy;
  /**
   * Routine id → evidence rank, best first, for the routines that have one.
   * Supplied by the planner from the knowledge base so this module stays
   * free of it. Absent for anything the person brought themselves.
   */
  evidenceRank?: Record<string, number>;
}

/**
 * Place routines into free windows.
 *
 * Order: protected first (they anchor the day), then by tier, THEN by the
 * user's stated life-area priority, then by how narrow the preferred window
 * is. A routine that cannot fit is omitted and reported in `unplaced`.
 *
 * Between the tier and the area sits one more key: whether the routine
 * serves an active goal. A goal is a specific commitment this person made;
 * a life-area ranking is a general preference stated once at onboarding,
 * and the specific should beat the general. This is not a refinement — the
 * cohort simulation showed that ordering by area alone took goals still
 * stalled after ten weeks from 25% to 33%, because goals living outside
 * someone's top three areas were the first thing cut every single day. The
 * app would then have nagged them about a goal its own scheduler starved.
 *
 * Priority is a tie-break WITHIN a tier, deliberately, and not above it.
 * Tier encodes whether something is negotiable at all; if priority
 * outranked it, a 'could' item in a favoured area would displace a 'must'
 * elsewhere — a plan that drops the school pickup to protect a workout
 * because health was ranked first. What the person actually meant is
 * narrower and more sensible: when two things have equal claim on the same
 * hour, the one in the area they care most about takes it.
 */
/**
 * Better-evidenced first, but only when both sides carry a grade.
 *
 * Returns 0 the moment either routine has no protocol behind it, which is
 * the point: an ungraded routine is the person's own habit, and losing an
 * hour to a C-grade protocol because nobody has run a trial on walking the
 * dog would be the app mistaking its library for their life.
 */
export function compareEvidence(
  a: Routine,
  b: Routine,
  evidenceRank: Record<string, number>,
): number {
  const ra = evidenceRank[a.id];
  const rb = evidenceRank[b.id];
  if (ra === undefined || rb === undefined) return 0;
  return ra - rb;
}

export function placeRoutines(
  windows: Window[],
  routines: Routine[],
  bufferMin: number = DEFAULT_BUFFER_MIN,
  priorities: LifeArea[] = [],
  /** Bedtime, in minutes past the day's start, for routines bounded by it. */
  dayEnd?: number,
  opts: PlacementOptions = {},
): PlacementResult {
  const evidence = opts.evidenceRank ?? {};
  const baseSort = (a: Routine, b: Routine): number => {
    if (a.protected !== b.protected) return a.protected ? -1 : 1;
    const tier = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
    if (tier !== 0) return tier;
    const goal = (a.goalId ? 0 : 1) - (b.goalId ? 0 : 1);
    if (goal !== 0) return goal;
    return areaRank(a.area, priorities) - areaRank(b.area, priorities);
  };
  const bySlack = (a: Routine, b: Routine): number =>
    toMinutes(a.preferredEnd) -
    toMinutes(a.preferredStart) -
    (toMinutes(b.preferredEnd) - toMinutes(b.preferredStart));

  const ordered = [...routines].sort((a, b) => baseSort(a, b) || bySlack(a, b));
  const plain = runPass(windows, ordered, bufferMin, dayEnd, opts.fineWindows);

  /** True when `candidate` fails to seat something `reference` managed to. */
  const costsSomething = (reference: PlacementResult, candidate: PlacementResult): boolean => {
    const seated = new Set(candidate.placements.map((p) => p.routine.id));
    return reference.placements.some((p) => !seated.has(p.routine.id));
  };

  // ── Evidence orders the day, and the tie-break has to be free ─────────
  //
  // Better-evidenced practices get seated first, so on an ordinary day they
  // take the hour they actually want and the weaker ones fit around them.
  //
  // What evidence is NOT allowed to do is change what makes the day at all.
  // The first version of this let it, and a learned-duration test caught
  // the cost immediately: a routine the person had finished three times was
  // displaced by a better-graded one they had never done. Adherence is the
  // active ingredient in almost everything in this library — a C done for
  // twelve weeks beats an A abandoned in week two — and nothing at this
  // seam knows which is which. A grade is not entitled to spend the day's
  // last hour on that guess.
  //
  // So the day is placed both ways and the evidence-ordered one is taken
  // only when it seats everything the plain one seated. Same rule the
  // chronotype shape lives under, for the same reason.
  let best = plain;
  let winning = ordered;
  if (Object.keys(evidence).length > 0) {
    const byEvidence = [...routines].sort(
      (a, b) => baseSort(a, b) || compareEvidence(a, b, evidence) || bySlack(a, b),
    );
    const graded = runPass(windows, byEvidence, bufferMin, dayEnd, opts.fineWindows);
    if (!costsSomething(plain, graded)) {
      best = graded;
      winning = byEvidence;
    }
  }

  if (!opts.energy) return best;

  // The chronotype shape, under the same rule, on whichever order won.
  const shaped = runPass(windows, winning, bufferMin, dayEnd, opts.fineWindows, opts.energy);
  return costsSomething(best, shaped) ? best : shaped;
}

function runPass(
  windows: Window[],
  ordered: Routine[],
  bufferMin: number,
  dayEnd: number | undefined,
  fineWindows: Window[] | undefined,
  energy?: DayEnergy,
): PlacementResult {
  const free = windows.map((w) => ({ ...w }));
  const placements: Placement[] = [];
  const unplaced: Routine[] = [];
  const energyPlacements: EnergyPlacement[] = [];

  const seat = (routine: Routine, spot: number) => {
    const wanted = toMinutes(routine.preferredStart);
    placements.push({
      routine,
      start: spot,
      end: spot + routine.durationMin,
      // A minute or two of drift is scheduling, not a decision. Only a
      // move large enough for a person to notice is worth explaining.
      movedFrom: Math.abs(spot - wanted) >= NOTICEABLE_MOVE_MIN ? wanted : undefined,
    });
  };

  for (const routine of ordered) {
    const spot = findSpot(free, routine, dayEnd, energy);
    if (spot === null) {
      unplaced.push(routine);
      continue;
    }
    seat(routine, spot.start);
    if (spot.byEnergy && energy) {
      const demand = demandOf(routine);
      const band = bandFor(demand, energy);
      if (band && demand !== 'steady') {
        energyPlacements.push({
          routineId: routine.id,
          title: routine.title,
          demand,
          start: spot.start,
          band,
        });
      }
    }
    carveOut(free, spot.start - bufferMin, spot.start + routine.durationMin + bufferMin);
  }

  // ── Second pass: move it, do not drop it ──────────────────────────────
  //
  // Reclaim's rule is "the next best time within the window", and until
  // this the engine had no equivalent: a routine the first pass could not
  // seat was reported and forgotten, even when the day still had a gap it
  // fitted. The first pass refuses gaps under twenty minutes on purpose,
  // and it tests one candidate start per window rather than the window's
  // whole legal range — so a five-minute practice could be dropped from a
  // day holding an eighteen-minute gap, and a routine with a
  // finish-before-sleep bound could be dropped from a window whose early
  // half was inside that bound.
  //
  // What the second pass may NOT do is loosen anything. It keeps the
  // routine's own drift bound, its finish-before-sleep bound, and the
  // buffers around everything already placed, and it never reopens a
  // placement — it only uses what is genuinely still free. Anything that
  // still does not fit stays unplaced, and the day says so.
  const stillUnplaced: Routine[] = [];
  if (unplaced.length > 0) {
    const remaining = (fineWindows ?? windows).map((w) => ({ ...w }));
    for (const p of placements) {
      carveOut(remaining, p.start - bufferMin, p.end + bufferMin, MIN_SECOND_PASS_WINDOW);
    }
    for (const routine of unplaced) {
      const spot = findRemainingSpot(remaining, routine, dayEnd);
      if (spot === null) {
        stillUnplaced.push(routine);
        continue;
      }
      seat(routine, spot);
      carveOut(remaining, spot - bufferMin, spot + routine.durationMin + bufferMin, MIN_SECOND_PASS_WINDOW);
    }
  }

  placements.sort((a, b) => a.start - b.start);
  return { placements, unplaced: stillUnplaced, energy: energyPlacements };
}

/**
 * The smallest move worth telling someone about.
 *
 * Half an hour: below that the plan is just settling, and narrating it
 * would turn a useful sentence into noise that people learn to ignore.
 */
const NOTICEABLE_MOVE_MIN = 30;

/**
 * How far outside its window a flexible routine may be pushed.
 *
 * Without a bound, the fallback pass placed a routine in the CLOSEST
 * window that fit — and "closest" can be eleven hours away. On a Saturday
 * with a full evening, that put dinner at 09:40 in the morning: not late,
 * not early, just wrong, and wrong in a way that makes the whole plan look
 * like it was generated by something that has never eaten a meal.
 *
 * A routine's own window is the best statement we have of how much it
 * cares about time. One that already tolerates ninety minutes will tolerate
 * roughly that much again; one anchored to a fifteen-minute slot will not.
 * The floor stops a tight window from becoming unplaceable, and the ceiling
 * stops a deliberately loose one from wandering across the whole day.
 *
 * The principle is already written down one file over, about deadlines:
 * an activity moved far enough "has become false, not merely
 * inconvenient", and such things "surface as unplaced rather than drift".
 * That is just as true of dinner as it is of a caffeine cutoff.
 */
const MIN_DRIFT_MIN = 60;
const MAX_DRIFT_MIN = 180;

/**
 * How far the energy shape may move something, when it is allowed to move
 * it at all.
 *
 * The same three hours the drift pass already treats as the limit of "the
 * same day, a bit later". Beyond that a walk placed for the dip is not the
 * walk moved, it is a different plan, and the person would read it as the
 * app ignoring them. Time-anchored practices and deadlines get none of it.
 */
const ENERGY_ROAM_MIN = MAX_DRIFT_MIN;

/**
 * Length of a preferred window, corrected for one that runs past midnight.
 *
 * `toRoutine` computes the end as `(start + windowMin) % 1440`, so a
 * routine anchored at 23:00 with a 90-minute window stores an end of
 * 00:30 — EARLIER than its start.
 */
function windowLength(prefStart: number, prefEnd: number): number {
  return prefEnd >= prefStart ? prefEnd - prefStart : prefEnd + 1440 - prefStart;
}

/** A start, and whether the energy shape is what chose it over another. */
interface Spot {
  start: number;
  /** True only when energy moved the routine off the start it would have had. */
  byEnergy?: boolean;
}

/** Earliest valid start within the preferred window; a bounded drift if flexible. */
function findSpot(
  free: Window[],
  routine: Routine,
  dayEnd?: number,
  energy?: DayEnergy,
): Spot | null {
  const prefStart = toMinutes(routine.preferredStart);
  const prefEnd = toMinutes(routine.preferredEnd);
  const dur = routine.durationMin;
  // A hard ceiling, separate from the preferred window: the drift pass may
  // move things when the day is full, but not across this.
  const hardLatestStart =
    routine.finishBeforeSleepMin !== undefined && dayEnd !== undefined
      ? dayEnd - routine.finishBeforeSleepMin - dur
      : Infinity;
  const withinBound = (start: number) => start <= hardLatestStart;
  // Compared against the raw stored end, a wrapped window (start 1380, end
  // 30) failed every pass-1 test and fell through to the drift pass — so
  // late-evening routines were the most likely of all to be misplaced.
  const latestStart = prefStart + windowLength(prefStart, prefEnd);

  // Pass 1: start inside the preferred window.
  //
  // `firstFit` is that pass exactly as it always was — the earliest legal
  // start in the earliest window that holds the routine — and it is the
  // answer unless the energy shape can do strictly better for something
  // that actually cares about the hour.
  //
  // The shape may look a little wider than the preferred window, because a
  // preferred window is a preference and not a bound. What it may never
  // cross is a bound: the finish-before-sleep ceiling, a fixed block (the
  // free windows are what is left after those), a deadline, or a practice
  // whose hour is part of what it is. So a deadline or a time-anchored
  // practice gets no roam at all — the shape may still choose where inside
  // that practice's own declared window it sits, and nothing beyond it.
  const band = energy ? bandFor(demandOf(routine), energy) : null;
  const roam = band && routine.flexible && !routine.timeAnchored ? ENERGY_ROAM_MIN : 0;
  const roamFrom = prefStart - roam;
  const roamTo = Math.min(latestStart + roam, hardLatestStart);

  let firstFit: number | null = null;
  let bestForBand: { start: number; overlap: number } | null = null;
  for (const w of free) {
    const earliestHere = Math.max(w.start, prefStart);
    const latestHere = Math.min(latestStart, w.end - dur, hardLatestStart);
    if (firstFit === null && latestHere >= earliestHere) firstFit = earliestHere;
    if (!band) {
      if (firstFit !== null) break;
      continue;
    }
    // The range of this window energy is allowed to consider, and the three
    // starts in it worth scoring: its two ends and the band's own start.
    const lo = Math.max(w.start, roamFrom);
    const hi = Math.min(w.end - dur, roamTo);
    if (hi < lo) continue;
    const aimed = Math.min(Math.max(toMinutes(band.start), lo), hi);
    for (const start of [lo, aimed, hi]) {
      const overlap = overlapWith(start, dur, band);
      const closer = Math.abs(start - prefStart);
      if (
        !bestForBand ||
        overlap > bestForBand.overlap ||
        (overlap === bestForBand.overlap && closer < Math.abs(bestForBand.start - prefStart))
      ) {
        bestForBand = { start, overlap };
      }
    }
  }

  // Strictly better, or it does not count. A session that was going to land
  // in the peak anyway did not land there BECAUSE of the shape, and only a
  // start the shape actually changed is attributed to it — the same rule
  // the displaced line follows about a day that simply ran out of room.
  if (band && bestForBand && bestForBand.overlap > 0) {
    const asIs = firstFit === null ? -1 : overlapWith(firstFit, dur, band);
    if (bestForBand.overlap > asIs) return { start: bestForBand.start, byEnergy: true };
  }
  if (firstFit !== null) return { start: firstFit };
  if (!routine.flexible) return null;

  // Pass 2: the closest window that fits. For a time-anchored routine that
  // search is bounded — for everything else, any hour will do, and an
  // errand done at 20:00 instead of 12:45 is still the errand.
  const drift = routine.timeAnchored
    ? Math.min(MAX_DRIFT_MIN, Math.max(MIN_DRIFT_MIN, latestStart - prefStart))
    : Infinity;
  // A bedtime bound says "not late". It does not say "not at all" — and
  // dropping the session was measurably worse than moving it: clipping the
  // late side alone pushed stalled goals from a quarter to a third. So a
  // bounded routine may drift as far EARLIER as the day allows, and the
  // free windows keep that honest by starting at wake time.
  const earliest =
    hardLatestStart === Infinity ? prefStart - drift : prefStart - Math.max(drift, 180);
  const latest = latestStart + drift;

  let best: { start: number; distance: number } | null = null;
  for (const w of free) {
    if (w.end - w.start < dur) continue;
    const start = Math.min(Math.max(w.start, prefStart), w.end - dur);
    if (start < earliest || start > latest || !withinBound(start)) continue;
    const distance = Math.abs(start - prefStart);
    if (!best || distance < best.distance) best = { start, distance };
  }
  return best ? { start: best.start } : null;
}

/**
 * The next best time still going, for a routine the first pass turned away.
 *
 * Where `findSpot` tests one candidate start per window, this walks each
 * window's whole legal range — the intersection of the window, the
 * routine's own drift, and its finish-before-sleep bound — and takes the
 * minute in it closest to the hour the routine asked for. It loosens
 * nothing: a deadline is not moved at all, a time-anchored practice keeps
 * the same drift the first pass gave it, and a bounded one still finishes
 * before the bound. It simply stops giving up on a window because the one
 * minute it happened to test was no good.
 */
function findRemainingSpot(free: Window[], routine: Routine, dayEnd?: number): number | null {
  // A deadline is not an activity to slot in — "last coffee by", "kitchen
  // closed". Moving it has made it false, so it stays where it is and is
  // reported instead.
  if (!routine.flexible) return null;

  const prefStart = toMinutes(routine.preferredStart);
  const prefEnd = toMinutes(routine.preferredEnd);
  const dur = routine.durationMin;
  const latestStart = prefStart + windowLength(prefStart, prefEnd);
  const hardLatestStart =
    routine.finishBeforeSleepMin !== undefined && dayEnd !== undefined
      ? dayEnd - routine.finishBeforeSleepMin - dur
      : Infinity;
  const drift = routine.timeAnchored
    ? Math.min(MAX_DRIFT_MIN, Math.max(MIN_DRIFT_MIN, latestStart - prefStart))
    : Infinity;
  const earliest =
    hardLatestStart === Infinity ? prefStart - drift : prefStart - Math.max(drift, 180);
  const latest = Math.min(latestStart + drift, hardLatestStart);

  let best: { start: number; distance: number } | null = null;
  for (const w of free) {
    const lo = Math.max(w.start, earliest);
    const hi = Math.min(w.end - dur, latest);
    if (hi < lo) continue;
    const start = Math.min(Math.max(prefStart, lo), hi);
    const distance = Math.abs(start - prefStart);
    if (!best || distance < best.distance) best = { start, distance };
  }
  return best?.start ?? null;
}

function carveOut(
  free: Window[],
  from: number,
  to: number,
  minFragment: number = MIN_USEFUL_WINDOW,
): void {
  for (let i = free.length - 1; i >= 0; i--) {
    const w = free[i];
    if (to <= w.start || from >= w.end) continue;
    const pieces: Window[] = [];
    if (from - w.start >= minFragment) pieces.push({ start: w.start, end: from });
    if (w.end - to >= minFragment) pieces.push({ start: to, end: w.end });
    free.splice(i, 1, ...pieces);
  }
}

/**
 * Build a full daily plan: fixed commitments as MUST items plus placed
 * routines, respecting the reserved-free-time rule. When placements would
 * consume too much of the day, lowest-tier items are dropped first.
 */
/** A routine that got a place, but not the one it asked for. */
export interface MovedPlacement {
  routine: Routine;
  /** Minutes from midnight it wanted. */
  from: number;
  /** Minutes from midnight it got. */
  to: number;
}

export function buildDailyPlan(
  ctx: DayContext,
): DailyPlan & { unplaced: Routine[]; moved: MovedPlacement[]; energy: EnergyPlacement[] } {
  const buffer = ctx.bufferMin ?? DEFAULT_BUFFER_MIN;
  const reserved = ctx.reservedFreeFraction ?? DEFAULT_RESERVED_FRACTION;
  const weekday = weekdayOf(ctx.date);

  const todaysRoutines = ctx.routines.filter((r) => r.active && r.days.includes(weekday));
  const windows = computeFreeWindows(ctx.fixed, ctx.wakeTime, ctx.sleepTime, buffer);
  const totalFree = windows.reduce((sum, w) => sum + (w.end - w.start), 0);
  const schedulable = Math.floor(totalFree * (1 - reserved));

  const priorities = ctx.priorities ?? [];
  /**
   * Evidence seats the day; it deliberately does NOT decide the cut.
   *
   * The first version of this ranked the drop list by grade too, and a
   * learned-duration test caught what that costs: a routine the person had
   * finished three times was cut in favour of a better-graded one they had
   * never done. Adherence is the active ingredient in almost everything in
   * the library — a C done for twelve weeks beats an A abandoned in week
   * two — and this seam has no adherence data to weigh against the grade.
   * So the grade decides who gets the good hour first, and what survives a
   * full day stays with tier, goal and the person's own stated order.
   */
  const evidenceRank = ctx.evidenceRank ?? {};
  // Bedtime as the engine sees it, so a routine bounded by it is bounded by
  // the same number the free windows were built from.
  const sleepMin = toMinutes(ctx.sleepTime);
  const wakeMin = toMinutes(ctx.wakeTime);
  const dayEnd = sleepMin <= wakeMin ? sleepMin + 1440 : sleepMin;
  const { placements, unplaced, energy } = placeRoutines(
    windows,
    todaysRoutines,
    buffer,
    priorities,
    dayEnd,
    {
      // The same day seen without the twenty-minute floor. Only the second
      // pass reads it, and only for routines nothing else could hold.
      fineWindows: computeFreeWindows(
        ctx.fixed,
        ctx.wakeTime,
        ctx.sleepTime,
        buffer,
        MIN_SECOND_PASS_WINDOW,
      ),
      energy: ctx.energy,
      evidenceRank,
    },
  );

  // Enforce slack: drop lowest-tier, non-protected placements until within budget.
  const kept: Placement[] = [];
  let used = 0;
  // The same order decides what survives a full day. Dropping by tier alone
  // meant that when the day overflowed, which of two equal items got cut was
  // effectively arbitrary — and arbitrary is the one thing a plan built on
  // someone's stated priorities must never be at the moment it has to choose.
  const byImportance = [...placements].sort((a, b) => {
    if (a.routine.protected !== b.routine.protected) return a.routine.protected ? -1 : 1;
    const tier = TIER_ORDER[a.routine.tier] - TIER_ORDER[b.routine.tier];
    if (tier !== 0) return tier;
    const goal = (a.routine.goalId ? 0 : 1) - (b.routine.goalId ? 0 : 1);
    if (goal !== 0) return goal;
    return areaRank(a.routine.area, priorities) - areaRank(b.routine.area, priorities);
  });
  for (const p of byImportance) {
    const dur = p.end - p.start;
    if (p.routine.protected || used + dur <= schedulable) {
      kept.push(p);
      used += dur;
    } else {
      unplaced.push(p.routine);
    }
  }
  kept.sort((a, b) => a.start - b.start);
  const moved: MovedPlacement[] = kept
    .filter((p) => p.movedFrom !== undefined)
    .map((p) => ({ routine: p.routine, from: p.movedFrom!, to: p.start }));

  const items: PlanItem[] = [
    ...ctx.fixed.map(
      (f): PlanItem => ({
        id: newId('pi'),
        date: ctx.date,
        start: f.start,
        end: f.end,
        title: f.title,
        area: f.area ?? 'work',
        tier: 'must',
        status: 'planned',
        fixed: true,
        sessionType: f.sessionType,
        routineId: f.routineId,
        goalId: f.goalId,
        focus: f.goalId ? ctx.goalFocus?.[f.goalId] : undefined,
      }),
    ),
    ...kept.map(
      (p): PlanItem => ({
        id: newId('pi'),
        date: ctx.date,
        start: toHHMM(p.start),
        end: toHHMM(p.end),
        title: p.routine.title,
        area: p.routine.area,
        tier: p.routine.tier,
        status: 'planned',
        routineId: p.routine.id,
        goalId: p.routine.goalId,
        focus: p.routine.goalId ? ctx.goalFocus?.[p.routine.goalId] : undefined,
        fixed: false,
        sessionType: p.routine.sessionType,
      }),
    ),
  ].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

  return {
    date: ctx.date,
    items,
    summary: summarise(items, totalFree, ctx.date),
    unplaced,
    moved,
    // Only what survived the day's slack budget: a sentence about the hour
    // something got is a lie if the thing is not on the day.
    energy: energy.filter((e) => kept.some((p) => p.routine.id === e.routineId)),
  };
}

function summarise(items: PlanItem[], totalFreeMin: number, date?: string): string {
  const base = summariseLoad(items, totalFreeMin);
  // Fresh-start effect (Milkman & Dai): temporal landmarks — Mondays, month
  // starts — are when people are most ready to act on aspirations. Frame them.
  if (date) {
    const day = dateKeyToDate(date);
    if (day.getDate() === 1) return `A new month. ${base}`;
    if (day.getDay() === 1) return `Fresh week. ${base}`;
  }
  return base;
}

function summariseLoad(items: PlanItem[], totalFreeMin: number): string {
  const musts = items.filter((i) => i.tier === 'must');
  const morningLoad = items.filter((i) => toMinutes(i.start) < 12 * 60).length;
  const afternoonLoad = items.filter((i) => toMinutes(i.start) >= 12 * 60).length;

  if (items.length === 0) return 'An open day. Choose what matters.';
  if (totalFreeMin < 120) return 'A full day. Keep expectations realistic.';
  if (morningLoad >= 3 && afternoonLoad <= 1) return 'Busy morning. Protect your afternoon.';
  if (afternoonLoad >= 3 && morningLoad <= 1) return 'Light morning, full afternoon. Start slow on purpose.';
  if (musts.length >= 4) return 'A committed day. Focus on the musts.';
  return 'A balanced day. Room to breathe.';
}

/**
 * Shorten a workout to fit available time rather than abandoning it.
 * Returns null when there isn't enough time for a meaningful session.
 */
export function shortenWorkout(
  plannedMin: number,
  availableMin: number,
): { durationMin: number; note: string } | null {
  if (availableMin >= plannedMin) return { durationMin: plannedMin, note: 'Full session.' };
  if (availableMin < 15) return null;
  const duration = Math.min(plannedMin, Math.floor(availableMin / 5) * 5);
  return {
    durationMin: duration,
    note: `Condensed ${duration}-minute session: main lifts only, shorter rests.`,
  };
}

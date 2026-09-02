/**
 * Pathway audit — is there enough there to do?
 *
 * ── Why this is not the cohort simulation ───────────────────────────────
 *
 * `sim/engine.ts` runs humans through six months and measures whether they
 * keep going. It answers "do people adhere?". It cannot answer the prior
 * question — "is there enough programme to adhere TO?" — because a pathway
 * that asks almost nothing of anybody scores beautifully on adherence.
 *
 * This harness never simulates a person's behaviour. It feeds real
 * profiles and real intake answers through the real `PATHS[id].build()`
 * and audits the OUTPUT. Every number it produces is a deterministic
 * property of the code, so a finding here is a defect, not a forecast.
 *
 * See docs/PATHWAY_HONING_BRIEF.md for the population, the weights, and
 * what each check is for.
 */

import { PATHS, type PathBuild, type PathId } from '@/features/paths/definitions';
import { LEVEL_ORDER, type PathLevel } from '@/features/paths/level';
import type { LifeArea, LifeProfile, PhysicalConstraint } from '@/types/domain';
import type { WeekShape } from '@/features/onboarding/markets';

export const PATH_IDS: PathId[] = [
  'training',
  'nutrition',
  'money',
  'work',
  'recovery',
  'relationship',
  'family',
];

/** Deterministic PRNG so a seed reproduces the whole population. */
function mulberry32(a: number) {
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weighted<T>(rng: () => number, table: [T, number][]): T {
  const roll = rng();
  let acc = 0;
  for (const [value, w] of table) {
    acc += w;
    if (roll < acc) return value;
  }
  return table[table.length - 1][0];
}

// The paying market carries the sample. See the brief for the reasoning;
// these are a deliberate business choice, not a demographic estimate.
const SHAPE_WEIGHTS: [WeekShape, number][] = [
  ['selfDirected', 0.3],
  ['employed', 0.3],
  ['caring', 0.12],
  ['shift', 0.12],
  ['study', 0.08],
  ['retired', 0.08],
];

// Real cohorts skew to the bottom of any ladder, and the bottom is where a
// thin programme does the most damage.
const LEVEL_WEIGHTS: [PathLevel, number][] = [
  ['foundation', 0.35],
  ['developing', 0.3],
  ['established', 0.25],
  ['advanced', 0.1],
];

const CONSTRAINT_POOL: PhysicalConstraint[] = [
  'joints',
  'balance',
  'energy',
  'recovering',
  'heart',
  'pregnancy',
];

const PRIORITY_SETS: LifeArea[][] = [
  ['family', 'health', 'work'],
  ['work', 'health', 'family'],
  ['health', 'relationship', 'growth'],
  ['family', 'relationship', 'enjoyment'],
  ['work', 'admin', 'health'],
];

export interface SimProfile {
  id: number;
  shape: WeekShape;
  level: PathLevel;
  profile: LifeProfile;
}

/** A profile whose week actually matches its shape. */
export function makeProfile(id: number): SimProfile {
  const rng = mulberry32(2_000_003 * (id + 1));
  const shape = weighted(rng, SHAPE_WEIGHTS);
  const level = weighted(rng, LEVEL_WEIGHTS);
  const hasKids = rng() < (shape === 'caring' ? 0.85 : 0.4);
  const constraints = rng() < 0.22 ? [CONSTRAINT_POOL[Math.floor(rng() * CONSTRAINT_POOL.length)]] : [];

  // Retired people have no work hours at all; shift workers have hours that
  // do not repeat. Giving everyone a nine-to-five would hide exactly the
  // failures this audit exists to find.
  const workDays =
    shape === 'retired'
      ? []
      : shape === 'shift'
        ? ([1, 3, 4, 6] as LifeProfile['workDays'])
        : shape === 'caring'
          ? ([1, 2, 3, 4, 5] as LifeProfile['workDays'])
          : ([1, 2, 3, 4, 5] as LifeProfile['workDays']);
  const workStart = shape === 'shift' ? '14:00' : shape === 'study' ? '10:00' : '09:00';
  const workEnd = shape === 'shift' ? '22:30' : shape === 'study' ? '15:00' : '17:30';

  const age =
    shape === 'retired' ? 62 + Math.floor(rng() * 22)
    : shape === 'study' ? 19 + Math.floor(rng() * 8)
    : 28 + Math.floor(rng() * 26);

  const profile: LifeProfile = {
    firstName: `P${id}`,
    priorities: PRIORITY_SETS[Math.floor(rng() * PRIORITY_SETS.length)],
    people: hasKids ? [{ id: `k${id}`, name: 'Kid', relation: 'child' }] : [],
    workDays,
    workStart,
    workEnd,
    wakeTime: shape === 'shift' ? '08:30' : '06:30',
    sleepTime: shape === 'shift' ? '00:30' : '22:30',
    energyProfile: weighted(rng, [
      ['morning', 0.45],
      ['evening', 0.35],
      ['midday', 0.1],
      ['any', 0.1],
    ]),
    capacity: weighted(rng, [
      ['minimal', 0.3],
      ['steady', 0.5],
      ['push', 0.2],
    ]),
    trainingDaysPerWeek: 2 + Math.floor(rng() * 4),
    trainingDurationMin: [30, 45, 60][Math.floor(rng() * 3)],
    trainingPreference: weighted(rng, [
      ['gym', 0.4],
      ['home', 0.3],
      ['outdoors', 0.2],
      ['mixed', 0.1],
    ]),
    moreOf: [],
    lessOf: [],
    constraints: constraints.length > 0 ? constraints : undefined,
    weekShape: shape,
    age,
    weightKg: 55 + Math.floor(rng() * 50),
    kidsCount: hasKids ? 1 + Math.floor(rng() * 2) : 0,
    workStyle: weighted(rng, [
      ['maker', 0.3],
      ['manager', 0.3],
      ['mixed', 0.25],
      ['physical', 0.15],
    ]),
    sleepQuality: weighted(rng, [
      ['good', 0.4],
      ['broken', 0.3],
      ['varies', 0.3],
    ]),
    pressure: weighted(rng, [
      ['calm', 0.25],
      ['full', 0.5],
      ['redline', 0.25],
    ]),
    createdAt: '2026-01-05T08:00:00.000Z',
    updatedAt: '2026-01-05T08:00:00.000Z',
  };

  return { id, shape, level, profile };
}

/**
 * A complete answer set for a pathway, chosen at random from the pathway's
 * own declared options. Answering from the real option lists rather than
 * invented strings is what makes a dead-question finding trustworthy.
 */
export function answersFor(path: PathId, rng: () => number): Record<string, string> {
  const out: Record<string, string> = {};
  for (const q of PATHS[path].questions) {
    if (q.options.length === 0) continue;
    out[q.key] = q.options[Math.floor(rng() * q.options.length)].value;
  }
  return out;
}

/** Mirrors the budget's own list: practices that re-label existing time. */
const RELABELLED = new Set([
  'device-free-meal',
  'family-ritual-anchor',
  'partner-reunion',
  'partner-appreciation',
]);

export interface BuildShape {
  /** The goal's own title. Recovery renames the goal per behaviour, and a
   *  shape that ignored it reported a live question as dead. */
  goalTitle: string;
  routineTitles: string[];
  routineCount: number;
  weeklyMinutes: number;
  /** Time the person has to actually find, excluding re-labelled time. */
  newTimeMinutes: number;
  milestoneTitles: string[];
  milestoneCount: number;
}

export function shapeOf(build: PathBuild): BuildShape {
  const routineTitles = build.routines.map((r) => r.title).sort();
  return {
    goalTitle: build.goal.title,
    routineTitles,
    routineCount: build.routines.length,
    weeklyMinutes: build.routines.reduce((n, r) => n + r.durationMin * Math.max(1, r.days.length), 0),
    newTimeMinutes: build.routines
      .filter((r) => !RELABELLED.has(r.protocolId ?? ''))
      .reduce((n, r) => n + r.durationMin * Math.max(1, r.days.length), 0),
    // Pre-ticked milestones are visible progress, so a question that only
    // changes a `done` flag has still changed the programme.
    milestoneTitles: (build.goal.milestones ?? []).map((m) => `${m.title}${m.done ? ' ✓' : ''}`).sort(),
    milestoneCount: (build.goal.milestones ?? []).length,
  };
}

/** Two builds are "the same programme" if nothing a user would notice differs. */
export function sameShape(a: BuildShape, b: BuildShape): boolean {
  return (
    a.goalTitle === b.goalTitle &&
    a.routineCount === b.routineCount &&
    a.weeklyMinutes === b.weeklyMinutes &&
    a.routineTitles.join('|') === b.routineTitles.join('|') &&
    a.milestoneTitles.join('|') === b.milestoneTitles.join('|')
  );
}

export interface PathAudit {
  path: PathId;
  n: number;
  /** Threw, or produced no routines or no milestones. */
  hardFailures: number;
  emptyRoutines: number;
  emptyMilestones: number;
  /** Profiles whose four level-builds are all identical. */
  levelIdentical: number;
  /** Questions whose answer never changed the build, across the sample. */
  deadQuestions: string[];
  liveQuestions: string[];
  /** Weekly prescribed minutes: mean and worst case. */
  meanWeeklyMinutes: number;
  maxWeeklyMinutes: number;
  meanNewTimeMinutes: number;
  maxNewTimeMinutes: number;
  /** Routines prescribing the same practice twice under two names. */
  duplicateRoutines: number;
  /** Per week shape: how many built nothing usable. */
  failuresByShape: Record<string, number>;
  /** Insight lines returned; zero is a silent hub. */
  meanInsights: number;
  zeroInsight: number;
}

export function auditPath(path: PathId, n: number, seedBase = 0): PathAudit {
  const def = PATHS[path];
  const questionKeys = def.questions.map((q) => q.key);
  const questionMoved = new Set<string>();

  let hardFailures = 0;
  let emptyRoutines = 0;
  let emptyMilestones = 0;
  let levelIdentical = 0;
  let totalMinutes = 0;
  let maxWeeklyMinutes = 0;
  let totalNewTime = 0;
  let maxNewTimeMinutes = 0;
  let duplicateRoutines = 0;
  let totalInsights = 0;
  let zeroInsight = 0;
  const failuresByShape: Record<string, number> = {};

  for (let i = 0; i < n; i += 1) {
    const { shape, profile } = makeProfile(seedBase + i);
    const rng = mulberry32(7_000_003 * (seedBase + i + 1));
    const answers = answersFor(path, rng);

    let shapes: BuildShape[] = [];
    try {
      // The same person, built at each rung. If the four come back
      // identical the ladder is decoration for this pathway.
      shapes = LEVEL_ORDER.map((level) => shapeOf(def.build({ ...answers, level }, profile)));
    } catch {
      hardFailures += 1;
      failuresByShape[shape] = (failuresByShape[shape] ?? 0) + 1;
      continue;
    }

    const base = shapes[0];
    if (base.routineCount === 0) {
      emptyRoutines += 1;
      failuresByShape[shape] = (failuresByShape[shape] ?? 0) + 1;
    }
    if (base.milestoneCount === 0) emptyMilestones += 1;
    if (shapes.every((s) => sameShape(s, base))) levelIdentical += 1;

    totalMinutes += base.weeklyMinutes;
    maxWeeklyMinutes = Math.max(maxWeeklyMinutes, base.weeklyMinutes);
    // Measured at the top rung, where every rung's additions are present
    // and a near-duplicate has the most chances to appear.
    const top = shapes[shapes.length - 1];
    totalNewTime += top.newTimeMinutes;
    maxNewTimeMinutes = Math.max(maxNewTimeMinutes, top.newTimeMinutes);
    if (new Set(top.routineTitles).size !== top.routineTitles.length) duplicateRoutines += 1;

    // One question at a time, everything else held. A question that never
    // moves the output is one the app should not be asking, because the
    // intake screen promises on its face that every answer changes things.
    for (const q of def.questions) {
      if (questionMoved.has(q.key)) continue;
      for (const opt of q.options) {
        if (opt.value === answers[q.key]) continue;
        try {
          const alt = shapeOf(def.build({ ...answers, [q.key]: opt.value }, profile));
          if (!sameShape(alt, base)) {
            questionMoved.add(q.key);
            break;
          }
        } catch {
          questionMoved.add(q.key); // a throw is a difference, and its own bug
          break;
        }
      }
    }

    try {
      const lines = def.insights(answers, profile);
      totalInsights += lines.length;
      if (lines.length === 0) zeroInsight += 1;
    } catch {
      zeroInsight += 1;
    }
  }

  return {
    path,
    n,
    hardFailures,
    emptyRoutines,
    emptyMilestones,
    levelIdentical,
    deadQuestions: questionKeys.filter((k) => !questionMoved.has(k)),
    liveQuestions: questionKeys.filter((k) => questionMoved.has(k)),
    meanWeeklyMinutes: Math.round(totalMinutes / Math.max(1, n)),
    maxWeeklyMinutes,
    meanNewTimeMinutes: Math.round(totalNewTime / Math.max(1, n)),
    maxNewTimeMinutes,
    duplicateRoutines,
    failuresByShape,
    meanInsights: Number((totalInsights / Math.max(1, n)).toFixed(2)),
    zeroInsight,
  };
}

export function renderAudit(audits: PathAudit[]): string {
  const rows = audits.map((a) => {
    const dead = a.deadQuestions.length === 0 ? '—' : a.deadQuestions.join(', ');
    return `| ${a.path} | ${a.n} | ${a.hardFailures} | ${a.emptyRoutines} | ${a.emptyMilestones} | ${a.levelIdentical} (${Math.round((a.levelIdentical / a.n) * 100)}%) | ${a.liveQuestions.length}/${a.liveQuestions.length + a.deadQuestions.length} | ${dead} | ${a.meanNewTimeMinutes} | ${a.maxNewTimeMinutes} | ${a.meanInsights} |`;
  });
  return [
    '| path | n | throws | no routines | no milestones | same at all 4 levels | live questions | dead questions | mean new min/wk | max new min/wk | insights |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

/** Aggregation + reporting for cohort simulation runs. */

import type { Suggestion } from '@/types/domain';
import type { UserResult, WeekMetrics } from './engine';

const KINDS: Suggestion['kind'][] = [
  'move_routine',
  'protect_time',
  'shorten_workout',
  'goal_stalled',
  'plan_adjustment',
  'connection',
];

function rate(w: WeekMetrics): number {
  return w.planned ? w.completed / w.planned : 0;
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function meanWeekRate(results: UserResult[], from: number, to: number): number {
  return mean(
    results.flatMap((r) => r.weeks.slice(from, to + 1).filter((w) => w.planned > 0).map(rate)),
  );
}

function meanAlignment(results: UserResult[], from: number, to: number): number {
  const vals = results.flatMap((r) =>
    r.weeks
      .slice(from, to + 1)
      .filter((w) => w.flexMinutes > 0)
      .map((w) => w.alignedMinutes / w.flexMinutes),
  );
  return mean(vals);
}

export interface CohortReport {
  users: number;
  weeks: number;
  personas: Record<string, number>;
  errors: number;
  overlapViolations: number;
  completion: { early: number; mid: number; late: number; liftPts: number };
  alignment: { early: number; late: number; liftPts: number };
  completionByPersona: Record<string, { early: number; late: number; liftPts: number }>;
  adopters: {
    count: number;
    nonCount: number;
    adopterLate: number;
    nonAdopterLate: number;
    deltaPts: number;
  };
  detectors: Record<string, { shown: number; accepted: number; acceptRate: number }>;
  medianWeekToFirstAdaptation: number | null;
  valueCoverage: { relationshipWeekPct: number; familyWeekPct: number };
  pruning: { totalDeactivations: number; usersOverPruned: number };
  avgUnplacedPerWeek: number;
  avgMovesPerUserPerWeek: number;
}

export function aggregate(results: UserResult[]): CohortReport {
  const weeksCount = Math.max(...results.map((r) => r.weeks.length));
  const lastQ = { from: Math.max(0, weeksCount - 4), to: weeksCount - 1 };

  const personas: Record<string, number> = {};
  for (const r of results) personas[r.persona] = (personas[r.persona] ?? 0) + 1;

  const detectors: CohortReport['detectors'] = {};
  for (const kind of KINDS) {
    let shown = 0;
    let accepted = 0;
    for (const r of results) {
      for (const w of r.weeks) {
        shown += w.suggestionsShown[kind] ?? 0;
        accepted += w.suggestionsAccepted[kind] ?? 0;
      }
    }
    if (shown > 0) detectors[kind] = { shown, accepted, acceptRate: accepted / shown };
  }

  const completionByPersona: CohortReport['completionByPersona'] = {};
  for (const key of Object.keys(personas)) {
    const subset = results.filter((r) => r.persona === key);
    const early = meanWeekRate(subset, 0, 1);
    const late = meanWeekRate(subset, lastQ.from, lastQ.to);
    completionByPersona[key] = { early, late, liftPts: (late - early) * 100 };
  }

  const adopterSet = results.filter(
    (r) => r.firstAnyAdaptationWeek !== null && r.firstAnyAdaptationWeek <= 8,
  );
  const nonSet = results.filter((r) => r.firstAnyAdaptationWeek === null);
  const adopterLate = meanWeekRate(adopterSet, lastQ.from, lastQ.to);
  const nonAdopterLate = meanWeekRate(nonSet, lastQ.from, lastQ.to);

  const firstWeeks = results
    .map((r) => r.firstAnyAdaptationWeek)
    .filter((w): w is number => w !== null)
    .sort((a, b) => a - b);

  const relWeeks = results.flatMap((r) => r.weeks.map((w) => (w.hasRelationshipMoment ? 1 : 0)));
  const famWeeks = results.flatMap((r) => r.weeks.map((w) => (w.hasFamilyMoment ? 1 : 0)));

  const totalDeact = results.reduce(
    (s, r) => s + r.weeks.reduce((a, w) => a + w.routinesDeactivated, 0),
    0,
  );
  const usersOverPruned = results.filter(
    (r) => r.weeks.reduce((a, w) => a + w.routinesDeactivated, 0) > 2,
  ).length;

  const early = meanWeekRate(results, 0, 1);
  const mid = meanWeekRate(results, Math.floor(weeksCount / 2) - 1, Math.floor(weeksCount / 2));
  const late = meanWeekRate(results, lastQ.from, lastQ.to);
  const alignEarly = meanAlignment(results, 0, 1);
  const alignLate = meanAlignment(results, lastQ.from, lastQ.to);

  return {
    users: results.length,
    weeks: weeksCount,
    personas,
    errors: results.reduce((s, r) => s + r.errors, 0),
    overlapViolations: results.reduce((s, r) => s + r.overlapViolations, 0),
    completion: { early, mid, late, liftPts: (late - early) * 100 },
    alignment: { early: alignEarly, late: alignLate, liftPts: (alignLate - alignEarly) * 100 },
    completionByPersona,
    adopters: {
      count: adopterSet.length,
      nonCount: nonSet.length,
      adopterLate,
      nonAdopterLate,
      deltaPts: (adopterLate - nonAdopterLate) * 100,
    },
    detectors,
    medianWeekToFirstAdaptation: firstWeeks.length
      ? firstWeeks[Math.floor(firstWeeks.length / 2)]
      : null,
    valueCoverage: {
      relationshipWeekPct: mean(relWeeks) * 100,
      familyWeekPct: mean(famWeeks) * 100,
    },
    pruning: { totalDeactivations: totalDeact, usersOverPruned },
    avgUnplacedPerWeek: mean(results.flatMap((r) => r.weeks.map((w) => w.unplaced))),
    avgMovesPerUserPerWeek: mean(results.flatMap((r) => r.weeks.map((w) => w.userMoves))),
  };
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

export function renderMarkdown(rep: CohortReport): string {
  const lines = [
    `# INTENT cohort simulation — ${rep.users} users × ${rep.weeks} weeks`,
    '',
    `Personas: ${Object.entries(rep.personas)
      .map(([k, v]) => `${k} ${v}`)
      .join(' · ')}`,
    `Engine health: ${rep.errors} errors · ${rep.overlapViolations} overlap violations · ${rep.avgUnplacedPerWeek.toFixed(2)} unplaced/user-week`,
    '',
    '## Does INTENT learn?',
    `- Weekly completion: ${pct(rep.completion.early)} (wk 1–2) → ${pct(rep.completion.mid)} (mid) → ${pct(rep.completion.late)} (final month) — **${rep.completion.liftPts >= 0 ? '+' : ''}${rep.completion.liftPts.toFixed(1)} pts**`,
    `- Schedule↔life alignment (flexible minutes in the user's true best slot): ${pct(rep.alignment.early)} → ${pct(rep.alignment.late)} — **${rep.alignment.liftPts >= 0 ? '+' : ''}${rep.alignment.liftPts.toFixed(1)} pts**`,
    `- Median weeks to first accepted adaptation: ${rep.medianWeekToFirstAdaptation ?? 'n/a'}`,
    `- Adopters (accepted an adaptation by week 8, n=${rep.adopters.count}) finish at ${pct(rep.adopters.adopterLate)} vs never-adapted (n=${rep.adopters.nonCount}) at ${pct(rep.adopters.nonAdopterLate)} — **Δ ${rep.adopters.deltaPts.toFixed(1)} pts**`,
    '',
    '## By persona (completion, early → late)',
    ...Object.entries(rep.completionByPersona).map(
      ([k, v]) =>
        `- ${k}: ${pct(v.early)} → ${pct(v.late)} (${v.liftPts >= 0 ? '+' : ''}${v.liftPts.toFixed(1)} pts)`,
    ),
    '',
    '## Detectors',
    ...Object.entries(rep.detectors).map(
      ([k, v]) => `- ${k}: shown ${v.shown} · accepted ${v.accepted} (${pct(v.acceptRate)})`,
    ),
    '',
    '## Values on the calendar',
    `- Weeks containing a relationship moment: ${rep.valueCoverage.relationshipWeekPct.toFixed(1)}%`,
    `- Weeks containing a family/enjoyment moment beyond dinner: ${rep.valueCoverage.familyWeekPct.toFixed(1)}%`,
    '',
    '## Weekly-review pruning',
    `- Total routines rested: ${rep.pruning.totalDeactivations} · users over-pruned (>2): ${rep.pruning.usersOverPruned}`,
    `- User moves: ${rep.avgMovesPerUserPerWeek.toFixed(2)} per user-week`,
  ];
  return lines.join('\n');
}

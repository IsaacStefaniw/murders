/**
 * The journey harness — drive the app, do not inspect it.
 *
 * ── Why this exists ─────────────────────────────────────────────────────
 *
 * The pathway audit (docs/PATHWAY_HONING_BRIEF.md) inspected what
 * `build()` RETURNS. It found real defects and missed an entire class of
 * them, because it never logged a set, never finished a session, never
 * pressed Move and never asked what a screen would show. Five defects
 * reported from a real phone in one message were all in that blind spot.
 *
 * So this harness does the other thing. It seeds profiles, runs days, and
 * performs the actions a person performs — tick, move, skip, log, finish —
 * against the real store. After every action it checks INVARIANTS: things
 * that must be true of the app no matter who is using it or what they did.
 *
 * An invariant that fails is a bug with a reproduction attached, because
 * the harness records the exact action sequence that broke it.
 *
 * ── The rule these checks are written to ────────────────────────────────
 *
 * Nothing here asserts a preference. Every invariant is a promise the app
 * already makes on screen or in its own documentation, so a failure is the
 * app contradicting itself rather than disagreeing with me.
 */

import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { PATHS, type PathId } from '@/features/paths/definitions';
import { useAppStore } from '@/state/store';
import { addDays, durationMinutes, todayKey, toMinutes } from '@/lib/dates';
import type { InterviewAnswers } from '@/features/onboarding/script';
import type { PlanItem } from '@/types/domain';
import {
  checkAudienceGating,
  checkCoachNote,
  type Finding,
} from '@/features/sim/screens';

export interface Violation {
  invariant: string;
  detail: string;
  /** The action sequence that produced it, so it can be replayed by hand. */
  trace: string[];
}

function mulberry32(a: number) {
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(rng: () => number, xs: T[]): T => xs[Math.floor(rng() * xs.length)];

/**
 * A full, valid answer set. Varied across the axes that change the plan —
 * week shape, capacity, training experience, constraints — because an
 * invariant that only holds for one kind of person is not an invariant.
 */
function answersFor(rng: () => number): InterviewAnswers {
  const shape = pick(rng, ['employed', 'selfDirected', 'shift', 'study', 'caring', 'retired']);
  const retired = shape === 'retired';
  return {
    name: 'Sim',
    priorities: pick(rng, [
      ['health', 'work'],
      ['family', 'health'],
      ['work', 'admin'],
      ['relationship', 'family'],
    ]),
    vision: 'Steadier and stronger',
    weekShape: shape,
    household: pick(rng, ['partner_kids', 'partner', 'solo', 'grandkids']),
    kidsCount: pick(rng, ['0', '1', '2']),
    partnerName: 'Sam',
    capacity: pick(rng, ['minimal', 'stretched', 'push']),
    age: pick(rng, ['24', '38', '47', '63', '74']),
    workStyle: pick(rng, ['maker', 'manager', 'mixed', 'physical']),
    workDays: retired ? [] : [1, 2, 3, 4, 5],
    workHours: retired ? '09:00-09:00' : pick(rng, ['08:00-16:00', '09:30-18:30', '14:00-22:30']),
    sleep: pick(rng, ['06:30-22:30', '05:00-21:00', '08:30-00:15']),
    sleepQuality: pick(rng, ['good', 'ok', 'broken']),
    pressure: pick(rng, ['calm', 'busy', 'redline']),
    energy: pick(rng, ['morning', 'evening', 'any']),
    trainingDays: pick(rng, ['0', '2', '3', '4']),
    trainingSetup: pick(rng, ['gym', 'home', 'outdoors']),
    trainingExperience: pick(rng, ['new', 'returning', 'consistent']),
    constraints: rng() < 0.25 ? [pick(rng, ['joints', 'energy', 'heart', 'recovering'])] : [],
    existingHabits: rng() < 0.5 ? ['workout'] : [],
    weight: '82',
    foodAim: pick(rng, ['energy', 'weight', 'muscle']),
    foodTrouble: 'evenings',
    mind: pick(rng, ['no', 'sometimes', 'daily']),
    moreOf: [],
    lessOf: [],
    money: pick(rng, ['saving', 'debt', 'checkin', 'none']),
    moneyAutomation: pick(rng, ['yes', 'some', 'no']),
    ambition: 'Get stronger',
  } as unknown as InterviewAnswers;
}

const meaningfulItems = (items: PlanItem[]) => items.filter((i) => i.title !== 'Work');

/**
 * Invariants, checked after every single action.
 *
 * Each one names the promise it enforces. Where the promise is a line the
 * app puts on screen, that line is quoted, so nobody has to guess whether
 * the check or the product is out of date.
 */
function check(trace: string[], out: Violation[]): void {
  const { plans, routines, goals } = useAppStore.getState();

  for (const plan of Object.values(plans)) {
    for (const item of plan.items) {
      // A block with no length is unschedulable and renders as a row
      // nobody can tap. Crossing midnight is legitimate — a wind-down
      // genuinely can run 23:40 to 00:00 — so this asks for real duration
      // rather than for `end` to sort after `start`.
      if (durationMinutes(item.start, item.end) <= 0) {
        out.push({
          invariant: 'positive duration',
          detail: `${item.title} ${item.start}–${item.end} on ${plan.date}`,
          trace: [...trace],
        });
      }
      // Every routine-backed item must still point at a routine that
      // exists, or the hub cannot explain where the block came from.
      if (item.routineId && !routines.some((r) => r.id === item.routineId)) {
        out.push({
          invariant: 'no orphan items',
          detail: `${item.title} references a routine that is gone`,
          trace: [...trace],
        });
      }
      if (item.goalId && !goals.some((g) => g.id === item.goalId)) {
        out.push({
          invariant: 'no orphan items',
          detail: `${item.title} references a goal that is gone`,
          trace: [...trace],
        });
      }
    }

    // Two things cannot occupy the same protected minute. Overlap between
    // flexible items is the scheduler's business; overlap where one side is
    // protected is a promise broken.
    // Overlap is compared in minutes, and items that wrap past midnight are
    // left out: they end on the next day and cannot overlap today's.
    const sorted = [...meaningfulItems(plan.items)]
      .filter((i) => toMinutes(i.end) > toMinutes(i.start))
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      if (toMinutes(cur.start) < toMinutes(prev.end) && (prev.fixed || cur.fixed)) {
        out.push({
          invariant: 'fixed time is not overlapped',
          detail: `${prev.title} (${prev.start}\u2013${prev.end}) overlaps ${cur.title} (${cur.start}) on ${plan.date}`,
          trace: [...trace],
        });
      }
    }

    // The same practice must not appear twice in one day under two names —
    // the family pathway shipped exactly that.
    const byRoutine = new Map<string, number>();
    for (const item of plan.items) {
      if (!item.routineId) continue;
      byRoutine.set(item.routineId, (byRoutine.get(item.routineId) ?? 0) + 1);
    }
    for (const [id, n] of byRoutine) {
      if (n > 1) {
        const r = routines.find((x) => x.id === id);
        out.push({
          invariant: 'one instance per routine per day',
          detail: `${r?.title ?? id} appears ${n} times on ${plan.date}`,
          trace: [...trace],
        });
      }
    }
  }
}

/**
 * How many examples of any one problem are worth keeping.
 *
 * A 500-person run died on `JSON.stringify` with a heap overflow: every
 * violation and every finding was retained in full, and the thousandth
 * instance of the same rule teaches nothing the first ten did not. Counts
 * are still exact — only the examples are capped.
 */
const MAX_EXAMPLES_PER_KIND = 10;

export interface JourneyResult {
  users: number;
  actions: number;
  violations: Violation[];
  /**
   * Completed practices that left no number behind.
   *
   * Not a violation — plenty of blocks are simply time, and inventing a
   * metric for "family dinner" would be worse than counting nothing. It is
   * a COVERAGE list, because the sauna defect was exactly this shape: a
   * practice the app scheduled every week and never counted, so Progress
   * had nothing to show for a year of it. Reading the list is how you
   * decide which silences are correct.
   */
  silentPractices: { title: string; completions: number }[];
  /** Exact counts; the violation and finding arrays hold capped examples. */
  violationCounts: Record<string, number>;
  findingCounts: Record<string, number>;
  /** What the screens would have SAID, checked per person per day. */
  findings: Finding[];
}

/**
 * Run one person through a number of days, doing what people do.
 *
 * Actions are chosen at random from the ones the UI actually offers for
 * that item's state, which is the point: a sequence no test author would
 * think to write is exactly where composition bugs live.
 */
export function runJourney(seed: number, days: number, trace: string[], out: Violation[]): number {
  const rng = mulberry32(9_000_003 * (seed + 1));
  const store = useAppStore.getState();
  store.resetAll();

  const built = buildLifeOperatingPlan(answersFor(rng));
  useAppStore.getState().completeOnboarding({
    profile: built.profile,
    goals: built.goals,
    routines: built.routines,
    behaviourIntentions: built.behaviourIntentions,
  });
  trace.push('onboard');
  check(trace, out);

  let actions = 1;
  const paths: PathId[] = ['training', 'nutrition', 'money', 'work', 'recovery', 'relationship', 'family'];
  // Start a couple of pathways — most people do not start all seven, and a
  // week holding all seven is its own separate question.
  for (const path of paths.filter(() => rng() < 0.35)) {
    const answers: Record<string, string> = {};
    for (const q of PATHS[path].questions) {
      if (q.options.length > 0) answers[q.key] = pick(rng, q.options).value;
    }
    useAppStore.getState().startPath(path, answers);
    trace.push(`startPath:${path}`);
    check(trace, out);
    actions += 1;
  }

  const start = todayKey();
  for (let d = 0; d < days; d += 1) {
    const date = addDays(start, d);
    useAppStore.getState().ensurePlan(date);
    const items = meaningfulItems(useAppStore.getState().plans[date]?.items ?? []);

    for (const item of items) {
      if (item.fixed) continue;
      const roll = rng();
      if (roll < 0.45) {
        useAppStore.getState().setItemStatus(date, item.id, 'completed', {
          source: 'manual',
          confidence: 1,
          at: `${date}T12:00:00.000Z`,
        });
        trace.push(`done:${item.title}@${date}`);
      } else if (roll < 0.6) {
        useAppStore.getState().setItemStatus(date, item.id, 'skipped');
        trace.push(`skip:${item.title}@${date}`);
      } else if (roll < 0.75) {
        // The action the field report was about. A move is a move: it must
        // not resolve the item, and it must not lose it.
        const before = useAppStore.getState().plans[date]?.items.find((i) => i.id === item.id);
        const target = pick(rng, ['07:15', '12:30', '17:45', '20:15']);
        useAppStore.getState().moveItem(date, item.id, target);
        trace.push(`move:${item.title}@${date}->${target}`);
        const after = useAppStore.getState().plans[date]?.items.find((i) => i.id === item.id);
        if (before && !after) {
          out.push({
            invariant: 'a move never loses the item',
            detail: `${item.title} vanished from ${date} after a move`,
            trace: [...trace],
          });
        }
        if (before && after && before.status === 'planned' && after.status !== 'planned') {
          out.push({
            invariant: 'a move never resolves the item',
            detail: `${item.title} became "${after.status}" from a move on ${date}`,
            trace: [...trace],
          });
        }
      }
      actions += 1;
      check(trace, out);
      if (trace.length > 400) trace.splice(0, 200);
    }
  }
  return actions;
}

/**
 * Stop the store persisting while the simulation runs.
 *
 * The OOM at 300 people was not the report — it was the persist
 * middleware. Every `set()` re-serialises the entire store, and a person
 * accumulates twenty-one days of plans, a metric per completion and an
 * event per action, so the cost is the state size times the action count
 * and the transient garbage buries the heap. Capping the examples was a
 * real improvement and fixed a different problem; it did not fix this one,
 * and reporting the run as if it had is what this whole exercise is about
 * not doing.
 *
 * Test-only, and applied through zustand's own options API so nothing in
 * the app changes to make its harness convenient.
 */
function pausePersistence(): void {
  const persist = (useAppStore as unknown as {
    persist?: { setOptions: (o: { storage: unknown }) => void };
  }).persist;
  persist?.setOptions({
    storage: { getItem: () => null, setItem: () => undefined, removeItem: () => undefined },
  });
}

export function runJourneys(users: number, days: number): JourneyResult {
  pausePersistence();
  const violations: Violation[] = [];
  const findings: Finding[] = [];
  const violationCounts: Record<string, number> = {};
  const findingCounts: Record<string, number> = {};
  const keepCapped = <T,>(all: T[], counts: Record<string, number>, kindOf: (x: T) => string) => {
    const seen: Record<string, number> = {};
    const kept: T[] = [];
    for (const x of all) {
      const kind = kindOf(x);
      counts[kind] = (counts[kind] ?? 0) + 1;
      seen[kind] = (seen[kind] ?? 0) + 1;
      if (seen[kind] <= MAX_EXAMPLES_PER_KIND) kept.push(x);
    }
    all.length = 0;
    all.push(...kept);
  };
  const silent = new Map<string, number>();
  let actions = 0;
  for (let i = 0; i < users; i += 1) {
    actions += runJourney(i, days, [], violations);
    // The render pass: what this person's screens would have said. Run
    // after their days so the plans, routines and metrics are real.
    checkAudienceGating(findings);
    for (const date of Object.keys(useAppStore.getState().plans)) {
      checkCoachNote(date, findings);
    }
    // Capped as we go rather than at the end: 500 people producing the same
    // finding every day is what overflowed the heap in the first place.
    keepCapped(findings, findingCounts, (f) => `${f.screen}|${f.rule}`);
    keepCapped(violations, violationCounts, (v) => v.invariant);
    // Measured per person, after their run: a title that produced a metric
    // for anybody is covered, and only the ones that never do are silent.
    const { plans, metrics } = useAppStore.getState();
    const noted = new Set(metrics.map((m) => m.note ?? ''));
    for (const plan of Object.values(plans)) {
      for (const item of plan.items) {
        if (item.status !== 'completed' || item.title === 'Work') continue;
        if (noted.has(item.title)) continue;
        silent.set(item.title, (silent.get(item.title) ?? 0) + 1);
      }
    }
  }
  return {
    users,
    actions,
    violations,
    violationCounts,
    findings,
    findingCounts,
    silentPractices: [...silent.entries()]
      .map(([title, completions]) => ({ title, completions }))
      .sort((a, b) => b.completions - a.completions),
  };
}

/** Violations grouped by invariant, most frequent first. */
export function summarise(result: JourneyResult): string {
  const example = (pred: (v: Violation) => boolean) => result.violations.find(pred)?.detail ?? '';
  const rows = Object.entries(result.violationCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, n]) => `| ${name} | ${n} | ${example((v) => v.invariant === name)} |`);
  const findingRows = Object.entries(result.findingCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([kind, n]) => {
      const [screen, rule] = kind.split('|');
      const eg = result.findings.find((f) => f.screen === screen && f.rule === rule);
      return `| ${screen} | ${rule} | ${n} | ${eg?.detail ?? ''} |`;
    });

  const silent = result.silentPractices
    .slice(0, 12)
    .map((s) => `| ${s.title} | ${s.completions} |`);
  const totalViolations = Object.values(result.violationCounts).reduce((a, b) => a + b, 0);
  return [
    `${result.users} users · ${result.actions} actions · ${totalViolations} violations`,
    '',
    '| invariant | hits | first example |',
    '|---|---|---|',
    ...(rows.length > 0 ? rows : ['| — | 0 | none |']),
    '',
    'Completed practices that recorded no number:',
    '',
    '| practice | completions |',
    '|---|---|',
    ...(silent.length > 0 ? silent : ['| — | 0 |']),
    '',
    'Render pass — what the screens would say:',
    '',
    '| screen | rule | hits | first example |',
    '|---|---|---|---|',
    ...(findingRows.length > 0 ? findingRows : ['| — | — | 0 | none |']),
  ].join('\n');
}

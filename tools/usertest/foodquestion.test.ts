/**
 * Scratch: what does the nutrition coach deliver when it is switched ON?
 *
 * `usertest:coachvalue` reports Nutrition 0 items, 0 done, and that has
 * been read as "nutrition is thin". It may instead be "nutrition was
 * never measured": `buildPlan` starts the nutrition path only when
 * `foodAim` is answered and is not 'none', and of eleven personas
 * exactly one (`endurance_athlete`) answers it. Ten never turn the coach
 * on — including `career_optimiser`, the target.
 *
 * It reports ITEMS ONLY. Whether nutrition keeps anything is a question
 * about the store, not about this engine, and is answered there.
 *
 * This builds the target persona twice, patching the interview answers
 * BEFORE `buildLifeOperatingPlan` consumes them (SimUser keeps no
 * answers, which cost one wrong run to notice). The difference between
 * the two columns is the size of the harness error.
 */
import { runUser } from '@/features/sim/engine';
import { PERSONAS, HABIT_KEYS, mulberry32, type SimUser } from '@/features/sim/personas';
import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { protocolById } from '@/features/knowledge/protocols';
import { coachForProtocol, coachForArea } from '@/features/coaches/interrupt';
import type { InterviewAnswers } from '@/features/onboarding/script';

const DAYS = 45;
const KEY = 'career_optimiser';

/** `makeUserOf` with a hook to change the answers before the plan is built. */
function userWith(id: number, patch: Partial<InterviewAnswers>): SimUser {
  const spec = PERSONAS.find((p) => p.key === KEY)!;
  const rng = mulberry32(1_000_003 * (id + 1));
  // HABIT_KEYS, in its own order, and BEFORE `spec.answers` — exactly as
  // `makeUserOf` does it. A first version of this file filtered
  // `Object.keys(spec.habitOdds)` instead, which draws from `rng` a
  // different number of times and so builds a different person under the
  // same seed: it printed Training 167/95 against coachvalue's 161/83
  // for the one named persona both claim to be running. The baseline
  // column of a comparison has to be the same baseline everyone else
  // measures, or the comparison measures the harness.
  const trueHabits = HABIT_KEYS.filter((h) => rng() < (spec.habitOdds?.[h] ?? 0));
  const answers = { ...spec.answers(rng), ...patch } as InterviewAnswers;
  if (trueHabits.length > 0) answers.existingHabits = trueHabits;
  const truth = spec.truth(rng);
  truth.trueHabits = trueHabits;
  truth.establishedBoost = 1.15 + rng() * 0.1;
  return { id, persona: spec.key, plan: buildLifeOperatingPlan(answers), truth, rng };
}

function tally(user: SimUser) {
  const r = runUser(user, DAYS, '2026-09-08', { startPaths: true });
  const snap = r.snapshot;
  const byRoutine = new Map(snap.routines.map((x) => [x.id, x]));
  const owner = (routineId?: string) => {
    if (!routineId) return 'unassigned';
    const routine = byRoutine.get(routineId);
    if (!routine) return 'unassigned';
    const p = routine.protocolId ? protocolById(routine.protocolId) : undefined;
    return p ? coachForProtocol(p) : coachForArea(routine.area);
  };
  const out = new Map<string, { planned: number; done: number; routines: Set<string> }>();
  for (const plan of Object.values(snap.plans)) {
    for (const item of plan.items) {
      if (item.fixed || item.title === 'Work') continue;
      const k = owner(item.routineId);
      if (!out.has(k)) out.set(k, { planned: 0, done: 0, routines: new Set() });
      const t = out.get(k)!;
      t.planned += 1;
      if (item.status === 'completed') t.done += 1;
      if (item.routineId) t.routines.add(item.routineId);
    }
  }
  return { out, snap, starts: user.plan.pathStarts.map((p) => p.id) };
}

it('measures nutrition with the food question answered', () => {
  const show = (label: string, t: ReturnType<typeof tally>) => {
    const n = t.out.get('nutrition');
    console.log(`\n── ${label} ──`);
    console.log(`  pathStarts from the interview: ${t.starts.join(', ') || 'none'}`);
    console.log(`  paths actually running: ${Object.keys(t.snap.paths ?? {}).join(', ') || 'none'}`);
    console.log(`  nutrition items: planned=${n?.planned ?? 0} done=${n?.done ?? 0} routines=${n?.routines.size ?? 0}`);
    // Deliberately NOT reported here: `mealPlan`. `SimSnapshot` has no
    // such field, so this harness cannot say whether the app writes one,
    // and a line printing "none" would have been this script asserting
    // the absence of something it never looked at. What the artefact is
    // worth is answered by reading `store.ts` — `saveMealPlan` has one
    // caller, `session/meals.tsx`, where the person types the dinners in.
    const all = [...t.out.entries()]
      .sort((a, b) => b[1].planned - a[1].planned)
      .map(([k, v]) => `${k} ${v.planned}/${v.done}`)
      .join('  ');
    console.log(`  every coach (planned/done): ${all}`);
  };

  show('as shipped — foodAim unanswered', tally(userWith(1, {})));
  show('foodAim answered', tally(userWith(1, { foodAim: 'muscle', weight: '82' } as never)));

  const answering = PERSONAS.filter((p) => Boolean((p.answers(mulberry32(7)) as never as Record<string, unknown>).foodAim));
  console.log(`\npersonas answering foodAim: ${answering.length} of ${PERSONAS.length} — ${answering.map((p) => p.key).join(', ')}`);
});

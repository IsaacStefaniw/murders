/**
 * Isaac's own week, built from his own answers.
 *
 * Not a persona. Isaac, 9 Nov 2026, asked for the optimal week for
 * himself from everything in here. These are the answers he gave:
 *
 *   work          08:00-16:30, five weekdays, office 2 min drive from home
 *   lunch         45 min door to door, so a ~30 min session
 *   pickup        he collects the boys from daycare; partner does Tue + Fri
 *   sleep         wake 06:30, bed 22:00, sometimes woken in the night
 *   household     two children, both under 5
 *   training      home gym: squat rack, barbell + plates, bench, incline,
 *                 smith machine, pulley, leg extension
 *   weight        ~90 kg
 *   aim           lose fat, keep muscle, support training
 *   food trouble  evenings
 *   alcohol       midweek at home AND heavy weekends; wants to stop
 *                 except 2-3 named events a month
 *   vaping        only when drinking or stressed
 *   parenting     present at bedtime every night; one real thing at the
 *                 weekend
 *
 * The `equipment: 'gym'` is deliberate and is not a lie: `TrainingEquipment`
 * describes what the movements can assume, not where the building is, and a
 * squat rack with a barbell and a bench supports every barbell lift the
 * generator prescribes. 'home' would downgrade him to dumbbell patterns he
 * has better tools than.
 */
import { buildProgramme, type TrainingInputs } from '@/features/training/programme';
import { buildNutritionPlan, proteinTarget } from '@/features/nutrition/plan';

it('prints Isaac a block and his numbers', () => {
  const inputs: TrainingInputs = {
    goal: 'fatloss',
    experience: 'consistent',
    level: 'established',
    daysAvailable: 4,
    sessionMin: 30,
    equipment: 'gym',
    focusArea: 'whole',
    age: 34,
  };
  // Isaac, 9 Nov 2026: "squat 110, bench 130, deadlift 140, overhead 80".
  // `baselines` is an e1RM snapshot (LIFT_METRIC -> strength.*.e1rm), so
  // the same four numbers mean two different blocks depending on whether
  // he gave maxes or working sets. Both are printed; neither is guessed.
  const asMax = { squat: 110, bench: 130, deadlift: 140, ohp: 80 };
  // Epley at 8 reps: e1RM = w * (1 + 8/30) = w * 1.267.
  const asWorking = Object.fromEntries(
    Object.entries(asMax).map(([k, v]) => [k, Math.round(v * 1.267)]),
  ) as typeof asMax;

  for (const [label, base] of [
    ['AS e1RM (the four numbers ARE maxes)', asMax],
    ['AS WORKING SETS at ~8 reps (e1RM derived)', asWorking],
  ] as const) {
    const b = buildProgramme(inputs, base);
    console.log(`\n╔══ ${label}`);
    console.log(`║  baselines: ${Object.entries(base).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
    for (const [wi, week] of b.weeks.entries()) {
      console.log(`║  week ${wi + 1} ${week.phase ?? ''}`);
      for (const ses of week.sessions) {
        console.log(`║    ${ses.title} — est ${ses.estimatedMin} min`);
        for (const e of ses.exercises ?? []) {
          if (!e.loadKg) continue;
          console.log(`║     ${e.name.padEnd(22)} ${e.sets}×${String(e.reps).padEnd(7)} ${String(e.loadKg).padStart(6)}kg`);
        }
      }
    }
  }

  const p = buildProgramme(inputs, asMax);

  console.log('\n══════ FOUR-WEEK BLOCK ══════');
  console.log(`goal=${inputs.goal} level=${inputs.level} days=${inputs.daysAvailable} session=${inputs.sessionMin}min`);
  for (const [wi, week] of p.weeks.entries()) {
    console.log(`\n── week ${wi + 1} · ${week.phase} · focus: ${week.focus} ──`);
    for (const s of week.sessions) {
      console.log(`  ${s.title}${s.kind ? ` [${s.kind}]` : ''} — est ${s.estimatedMin} min${s.note ? ` · ${s.note}` : ''}`);
      for (const e of s.exercises ?? []) {
        const load = e.loadKg ? `${e.loadKg}kg` : e.rpe ? `RPE ${e.rpe}` : '';
        console.log(`     ${e.name.padEnd(30)} ${e.sets}×${String(e.reps).padEnd(7)} ${load.padEnd(9)} rest ${e.restSec}s`);
      }
    }
  }

  console.log('\n══════ NUTRITION ══════');
  for (const aim of ['weight', 'muscle'] as const) {
    const t = proteinTarget(aim, 90);
    console.log(`aim=${aim.padEnd(7)} protein ${t?.minG}-${t?.maxG}g/day · ${t?.perMealG}g across ${t?.meals} meals`);
  }
  const plan = buildNutritionPlan({ aim: 'weight', weightKg: 90, trouble: 'evenings', leverLevel: 4 });
  console.log(`fibre ${plan.fibreTargetG}g/day`);
  console.log(`plate: ${plan.plate}`);
  console.log('\nLEVER LADDER (reordered because the trouble is evenings):');
  for (const [i, l] of plan.levers.entries()) {
    console.log(`  ${i + 1}. [${l.state}] ${l.title} — ${l.detail}${l.protocolId ? `  (${l.protocolId})` : ''}`);
  }
});

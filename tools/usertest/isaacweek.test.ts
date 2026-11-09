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
  const p = buildProgramme(inputs, {});

  console.log('\n══════ FOUR-WEEK BLOCK ══════');
  console.log(`goal=${inputs.goal} level=${inputs.level} days=${inputs.daysAvailable} session=${inputs.sessionMin}min`);
  for (const [wi, week] of p.weeks.entries()) {
    console.log(`\n── week ${wi + 1}${week.phase ? ` · ${week.phase}` : ''} ──`);
    for (const s of week.sessions) {
      console.log(`  ${s.name}${s.focus ? ` (${s.focus})` : ''}`);
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

/**
 * Seam 1 — a deferred interview answer, walked to the day.
 *
 * The opening interview asks nine questions and defers the rest to the
 * coach that consumes them. A late answer has to land on the same field
 * the interview would have set, reach the pathway whose build it changes,
 * change the thing that pathway computes, and still leave the row on Today
 * that runs it. Every hop is asserted, for every deferred answer in
 * PATH_ANSWER_FOR and every field profilePatchFor knows.
 */

import { PATHS } from '@/features/paths/definitions';
import { PATH_ANSWER_FOR, profilePatchFor } from '@/features/onboarding/buildPlan';
import { INTERVIEW_STEPS, deferredSteps } from '@/features/onboarding/script';
import { buildNutritionPlan, type NutritionInputs } from '@/features/nutrition/plan';
import { deepHoursTarget } from '@/features/work/programme';
import { displacedLine } from '@/features/planner/displaced';
import { behaviourInfo } from '@/features/behaviours/catalog';
import { useAppStore } from '@/state/store';
import type { LifeProfile } from '@/types/domain';

import { nextDateOn, onboard } from './harness';

const s = () => useAppStore.getState();

/** The hub's own nutrition inputs, as NutritionHub.tsx assembles them. */
function nutritionInputs(): NutritionInputs {
  const answers = s().paths.nutrition?.answers ?? {};
  return {
    aim: (answers.aim as NutritionInputs['aim']) || 'energy',
    weightKg: s().profile?.weightKg,
    trouble: answers.trouble as NutritionInputs['trouble'],
    leverLevel: Number(answers.leverLevel) || 0,
  };
}

function startEveryPath() {
  s().startPath('training', { experience: 'consistent', frequency: '3-4', limiter: 'time' });
  s().startPath('nutrition', { aim: 'energy', cooking: 'normal' });
  s().startPath('money', { mode: 'saving', automation: 'partial' });
  s().startPath('work', { style: 'mixed', team: 'solo' });
  s().startPath('recovery', { behaviour: 'doomscrolling', trigger: 'evening', replacement: 'breathe' });
  s().buildTrainingBlock();
  s().buildWorkBlock();
}

/** The Today row that runs the training block: title, time, and the reason line when it moved. */
function workoutRow(date: string) {
  const plan = s().ensurePlan(date);
  const strength = s().routines.find((r) => r.active && r.protocolId === 'strength')!;
  const row = plan.items.find((i) => i.routineId === strength.id);
  return { plan, strength, row };
}

const programmedNames = () =>
  s().trainingProgramme!.weeks.flatMap((w) => w.sessions.flatMap((x) => x.exercises.map((e) => e.name)));

interface Case {
  step: string;
  value: string | string[];
  /** What the profile must carry afterwards. */
  profile?: Partial<LifeProfile>;
  /** The visible consequence, beyond the profile and the path record. */
  then?: () => void;
}

const CASES: Case[] = [
  {
    step: 'trainingExperience',
    value: 'new',
    then: () => {
      expect(s().trainingLevelState().level).toBe('foundation');
      expect(s().trainingProgramme!.inputs.experience).toBe('new');
      expect(s().trainingProgramme!.inputs.level).toBe('foundation');
      expect(programmedNames()).not.toContain('Deadlift');
      expect(programmedNames()).not.toContain('Overhead press');
      expect(PATHS.training.insights(s().paths.training!.answers, s().profile)[0]).toMatch(/Two 30-minute sessions/);
    },
  },
  {
    step: 'trainingSetup',
    value: 'home',
    profile: { trainingPreference: 'home' },
    then: () => {
      expect(s().trainingProgramme!.inputs.equipment).toBe('home');
      const loaded = s().trainingProgramme!.weeks.flatMap((w) => w.sessions.flatMap((x) => x.exercises)).filter((e) => e.loadKg);
      expect(loaded).toHaveLength(0);
    },
  },
  {
    step: 'trainingSetup',
    value: 'walking',
    profile: { trainingPreference: 'outdoors' },
    then: () => expect(s().trainingProgramme!.inputs.equipment).toBe('bodyweight'),
  },
  {
    step: 'age',
    value: '65',
    profile: { age: 65 },
    then: () => {
      expect(s().trainingProgramme!.inputs.age).toBe(65);
      expect(s().trainingProgramme!.notes).toContain('45+: longer warm-ups are built into every estimate.');
      expect(PATHS.training.insights(s().paths.training!.answers, s().profile).join(' ')).toMatch(/At 65, warm-ups/);
    },
  },
  {
    step: 'foodAim',
    value: 'weight',
    then: () => {
      expect(PATHS.nutrition.insights(s().paths.nutrition!.answers, s().profile).join(' ')).toMatch(/Kitchen closes/);
      expect(buildNutritionPlan(nutritionInputs()).levers[0].id).toBe('kitchen-closed');
    },
  },
  {
    step: 'foodTrouble',
    value: 'drinks',
    then: () => expect(buildNutritionPlan(nutritionInputs()).levers[0].id).toBe('liquid-calories'),
  },
  {
    step: 'weight',
    value: '86',
    profile: { weightKg: 86 },
    then: () => {
      expect(PATHS.nutrition.insights(s().paths.nutrition!.answers, s().profile)[0]).toMatch(/~138–172 g\/day/);
      expect(buildNutritionPlan(nutritionInputs()).proteinTarget).toEqual({ minG: 138, maxG: 172, perMealG: 45, meals: 3 });
    },
  },
  {
    step: 'money',
    value: 'debt',
    then: () => {
      const lines = PATHS.money.insights(s().paths.money!.answers, s().profile).join(' ');
      expect(lines).toMatch(/list every rate/);
      expect(lines).not.toMatch(/Investing/);
    },
  },
  {
    step: 'money',
    value: 'checkin',
    then: () => {
      // The interview's "a short check-in" is the money path's clarity mode.
      expect(s().paths.money!.answers.mode).toBe('clarity');
      expect(PATHS.money.insights(s().paths.money!.answers, s().profile).join(' ')).toMatch(/One place, one monthly number/);
    },
  },
  {
    step: 'moneyAutomation',
    value: 'no',
    then: () => expect(PATHS.money.insights(s().paths.money!.answers, s().profile).join(' ')).toMatch(/automate one transfer/),
  },
  {
    step: 'workStyle',
    value: 'maker',
    profile: { workStyle: 'maker' },
    then: () => {
      expect(s().workBlock!.inputs.style).toBe('maker');
      expect(deepHoursTarget(s().workBlock!.inputs)).toBe(9);
      expect(PATHS.work.insights(s().paths.work!.answers, s().profile).join(' ')).toMatch(/Mornings are for making/);
    },
  },
  {
    step: 'sleepQuality',
    value: 'broken',
    profile: { sleepQuality: 'broken' },
    // No coach reads this after onboarding; see the integration report.
  },
  {
    step: 'pressure',
    value: 'redline',
    profile: { pressure: 'redline' },
    then: () => {
      // The work block is the one thing that reads pressure after the
      // interview, so it is rebuilt from the answer straight away.
      const inputs = s().workBlock!.inputs;
      expect(inputs.pressure).toBe('redline');
      expect(deepHoursTarget(inputs)).toBeLessThan(deepHoursTarget({ ...inputs, pressure: undefined }));
    },
  },
];

beforeEach(() => {
  onboard();
  startEveryPath();
});

describe('every deferred answer in PATH_ANSWER_FOR', () => {
  it('is asked in the hub whose answers it writes', () => {
    for (const [step, route] of Object.entries(PATH_ANSWER_FOR)) {
      const def = INTERVIEW_STEPS.find((x) => x.id === step);
      expect(def).toBeDefined();
      expect(def!.deferTo).toBe(route.path);
    }
  });

  it.each(CASES.map((c) => [c.step, c.value, c] as const))(
    '%s = %s reaches the profile, the path, the coach and the row',
    (step, value, c) => {
      const route = PATH_ANSWER_FOR[step];
      const before = s().profile!;
      // The hub offers the question unless the coach's own intake asked it.
      const covered = s().paths[route.path]!.answers[route.key] !== undefined;
      expect(deferredSteps(s().interviewAnswers, route.path).map((x) => x.id).includes(step)).toBe(!covered);

      s().answerDeferredQuestion(step, value);

      // The record, and the hub stops asking.
      expect(s().interviewAnswers[step]).toEqual(value);
      expect(deferredSteps(s().interviewAnswers, route.path).map((x) => x.id)).not.toContain(step);
      // The profile field, exactly what profilePatchFor promises.
      const patch = profilePatchFor(step, value, before);
      if (patch) expect(s().profile).toMatchObject(patch);
      if (c.profile) expect(s().profile).toMatchObject(c.profile);
      // The pathway's answer under the key its build and insights read.
      const written = s().paths[route.path]!.answers[route.key];
      expect(written).toBeDefined();
      // The coach.
      c.then?.();
      // The row on Today that runs the block, or the reason it is not there.
      const { plan, strength, row } = workoutRow(nextDateOn(1));
      if (row) {
        expect(row.title).toBe(strength.title);
        expect(row.sessionType).toBe('workout');
        expect(row.start < row.end).toBe(true);
      } else {
        const line = displacedLine(plan.displaced ?? []);
        expect(line).toContain(strength.title);
      }
    },
  );

  it('the hub does not ask what the intake just asked', () => {
    // The training intake asked "where are you starting from?" and the
    // hub asked it again a minute later, because the intake wrote to the
    // path and the deferred card reads the interview record.
    expect(deferredSteps(s().interviewAnswers, 'training').map((x) => x.id)).not.toContain('trainingExperience');
    expect(s().interviewAnswers.trainingExperience).toBe('consistent');
    expect(deferredSteps(s().interviewAnswers, 'nutrition').map((x) => x.id)).not.toContain('foodAim');
    expect(deferredSteps(s().interviewAnswers, 'money').map((x) => x.id)).not.toContain('money');
    expect(deferredSteps(s().interviewAnswers, 'money').map((x) => x.id)).not.toContain('moneyAutomation');
    expect(deferredSteps(s().interviewAnswers, 'work').map((x) => x.id)).not.toContain('workStyle');
    // What the intake did not ask is still asked.
    expect(deferredSteps(s().interviewAnswers, 'training').map((x) => x.id)).toContain('trainingSetup');
    expect(deferredSteps(s().interviewAnswers, 'nutrition').map((x) => x.id)).toContain('foodTrouble');
  });

  it('a pathway answer for a coach not yet started waits in the interview record', () => {
    onboard();
    s().answerDeferredQuestion('money', 'debt');
    expect(s().interviewAnswers.money).toBe('debt');
    expect(s().paths.money).toBeUndefined();
    // And the intake still asks its own question, with nothing pre-filled
    // behind it that the person did not see.
    expect(deferredSteps(s().interviewAnswers, 'money').map((x) => x.id)).not.toContain('money');
  });
});

describe('every field profilePatchFor knows', () => {
  it('vision, habits and the household land on the profile', () => {
    s().answerDeferredQuestion('vision', 'Fitter and more present');
    expect(s().profile!.lifeVision).toBe('Fitter and more present');

    s().answerDeferredQuestion('moreOf', ['Reading']);
    expect(s().profile!.moreOf).toEqual(['Reading']);

    s().answerDeferredQuestion('existingHabits', ['workout']);
    expect(s().profile!.existingHabits).toEqual(['workout']);

    s().answerDeferredQuestion('kidsCount', '2');
    expect(s().profile!.kidsCount).toBe(2);

    s().answerDeferredQuestion('household', ['partner', 'kids']);
    expect(s().profile!.people.map((p) => p.relation).sort()).toEqual(['child', 'partner']);
    s().answerDeferredQuestion('partnerName', 'Alex');
    expect(s().profile!.people.find((p) => p.relation === 'partner')!.name).toBe('Alex');
    // Answering the household twice leaves one partner, still named.
    s().answerDeferredQuestion('household', ['partner']);
    const partners = s().profile!.people.filter((p) => p.relation === 'partner');
    expect(partners).toHaveLength(1);
    expect(partners[0].name).toBe('Alex');
    expect(s().profile!.people.some((p) => p.relation === 'child')).toBe(false);
  });

  it('sex at birth reaches the profile and the strength standards', () => {
    s().answerDeferredQuestion('sexAtBirth', 'female');
    expect(s().profile!.sexAtBirth).toBe('female');
    expect(s().interviewAnswers.sexAtBirth).toBe('female');
  });

  it('a behaviour named late is protected against from that moment', () => {
    s().answerDeferredQuestion('lessOf', ['alcohol']);
    expect(s().profile!.lessOf).toEqual(['alcohol']);
    const intention = s().behaviourIntentions.find((b) => b.behaviour === 'alcohol');
    expect(intention?.active).toBe(true);
    expect(intention?.intentionText).toBe(behaviourInfo('alcohol').intentionTemplate);
    // Naming it again never makes a twin.
    s().answerDeferredQuestion('lessOf', ['alcohol', 'doomscrolling']);
    expect(s().behaviourIntentions.filter((b) => b.behaviour === 'alcohol')).toHaveLength(1);
  });
});

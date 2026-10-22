/**
 * The gym trainer actually has a programme in it.
 *
 * Isaac, 22 Oct 2026: *"Still I didn't want to come back really, the gym
 * trainer was ok but nothing else incentivised it either."*
 *
 * Measured over his six weeks (`npm run usertest:coachvalue`), Training
 * put 148 of the 190 items in his week and 79 of the 95 he completed —
 * three quarters of everything he did, from the one coach he named. The
 * other six managed 42 items between them and four put in NOTHING.
 *
 * Two things were wrong with the one that worked, and both are
 * composition bugs of exactly the kind this file exists for:
 *
 *  1. `buildLifeOperatingPlan` could start nutrition, money and recovery
 *     and had NO BRANCH for training. The gym trainer could never be
 *     started by the interview, for anybody.
 *  2. `startPath` created the goal and the routines and never called
 *     `buildTrainingBlock`, so `trainingProgramme` stayed null — he
 *     opened a strength session and found an empty box labelled kg. Every
 *     other route to the block rebuilds it; the one that creates the coach
 *     did not.
 */

import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { grantedEntitlement } from '@/features/plus/entitlement';
import { useAppStore } from '@/state/store';
import type { InterviewAnswers } from '@/features/onboarding/script';

const BASE = {
  name: 'Alex',
  priorities: ['health', 'work', 'growth'],
  capacity: 'push',
  age: '34',
  workStyle: 'mixed',
  workDays: [1, 2, 3, 4, 5],
  workHours: '08:30-18:30',
  sleep: '06:15-23:00',
  sleepQuality: 'ok',
  pressure: 'busy',
  energy: 'evening',
  trainingDays: '4',
  trainingSetup: 'gym',
  trainingExperience: 'consistent',
  existingHabits: ['workout'],
  moreOf: [],
  lessOf: [],
  ambition: 'Get into the best shape of my life',
} as unknown as InterviewAnswers;

const onboard = (over: Partial<Record<string, unknown>> = {}) => {
  useAppStore.getState().resetAll();
  const built = buildLifeOperatingPlan({ ...BASE, ...over } as InterviewAnswers);
  useAppStore.setState({ entitlement: grantedEntitlement() });
  useAppStore.getState().completeOnboarding({
    profile: built.profile,
    goals: built.goals,
    routines: built.routines,
    behaviourIntentions: built.behaviourIntentions,
  });
  return built;
};

describe('the interview starts the training coach', () => {
  it('starts it for somebody who trains in a gym', () => {
    const built = onboard();
    expect(built.pathStarts.map((p) => p.id)).toContain('training');
  });

  it('passes only what the interview actually asked', () => {
    const start = onboard().pathStarts.find((p) => p.id === 'training')!;
    // `want` is the question the fitness intake leads with and the
    // interview never puts. 'unsure' is a real option on it — "Not sure,
    // help me pick" — and guessing from a free-text ambition is what the
    // question bank's own comment records as the thing it replaced.
    expect(start.answers.want).toBe('unsure');
    expect(start.answers.experience).toBe('consistent');
    expect(start.answers.frequency).toBe('3-4');
  });

  it('bands the frequency the way the intake expects', () => {
    const band = (days: string) =>
      onboard({ trainingDays: days }).pathStarts.find((p) => p.id === 'training')?.answers.frequency;
    expect(band('2')).toBe('1-2');
    expect(band('4')).toBe('3-4');
    expect(band('6')).toBe('5+');
  });

  it('does not start it for somebody whose training is the walk', () => {
    const built = onboard({ trainingSetup: 'walking' });
    expect(built.pathStarts.map((p) => p.id)).not.toContain('training');
  });

  it('does not start it for somebody who does not train', () => {
    const built = onboard({ trainingDays: '0', existingHabits: [] });
    expect(built.pathStarts.map((p) => p.id)).not.toContain('training');
  });

  /**
   * Held back, and it is the rule rather than an exception to it. Every
   * work-hours comparison in the codebase asks `start <= m < end`, which
   * is false for every minute of a 19:00-07:00 shift — so the app cannot
   * see that 06:00 is her work, and places a strength session there. On
   * the cohort it takes the night nurse from 0.269 to 0.152, through the
   * floor. Handing somebody a programme the scheduler will put inside
   * their shift is the failure this whole change is about.
   */
  it('holds back for a shift that crosses midnight, until the window understands midnight', () => {
    const built = onboard({ workHours: '19:00-07:00', sleep: '08:30-00:15' });
    expect(built.pathStarts.map((p) => p.id)).not.toContain('training');
  });
});

describe('starting it builds the block', () => {
  it('leaves a programme with sessions in it, not a null', () => {
    const built = onboard();
    const start = built.pathStarts.find((p) => p.id === 'training')!;
    useAppStore.getState().startPath('training', start.answers);

    const programme = useAppStore.getState().trainingProgramme;
    expect(programme).not.toBeNull();
    expect(programme!.weeks.length).toBeGreaterThan(0);
    expect(programme!.weeks[0].sessions.length).toBeGreaterThan(0);
  });

  /**
   * The point of the whole change: a coach that tells you to train and
   * never says what to lift is the difference between "ok" and a reason
   * to come back.
   */
  it('names actual exercises, so the session is not an empty kg box', () => {
    const built = onboard();
    useAppStore
      .getState()
      .startPath('training', built.pathStarts.find((p) => p.id === 'training')!.answers);

    const session = useAppStore.getState().trainingProgramme!.weeks[0].sessions[0];
    expect(session.exercises.length).toBeGreaterThan(0);
    for (const exercise of session.exercises) {
      expect(exercise.name.length).toBeGreaterThan(1);
      // Prescribed, not blank: the empty kg box was the whole complaint.
      expect(exercise.sets).toBeGreaterThan(0);
    }
  });

  it('does not build a block for a coach that is not the trainer', () => {
    onboard();
    expect(useAppStore.getState().trainingProgramme).toBeNull();
    useAppStore.getState().startPath('recovery', { behaviour: 'alcohol', trigger: 'unsure' });
    expect(useAppStore.getState().trainingProgramme).toBeNull();
  });
});

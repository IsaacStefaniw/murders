/**
 * The bridge from the repo's constants into the app's store.
 *
 * These assert the thing that would silently break: that the plan built
 * from his frozen answers actually contains the week he was given. A
 * bridge that compiles and produces an empty plan is worse than no
 * bridge, because the app would look onboarded and hold nothing.
 */

import { mePlan, meOnboarding, mePathStarts, PROVENANCE, THE_LOG_GAP } from '@/features/me/adopt';
import { ISAAC_PROFILE, ME, STATED_ON } from '@/features/me/profile';
import { LIFTING } from '@/features/me/week';

describe('the plan his constants produce', () => {
  it('produces a profile, goals and routines', () => {
    const plan = mePlan();
    expect(plan.profile.firstName).toBe('Isaac');
    expect(plan.goals.length).toBeGreaterThan(0);
    expect(plan.routines.length).toBeGreaterThan(0);
  });

  it('hands back the STATED profile, not the derived one', () => {
    // buildLifeOperatingPlan derives a profile from the answers;
    // profile.ts states it directly, with his words beside each field.
    // Where they disagree the stated one wins, and the finish time is the
    // field that broke the product when it was wrong.
    expect(mePlan().profile).toBe(ISAAC_PROFILE);
    expect(mePlan().profile.workEnd).toBe('16:30');
  });

  it('starts the training path, because he trains four days', () => {
    // The nutrition coach was lost for six weeks because an interview
    // answer was never set and nothing asserted on it. This is that
    // assertion, for the path that matters most to him.
    const ids = mePathStarts().map((p) => p.id);
    expect(ids).toContain('training');
  });

  it('starts nutrition, because foodAim is answered in the constants', () => {
    // ISAAC_ANSWERS sets foodAim deliberately: ten of eleven simulated
    // personas never answered it, which is why the coach returned zero
    // items for six weeks. A constant cannot skip the question.
    expect(mePathStarts().map((p) => p.id)).toContain('nutrition');
  });
});

describe('what the store receives', () => {
  it('matches completeOnboarding exactly, with answers included', () => {
    const input = meOnboarding();
    expect(Object.keys(input).sort()).toEqual(
      ['answers', 'behaviourIntentions', 'goals', 'profile', 'routines'].sort(),
    );
    // `answers` is what the health markers and QuickLog read. Omitting it
    // would leave the app onboarded with no answers, which is the shape
    // the deferred-question screens cannot recover from.
    expect(input.answers.workHours).toBe(`${ME.workStart}-${ME.workEnd}`);
  });

  it('carries the four training days the declared week expects', () => {
    expect(meOnboarding().profile.trainingDaysPerWeek).toBe(Object.keys(LIFTING).length);
  });
});

describe('honesty about what it does not do', () => {
  it('says where the facts came from, and when', () => {
    expect(PROVENANCE).toContain(STATED_ON);
    expect(PROVENANCE).toMatch(/not from an interview/i);
  });

  it('states the log gap rather than implying the loop is closed', () => {
    expect(THE_LOG_GAP).toMatch(/log/i);
    expect(THE_LOG_GAP).toMatch(/daily|changes/i);
  });
});

/**
 * Saying "my back has gone" after the block was already built.
 *
 * `constraints` is the only injury input that decides whether the training
 * coach prescribes a loaded lift, and it could be given exactly once,
 * during setup. It is a `multi` step, so `YourAnswers` filtered it out;
 * nothing deferred it; and `profilePatchFor` had no case for it, so even a
 * re-answer never reached the profile. The interview promised the
 * opposite: "You can add something here any time — the plan will adjust
 * from that day."
 *
 * So a man who tore a shoulder in week six had nowhere to say so, and the
 * coach opened his Tuesday with an overhead press at a load computed from
 * his own e1RM for the rest of the block. The app could hear "I moved to a
 * home gym" and could not hear "my back has gone" — which is the most
 * common reason people stop training.
 *
 * Three things are under test: the answer reaches the profile, it survives
 * the round trip back, and it changes the next session WITHOUT rebuilding
 * the block.
 */

import { answersFromProfile, profilePatchFor } from '@/features/onboarding/buildPlan';
import { CONSTRAINT_OPTIONS, applyConstraints } from '@/features/training/constraints';
import { INTERVIEW_STEPS } from '@/features/onboarding/script';
import type { LifeProfile, PhysicalConstraint } from '@/types/domain';

const profile = (over: Partial<LifeProfile> = {}): LifeProfile =>
  ({
    firstName: 'Isaac',
    priorities: ['health'],
    capacity: 'moderate',
    workDays: [1, 2, 3, 4, 5],
    workStart: '09:00',
    workEnd: '17:30',
    wakeTime: '06:30',
    sleepTime: '22:30',
    energyProfile: 'morning',
    trainingDaysPerWeek: 3,
    trainingPreference: 'mixed',
    people: [],
    moreOf: [],
    lessOf: [],
    ...over,
  }) as LifeProfile;

describe('reporting an injury', () => {
  it('reaches the profile, which it never did before', () => {
    expect(profilePatchFor('constraints', ['joints'], profile())).toEqual({
      constraints: ['joints'],
    });
  });

  /**
   * The other direction, and it is not symmetry for its own sake: an
   * injury that cannot be taken back off becomes permanent the moment it
   * is reported, and somebody whose back recovered would be handed a
   * kinder programme forever.
   */
  it('can be taken back off once it is better', () => {
    expect(profilePatchFor('constraints', [], profile({ constraints: ['joints'] }))).toEqual({
      constraints: undefined,
    });
  });

  it('survives the round trip, so the chips come back filled', () => {
    // Without this an existing user's injuries read as unanswered, and the
    // re-ask opens with nothing selected — which is how a Skip silently
    // clears an injury that is still there.
    const answers = answersFromProfile(profile({ constraints: ['joints', 'balance'] }));
    expect(answers.constraints).toEqual(['joints', 'balance']);
  });

  it('says nothing about somebody who never had one', () => {
    expect(answersFromProfile(profile()).constraints).toBeUndefined();
  });
});

/**
 * One list, two screens. The interview asks this at setup and the training
 * hub asks it again whenever something changes; an injury described one
 * way in one place and another way in the other is two different answers
 * to the person, whatever the stored value says.
 */
describe('the words the two screens use', () => {
  it('are the same words', () => {
    const step = INTERVIEW_STEPS.find((s) => s.id === 'constraints');
    expect(step?.options).toBe(CONSTRAINT_OPTIONS);
  });

  it('cover every constraint the programme acts on', () => {
    const offered = new Set(CONSTRAINT_OPTIONS.map((o) => o.value));
    const acted: PhysicalConstraint[] = [
      'joints',
      'balance',
      'heart',
      'recovering',
      'pregnancy',
      'energy',
    ];
    for (const c of acted) expect(offered.has(c)).toBe(true);
  });
});

/**
 * The half that decides whether any of this is worth anything.
 *
 * Constraints used to reach a programme in exactly one place —
 * `buildProgramme`, at build time — so an injury reported in week two did
 * nothing until the block ran out, and the only way to change that was a
 * rebuild that mints a new programme id, resets the week count to one and
 * orphans every swap and drop. Reporting an injury must not cost somebody
 * their block, so the same swap runs over the session as it is read.
 */
describe('the session after the injury', () => {
  // The names the programme actually emits — `programme.ts:539,541` for the
  // two primaries. A test built on invented movement names would pass
  // against a swap table that covers none of them.
  const session = () => [
    { name: 'Squat', lift: 'squat' as const, primary: true },
    { name: 'Overhead press', lift: null, primary: true },
    { name: 'Dumbbell rows', lift: null, primary: false },
  ];

  it('replaces the movement rather than removing it', () => {
    const after = applyConstraints(session(), ['joints']);
    // Same number of things to do. A session with a hole in it is a
    // session somebody skips.
    expect(after).toHaveLength(3);
    expect(after[0].name).not.toBe('Squat');
  });

  it('drops the barbell lift identity with the barbell', () => {
    // Keeping `lift` set would log a goblet squat as a squat baseline and
    // quietly corrupt every strength number downstream.
    const after = applyConstraints(session(), ['joints']);
    expect(after[0].lift).toBeNull();
  });

  it('leaves a session alone when there is nothing to work around', () => {
    expect(applyConstraints(session(), undefined)).toEqual(session());
    expect(applyConstraints(session(), [])).toEqual(session());
  });

  it('puts balance work first rather than tacking it on the end', () => {
    const after = applyConstraints(session(), ['balance']);
    expect(after).toHaveLength(4);
    expect(after[0].name).not.toBe('Squat');
  });

  /**
   * The shoulder in the finding, end to end: the movement that was the
   * problem is gone from tomorrow's session, and the session is still a
   * session.
   */
  it('takes the overhead press out of the very next Tuesday', () => {
    const after = applyConstraints(session(), ['joints']);
    expect(after.map((s) => s.name)).not.toContain('Overhead press');
    expect(after.map((s) => s.name)).not.toContain('Squat');
    expect(after).toHaveLength(3);
  });
});

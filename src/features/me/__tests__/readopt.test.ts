/**
 * A store built by the interview must be replaced, and the logs must not.
 *
 * Isaac, 10 Nov 2026, with a screenshot of his TestFlight day: breakfast
 * at 12:15pm, no lifting session, and a 4:15pm item reading "Launching
 * intent OS and gro…" — a goal from the months he was building this for a
 * market. *"All showing old data I believe."*
 *
 * His store came from the thirty-nine question interview, so nothing in
 * `features/me` had ever reached it, and the adopt in `app/index.tsx` ran
 * only when `onboarded` was false. The profile had been pushed, built and
 * shipped, and still was not the profile in his hand.
 *
 * These test the two halves of the rule the screen now applies: a stored
 * profile that did not come from this revision of the repo is stale, and
 * adopting over it keeps everything he has logged.
 */

import { meOnboarding, mePathStarts } from '@/features/me/adopt';
import { ISAAC_PROFILE, STATED_ON } from '@/features/me/profile';
import { useAppStore } from '@/state/store';
import type { LifeProfile } from '@/types/domain';

/** The rule `app/index.tsx` applies, in one line, so it can be asserted. */
const isStale = (onboarded: boolean, profile?: LifeProfile | null) =>
  !onboarded || profile?.createdAt !== ISAAC_PROFILE.createdAt;

describe('which stores count as stale', () => {
  it('treats a fresh install as stale', () => {
    expect(isStale(false, null)).toBe(true);
  });

  it('treats an interview-built store as stale, which is the bug', () => {
    // The interview stamps a real clock reading. ISAAC_PROFILE carries the
    // constant `${STATED_ON}T00:00:00.000Z`, so the two can never match.
    const fromInterview = { ...ISAAC_PROFILE, createdAt: new Date().toISOString() };
    expect(isStale(true, fromInterview)).toBe(true);
  });

  it('treats a store adopted at this revision as current', () => {
    expect(isStale(true, ISAAC_PROFILE)).toBe(false);
  });

  it('re-adopts when STATED_ON moves, with no extra state to keep', () => {
    const adoptedYesterday = { ...ISAAC_PROFILE, createdAt: '2026-11-08T00:00:00.000Z' };
    expect(isStale(true, adoptedYesterday)).toBe(true);
    // And the constant really is the version, not a clock reading.
    expect(ISAAC_PROFILE.createdAt).toBe(`${STATED_ON}T00:00:00.000Z`);
  });
});

describe('what adopting over an existing store keeps', () => {
  it('replaces the plan and keeps every logged thing', () => {
    const s = () => useAppStore.getState();

    // A store as his phone has it: onboarded, with a founder-era goal, and
    // with real logged history underneath.
    s().completeOnboarding({
      profile: { ...ISAAC_PROFILE, createdAt: '2026-09-01T10:22:03.000Z' },
      goals: [],
      routines: [],
      behaviourIntentions: [],
      answers: {},
    });
    s().addGoal(
      { title: 'Launching intent OS and growing it', area: 'work', domain: 'work' } as never,
      [],
    );
    s().addMetric('body.weight', 90.4, 'seed');
    s().addMetric('mind.mood', 7.5, 'seed');
    const metricsBefore = s().metrics.length;

    expect(isStale(s().onboarded, s().profile)).toBe(true);

    // The adopt, exactly as app/index.tsx runs it.
    s().completeOnboarding(meOnboarding());
    for (const { id, answers } of mePathStarts()) s().startPath(id, answers);

    // The plan is his now.
    expect(isStale(s().onboarded, s().profile)).toBe(false);
    expect(s().profile?.statedTrainingLevel).toBe('advanced');
    expect(s().goals.some((g) => /intent os/i.test(g.title))).toBe(false);

    // And nothing logged was spent to get there.
    expect(s().metrics.length).toBeGreaterThanOrEqual(metricsBefore);
    expect(s().metrics.find((m) => m.key === 'mind.mood')?.value).toBe(7.5);
    expect(s().metrics.find((m) => m.key === 'body.weight')?.value).toBe(90.4);
  });
});

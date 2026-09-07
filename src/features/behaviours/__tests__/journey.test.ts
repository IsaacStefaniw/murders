/**
 * From an urge, through the store, to a timed intervention.
 *
 * The pieces are tested on their own in patterns.test.ts. This is the
 * composed path a person actually walks: name a behaviour in the
 * interview, log it a few times at the real hour, and find the app quiet
 * until it has something true to say — then saying it ahead of the hour,
 * on the days it happens, with what else was true on those days.
 *
 * Every time is built from local components so the window label is the
 * same under Sydney, Perth, Auckland and UTC.
 */

import { BEHAVIOUR_CATALOG, behaviourInfo } from '@/features/behaviours/catalog';
import { behaviourPattern, dueInterventions, DEFAULT_LEAD_MIN, MIN_EVENTS_FOR_PATTERN } from '@/features/behaviours/patterns';
import { plannedNotifications } from '@/features/notifications/schedule';
import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { useAppStore } from '@/state/store';
import { toDateKey } from '@/lib/dates';
import type { BehaviourKey } from '@/types/domain';

const local = (y: number, m: number, d: number, h: number, min = 0) => new Date(y, m - 1, d, h, min, 0, 0);

/** Four Fridays in a row, ending Friday 4 September 2026. */
const FRIDAYS = [local(2026, 8, 14, 21, 15), local(2026, 8, 21, 21, 40), local(2026, 8, 28, 22, 5), local(2026, 9, 4, 21, 50)];
const NOW = local(2026, 9, 8, 9);

function onboardWith(lessOf: BehaviourKey[]) {
  useAppStore.getState().resetAll();
  const built = buildLifeOperatingPlan({
    name: 'Sam',
    priorities: ['health'],
    workDays: ['1', '2', '3', '4', '5'],
    workHours: '09:00-17:30',
    sleep: '06:30-22:30',
    energy: 'morning',
    trainingDays: '2',
    capacity: 'steady',
    lessOf,
  } as never);
  useAppStore.getState().completeOnboarding({
    profile: built.profile,
    goals: built.goals,
    routines: built.routines,
    behaviourIntentions: built.behaviourIntentions,
  });
  return useAppStore.getState().behaviourIntentions.find((b) => b.behaviour === lessOf[0])!;
}

beforeEach(() => useAppStore.getState().resetAll());

describe('an urge, logged, becomes a timed intervention', () => {
  it('says nothing until the fourth log, then names the window and the hour before it', () => {
    const intention = onboardWith(['doomscrolling']);
    const s = useAppStore.getState;
    for (const [i, at] of FRIDAYS.entries()) {
      s().logPastBehaviourEvent(intention.id, at.toISOString(), 'forty minutes', 'usual');
      const p = behaviourPattern(intention, s().behaviourEvents, s().metrics, NOW);
      if (i + 1 < MIN_EVENTS_FOR_PATTERN) {
        expect(p.readiness).toBe('learning');
        expect(p.needed).toBe(MIN_EVENTS_FOR_PATTERN - (i + 1));
        expect(p.intervention).toBeNull();
      }
    }
    const pattern = behaviourPattern(intention, s().behaviourEvents, s().metrics, NOW);
    expect(pattern.readiness).toBe('ready');
    expect(pattern.window?.label).toBe('21:15–22:15');
    expect(pattern.window?.hits).toBe(4);
    expect(pattern.days.label).toBe('Fridays');
    expect(pattern.intervention?.at).toBe('20:30');
    expect(pattern.intervention?.leadMin).toBe(DEFAULT_LEAD_MIN);
    expect(pattern.intervention?.line).toBe('Usually lands 21:15–22:15. 20:30 is ahead of it.');
  });

  it('the log keeps the time it happened, not the time it was typed', () => {
    const intention = onboardWith(['doomscrolling']);
    const id = useAppStore.getState().logPastBehaviourEvent(intention.id, FRIDAYS[0].toISOString(), 'a scroll', 'small');
    const event = useAppStore.getState().behaviourEvents.find((e) => e.id === id)!;
    expect(event.occurredAt).toBe(FRIDAYS[0].toISOString());
    expect(toDateKey(new Date(event.occurredAt))).toBe('2026-08-14');
    expect(event.size).toBe('small');
    useAppStore.getState().setBehaviourEventTrigger(id, 'tired');
    expect(useAppStore.getState().behaviourEvents.find((e) => e.id === id)!.trigger).toBe('tired');
  });

  it('names what else was true on those days, as co-occurrence', () => {
    const intention = onboardWith(['doomscrolling']);
    const s = useAppStore.getState;
    for (const at of FRIDAYS) s().logPastBehaviourEvent(intention.id, at.toISOString());
    // Sleep read that morning, three of the four nights short.
    const nights = [5.5, 5.8, 7.5, 6.0];
    useAppStore.setState({
      metrics: FRIDAYS.map((at, i) => ({
        id: `s${i}`,
        key: 'sleep.hours',
        value: nights[i],
        at: local(at.getFullYear(), at.getMonth() + 1, at.getDate(), 7).toISOString(),
        source: 'healthkit' as const,
      })),
    });
    const pattern = behaviourPattern(intention, s().behaviourEvents, s().metrics, NOW);
    expect(pattern.coFactor).toEqual({
      key: 'short_sleep',
      hits: 3,
      checked: 4,
      label: '3 of the 4 followed a night under 6.5 hours',
    });
    expect(pattern.coFactor!.label).not.toMatch(/caus|because|made you/i);
  });

  it('fires on Fridays and is silent on a Tuesday, in the app and in the queue', () => {
    const intention = onboardWith(['doomscrolling']);
    const s = useAppStore.getState;
    for (const at of FRIDAYS) s().logPastBehaviourEvent(intention.id, at.toISOString());
    const friday = '2026-09-11';
    const tuesday = '2026-09-08';
    const due = dueInterventions(s().behaviourIntentions, s().behaviourEvents, s().metrics, friday, NOW);
    expect(due).toHaveLength(1);
    expect(due[0].at).toBe('20:30');
    expect(dueInterventions(s().behaviourIntentions, s().behaviourEvents, s().metrics, tuesday, NOW)).toEqual([]);

    const settings = { ...s().notifications, enabled: true, interventions: true };
    const queued = plannedNotifications(
      {
        date: friday,
        profile: s().profile,
        plan: null,
        routines: s().routines,
        behaviourIntentions: s().behaviourIntentions,
        behaviourEvents: s().behaviourEvents,
        metrics: s().metrics,
        settings,
      },
      NOW,
    );
    expect(queued).toHaveLength(1);
    expect(queued[0].at).toBe('20:30');
    expect(queued[0].body).toContain('21:15–22:15');
    expect(queued[0].body).not.toMatch(/again|still|only|should have/i);
  });

  it('an intention switched off is left alone', () => {
    const intention = onboardWith(['doomscrolling']);
    const s = useAppStore.getState;
    for (const at of FRIDAYS) s().logPastBehaviourEvent(intention.id, at.toISOString());
    s().setBehaviourIntentionActive(intention.id, false);
    expect(dueInterventions(s().behaviourIntentions, s().behaviourEvents, s().metrics, '2026-09-11', NOW)).toEqual([]);
  });
});

describe('the intention templates', () => {
  it('every behaviour in the catalogue has the words the screens need', () => {
    for (const info of BEHAVIOUR_CATALOG) {
      expect(info.intentionTemplate.trim().length).toBeGreaterThan(3);
      expect(info.logPrompt.trim().length).toBeGreaterThan(3);
      expect(info.detailHint.trim().length).toBeGreaterThan(3);
      // Neutral verb phrases: no verdict on the person in the sentence they will read every day.
      expect(info.intentionTemplate).not.toMatch(/\b(should|must|bad|guilty|shame|weak|fail|failure)\b/i);
    }
  });

  it('naming a behaviour after onboarding creates one intention from the template, and never a twin', () => {
    onboardWith(['doomscrolling']);
    const s = useAppStore.getState;
    expect(s().behaviourIntentions.map((b) => b.behaviour)).toEqual(['doomscrolling']);
    s().answerDeferredQuestion('lessOf', ['doomscrolling', 'late_caffeine']);
    const after = s().behaviourIntentions;
    expect(after.map((b) => b.behaviour)).toEqual(['doomscrolling', 'late_caffeine']);
    expect(after[1].intentionText).toBe(behaviourInfo('late_caffeine').intentionTemplate);
    expect(after[1].active).toBe(true);
    s().answerDeferredQuestion('lessOf', ['late_caffeine']);
    expect(s().behaviourIntentions).toHaveLength(2);
    expect(s().profile!.lessOf).toEqual(['late_caffeine']);
    expect(s().interviewAnswers.lessOf).toEqual(['late_caffeine']);
  });
});

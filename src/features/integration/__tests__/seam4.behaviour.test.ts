/**
 * Seam 4 — an urge, logged, walked to the breath session. Plus off.
 *
 * Naming a behaviour in the interview makes an intention and starts the
 * Habits & urges coach. Four logs at the real hour make a pattern; the
 * pattern makes a time ahead of the window; Today shows that time on the
 * days the pattern lives on with a button into the breath session. None of
 * it is charged for: every assertion runs with no entitlement at all.
 */

import { behaviourInfo } from '@/features/behaviours/catalog';
import { behaviourPattern, dueInterventions, momentNote } from '@/features/behaviours/patterns';
import { plannedNotifications } from '@/features/notifications/schedule';
import { PATHS } from '@/features/paths/definitions';
import {
  FREE_MEDITATION_MAX_MIN,
  isAlwaysFreeRoutine,
  meditationLengthNeedsPlus,
  sessionsPlusWouldRun,
} from '@/features/plus/entitlement';
import { formatTime } from '@/lib/dates';
import { useAppStore } from '@/state/store';

import { local, onboard } from './harness';

const s = () => useAppStore.getState();

/** Four Fridays in a row, ending Friday 4 September 2026. */
const FRIDAYS = [local(2026, 8, 14, 21, 15), local(2026, 8, 21, 21, 40), local(2026, 8, 28, 22, 5), local(2026, 9, 4, 21, 50)];
const NOW = local(2026, 9, 8, 9);
const FRIDAY = '2026-09-11';
const TUESDAY = '2026-09-08';

beforeEach(() => {
  onboard({ lessOf: ['doomscrolling'] }, { plus: false });
});

describe('with Plus off', () => {
  it('the interview’s behaviour becomes an intention and a running coach', () => {
    expect(s().entitlement.plus).toBe(false);
    const intention = s().behaviourIntentions.find((b) => b.behaviour === 'doomscrolling')!;
    expect(intention.active).toBe(true);
    expect(s().profile!.lessOf).toEqual(['doomscrolling']);
    // The plan review started the coach from the interview's answers.
    const recovery = s().paths.recovery!;
    expect(recovery.answers.behaviour).toBe('doomscrolling');
    const own = s().routines.filter((r) => r.active && r.goalId === recovery.goalId);
    expect(own.length).toBeGreaterThan(0);
    expect(own.every((r) => isAlwaysFreeRoutine(r, recovery.goalId))).toBe(true);
    // And its practices are on the plan, while the paid coaches wait.
    const plan = s().ensurePlan(FRIDAY);
    const ownIds = new Set(own.map((r) => r.id));
    expect(plan.items.some((i) => i.routineId && ownIds.has(i.routineId))).toBe(true);
    const locked = sessionsPlusWouldRun(s().routines, FRIDAY, recovery.goalId);
    expect(locked.some((r) => r.protocolId === 'strength')).toBe(true);
    expect(plan.items.some((i) => i.title === locked.find((r) => r.protocolId === 'strength')!.title)).toBe(false);
  });

  it('four logs become a window, a time ahead of it, and a card on the right days', () => {
    const intention = s().behaviourIntentions.find((b) => b.behaviour === 'doomscrolling')!;
    for (const [i, at] of FRIDAYS.entries()) {
      const id = s().logPastBehaviourEvent(intention.id, at.toISOString(), 'forty minutes', 'usual');
      expect(s().behaviourEvents.find((e) => e.id === id)!.occurredAt).toBe(at.toISOString());
      if (i < 3) {
        // Quiet until it has something true to say.
        expect(behaviourPattern(intention, s().behaviourEvents, s().metrics, NOW).readiness).toBe('learning');
        expect(dueInterventions(s().behaviourIntentions, s().behaviourEvents, s().metrics, FRIDAY, NOW)).toEqual([]);
      }
    }

    const pattern = behaviourPattern(intention, s().behaviourEvents, s().metrics, NOW);
    expect(pattern.readiness).toBe('ready');
    expect(pattern.window!.label).toBe('21:15–22:15');
    expect(pattern.days.label).toBe('Fridays');
    expect(pattern.intervention!.at).toBe('20:30');

    // Today's "Tonight" card, on a Friday and not on a Tuesday.
    const due = dueInterventions(s().behaviourIntentions, s().behaviourEvents, s().metrics, FRIDAY, NOW);
    expect(due).toHaveLength(1);
    expect(due[0].at).toBe('20:30');
    expect(due[0].line).toBe('Usually lands 21:15–22:15. 20:30 is ahead of it.');
    expect(dueInterventions(s().behaviourIntentions, s().behaviourEvents, s().metrics, TUESDAY, NOW)).toEqual([]);
    // The card's own words, as today.tsx assembles them.
    expect(`${formatTime(due[0].at)} — ahead of it`).toBe('8:30pm — ahead of it');
    expect(`${behaviourInfo(due[0].intention.behaviour).label} usually lands ${due[0].pattern.window!.label}.`).toBe(
      'Doom scrolling usually lands 21:15–22:15.',
    );

    // The button goes to the breath session, and the reset behind it is free.
    expect(PATHS.recovery.sessionRoute).toBe('/session/breathe');
    expect(meditationLengthNeedsPlus(FREE_MEDITATION_MAX_MIN, false)).toBe(false);

    // Once notifications are on, the same time is queued for that Friday and
    // only that day. Off by default: nothing fires until the person says so.
    s().setNotificationSettings({ enabled: true });
    const queue = (date: string) =>
      plannedNotifications(
        {
          date,
          profile: s().profile,
          plan: s().ensurePlan(date),
          routines: s().routines,
          behaviourIntentions: s().behaviourIntentions,
          behaviourEvents: s().behaviourEvents,
          metrics: s().metrics,
          settings: s().notifications,
        },
        NOW,
      );
    expect(queue(FRIDAY).some((n) => n.at === '20:30' && /21:15–22:15/.test(n.body))).toBe(true);
    expect(queue(TUESDAY).some((n) => n.at === '20:30')).toBe(false);
  });

  it('a log made in the moment keeps the moment, and the note stays honest', () => {
    const intention = s().behaviourIntentions.find((b) => b.behaviour === 'doomscrolling')!;
    for (const at of FRIDAYS) s().logPastBehaviourEvent(intention.id, at.toISOString());
    const before = Date.now();
    const id = s().logBehaviourEvent(intention.id, 'tired', undefined, 'ten minutes', 'small');
    const event = s().behaviourEvents.find((e) => e.id === id)!;
    expect(Math.abs(Date.parse(event.occurredAt) - before)).toBeLessThan(5000);
    expect(event.trigger).toBe('tired');
    expect(event.size).toBe('small');

    const pattern = behaviourPattern(intention, s().behaviourEvents, s().metrics, NOW);
    expect(pattern.readiness).toBe('ready');
    expect(pattern.intervention).not.toBeNull();
    const note = momentNote(event, pattern, s().profile!.sleepTime);
    expect(['mechanism', 'pattern', 'logged']).toContain(note.kind);
    expect(note.text).not.toMatch(/\b(bad|fail|weak|shame|guilty)\b/i);
  });

  it('switching the intention off silences the card without losing the log', () => {
    const intention = s().behaviourIntentions.find((b) => b.behaviour === 'doomscrolling')!;
    for (const at of FRIDAYS) s().logPastBehaviourEvent(intention.id, at.toISOString());
    s().setBehaviourIntentionActive(intention.id, false);
    expect(dueInterventions(s().behaviourIntentions, s().behaviourEvents, s().metrics, FRIDAY, NOW)).toEqual([]);
    expect(s().behaviourEvents).toHaveLength(4);
    s().setBehaviourIntentionActive(intention.id, true);
    expect(dueInterventions(s().behaviourIntentions, s().behaviourEvents, s().metrics, FRIDAY, NOW)).toHaveLength(1);
  });
});

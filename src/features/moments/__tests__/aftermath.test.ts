/**
 * The ten minutes after a slip.
 *
 * Isaac, on his own week: "I have drank a few times this week and could
 * only log yesterday. I also feel like I needed more of an action plan."
 *
 * What is under test is not layout. It is whether the screen says the one
 * thing that interrupts a spiral, before it says anything else; whether
 * what it hands back is specific to the situation that actually happened;
 * and whether it manages all of that without once scoring, shaming, or
 * telling somebody they have a problem.
 */

import { behaviourPattern } from '@/features/behaviours/patterns';
import {
  LATE_CUTOFF_MIN,
  planDelivery,
  TRIGGER_LABELS,
  TRIGGER_ORDER,
  aftermath,
  countThisWeek,
  loggedToday,
  planFor,
  rightNow,
  steady,
  triggerKeyOf,
} from '@/features/moments/aftermath';
import { TRIGGER_KEYS } from '@/features/behaviours/tonight';
import type { BehaviourEvent, BehaviourIntention } from '@/types/domain';

const NOW = new Date('2026-09-16T21:30:00');
const INTENTION: BehaviourIntention = {
  id: 'bi-1',
  behaviour: 'alcohol',
  active: true,
  createdAt: '2026-08-01T00:00:00.000Z',
} as BehaviourIntention;

let seq = 0;
const at = (iso: string, over: Partial<BehaviourEvent> = {}): BehaviourEvent => ({
  id: `be-${(seq += 1)}`,
  intentionId: INTENTION.id,
  occurredAt: iso,
  ...over,
});

const pattern = (events: BehaviourEvent[]) => behaviourPattern(INTENTION, events, [], NOW);

describe('the first thing on the screen', () => {
  /**
   * Marlatt's abstinence violation effect: having broken the rule, the rule
   * is gone, so the night is written off. It is the documented reason a
   * lapse becomes a relapse, and it is what the opener exists to interrupt.
   */
  it('says the next one is a separate decision, from the second onward', () => {
    expect(steady(2).because).toMatch(/separate decision/i);
    expect(steady(4).because).toMatch(/separate decision/i);
  });

  it('never scores, grades or totals', () => {
    for (const n of [1, 2, 3, 7]) {
      const s = steady(n);
      const said = `${s.line} ${s.because ?? ''}`;
      expect(said).not.toMatch(/%|\bstreak\b|\btarget\b|\bgoal\b|\bout of\b/i);
    }
  });

  it('never tells somebody they have a problem, however many they log', () => {
    const said = `${steady(9).line} ${steady(9).because}`;
    expect(said).not.toMatch(/problem|addict|depend|too much|should|failed|slipping|worry/i);
  });

  it('does not console — consolation says something bad happened', () => {
    for (const n of [1, 2, 5]) {
      const said = `${steady(n).line} ${steady(n).because ?? ''}`;
      expect(said).not.toMatch(/don.t worry|it.s okay|be kind to yourself|forgive/i);
    }
  });

  it('states the count plainly once it is more than one', () => {
    expect(steady(2).line).toBe('That is two this week.');
    // Words through nine. A tally in figures reads as a score.
    expect(steady(5).line).toBe('That is five this week.');
    expect(steady(11).line).toBe('That is 11 this week.');
    expect(steady(1).line).toBe('Logged.');
  });
});

describe('counting the week', () => {
  it('is the seven days ending today, not a calendar week', () => {
    const events = [
      at('2026-09-16T20:00:00'),
      at('2026-09-13T22:00:00'),
      at('2026-09-10T20:00:00'), // six days back — in
      at('2026-09-08T20:00:00'), // eight days back — out
    ];
    expect(countThisWeek(events, INTENTION.id, NOW)).toBe(3);
  });

  it('counts the event being logged even before it reaches the store', () => {
    const fresh = at('2026-09-16T21:25:00');
    const model = aftermath({
      event: fresh,
      pattern: pattern([]),
      events: [at('2026-09-14T20:00:00')],
      sleepTime: '22:30',
      now: NOW,
    });
    expect(model.weekCount).toBe(2);
    expect(model.steady.line).toBe('That is two this week.');
  });

  it('does not double-count it once it has', () => {
    const fresh = at('2026-09-16T21:25:00');
    const model = aftermath({
      event: fresh,
      pattern: pattern([fresh]),
      events: [fresh, at('2026-09-14T20:00:00')],
      sleepTime: '22:30',
      now: NOW,
    });
    expect(model.weekCount).toBe(2);
  });
});

describe('one trigger vocabulary', () => {
  it('offers every key the plan engine can use, and no others', () => {
    expect([...TRIGGER_ORDER].sort()).toEqual([...TRIGGER_KEYS].sort());
    for (const key of TRIGGER_ORDER) expect(TRIGGER_LABELS[key]).toBeTruthy();
  });

  it('puts "not sure" last, so it is never the first thing reached for', () => {
    expect(TRIGGER_ORDER[TRIGGER_ORDER.length - 1]).toBe('unsure');
  });

  /**
   * The Life tab stored 'Stress' and 'After a meal' as free text under its
   * own separate vocabulary. Those are the only trigger data the app has
   * ever collected, so they are read rather than dropped.
   */
  it('reads triggers captured under the old vocabulary', () => {
    expect(triggerKeyOf('Stress')).toBe('stress');
    expect(triggerKeyOf('After a meal')).toBe('evening');
    expect(triggerKeyOf('Work')).toBe('stress');
    expect(triggerKeyOf('stress')).toBe('stress');
    expect(triggerKeyOf(undefined)).toBeNull();
    expect(triggerKeyOf('something nobody wrote')).toBeNull();
  });
});

describe('the plan', () => {
  it('is an if-then in the trigger the person just named', () => {
    const plan = planFor('social');
    expect(plan.text).toMatch(/^When other people are doing it, I /);
    expect(plan.text.endsWith('.')).toBe(true);
  });

  it('is a thing done, never a thing avoided', () => {
    for (const key of TRIGGER_ORDER) {
      const plan = planFor(key);
      expect(plan.action).not.toMatch(/^(don.t|do not|avoid|resist|stop|no more)/i);
    }
  });

  it('offers the rest of that trigger\'s stand-ins, so the plan is chosen', () => {
    const plan = planFor('stress');
    expect(plan.alternatives.length).toBeGreaterThan(0);
    expect(plan.alternatives.map((a) => a.key)).not.toContain(plan.replacement);
  });

  /**
   * A chip row wraps between chips and cannot wrap one wider than the
   * phone. The browser showed "A drink made slowly, away from the desk"
   * running off the right edge at 390pt.
   */
  it('labels the alternatives short enough to fit a phone', () => {
    for (const key of TRIGGER_ORDER) {
      for (const alt of planFor(key).alternatives) {
        expect(alt.label.length).toBeLessThanOrEqual(32);
        expect(alt.label).toMatch(/^[A-Z]/);
      }
    }
  });

  it('honours a stand-in the person picks instead', () => {
    const plan = planFor('stress', 'walk');
    expect(plan.replacement).toBe('walk');
    expect(plan.text).toContain('walk it off');
  });

  it('has something to say for every trigger, including unsure', () => {
    for (const key of TRIGGER_ORDER) {
      expect(planFor(key).because.length).toBeGreaterThan(20);
    }
  });
});

describe('the thing to do in the next ten minutes', () => {
  const plan = planFor('stress');

  it('is offered while tonight can still go either way', () => {
    expect(rightNow(plan, 21 * 60, true)).not.toBeNull();
  });

  it('is not offered about a night that is already over', () => {
    // Logging Tuesday's drink on Thursday. There is nothing to do now.
    expect(rightNow(plan, 21 * 60, false)).toBeNull();
  });

  it('is not offered past the point where the answer is bed', () => {
    expect(rightNow(plan, LATE_CUTOFF_MIN, true)).toBeNull();
    expect(rightNow(plan, LATE_CUTOFF_MIN - 1, true)).not.toBeNull();
  });
});

describe('what it cost and what does not change', () => {
  it('says plainly that tomorrow stands', () => {
    const event = at('2026-09-16T14:00:00'); // middle of the day, no sleep effect
    const model = aftermath({
      event,
      pattern: pattern([]),
      events: [],
      sleepTime: '22:30',
      now: NOW,
    });
    expect(model.cost.tomorrow).toMatch(/Nothing about tomorrow changes/);
  });

  it('changes the shape rather than dropping the day, where sleep is hit', () => {
    const event = at('2026-09-16T21:30:00'); // an hour before bed
    const model = aftermath({
      event,
      pattern: pattern([]),
      events: [],
      sleepTime: '22:30',
      now: NOW,
    });
    expect(model.cost.hoursBeforeSleep).toBeCloseTo(1, 1);
    expect(model.cost.tomorrow).not.toMatch(/skip|drop it|write off/i);
  });
});

describe('the pattern, said back', () => {
  /** Four occurrences is the floor the engine speaks at — see patterns.ts. */
  const four = [
    at('2026-09-09T21:00:00'),
    at('2026-09-11T21:15:00'),
    at('2026-09-13T20:45:00'),
    at('2026-09-15T21:30:00'),
  ];

  it('is silent until there is genuinely a pattern', () => {
    const model = aftermath({
      event: at('2026-09-16T21:00:00'),
      pattern: pattern([at('2026-09-14T21:00:00')]),
      events: [at('2026-09-14T21:00:00')],
      sleepTime: '22:30',
      now: NOW,
    });
    expect(model.window).toBeNull();
  });

  it('says the window once there is, as a count and never a rate', () => {
    const model = aftermath({
      event: at('2026-09-16T21:00:00'),
      pattern: pattern(four),
      events: four,
      sleepTime: '22:30',
      now: NOW,
    });
    expect(model.window).toMatch(/of your last/);
    expect(model.window).not.toMatch(/%/);
  });
});

describe('which night it was', () => {
  it('knows today from a day already gone', () => {
    expect(loggedToday(at('2026-09-16T08:00:00'), NOW)).toBe(true);
    expect(loggedToday(at('2026-09-15T23:00:00'), NOW)).toBe(false);
  });
});

/**
 * The loop closing.
 *
 * `dueInterventions` always computed the right moment — ahead of the
 * window, on the weekdays the pattern lives on. What arrived there was
 * generic. An implementation intention only works when it is recalled in
 * the situation it names, so the plan written after the last slip is what
 * has to arrive at the hour it is about.
 */
describe('the plan, delivered ahead of the window', () => {
  const stored = {
    trigger: 'stress',
    replacement: 'breathe',
    text: 'When the pressure is on, I do the two-minute breath reset.',
    writtenAt: '2026-09-16T21:30:00.000Z',
  };

  it('says the person’s own sentence back, unparaphrased', () => {
    expect(planDelivery(stored)!.text).toBe(stored.text);
  });

  it('runs the stand-in itself where it can', () => {
    const d = planDelivery(stored)!;
    expect(d.route).toContain('/session/breathe');
    expect(d.label).toBe('Do it now');
  });

  it('offers no action it cannot perform', () => {
    const d = planDelivery({ ...stored, replacement: 'tidy', text: 'When there is nothing to do, I do one small job with my hands.' })!;
    expect(d.route).toBeUndefined();
    expect(d.text).toContain('one small job');
  });

  it('stays out of the way until a plan exists', () => {
    expect(planDelivery(undefined)).toBeNull();
  });

  it('reads a plan whose trigger was stored under the old vocabulary', () => {
    expect(planDelivery({ ...stored, trigger: 'Stress' })).not.toBeNull();
  });
});

/**
 * The words on the Tonight card, and the rules they keep.
 *
 * A plan that names the cue and the action; a count that only goes up; a
 * lapse that becomes the next hour; stand-ins that differ by trigger; and
 * timing in the same clock as the rest of the screen. And nowhere, in any
 * behaviour at any hour, a word that puts the slip on the person.
 */

import { BEHAVIOUR_CATALOG } from '@/features/behaviours/catalog';
import { behaviourPattern } from '@/features/behaviours/patterns';
import {
  CLEAR_DAYS_KEPT,
  COUNT_FROM_MIN,
  REPLACEMENT_KEYS,
  STAND_INS,
  TRIGGER_KEYS,
  URGE_BREATH_ROUTE,
  canMarkClear,
  clearDaysOf,
  defaultReplacementFor,
  ifThenPlan,
  markClearDay,
  nextHour,
  primaryTrigger,
  replacementOf,
  standInAfterBreath,
  standInFor,
  tally,
  timingLine,
  tonightModel,
  triggersOf,
  unmarkClearDay,
} from '@/features/behaviours/tonight';
import type { BehaviourEvent, BehaviourIntention } from '@/types/domain';

const intention = (behaviour: BehaviourIntention['behaviour'] = 'alcohol'): BehaviourIntention => ({
  id: 'bi-1',
  behaviour,
  intentionText: 'Drink less, more deliberately',
  createdAt: '2026-01-01T00:00:00.000Z',
  active: true,
});

/** An event at a local wall-clock time on a given date. */
const at = (dateKey: string, hhmm: string): BehaviourEvent => {
  const [h, m] = hhmm.split(':').map(Number);
  const [y, mo, d] = dateKey.split('-').map(Number);
  return { id: `be-${dateKey}-${hhmm}`, intentionId: 'bi-1', occurredAt: new Date(y, mo - 1, d, h, m).toISOString() };
};

/** The vocabulary that would turn a count into a verdict. */
const SHAMING = ['streak', 'broke', 'broken', 'lost', 'reset to', 'fail', 'guilt', 'shame', 'willpower', 'you should', 'relapse', 'cheat'];

describe('the if-then plan', () => {
  it('composes the intake picks into a cue and an action, the action something done', () => {
    const plan = ifThenPlan({ trigger: 'stress', replacement: 'walk' });
    expect(plan.text).toBe('When the pressure is on, I walk it off, outside if I can.');
    expect(plan.ownWords).toBe(false);
    expect(plan.text).not.toMatch(/\b(not|never|avoid|stop)\b/);
  });

  it('gives every trigger its own cue, so seven people read seven sentences', () => {
    const texts = new Set(TRIGGER_KEYS.map((t) => ifThenPlan({ trigger: t, replacement: 'read' }).text));
    expect(texts.size).toBe(TRIGGER_KEYS.length);
  });

  it('the person’s own words win, kept as typed, with a full stop added once', () => {
    const plan = ifThenPlan({
      trigger: 'stress',
      replacement: 'walk',
      ifThenCue: 'the kids are down and the kitchen is quiet ',
      ifThenAction: 'the kettle goes on and the phone goes on the shelf.',
    });
    expect(plan.ownWords).toBe(true);
    expect(plan.text).toBe('When the kids are down and the kitchen is quiet, the kettle goes on and the phone goes on the shelf.');
  });

  it('half a plan in own words falls back to the picks rather than a broken sentence', () => {
    expect(ifThenPlan({ trigger: 'tired', ifThenCue: 'late' }).ownWords).toBe(false);
    expect(ifThenPlan({ trigger: 'tired', ifThenAction: 'bed' }).text).toContain('running on empty');
  });

  it('reads a multi-answer trigger and leads with the first named', () => {
    expect(triggersOf({ trigger: 'social,stress' })).toEqual(['social', 'stress']);
    expect(primaryTrigger({ trigger: 'social,stress' })).toBe('social');
    expect(primaryTrigger({})).toBe('unsure');
    expect(triggersOf({ trigger: 'nonsense,stress' })).toEqual(['stress']);
  });
});

describe('stand-ins matched to the trigger', () => {
  it('stress, boredom, social and tired get different first answers', () => {
    const firsts = ['stress', 'boredom', 'social', 'tired'].map((t) => defaultReplacementFor(t as never));
    expect(new Set(firsts).size).toBe(4);
    expect(defaultReplacementFor('stress')).toBe('breathe');
    expect(defaultReplacementFor('boredom')).toBe('tidy');
    expect(defaultReplacementFor('social')).toBe('message');
    expect(defaultReplacementFor('tired')).toBe('water');
  });

  it('"help me pick" resolves by trigger; a chosen replacement is never overridden', () => {
    expect(replacementOf({ trigger: 'boredom', replacement: 'unsure' })).toBe('tidy');
    expect(replacementOf({ trigger: 'boredom' })).toBe('tidy');
    expect(replacementOf({ trigger: 'boredom', replacement: 'read' })).toBe('read');
    expect(replacementOf({ replacement: 'unsure' })).toBe('breathe');
  });

  it('every stand-in names a real replacement and says why it fits, and only a breath has a route', () => {
    for (const t of TRIGGER_KEYS) {
      expect(STAND_INS[t].length).toBeGreaterThan(0);
      for (const s of STAND_INS[t]) {
        expect(REPLACEMENT_KEYS).toContain(s.key);
        expect(s.line.length).toBeGreaterThan(20);
        if (s.route) expect(s.key).toBe('breathe');
        if (s.key === 'breathe') expect(s.route).toBe(URGE_BREATH_ROUTE);
      }
    }
  });

  it('a chosen replacement with no trigger sentence still gets a plain one', () => {
    const s = standInFor({ trigger: 'social', replacement: 'tidy' });
    expect(s.key).toBe('tidy');
    expect(s.line).toBe('Do one small job with my hands.');
    expect(s.route).toBeUndefined();
  });

  it('after a breath session, the next stand-in is not more breathing', () => {
    expect(standInFor({ trigger: 'stress' }).key).toBe('breathe');
    expect(standInAfterBreath({ trigger: 'stress' }).key).not.toBe('breathe');
    expect(standInAfterBreath({ trigger: 'boredom', replacement: 'walk' }).key).toBe('walk');
  });
});

describe('the count', () => {
  it('marks, keeps in order, never duplicates, and can be unmarked', () => {
    let a: Record<string, string> = {};
    a = { clearDays: markClearDay(a, '2026-09-06') };
    a = { clearDays: markClearDay(a, '2026-09-05') };
    a = { clearDays: markClearDay(a, '2026-09-06') };
    expect(clearDaysOf(a)).toEqual(['2026-09-05', '2026-09-06']);
    a = { clearDays: unmarkClearDay(a, '2026-09-06') };
    expect(clearDaysOf(a)).toEqual(['2026-09-05']);
    expect(clearDaysOf({ clearDays: 'junk,2026-09-01' })).toEqual(['2026-09-01']);
  });

  it('keeps a season and drops the oldest, never the count of what is kept', () => {
    let a: Record<string, string> = {};
    for (let i = 0; i < CLEAR_DAYS_KEPT + 10; i += 1) {
      const d = new Date(2026, 0, 1 + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      a = { clearDays: markClearDay(a, key) };
    }
    const kept = clearDaysOf(a);
    expect(kept).toHaveLength(CLEAR_DAYS_KEPT);
    expect(kept[0] > '2026-01-01').toBe(true);
  });

  it('counts from eight in the evening', () => {
    expect(COUNT_FROM_MIN).toBe(20 * 60);
    expect(canMarkClear(19 * 60 + 59)).toBe(false);
    expect(canMarkClear(20 * 60)).toBe(true);
  });

  it('says what went right in numbers that only go up', () => {
    const events = [at('2026-09-01', '21:00'), at('2026-09-03', '21:30')];
    const t = tally(intention(), events, { clearDays: '2026-09-04,2026-09-05,2026-09-06' }, '2026-09-07');
    expect(t.clear).toBe(3);
    expect(t.daysSince).toBe(4);
    expect(t.lapsedToday).toBe(false);
    expect(t.line).toBe('3 clear nights counted, 4 days since the last one.');
  });

  it('starts honestly and names yesterday as yesterday', () => {
    expect(tally(intention(), [], {}, '2026-09-07').line).toBe('Nothing counted yet. Tonight can be the first.');
    const t = tally(intention(), [at('2026-09-06', '22:00')], { clearDays: '2026-09-05' }, '2026-09-07');
    expect(t.line).toBe('1 clear night counted, the last one was yesterday.');
  });

  it('a lapse tonight is one event and the count stays', () => {
    const t = tally(intention(), [at('2026-09-07', '21:00')], { clearDays: '2026-09-05,2026-09-06' }, '2026-09-07');
    expect(t.lapsedToday).toBe(true);
    expect(t.clear).toBe(2);
    expect(t.line).toBe('2 clear nights counted.');
    expect(tally(intention(), [at('2026-09-07', '21:00')], {}, '2026-09-07').line).toBe('One event. The count is still yours.');
  });

  it('turns a lapse into the next hour, with the person’s own stand-in', () => {
    const line = nextHour({ trigger: 'tired', replacement: 'water' });
    expect(line).toMatch(/^One event, not a verdict\. The next hour: /);
    expect(line).toContain('a drink made slowly');
    expect(line).toContain('Nothing restarts from zero');
  });
});

describe('the timing, in plain words', () => {
  const fridays = [at('2026-08-14', '21:15'), at('2026-08-21', '21:40'), at('2026-08-28', '22:05'), at('2026-09-04', '21:50')];
  const now = new Date(2026, 8, 8, 9);

  it('says how far off the pattern is before there is one', () => {
    expect(timingLine(behaviourPattern(intention(), [], [], now))).toContain('After four');
    expect(timingLine(behaviourPattern(intention(), fridays.slice(0, 2), [], now))).toBe('2 logged. 2 more and the timing starts to show.');
  });

  it('uses the twelve-hour clock the rest of the screen uses, and says what happens', () => {
    const line = timingLine(behaviourPattern(intention(), fridays, [], now));
    expect(line).toBe(
      'Usually lands between 9:15pm and 10:15pm, mostly Fridays. 8:30pm is when IntentNorth puts something else in front of you on those days.',
    );
    expect(line).not.toMatch(/\d{2}:\d{2}–/);
  });

  it('is honest about a habit spread across the day', () => {
    const spread = ['07:30', '12:15', '16:00', '21:30', '09:45', '14:20'].map((t, i) => at(`2026-09-0${i + 1}`, t));
    expect(timingLine(behaviourPattern(intention(), spread, [], now))).toContain('spread across the day');
  });
});

describe('the card as data', () => {
  const now = new Date(2026, 8, 7, 21);

  it('carries the plan, the count, the timing and the stand-in for one behaviour', () => {
    const answers = { behaviour: 'alcohol', trigger: 'social', replacement: 'unsure', clearDays: '2026-09-06' };
    const pattern = behaviourPattern(intention(), [], [], now);
    const m = tonightModel(intention(), [], pattern, answers, '2026-09-07', true);
    expect(m.info.winLabel).toBe('No drinks tonight');
    expect(m.plan.text).toContain('other people are doing it');
    expect(m.standIn.key).toBe('message');
    expect(m.tally.clear).toBe(1);
    expect(m.clearMarked).toBe(false);
    expect(m.afterLapse).toBeNull();
    expect(m.counting).toBe(true);
  });

  it('after a lapse tonight the next hour replaces the count and tonight is not marked', () => {
    const events = [at('2026-09-07', '20:30')];
    const pattern = behaviourPattern(intention(), events, [], now);
    const m = tonightModel(intention(), events, pattern, { clearDays: '2026-09-07' }, '2026-09-07', true);
    expect(m.afterLapse).toMatch(/^One event, not a verdict/);
    expect(m.clearMarked).toBe(true);
  });

  it('every behaviour has a win label that names what happened, not what was resisted', () => {
    for (const info of BEHAVIOUR_CATALOG) {
      expect(info.winLabel.length).toBeGreaterThan(5);
      expect(info.winLabel.toLowerCase()).not.toMatch(/resist|didn|avoid|held off|willpower/);
    }
  });

  it('says nothing shaming, for any behaviour, trigger or state', () => {
    const produced: string[] = [];
    for (const info of BEHAVIOUR_CATALOG) {
      for (const trigger of TRIGGER_KEYS) {
        const answers = { behaviour: info.key, trigger, clearDays: '2026-09-05' };
        for (const events of [[], [at('2026-09-07', '21:00')], [at('2026-09-01', '21:00')]]) {
          const pattern = behaviourPattern(intention(info.key), events, [], now);
          const m = tonightModel(intention(info.key), events, pattern, answers, '2026-09-07', true);
          produced.push(m.plan.text, m.tally.line, m.timing, m.standIn.line, m.afterLapse ?? '', info.winLabel);
        }
      }
    }
    const text = produced.join(' ').toLowerCase();
    for (const word of SHAMING) expect(text).not.toContain(word);
  });
});

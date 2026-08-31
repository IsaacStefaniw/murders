import { BEHAVIOUR_CATALOG, behaviourInfo } from '@/features/behaviours/catalog';
import {
  behaviourPattern,
  coFactor,
  dueInterventions,
  hotWindow,
  hoursBeforeSleep,
  interventionTime,
  MIN_EVENTS_FOR_PATTERN,
  momentNote,
  weekdayShape,
  weekNote,
  weekPressure,
} from '@/features/behaviours/patterns';
import { EVIDENCE_LABELS, protocolById } from '@/features/knowledge/protocols';
import { observe, type MetricObservation } from '@/features/model/metrics';
import type { BehaviourEvent, BehaviourIntention } from '@/types/domain';

const intention = (behaviour: BehaviourIntention['behaviour']): BehaviourIntention => ({
  id: 'bi-1',
  behaviour,
  intentionText: 'Working on it',
  createdAt: '2026-01-01T00:00:00.000Z',
  active: true,
});

/** An event at a local wall-clock time on a given date. */
const at = (dateKey: string, hhmm: string, extra: Partial<BehaviourEvent> = {}): BehaviourEvent => {
  const [h, m] = hhmm.split(':').map(Number);
  const [y, mo, d] = dateKey.split('-').map(Number);
  return {
    id: `be-${dateKey}-${hhmm}`,
    intentionId: 'bi-1',
    occurredAt: new Date(y, mo - 1, d, h, m).toISOString(),
    ...extra,
  };
};

describe('hotWindow', () => {
  it('says nothing until there is enough to say', () => {
    expect(hotWindow([at('2026-03-02', '20:45'), at('2026-03-03', '20:50')])).toBeNull();
    expect(MIN_EVENTS_FOR_PATTERN).toBeGreaterThanOrEqual(4);
  });

  it('finds the evening window a habit actually lives in', () => {
    const evenings = [
      at('2026-03-02', '20:45'),
      at('2026-03-03', '21:10'),
      at('2026-03-04', '20:30'),
      at('2026-03-05', '21:40'),
    ];
    const w = hotWindow(evenings)!;
    expect(w).not.toBeNull();
    expect(w.startMin).toBe(20 * 60 + 30);
    expect(w.endMin).toBe(21 * 60 + 45);
    expect(w.hits).toBe(4);
    expect(w.share).toBe(1);
    expect(w.label).toBe('20:30–21:45');
  });

  /**
   * The reason the search is circular. Clock arithmetic that starts at
   * midnight splits a late-night habit into two clusters at opposite ends of
   * the day and then reports neither — which is precisely the habit most
   * worth catching.
   */
  it('reads 11pm and 12:30am as one late window, not two distant ones', () => {
    const late = [
      at('2026-03-02', '23:20'),
      at('2026-03-03', '23:50'),
      at('2026-03-05', '00:20'),
      at('2026-03-06', '00:40'),
    ];
    const w = hotWindow(late)!;
    expect(w).not.toBeNull();
    expect(w.hits).toBe(4);
    expect(w.startMin).toBeGreaterThan(w.endMin); // crosses midnight
    expect(w.label).toBe('23:15–00:45');
  });

  it('refuses to name a window for something spread across the day', () => {
    const spread = [
      at('2026-03-02', '07:30'),
      at('2026-03-03', '12:15'),
      at('2026-03-04', '16:00'),
      at('2026-03-05', '21:30'),
      at('2026-03-06', '09:45'),
      at('2026-03-07', '14:20'),
    ];
    expect(hotWindow(spread)).toBeNull();
  });
});

describe('weekdayShape', () => {
  it('names a concentrated set of days', () => {
    const fridays = [
      at('2026-03-06', '21:00'), // Friday
      at('2026-03-13', '21:00'),
      at('2026-03-20', '21:00'),
      at('2026-03-27', '21:00'),
    ];
    expect(weekdayShape(fridays).label).toBe('Fridays');
  });

  it('recognises a weekend shape', () => {
    const weekend = [
      at('2026-03-07', '21:00'), // Saturday
      at('2026-03-08', '21:00'), // Sunday
      at('2026-03-14', '21:00'),
      at('2026-03-15', '21:00'),
    ];
    expect(weekdayShape(weekend).label).toBe('weekends');
  });

  it('reports no shape when it is simply every day', () => {
    const daily = ['02', '03', '04', '05', '06', '07', '08'].map((d) => at(`2026-03-${d}`, '21:00'));
    expect(weekdayShape(daily).label).toBeNull();
  });
});

describe('coFactor', () => {
  const events = [
    at('2026-03-02', '21:00'),
    at('2026-03-03', '21:00'),
    at('2026-03-04', '21:00'),
    at('2026-03-05', '21:00'),
  ];
  const sleepOn = (dateKey: string, hours: number): MetricObservation => ({
    ...observe('sleep.hours', hours),
    at: new Date(`${dateKey}T08:00:00`).toISOString(),
  });

  it('surfaces short sleep when it holds on most of the days', () => {
    const metrics = [
      sleepOn('2026-03-02', 5.5),
      sleepOn('2026-03-03', 5.9),
      sleepOn('2026-03-04', 6.1),
      sleepOn('2026-03-05', 7.8),
    ];
    const co = coFactor(events, metrics)!;
    expect(co.hits).toBe(3);
    expect(co.checked).toBe(4);
    expect(co.label).toContain('3 of the 4');
  });

  it('stays quiet when it is close to a coin toss', () => {
    const metrics = [
      sleepOn('2026-03-02', 5.5),
      sleepOn('2026-03-03', 7.5),
      sleepOn('2026-03-04', 6.1),
      sleepOn('2026-03-05', 7.8),
    ];
    expect(coFactor(events, metrics)).toBeNull();
  });

  it('stays quiet when there are no sleep readings to check against', () => {
    expect(coFactor(events, [])).toBeNull();
  });
});

describe('weekPressure', () => {
  const now = new Date('2026-03-08T22:00:00');
  const daysAgo = (n: number, hhmm = '21:00') => {
    const d = new Date(now.getTime() - n * 86400e3);
    return at(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      hhmm,
    );
  };

  it('withholds a comparison until there is history to compare against', () => {
    const w = weekPressure([daysAgo(1), daysAgo(2), daysAgo(3)], now);
    expect(w.thisWeek).toBe(3);
    expect(w.comparable).toBe(false);
    expect(w.direction).toBe('flat');
  });

  it('reads direction against the three weeks before', () => {
    const events = [
      daysAgo(1), daysAgo(2), daysAgo(3), daysAgo(4), daysAgo(5),
      daysAgo(9), daysAgo(11),
      daysAgo(17),
      daysAgo(24),
    ];
    const w = weekPressure(events, now);
    expect(w.thisWeek).toBe(5);
    expect(w.priorMean).toBeCloseTo(1.3, 1);
    expect(w.direction).toBe('up');
  });
});

describe('interventionTime', () => {
  /**
   * The whole point. A nudge inside the window arrives after the decision;
   * this one arrives while the choice is still cheap.
   */
  it('lands ahead of the window, never inside it', () => {
    const w = hotWindow([
      at('2026-03-02', '20:45'),
      at('2026-03-03', '21:10'),
      at('2026-03-04', '20:30'),
      at('2026-03-05', '21:40'),
    ])!;
    const iv = interventionTime(w)!;
    expect(iv.at).toBe('19:45'); // 20:30 window start, 45 minutes ahead
    expect(iv.line).toContain('19:45');
  });

  it('wraps correctly for a window that opens just after midnight', () => {
    const iv = interventionTime({
      startMin: 15,
      endMin: 90,
      hits: 4,
      total: 4,
      share: 1,
      label: '00:15–01:30',
    })!;
    expect(iv.at).toBe('23:30');
  });

  it('has nothing to offer when there is no window', () => {
    expect(interventionTime(null)).toBeNull();
  });
});

describe('hoursBeforeSleep', () => {
  it('measures the gap to bedtime', () => {
    expect(hoursBeforeSleep(at('2026-03-02', '16:30').occurredAt, '22:30')).toBe(6);
  });

  it('treats an event past bedtime as maximally proximate, not a day early', () => {
    expect(hoursBeforeSleep(at('2026-03-02', '01:00').occurredAt, '22:30')).toBe(0);
  });

  it('returns nothing when bedtime is unknown', () => {
    expect(hoursBeforeSleep(at('2026-03-02', '16:30').occurredAt, null)).toBeNull();
  });
});

describe('momentNote', () => {
  const evenings = [
    at('2026-03-02', '20:45'),
    at('2026-03-03', '21:10'),
    at('2026-03-04', '20:30'),
    at('2026-03-05', '21:40'),
  ];

  /**
   * The case this whole design turns on, and the one it originally got
   * wrong. A chocolate bar at 8:45pm does produce a glucose and insulin
   * response, and evening insulin sensitivity is measurably lower than
   * morning — so there IS something true and useful to say. What must not
   * appear is a verdict; what must appear is the mechanism and the lever.
   */
  it('teaches the mechanism for a snack at 8:45pm, and names what helps', () => {
    const pattern = behaviourPattern(intention('sugar'), evenings, [], new Date('2026-03-06T09:00:00'));
    const note = momentNote(at('2026-03-05', '20:45'), pattern, '22:30');
    expect(note.kind).toBe('mechanism');
    if (note.kind !== 'mechanism') throw new Error('unreachable');
    expect(note.text).toMatch(/insulin/i);
    expect(note.counterText).toMatch(/walk/i);
    expect(note.counterProtocolId).toBe('post-meal-walk');
    // The strongest claim leads; the weaker one rides along marked as weaker.
    expect(note.evidenceLevel).toBe('B');
    expect(note.also?.evidenceLevel).toBe('C');
  });

  /**
   * The same bar at nine in the morning is a different metabolic event, and
   * the evening finding must not be recited at it. What survives is the
   * timeless part — sugar alone absorbs faster than sugar with protein —
   * which is true at any hour.
   */
  it('drops the evening-specific claim for the same snack in the morning', () => {
    const pattern = behaviourPattern(intention('sugar'), evenings, [], new Date('2026-03-06T09:00:00'));
    const morning = momentNote(at('2026-03-05', '09:00'), pattern, '22:30');
    expect(morning.kind).toBe('mechanism');
    if (morning.kind !== 'mechanism') throw new Error('unreachable');
    expect(morning.text).not.toMatch(/evening|nine at night/i);
  });

  it('offers a mechanism only where one exists and applies right now', () => {
    const pattern = behaviourPattern(intention('late_caffeine'), evenings, [], new Date());
    const late = momentNote(at('2026-03-05', '16:30'), pattern, '22:30');
    expect(late.kind).toBe('mechanism');
    expect(late.text).toContain('half-life');

    // Same behaviour, same person, a morning coffee: the SLEEP finding does
    // not apply outside its window and must not be recited anyway. The
    // timeless pharmacology still can — it is true at any hour.
    const morning = momentNote(at('2026-03-05', '07:30'), pattern, '22:30');
    expect(morning.kind).toBe('mechanism');
    if (morning.kind !== 'mechanism') throw new Error('unreachable');
    expect(morning.text).not.toMatch(/half-life|bedtime/i);
    expect(morning.text).toMatch(/adenosine/i);
  });

  /**
   * A behaviour with no physiological mechanism and no pattern yet gets an
   * acknowledgement and nothing else. The app never fills the silence with
   * something invented.
   */
  it('falls back to a flat acknowledgement where there is genuinely nothing to say', () => {
    const pattern = behaviourPattern(intention('shopping'), [at('2026-03-02', '20:45')], [], new Date());
    const note = momentNote(at('2026-03-02', '20:45'), pattern, '22:30');
    expect(note.kind).toBe('logged');
  });
});

describe('what may never be said', () => {
  /**
   * Food shaming is the failure mode this feature is one bad sentence away
   * from, and the people most likely to log a snack are the people it hurts
   * most. The vocabulary check lives in a test so it survives future copy
   * edits by anyone, including me.
   */
  const SHAMING = [
    'cheat',
    'guilt',
    'shame',
    'naughty',
    'sinful',
    'clean eating',
    'earned it',
    'lapse',
    'relapse',
    'failure',
    'failed',
    'willpower',
    'bad food',
    'you should',
    'you shouldn',
  ];

  /**
   * Everything the app says ABOUT the behaviour. Safety notes are checked
   * separately below, because routing someone to real help sometimes means
   * naming shame or relapse out loud — the distinction that matters is
   * between naming shame as the obstacle and applying it to the person.
   */
  it('the catalog moralises nowhere', () => {
    const text = JSON.stringify(
      BEHAVIOUR_CATALOG.map(({ safetyNote: _ignored, ...rest }) => rest),
    ).toLowerCase();
    for (const word of SHAMING) expect(text).not.toContain(word);
  });

  it('safety notes name the obstacle without turning it on the reader', () => {
    for (const info of BEHAVIOUR_CATALOG) {
      if (!info.safetyNote) continue;
      const note = info.safetyNote.toLowerCase();
      for (const phrase of [
        'you should',
        'you shouldn',
        'your fault',
        'you failed',
        'you are weak',
        'lack of willpower',
        'you need to stop',
      ]) {
        expect(note).not.toContain(phrase);
      }
    }
  });

  it('generated moment and week copy moralises nowhere', () => {
    const evenings = [
      at('2026-03-02', '20:45'),
      at('2026-03-03', '21:10'),
      at('2026-03-04', '20:30'),
      at('2026-03-05', '21:40'),
    ];
    const produced: string[] = [];
    for (const info of BEHAVIOUR_CATALOG) {
      const pattern = behaviourPattern(intention(info.key), evenings, [], new Date('2026-03-06T09:00:00'));
      for (const time of ['07:30', '16:30', '20:45', '23:50']) {
        produced.push(momentNote(at('2026-03-05', time), pattern, '22:30').text);
      }
      const wn = weekNote(pattern);
      if (wn) produced.push(wn);
    }
    const text = produced.join(' ').toLowerCase();
    for (const word of SHAMING) expect(text).not.toContain(word);
  });

  /**
   * The reverse of what this test used to assert.
   *
   * It once pinned that sweets and junk food carried NO mechanism, on the
   * reasoning that a snack has no established acute harm. That was wrong on
   * the science — a chocolate bar produces a real glucose and insulin
   * response, and evening insulin sensitivity is measurably lower than
   * morning — and wrong on the principle, which confused not shaming with
   * not informing.
   */
  it('teaches the mechanism where the evidence supports one, food included', () => {
    for (const key of ['sugar', 'junk_food', 'late_caffeine', 'alcohol', 'smoking'] as const) {
      expect(behaviourInfo(key).effects?.length ?? 0).toBeGreaterThan(0);
    }
    const sugar = behaviourInfo('sugar').effects!;
    expect(JSON.stringify(sugar)).toMatch(/insulin/i);
    // And it hands over the lever, not just the fact.
    expect(sugar.some((e) => e.counterProtocolId === 'post-meal-walk')).toBe(true);
  });

  /**
   * Still silent where there genuinely is no physiological mechanism to
   * teach. Impulse shopping is a money problem, not a metabolic one, and
   * inventing biology for it would be the original error in the other
   * direction.
   */
  it('invents no mechanism where none exists', () => {
    for (const key of ['shopping', 'porn', 'procrastination'] as const) {
      expect(behaviourInfo(key).effects).toBeUndefined();
    }
  });

  /** Every counter-move points at a protocol that actually exists. */
  it('every named counter-move resolves to a real protocol', () => {
    for (const info of BEHAVIOUR_CATALOG) {
      for (const effect of info.effects ?? []) {
        if (!effect.counterProtocolId) continue;
        expect(protocolById(effect.counterProtocolId)).toBeDefined();
        expect(effect.counterText).toBeTruthy();
      }
    }
  });

  /**
   * A weak claim must not ride on a strong one's grade. Each mechanism
   * carries its own, and the strongest leads.
   */
  it('grades each mechanism separately rather than averaging them', () => {
    const sugar = behaviourInfo('sugar').effects!;
    const grades = new Set(sugar.map((e) => e.evidenceLevel));
    expect(grades.size).toBeGreaterThan(1);
    for (const e of sugar) expect(EVIDENCE_LABELS[e.evidenceLevel]).toBeTruthy();
  });

  /**
   * Food and gambling used to be exempt from counting. They are not any
   * more — a count is information, and someone who chose to track a thing
   * is owed the number. What replaces the exemption is a safety note, since
   * a visible tally is precisely what can tip from useful into
   * preoccupying for the people most likely to keep one.
   */
  it('warns where a visible count carries its own risk', () => {
    for (const info of BEHAVIOUR_CATALOG.filter((b) => b.family === 'food')) {
      expect(info.safetyNote).toBeTruthy();
      expect(info.safetyNote!.toLowerCase()).toMatch(/compulsive|dietitian|gp/);
    }
  });

  it('routes the behaviours that need a person to a person', () => {
    for (const key of ['alcohol', 'gambling', 'smoking'] as const) {
      expect(behaviourInfo(key).safetyNote).toBeTruthy();
    }
    expect(behaviourInfo('gambling').safetyNote).toMatch(/help|1800/i);
  });

  it('every behaviour is complete and every mechanism is attributed', () => {
    const keys = new Set(BEHAVIOUR_CATALOG.map((b) => b.key));
    expect(keys.size).toBe(BEHAVIOUR_CATALOG.length);
    for (const info of BEHAVIOUR_CATALOG) {
      expect(info.label.length).toBeGreaterThan(2);
      expect(info.detailHint.length).toBeGreaterThan(5);
      expect(info.logPrompt.length).toBeGreaterThan(5);
      for (const effect of info.effects ?? []) {
        expect(effect.text.length).toBeGreaterThan(40);
        expect(effect.attribution.length).toBeGreaterThan(5);
        if (effect.withinHoursOfSleep !== undefined) {
          expect(effect.withinHoursOfSleep).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('weekNote', () => {
  it('says how far off a pattern is rather than guessing at one', () => {
    const pattern = behaviourPattern(intention('sugar'), [at('2026-03-02', '20:45')], [], new Date());
    expect(weekNote(pattern)).toContain('3 more');
  });

  it('is silent when there is nothing logged at all', () => {
    expect(weekNote(behaviourPattern(intention('sugar'), [], [], new Date()))).toBeNull();
  });

  it('leads with the timing once there is one', () => {
    const evenings = [
      at('2026-03-02', '20:45'),
      at('2026-03-03', '21:10'),
      at('2026-03-04', '20:30'),
      at('2026-03-05', '21:40'),
    ];
    const pattern = behaviourPattern(intention('sugar'), evenings, [], new Date('2026-03-06T09:00:00'));
    expect(weekNote(pattern)).toContain('20:30–21:45');
  });
});

describe('dueInterventions', () => {
  const fridayNights = [
    at('2026-03-06', '21:00'), // Fridays
    at('2026-03-13', '21:10'),
    at('2026-03-20', '20:50'),
    at('2026-03-27', '21:20'),
  ];
  const now = new Date('2026-03-28T09:00:00');

  /**
   * The reason the day filter exists. An app that nudges every evening for
   * a Friday habit is an app people mute, and muting costs the nudges that
   * would have landed.
   */
  it('fires on the days the pattern actually lives on', () => {
    const due = dueInterventions([intention('alcohol')], fridayNights, [], '2026-04-03', now);
    expect(due).toHaveLength(1);
    expect(due[0].at).toBe('20:00'); // 20:45 window start, 45 minutes ahead
  });

  it('stays silent on a day the pattern does not touch', () => {
    expect(dueInterventions([intention('alcohol')], fridayNights, [], '2026-03-31', now)).toEqual([]);
  });

  it('stays silent until there is a pattern at all', () => {
    const two = fridayNights.slice(0, 2);
    expect(dueInterventions([intention('alcohol')], two, [], '2026-04-03', now)).toEqual([]);
  });

  it('ignores intentions the user has switched off', () => {
    const off = { ...intention('alcohol'), active: false };
    expect(dueInterventions([off], fridayNights, [], '2026-04-03', now)).toEqual([]);
  });
});

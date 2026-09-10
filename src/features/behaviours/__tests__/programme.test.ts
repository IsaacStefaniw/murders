import {
  afterTheFact,
  collectedNights,
  markCollected,
  nextToPromise,
  promiseKey,
  REWARD_NIGHTS,
  rewardDue,
  stageFor,
  STOP_STAGES,
  weekShape,
} from '@/features/behaviours/programme';
import { protocolById } from '@/features/knowledge/protocols';
import { toDateKey } from '@/lib/dates';
import type { BehaviourEvent, BehaviourIntention } from '@/types/domain';

const TODAY = '2026-09-10';
const daysAgo = (n: number) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d;
};

const intention = (id: string, behaviour: string): BehaviourIntention =>
  ({ id, behaviour }) as BehaviourIntention;

const event = (intentionId: string, n: number): BehaviourEvent =>
  ({ id: `e${intentionId}${n}`, intentionId, occurredAt: daysAgo(n).toISOString() }) as BehaviourEvent;

const clear = (n: number) => ({
  clearDays: Array.from({ length: n }, (_, i) => toDateKey(daysAgo(i + 1))).join(','),
});

describe('the arc', () => {
  it('starts by finding out when it happens, not by stopping', () => {
    expect(stageFor(0).current.n).toBe(1);
    expect(stageFor(0).current.title).toMatch(/when it actually happens/i);
  });

  it('opens each stage on nights accumulated', () => {
    expect(stageFor(3).current.n).toBe(2);
    expect(stageFor(7).current.n).toBe(3);
    expect(stageFor(21).current.n).toBe(4);
  });

  it('says how many nights open the next stage', () => {
    expect(stageFor(5).nightsToNext).toBe(2);
    expect(stageFor(100).next).toBeNull();
  });

  it('every stage that names a practice names one that exists', () => {
    for (const s of STOP_STAGES) {
      if (s.protocolId) expect(protocolById(s.protocolId)).toBeDefined();
    }
  });

  it('every stage has something for the coach to say', () => {
    for (const s of STOP_STAGES) expect(s.coachLine.length).toBeGreaterThan(15);
  });
});

describe('rewards, and the reset this deliberately does not have', () => {
  it('offers nothing before the first milestone', () => {
    expect(rewardDue(6, {})).toBeNull();
  });

  it('offers the milestone once it is reached', () => {
    expect(rewardDue(7, {})?.nights).toBe(7);
  });

  it('counts nights accumulated, so a lapse in the middle costs nothing', () => {
    // Ten clear nights with a lapse among them is ten clear nights. This is
    // the whole divergence from classic contingency management, and the
    // reason is in the module header: a schedule that can be lost hands
    // somebody a reason to stop reporting honestly.
    const answers = clear(10);
    expect(rewardDue(10, answers)?.nights).toBe(7);
    // The lapse does not appear in this calculation at all.
    expect(Object.keys(answers)).not.toContain('lapses');
  });

  it('never offers the same milestone twice', () => {
    const answers = { rewardsTaken: markCollected({}, 7) };
    expect(collectedNights(answers)).toEqual([7]);
    expect(rewardDue(7, answers)).toBeNull();
  });

  it('walks somebody through the ones they skipped, smallest first', () => {
    // Arriving at thirty without having marked seven gets seven, not thirty.
    expect(rewardDue(30, {})?.nights).toBe(7);
    expect(rewardDue(30, { rewardsTaken: '7,14' })?.nights).toBe(30);
  });

  it('says what they promised themselves, where they named it', () => {
    const answers = { [promiseKey(7)]: 'the good coffee beans' };
    expect(rewardDue(7, answers)?.line).toContain('the good coffee beans');
  });

  it('asks for the next promise in advance, which is the commitment', () => {
    expect(nextToPromise(0, {})).toBe(7);
    expect(nextToPromise(0, { [promiseKey(7)]: 'a book' })).toBe(14);
  });

  it('escalates and then stops, rather than running forever', () => {
    expect(REWARD_NIGHTS).toEqual([7, 14, 30, 60, 90]);
    expect(rewardDue(500, { rewardsTaken: '7,14,30,60,90' })).toBeNull();
  });
});

describe('the week, across every behaviour at once', () => {
  const drink = intention('i1', 'alcohol');
  const vape = intention('i2', 'vaping');

  it('names the cluster, which is what a person notices first', () => {
    // Isaac's actual week: drank twice, vaped twice.
    const events = [event('i1', 1), event('i1', 3), event('i2', 1), event('i2', 4)];
    const shape = weekShape([drink, vape], events, TODAY);
    expect(shape.events).toBe(4);
    expect(shape.clustered).toBe(true);
    expect(shape.line).toMatch(/travel together/);
  });

  it('does not invent a cluster from one behaviour', () => {
    const shape = weekShape([drink, vape], [event('i1', 2)], TODAY);
    expect(shape.clustered).toBe(false);
    expect(shape.line).toMatch(/all alcohol/i);
  });

  it('ignores anything older than the week', () => {
    expect(weekShape([drink], [event('i1', 9)], TODAY).events).toBe(0);
  });

  it('counts a lapse logged days later, which is the point of logging late', () => {
    const shape = weekShape([drink], [event('i1', 5)], TODAY);
    expect(shape.events).toBe(1);
  });
});

describe('what it says to somebody logging days after the fact', () => {
  const drink = intention('i1', 'alcohol');

  it('gives the week and the next step, not a lecture about tonight', () => {
    const out = afterTheFact([drink], [event('i1', 2), event('i1', 4)], clear(5), TODAY);
    expect(out.shape.events).toBe(2);
    expect(out.stage.n).toBe(2);
    expect(out.next).toMatch(/2 more clear nights/);
  });

  it('falls back to tonight’s stand-in at the top of the arc', () => {
    const out = afterTheFact([drink], [], clear(40), TODAY);
    expect(out.stage.n).toBe(4);
    expect(out.next).toMatch(/Tonight, if it comes up/);
  });
});

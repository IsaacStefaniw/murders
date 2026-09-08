/**
 * Recording how long things really take, and planning with it.
 *
 * The honest source is the gap between the person starting a block and
 * marking it done. Nothing is inferred: a block nobody started records no
 * length at all, and a screen left open all afternoon is capped the same
 * way a guided session's elapsed time is capped, so one forgotten tab
 * cannot turn a 45-minute workout into a four-hour one.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { grantedEntitlement } from '@/features/plus/entitlement';
import { learnedDuration } from '@/lib/scheduling/adaptation';
import { addDays, durationMinutes, todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';
import type { PlanItem } from '@/types/domain';

const KEY = 'intent-os-store';

function onboard() {
  useAppStore.getState().resetAll();
  const built = buildLifeOperatingPlan({
    name: 'Sam',
    priorities: ['health', 'work'],
    workDays: ['1', '2', '3', '4', '5'],
    workHours: '09:00-17:30',
    sleep: '06:30-22:30',
    energy: 'morning',
    trainingDays: '3',
    capacity: 'steady',
    sexAtBirth: 'female',
  } as never);
  useAppStore.setState({ entitlement: grantedEntitlement() });
  useAppStore.getState().completeOnboarding({
    profile: built.profile,
    goals: built.goals,
    routines: built.routines,
    behaviourIntentions: built.behaviourIntentions,
  });
}

/**
 * A flexible, routine-backed item with room to grow into.
 *
 * Two assumptions used to live here and both were wrong. It pinned to
 * todayKey(), so the suite passed or failed on what day it ran. And it took
 * whichever item came first, which on this profile is "Wind down, screens
 * away" — twenty minutes, sleep-anchored, with a fifteen-minute window. A
 * test about learned durations then stretched it and watched the engine
 * correctly refuse to fit forty minutes into fifteen, which proves nothing
 * about learning.
 *
 * So: scan for the day, and pick the item whose window has the most slack,
 * because that is the one a longer measured duration can actually be shown
 * on.
 */
const firstFlexible = () => {
  for (let n = 0; n < 14; n += 1) {
    const date = addDays(todayKey(), n);
    const plan = useAppStore.getState().ensurePlan(date);
    const routines = useAppStore.getState().routines ?? [];
    const slackOf = (item: PlanItem) => {
      const r = routines.find((x) => x.id === item.routineId);
      if (!r) return -1;
      return (
        durationMinutes(r.preferredStart, r.preferredEnd) - r.durationMin
      );
    };
    const roomiest = plan.items
      .filter((i) => !i.fixed && i.status === 'planned' && i.routineId)
      .sort((a, b) => slackOf(b) - slackOf(a))[0];
    if (roomiest && slackOf(roomiest) >= 30) return { date, item: roomiest };
  }
  throw new Error('no flexible routine-backed item with room to grow');
};

const readItem = (date: string, id: string): PlanItem =>
  useAppStore.getState().plans[date].items.find((i) => i.id === id)!;

/** Backdate an item's start stamp so the elapsed time is known exactly. */
const startedMinutesAgo = (date: string, id: string, minutes: number) => {
  const at = new Date(Date.now() - minutes * 60_000).toISOString();
  useAppStore.setState((s) => ({
    plans: {
      ...s.plans,
      [date]: {
        ...s.plans[date],
        items: s.plans[date].items.map((i) => (i.id === id ? { ...i, startedAt: at } : i)),
      },
    },
  }));
};

beforeEach(async () => {
  useAppStore.getState().resetAll();
  await AsyncStorage.clear();
});

describe('starting an item', () => {
  it('stamps when it began', () => {
    onboard();
    const { date, item } = firstFlexible();
    expect(readItem(date, item.id).startedAt).toBeUndefined();

    useAppStore.getState().startItem(date, item.id);
    const startedAt = readItem(date, item.id).startedAt!;
    expect(Number.isNaN(Date.parse(startedAt))).toBe(false);
    expect(Math.abs(Date.now() - Date.parse(startedAt))).toBeLessThan(5_000);
  });

  it('keeps the first stamp — reopening the screen is not starting again', () => {
    onboard();
    const { date, item } = firstFlexible();
    useAppStore.getState().startItem(date, item.id);
    const first = readItem(date, item.id).startedAt;
    useAppStore.getState().startItem(date, item.id);
    expect(readItem(date, item.id).startedAt).toBe(first);
  });

  it('ignores an item that is already done, and an id that is not there', () => {
    onboard();
    const { date, item } = firstFlexible();
    useAppStore.getState().setItemStatus(date, item.id, 'completed');
    useAppStore.getState().startItem(date, item.id);
    expect(readItem(date, item.id).startedAt).toBeUndefined();
    expect(() => useAppStore.getState().startItem(date, 'nope')).not.toThrow();
  });
});

describe('completing an item records how long it took', () => {
  it('measures the gap between starting and marking it done', () => {
    onboard();
    const { date, item } = firstFlexible();
    startedMinutesAgo(date, item.id, 42);
    useAppStore.getState().setItemStatus(date, item.id, 'completed');
    expect(readItem(date, item.id).actualMin).toBe(42);
  });

  it('records nothing for a block nobody started — an estimate is worse than silence', () => {
    onboard();
    const { date, item } = firstFlexible();
    useAppStore.getState().setItemStatus(date, item.id, 'completed');
    expect(readItem(date, item.id).actualMin).toBeUndefined();
  });

  it('caps a screen left open all afternoon at three times the planned length', () => {
    onboard();
    const { date, item } = firstFlexible();
    const planned = durationMinutes(item.start, item.end);
    startedMinutesAgo(date, item.id, 60 * 5);
    useAppStore.getState().setItemStatus(date, item.id, 'completed');
    expect(readItem(date, item.id).actualMin).toBe(planned * 3);
  });

  it('never records less than a minute', () => {
    onboard();
    const { date, item } = firstFlexible();
    useAppStore.getState().startItem(date, item.id);
    useAppStore.getState().setItemStatus(date, item.id, 'completed');
    expect(readItem(date, item.id).actualMin).toBe(1);
  });

  it('clears the record when the item is reopened, so it is measured afresh', () => {
    onboard();
    const { date, item } = firstFlexible();
    startedMinutesAgo(date, item.id, 42);
    useAppStore.getState().setItemStatus(date, item.id, 'completed');
    useAppStore.getState().setItemStatus(date, item.id, 'planned');
    const after = readItem(date, item.id);
    expect(after.actualMin).toBeUndefined();
    expect(after.startedAt).toBeUndefined();
  });

  it('records nothing for a skipped block', () => {
    onboard();
    const { date, item } = firstFlexible();
    startedMinutesAgo(date, item.id, 42);
    useAppStore.getState().setItemStatus(date, item.id, 'skipped');
    expect(readItem(date, item.id).actualMin).toBeUndefined();
  });
});

describe('the plan uses what it has learned', () => {
  /** Three finished sessions of the same routine, each taking `minutes`. */
  const seedHistory = (routineId: string, minutes: number[], planned: PlanItem) => {
    const plans = { ...useAppStore.getState().plans };
    minutes.forEach((actualMin, n) => {
      const date = addDays(todayKey(), -(n + 1));
      plans[date] = {
        date,
        items: [{ ...planned, id: `${routineId}-h${n}`, date, status: 'completed', actualMin }],
      };
    });
    useAppStore.setState({ plans });
  };

  it('holds the length the sessions actually take', () => {
    onboard();
    const { date, item } = firstFlexible();
    const planned = durationMinutes(item.start, item.end);
    // Twenty minutes, not sixty per cent. The old stretch turned a
    // one-hour block into a ninety-six-minute one, which a real evening is
    // entitled to refuse — so the test was failing on the day being full
    // rather than on the length being wrong, which is not what it is for.
    const longer = planned + 20;
    seedHistory(item.routineId!, [longer, longer, longer], item);

    const rebuilt = useAppStore.getState().regeneratePlan(date);
    const placed = rebuilt.items.find((i) => i.routineId === item.routineId);
    expect(placed).toBeDefined();
    expect(durationMinutes(placed!.start, placed!.end)).toBe(longer);
  });

  it('holds the declared length until three sessions exist', () => {
    onboard();
    const { date, item } = firstFlexible();
    const planned = durationMinutes(item.start, item.end);
    const longer = planned + Math.max(20, Math.ceil(planned * 0.6));
    seedHistory(item.routineId!, [longer, longer], item);

    const rebuilt = useAppStore.getState().regeneratePlan(date);
    const placed = rebuilt.items.find((i) => i.routineId === item.routineId)!;
    expect(durationMinutes(placed.start, placed.end)).toBe(planned);
  });
});

describe('a plan stored before any of this existed', () => {
  it('hydrates, plans and learns nothing from items that recorded nothing', async () => {
    onboard();
    const { date, item } = firstFlexible();
    // Exactly what an older build wrote: no startedAt, no actualMin.
    const old = useAppStore.getState().plans[date].items.map(({ ...i }) => {
      delete (i as Partial<PlanItem>).startedAt;
      delete (i as Partial<PlanItem>).actualMin;
      return { ...i, status: 'completed' as const };
    });
    const state = {
      ...JSON.parse(JSON.stringify(useAppStore.persist.getOptions().partialize!(useAppStore.getState()))),
      plans: { [date]: { date, items: old } },
    };

    useAppStore.getState().resetAll();
    await Promise.resolve();
    await AsyncStorage.setItem(KEY, JSON.stringify({ state, version: 1 }));
    await useAppStore.persist.rehydrate();

    const after = useAppStore.getState();
    expect(after.hydrated).toBe(true);
    expect(after.plans[date].items).toHaveLength(old.length);
    expect(after.plans[date].items.every((i) => i.actualMin === undefined)).toBe(true);
    expect(learnedDuration(item.routineId!, after.plans[date].items)).toBeNull();
    // And the day still builds.
    expect(() => after.regeneratePlan(addDays(date, 1))).not.toThrow();
  });
});

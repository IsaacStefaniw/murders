import type { Protocol } from '@/features/knowledge/protocols';
import { listedProtocols } from '@/features/knowledge/protocols';
import type { Routine } from '@/types/domain';
import {
  PLUS_PRODUCTS,
  entitlementFromPurchases,
  isAlwaysFreeRoutine,
  meditationLengthNeedsPlus,
  runningRoutines,
  sessionsPlusWouldRun,
  splitLibrary,
} from '../entitlement';

const now = new Date('2026-09-03T03:00:00Z');
const day = 24 * 60 * 60 * 1000;

describe('entitlementFromPurchases', () => {
  it('is nothing when Apple reports nothing', () => {
    const e = entitlementFromPurchases([], now);
    expect(e.plus).toBe(false);
    expect(e.source).toBe('none');
    expect(e.checkedAt).toBe(now.toISOString());
  });

  it('lifetime is Plus with no expiry', () => {
    const e = entitlementFromPurchases([{ productId: PLUS_PRODUCTS.lifetime }], now);
    expect(e).toMatchObject({ plus: true, source: 'purchase', productId: PLUS_PRODUCTS.lifetime });
    expect(e.expiresAt).toBeUndefined();
  });

  it('a live subscription is Plus until it expires; an expired one is not', () => {
    const live = entitlementFromPurchases(
      [{ productId: PLUS_PRODUCTS.annual, expirationDateIOS: now.getTime() + 300 * day }],
      now,
    );
    expect(live.plus).toBe(true);
    expect(live.expiresAt).toBe(new Date(now.getTime() + 300 * day).toISOString());
    const lapsed = entitlementFromPurchases(
      [{ productId: PLUS_PRODUCTS.monthly, expirationDateIOS: now.getTime() - day }],
      now,
    );
    expect(lapsed.plus).toBe(false);
  });

  it('a pending purchase and an unknown product grant nothing', () => {
    const e = entitlementFromPurchases(
      [
        { productId: PLUS_PRODUCTS.lifetime, purchaseState: 'pending' },
        { productId: 'com.example.other', expirationDateIOS: now.getTime() + day },
      ],
      now,
    );
    expect(e.plus).toBe(false);
  });

  it('with two subscriptions the later expiry wins', () => {
    const e = entitlementFromPurchases(
      [
        { productId: PLUS_PRODUCTS.monthly, expirationDateIOS: now.getTime() + 10 * day },
        { productId: PLUS_PRODUCTS.annual, expirationDateIOS: now.getTime() + 200 * day },
      ],
      now,
    );
    expect(e.productId).toBe(PLUS_PRODUCTS.annual);
  });
});

describe('splitLibrary', () => {
  const listed = listedProtocols('female');

  it('opens five per pillar without Plus and names the rest', () => {
    const { open, openCount, total } = splitLibrary(listed, false);
    expect(total).toBe(listed.length);
    expect(openCount).toBeLessThan(total);
    const byPillar: Record<string, number> = {};
    // The urge tools sit outside the count: they are open in every case.
    for (const p of listed)
      if (open.has(p.id) && !p.id.startsWith('urge')) byPillar[p.pillar] = (byPillar[p.pillar] ?? 0) + 1;
    for (const n of Object.values(byPillar)) expect(n).toBeLessThanOrEqual(5);
    // The open ones are the first of each pillar, not a random five.
    const firstPillar = listed[0].pillar;
    const firstFive = listed.filter((p) => p.pillar === firstPillar).slice(0, 5);
    for (const p of firstFive) expect(open.has(p.id)).toBe(true);
  });

  it('never locks an urge tool, whatever its area has open', () => {
    const { open } = splitLibrary(listed, false, 0);
    const urges = listed.filter((p) => p.id.startsWith('urge'));
    expect(urges.length).toBeGreaterThan(0);
    for (const p of urges) expect(open.has(p.id)).toBe(true);
  });

  it('opens everything with Plus', () => {
    const { openCount, total } = splitLibrary(listed, true);
    expect(openCount).toBe(total);
  });

  it('the locked count is a real number worth saying', () => {
    const { openCount, total } = splitLibrary(listed as Protocol[], false);
    expect(total - openCount).toBeGreaterThan(100);
  });
});

describe('sessionsPlusWouldRun', () => {
  const routine = (id: string, days: number[], start: string): Routine =>
    ({ id, title: id, days, preferredStart: start, durationMin: 30, active: true }) as unknown as Routine;

  it('lists the active routines for that weekday, earliest first', () => {
    // 2026-09-03 is a Thursday (4).
    const list = sessionsPlusWouldRun(
      [routine('b', [4], '18:00'), routine('a', [4], '06:30'), routine('c', [1], '06:30'), { ...routine('d', [4], '07:00'), active: false }],
      '2026-09-03',
    );
    expect(list.map((r) => r.id)).toEqual(['a', 'b']);
  });
});

describe('the hardest-moment rule', () => {
  const r = (id: string, extra: Partial<Routine> = {}): Routine =>
    ({ id, title: id, days: [0, 1, 2, 3, 4, 5, 6], preferredStart: '12:00', durationMin: 5, active: true, ...extra }) as Routine;

  it('recovery-pathway routines and urge protocols run without Plus; nothing else does', () => {
    const routines = [
      r('reset', { goalId: 'goal-recovery' }),
      r('surf', { protocolId: 'urge-surf', goalId: 'goal-other' }),
      r('lift', { goalId: 'goal-training', protocolId: 'zone2' }),
    ];
    expect(runningRoutines(routines, false, 'goal-recovery').map((x) => x.id)).toEqual(['reset', 'surf']);
    expect(runningRoutines(routines, true, 'goal-recovery').map((x) => x.id)).toEqual(['reset', 'surf', 'lift']);
    expect(isAlwaysFreeRoutine(routines[2], 'goal-recovery')).toBe(false);
  });

  it('the locked list on Today never contains a free routine', () => {
    const routines = [r('reset', { goalId: 'goal-recovery' }), r('lift', { goalId: 'goal-training' })];
    expect(sessionsPlusWouldRun(routines, '2026-09-03', 'goal-recovery').map((x) => x.id)).toEqual(['lift']);
  });
});

describe('meditation lengths', () => {
  it('two minutes is always free; longer needs Plus', () => {
    expect(meditationLengthNeedsPlus(2, false)).toBe(false);
    expect(meditationLengthNeedsPlus(5, false)).toBe(true);
    expect(meditationLengthNeedsPlus(20, true)).toBe(false);
  });
});
